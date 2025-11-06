import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { IMAGE_EXTRACTION_SYSTEM_PROMPT } from '../../../lib/image-extraction-prompt';
import { parseExtractionJSON } from '../../../lib/json-parser';

export interface ImageExtractionResult {
  type: 'SINGLE_PROBLEM' | 'TWO_PROBLEMS' | 'MULTIPLE_PROBLEMS' | 'SOLUTION_DETECTED' | 'UNCLEAR_IMAGE';
  confidence: 'high' | 'medium' | 'low';
  problems: string[];
  extracted_text?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'Missing image data' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create image data URL for Claude Vision
    const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

    // Call Claude Vision API for extraction
    const result = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: IMAGE_EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: imageDataUrl,
            },
            {
              type: 'text',
              text: 'Extract the math problem(s) from this image. Return only valid JSON in the specified format.',
            },
          ],
        },
      ],
    });

    // Parse JSON response
    const extractionResult = parseExtractionJSON(result.text);
    
    // Log parsing failures in development
    if (process.env.NODE_ENV === 'development' && extractionResult.type === 'UNCLEAR_IMAGE' && extractionResult.confidence === 'low') {
      console.error('Failed to parse extraction result, using fallback');
      console.error('Raw response:', result.text);
    }

    return new Response(
      JSON.stringify(extractionResult),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Image extraction error:', error);
    
    let errorMessage = 'Failed to extract problem from image';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        type: 'UNCLEAR_IMAGE',
        confidence: 'low',
        problems: []
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

