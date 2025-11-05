import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { getSocraticPrompt, validateSocraticResponse, extractProblemFromMessages, getStricterSocraticPrompt } from '../../lib/prompts';

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

    // Parse request body
    const { messages } = await req.json();
    
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
    const validMessages = messages
      .filter((msg: any) => {
        if (!msg.role || (!msg.content && msg.content !== 0)) return false;
        // Ensure content is a non-empty string
        const contentStr = typeof msg.content === 'string' ? msg.content : String(msg.content || '');
        return contentStr.trim().length > 0;
      })
      .map((msg: any) => ({
        role: msg.role,
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

    // Extract current problem context
    const currentProblem = extractProblemFromMessages(validMessages);
    const conversationLength = validMessages.length;
    const isStuck = conversationLength > 4; // Simple stuck detection
    
    // Generate enhanced Socratic prompt with context
    const systemPrompt = getSocraticPrompt({
      problemText: currentProblem,
      conversationLength,
      isStuck,
      studentLevel: 'auto' // Will be enhanced later
    });

    // Generate response using Anthropic
    // Using Claude Sonnet 4.5 (latest available model)
    const result = await streamText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: systemPrompt,
      messages: validMessages,
    });

    // For now, return streaming response directly
    // TODO: Add response validation in Phase 3 when we implement the testing framework
    // The validation would need to work with streaming responses which is more complex
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('API route error:', error);
    
    // Extract error message from various error formats
    let errorMessage = 'Something went wrong. Please try again.';
    let statusCode = 500;
    
    // Check if it's an AI SDK error with responseBody
    const errorAny = error as any;
    if (errorAny?.responseBody) {
      try {
        const body = typeof errorAny.responseBody === 'string' 
          ? JSON.parse(errorAny.responseBody) 
          : errorAny.responseBody;
        if (body?.error?.message) {
          errorMessage = body.error.message;
        }
      } catch (e) {
        // If parsing fails, use the string directly
        if (typeof errorAny.responseBody === 'string' && errorAny.responseBody.includes('text content blocks must be non-empty')) {
          errorMessage = 'Invalid message format. Please try rephrasing your problem or refresh the page.';
          statusCode = 400;
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
