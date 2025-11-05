import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { getSocraticPrompt, extractProblemFromMessages } from '../../lib/prompts';
import { mathVerificationTools } from '../../lib/math-tools';
import { manageAttemptTracking } from '../../lib/attempt-tracking';

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
      .map((msg: MessageInput) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: typeof msg.content === 'string' ? msg.content.trim() : String(msg.content || '').trim(),
      }));

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
      });
      
      // Log tool usage in development
      if (process.env.NODE_ENV === 'development') {
        // Note: Tool calls are handled automatically by the SDK
        // We can't easily intercept them in streamText, but they'll work
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

    // Return streaming response with tool results
    return result.toTextStreamResponse();
    
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
