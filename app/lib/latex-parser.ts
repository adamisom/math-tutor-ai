/**
 * LaTeX Parsing Utilities
 * 
 * Pure functions for parsing LaTeX expressions from text
 */

export interface LaTeXPart {
  type: 'text' | 'inline' | 'block';
  content: string;
  start: number;
  end: number;
}

/**
 * Parse LaTeX expressions from text
 * Returns array of parts (text and math expressions)
 */
export function parseLaTeX(content: string): LaTeXPart[] {
  const parts: LaTeXPart[] = [];
  const remaining = content;

  // First, find all block math ($$...$$) - these take priority
  const blockMathRegex = /\$\$([^$]+)\$\$/g;
  const blockMatches: Array<{ start: number; end: number; content: string }> = [];
  let blockMatch: RegExpExecArray | null;
  
  while ((blockMatch = blockMathRegex.exec(remaining)) !== null) {
    blockMatches.push({
      start: blockMatch.index,
      end: blockMatch.index + blockMatch[0].length,
      content: blockMatch[1],
    });
  }

  // Then find inline math ($...$) - but not inside block math
  const inlineMathRegex = /\$([^$\n]+?)\$/g;
  const inlineMatches: Array<{ start: number; end: number; content: string }> = [];
  let inlineMatch: RegExpExecArray | null;
  
  while ((inlineMatch = inlineMathRegex.exec(remaining)) !== null) {
    // TypeScript knows inlineMatch is not null here, but we need to assert it
    const match = inlineMatch;
    
    // Check if this inline math is inside a block math
    const isInsideBlock = blockMatches.some(
      block => match.index >= block.start && match.index < block.end
    );
    
    // Also check for escaped dollars (\$)
    const beforeMatch = remaining.substring(Math.max(0, match.index - 1), match.index);
    const isEscaped = beforeMatch === '\\';
    
    if (!isInsideBlock && !isEscaped) {
      inlineMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }
  }

  // Combine and sort all matches
  const allMatches = [
    ...blockMatches.map(m => ({ ...m, type: 'block' as const })),
    ...inlineMatches.map(m => ({ ...m, type: 'inline' as const })),
  ].sort((a, b) => a.start - b.start);

  // Build parts array with text segments
  let currentIndex = 0;
  
  for (const match of allMatches) {
    // Add text before match
    if (match.start > currentIndex) {
      const textContent = remaining.substring(currentIndex, match.start);
      if (textContent) {
        parts.push({
          type: 'text',
          content: textContent,
          start: currentIndex,
          end: match.start,
        });
      }
    }
    
    // Add math expression
    parts.push({
      type: match.type,
      content: match.content,
      start: match.start,
      end: match.end,
    });
    
    currentIndex = match.end;
  }
  
  // Add remaining text
  if (currentIndex < remaining.length) {
    const textContent = remaining.substring(currentIndex);
    if (textContent) {
      parts.push({
        type: 'text',
        content: textContent,
        start: currentIndex,
        end: remaining.length,
      });
    }
  }
  
  // If no math found, return single text part
  if (parts.length === 0) {
    return [{
      type: 'text',
      content: remaining,
      start: 0,
      end: remaining.length,
    }];
  }
  
  return parts;
}

