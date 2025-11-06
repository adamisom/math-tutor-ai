/**
 * JSON parsing utilities for extracting structured data from AI responses
 */

import { ImageExtractionResult } from '../api/chat/image-extract/route';

/**
 * Parse extraction JSON from Claude's response
 * Handles markdown code blocks, extra text, and malformed JSON gracefully
 */
export function parseExtractionJSON(text: string): ImageExtractionResult {
  try {
    // Try to extract JSON from the response (might have markdown code blocks)
    let jsonText = text.trim();
    
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
    
    const extractionResult = JSON.parse(jsonText) as ImageExtractionResult;
    
    // Validate structure
    if (!extractionResult.type || !extractionResult.confidence) {
      throw new Error('Invalid extraction result structure');
    }
    
    // Ensure problems array exists
    if (!extractionResult.problems) {
      extractionResult.problems = [];
    }
    
    return extractionResult;
  } catch {
    // Fallback: treat as unclear
    return {
      type: 'UNCLEAR_IMAGE',
      confidence: 'low',
      problems: [],
      extracted_text: text.substring(0, 500), // First 500 chars as fallback
    };
  }
}

