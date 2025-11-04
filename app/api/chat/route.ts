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

    // Extract current problem context
    const currentProblem = extractProblemFromMessages(messages);
    const conversationLength = messages.length;
    const isStuck = conversationLength > 4; // Simple stuck detection
    
    // Generate enhanced Socratic prompt with context
    const systemPrompt = getSocraticPrompt({
      problemText: currentProblem,
      conversationLength,
      isStuck,
      studentLevel: 'auto' // Will be enhanced later
    });

    // Generate response using Anthropic
    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages: messages,
    });

    // For now, return streaming response directly
    // TODO: Add response validation in Phase 3 when we implement the testing framework
    // The validation would need to work with streaming responses which is more complex
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('API route error:', error);
    
    // Determine error type and return appropriate response
    if (error instanceof Error) {
      // Rate limiting (429 from Anthropic)
      if (error.message.includes('429')) {
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
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
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
      
      // Network/connection errors
      if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
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
