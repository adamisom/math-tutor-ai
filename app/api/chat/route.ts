import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { getSocraticPrompt, extractProblemFromMessages } from '../../lib/prompts';
import { mathVerificationTools } from '../../lib/math-tools';
import { manageAttemptTracking } from '../../lib/attempt-tracking';
import { ToolCallInjector, stripToolCallMarkers } from '../../lib/tool-call-injection';

// Shared store for tool calls in this request (for testing/logging)
// Note: Currently unused, but kept for potential future tool call logging/injection
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ToolCallInfo {
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: number;
}

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body - may include attempt tracking metadata
    const { messages, attemptMetadata } = await req.json();
    // attemptMetadata: { previousProblem?: string, problemSignature?: string }
    
    // Validate messages format
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Filter and validate messages - remove any with empty content
    // Also ensure messages are in the format expected by AI SDK
    interface MessageInput {
      role: string;
      content: string | number;
    }
    const validMessages = messages
      .filter((msg: MessageInput) => {
        if (!msg.role || (!msg.content && msg.content !== 0)) return false;
        // Ensure content is a non-empty string
        const contentStr = typeof msg.content === 'string' ? msg.content : String(msg.content || '');
        return contentStr.trim().length > 0;
      })
      .map((msg: MessageInput) => {
        const content = typeof msg.content === 'string' ? msg.content.trim() : String(msg.content || '').trim();
        // Strip tool call markers from assistant messages (dev mode injection)
        // This prevents markers from being included in conversation history sent to Claude
        const cleanedContent = msg.role === 'assistant' ? stripToolCallMarkers(content) : content;
        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: cleanedContent,
        };
      })
      .filter(msg => msg.content.length > 0); // Filter out messages that became empty after stripping

    // Ensure we have at least one valid message
    if (validMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid messages provided. Please enter a math problem.' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Validated messages:', JSON.stringify(validMessages, null, 2));
    }

    // Extract current problem context and manage attempt tracking
    const currentProblem = extractProblemFromMessages(validMessages);
    const conversationLength = validMessages.length;
    const isStuck = conversationLength > 4; // Simple stuck detection
    
    // Manage attempt tracking (server-side approximation)
    // Note: Full tracking requires client-side localStorage, but we can approximate here
    const previousProblem = attemptMetadata?.previousProblem;
    const attemptTracking = manageAttemptTracking(validMessages, previousProblem);
    const attemptCount = attemptMetadata?.attemptCount ?? attemptTracking.attemptCount;
    
    // Generate enhanced Socratic prompt with context including attempt count
    const systemPrompt = getSocraticPrompt({
      problemText: currentProblem || attemptTracking.currentProblem || undefined,
      conversationLength,
      isStuck,
      studentLevel: 'auto', // Will be enhanced later
      attemptCount: attemptCount,
      isNewProblem: attemptTracking.isNewProblem,
      previousProblem: previousProblem,
    });

    // Generate response using Anthropic with tool calling
    // Using Claude Sonnet 4.5 (latest available model)
    let result;
    try {
      result = await streamText({
        model: anthropic('claude-sonnet-4-5-20250929'),
        system: systemPrompt,
        messages: validMessages,
        tools: mathVerificationTools,
        toolChoice: 'auto', // Claude decides when to call tools
        // Note: maxSteps parameter is not available in this AI SDK version
        // Tool calling continuation issue will be addressed through other approaches
      });
      
      // Log tool usage in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Tool calling enabled with', Object.keys(mathVerificationTools).length, 'tools');
      }
    } catch (toolError) {
      // If tool calling fails, fall back to Claude without tools
      console.warn('Tool calling failed, falling back to Claude-only mode:', toolError);
      result = await streamText({
        model: anthropic('claude-sonnet-4-5-20250929'),
        system: systemPrompt + '\n\nNote: Mathematical verification tools are temporarily unavailable. Guide the student through questions and encourage them to verify their own work.',
        messages: validMessages,
      });
    }

    // Return streaming response with Approach 6: Explicit Continuation Message
    // Monitor stream to detect if tool was called but no text follows
    try {
      // Create a wrapper stream that monitors for tool calls and text
      let toolWasCalled = false;
      let hasText = false;
      let accumulatedText = '';
      let lastToolResultTime = 0;
      let streamFinished = false;
      let finishReason: string | undefined;
      
      // Create a custom stream that monitors and forwards chunks
      const encoder = new TextEncoder();
      const monitoredStream = new ReadableStream({
        async start(controller) {
          // Initialize tool call injector (only active in development)
          const toolInjector = new ToolCallInjector({
            encoder,
            controller,
          });

          try {
            for await (const chunk of result.fullStream) {
              if (chunk.type === 'tool-call') {
                toolWasCalled = true;
                const toolInput = 'input' in chunk ? (chunk.input as Record<string, unknown>) : {};
                const toolCallId = 'toolCallId' in chunk ? String(chunk.toolCallId) : undefined;
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('[Stream Monitor] Tool call detected:', chunk.toolName, toolCallId ? `(id: ${toolCallId})` : '');
                }
                
                // Handle tool call injection (dev mode only)
                toolInjector.handleToolCall(chunk.toolName, toolInput, toolCallId);
              } else if (chunk.type === 'tool-result') {
                lastToolResultTime = Date.now();
                const toolOutput = 'output' in chunk ? chunk.output : null;
                const toolCallId = 'toolCallId' in chunk ? String(chunk.toolCallId) : undefined;
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('[Stream Monitor] Tool result received:', chunk.toolName, toolCallId ? `(id: ${toolCallId})` : '');
                }
                
                // Handle tool result injection (dev mode only)
                toolInjector.handleToolResult(chunk.toolName, toolOutput, toolCallId);
              } else if (chunk.type === 'text-delta') {
                hasText = true;
                accumulatedText += chunk.text;
                // Forward text chunks to client immediately
                controller.enqueue(encoder.encode(chunk.text));
              } else if (chunk.type === 'finish') {
                streamFinished = true;
                finishReason = chunk.finishReason;
                if (process.env.NODE_ENV === 'development') {
                  console.log('[Stream Monitor] Stream finished:', chunk.finishReason);
                }
              }
            }
            
            // More conservative check: Only continue if:
            // 1. Tool was called
            // 2. No text was generated (or only whitespace)
            // 3. Stream finished (not just loop ended)
            // 4. At least some time passed since tool result (guard against race conditions)
            const timeSinceToolResult = lastToolResultTime > 0 ? Date.now() - lastToolResultTime : Infinity;
            const shouldContinue = toolWasCalled && 
                                   (!hasText || accumulatedText.trim().length === 0) &&
                                   (streamFinished || timeSinceToolResult > 100); // 100ms buffer
            
            if (shouldContinue) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[Approach 6] Tool was called but no text generated.', {
                  hasText,
                  accumulatedLength: accumulatedText.length,
                  streamFinished,
                  finishReason,
                  timeSinceToolResult,
                });
                console.log('[Approach 6] Making continuation request...');
              }
              
              // Approach 6: Make continuation request and append to stream
              const continuationMessages = [
                ...validMessages,
                {
                  role: 'user' as const,
                  content: 'Please respond to the student based on the tool verification results above. Guide them with Socratic questions.',
                },
              ];
              
              const continuationResult = await streamText({
                model: anthropic('claude-sonnet-4-5-20250929'),
                system: systemPrompt,
                messages: continuationMessages,
                // Don't pass tools to avoid infinite loop
              });
              
              if (process.env.NODE_ENV === 'development') {
                console.log('[Approach 6] Continuation request created, streaming response...');
              }
              
              // Stream continuation response text chunks
              let continuationTextCount = 0;
              for await (const chunk of continuationResult.fullStream) {
                if (chunk.type === 'text-delta') {
                  continuationTextCount += chunk.text.length;
                  controller.enqueue(encoder.encode(chunk.text));
                }
              }
              
              if (process.env.NODE_ENV === 'development') {
                console.log('[Approach 6] Continuation response streamed:', continuationTextCount, 'characters');
              }
            }
            
            controller.close();
          } catch (error) {
            console.error('[Stream Monitor] Error:', error);
            controller.error(error);
          }
        },
      });
      
      // Return the monitored stream
      if (process.env.NODE_ENV === 'development') {
        console.log('[Stream] Monitored stream created with Approach 6 continuation detection');
      }
      
      return new Response(monitoredStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } catch (streamError) {
      console.error('[Stream Error] Failed to create stream response:', streamError);
      throw streamError;
    }
    
  } catch (error) {
    console.error('API route error:', error);
    
    // Extract error message from various error formats
    let errorMessage = 'Something went wrong. Please try again.';
    
    // Check if it's an AI SDK error with responseBody
    interface ErrorWithResponseBody {
      responseBody?: string | { error?: { message?: string } };
      statusCode?: number;
    }
    const errorAny = error as ErrorWithResponseBody;
    if (errorAny?.responseBody) {
      try {
        const body = typeof errorAny.responseBody === 'string' 
          ? JSON.parse(errorAny.responseBody) 
          : errorAny.responseBody;
        if (body?.error?.message) {
          errorMessage = body.error.message;
        }
      } catch {
        // If parsing fails, use the string directly
        if (typeof errorAny.responseBody === 'string' && errorAny.responseBody.includes('text content blocks must be non-empty')) {
          errorMessage = 'Invalid message format. Please try rephrasing your problem or refresh the page.';
        }
      }
    }
    
    // Determine error type and return appropriate response
    if (error instanceof Error) {
      const msg = error.message || errorMessage;
      
      // Rate limiting (429 from Anthropic)
      if (msg.includes('429') || errorAny?.statusCode === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Too many requests. Please wait a moment and try again.',
            retryAfter: 60 
          }), 
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': '60'
            } 
          }
        );
      }
      
      // Authentication error (401 from Anthropic)
      if (msg.includes('401') || msg.includes('unauthorized') || errorAny?.statusCode === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'API configuration error. Please contact support.' 
          }), 
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      // Model not found error (404 from Anthropic)
      if (msg.includes('404') || 
          msg.includes('not_found_error') ||
          msg.includes('model:') ||
          errorAny?.statusCode === 404) {
        return new Response(
          JSON.stringify({ 
            error: 'Model configuration error. Please contact support.' 
          }), 
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      // Invalid request error (400 from Anthropic) - often empty content blocks
      if (msg.includes('400') || 
          msg.includes('invalid_request_error') ||
          msg.includes('text content blocks must be non-empty') ||
          msg.includes('content blocks must be non-empty') ||
          errorAny?.statusCode === 400) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid message format. Please try rephrasing your problem or refresh the page.' 
          }), 
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Network/connection errors
      if (msg.includes('network') || msg.includes('ENOTFOUND')) {
        return new Response(
          JSON.stringify({ 
            error: 'Network error. Please check your connection and try again.' 
          }), 
          { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // Generic error fallback
    return new Response(
      JSON.stringify({ 
        error: 'Something went wrong. Please try again.' 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
