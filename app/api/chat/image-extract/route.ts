import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { IMAGE_EXTRACTION_SYSTEM_PROMPT } from '../../../lib/image-extraction-prompt';

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
    let extractionResult: ImageExtractionResult;
    try {
      // Try to extract JSON from the response (might have markdown code blocks)
      let jsonText = result.text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        const lines = jsonText.split('\n');
        const startIndex = lines.findIndex(line => line.trim().startsWith('```'));
        const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.trim().endsWith('```'));
        if (startIndex >= 0 && endIndex > startIndex) {
          jsonText = lines.slice(startIndex + 1, endIndex).join('\n');
        }
      }
      
      // Remove any leading/trailing whitespace
      jsonText = jsonText.trim();
      
      // Try to find JSON object in the text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      extractionResult = JSON.parse(jsonText) as ImageExtractionResult;
      
      // Validate structure
      if (!extractionResult.type || !extractionResult.confidence) {
        throw new Error('Invalid extraction result structure');
      }
      
      // Ensure problems array exists
      if (!extractionResult.problems) {
        extractionResult.problems = [];
      }
      
    } catch (parseError) {
      console.error('Failed to parse extraction result:', parseError);
      console.error('Raw response:', result.text);
      
      // Fallback: treat as unclear
      extractionResult = {
        type: 'UNCLEAR_IMAGE',
        confidence: 'low',
        problems: [],
        extracted_text: result.text.substring(0, 500), // First 500 chars as fallback
      };
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

