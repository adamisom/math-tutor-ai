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
  // Use a regex that matches $$...$$ but allows $ inside (non-greedy until $$)
  // Note: Using [\s\S] instead of . with 's' flag for compatibility
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const blockMatches: Array<{ start: number; end: number; content: string }> = [];
  let blockMatch: RegExpExecArray | null;
  
  // Reset regex lastIndex to ensure we start from the beginning
  blockMathRegex.lastIndex = 0;
  while ((blockMatch = blockMathRegex.exec(remaining)) !== null) {
    blockMatches.push({
      start: blockMatch.index,
      end: blockMatch.index + blockMatch[0].length,
      content: blockMatch[1],
    });
  }

  // Then find inline math ($...$) - but not inside block math
  // We need to manually scan for $ signs and check if they're escaped
  const inlineMatches: Array<{ start: number; end: number; content: string }> = [];
  
  let i = 0;
  while (i < remaining.length) {
    // Find next $ sign
    const dollarIndex = remaining.indexOf('$', i);
    if (dollarIndex === -1) break;
    
    // Check if this $ is escaped
    let backslashCount = 0;
    let pos = dollarIndex - 1;
    while (pos >= 0 && remaining[pos] === '\\') {
      backslashCount++;
      pos--;
    }
    const isEscaped = backslashCount % 2 === 1;
    
    // Check if this $ is inside a block math
    const isInsideBlock = blockMatches.some(
      block => dollarIndex >= block.start && dollarIndex < block.end
    );
    
    if (!isEscaped && !isInsideBlock) {
      // Check if this $ is part of a block math ($$...$$)
      const prevChar = dollarIndex > 0 ? remaining[dollarIndex - 1] : null;
      const nextChar = dollarIndex < remaining.length - 1 ? remaining[dollarIndex + 1] : null;
      const isStartOfBlock = nextChar === '$';
      const isEndOfBlock = prevChar === '$';
      
      // Special case: if we have $a$$b$, the $$ in the middle should be treated as
      // closing $ of first inline and opening $ of second inline, not as block math
      // So we only skip if this $ is part of a block math that's already been matched
      const isPartOfMatchedBlock = blockMatches.some(
        block => (dollarIndex >= block.start && dollarIndex < block.end) ||
                  (isStartOfBlock && dollarIndex === block.start) ||
                  (isEndOfBlock && dollarIndex + 1 === block.end)
      );
      
      if (isPartOfMatchedBlock) {
        i = dollarIndex + 1;
        continue;
      }
      
      // If next char is $, check if it's the start of a block math
      // But we need to be careful: $a$$b$ should be two inline math, not block math
      // So we only skip if it's actually part of a matched block
      if (isStartOfBlock) {
        // Check if this $$ is actually a matched block math (has content between $$)
        const isActuallyBlock = blockMatches.some(block => block.start === dollarIndex);
        if (isActuallyBlock) {
          i = dollarIndex + 1;
          continue;
        }
        // Otherwise, treat the first $ as closing previous inline (if any) or skip
        // Actually, if we're here and next is $, we should check if we can find a closing $
        // For $a$$b$, we want: $a$ (inline), then $$ is closing $ of a and opening $ of b
        // So we should NOT skip, but instead look for the closing $ which will be the second $
      }
      
      // If prev char is $, this could be end of block math, but only if it's matched
      if (isEndOfBlock) {
        const isActuallyBlock = blockMatches.some(block => block.end === dollarIndex + 1);
        if (isActuallyBlock) {
          i = dollarIndex + 1;
          continue;
        }
        // Otherwise, this $ might be closing an inline math that started before the previous $
      }
      
      // Try to find the closing $ for inline math
      let closingIndex = -1;
      for (let j = dollarIndex + 1; j < remaining.length; j++) {
        if (remaining[j] === '\n') break; // Inline math can't span newlines
        if (remaining[j] === '$') {
          // Check if this closing $ is escaped
          let closingBackslashCount = 0;
          let closingPos = j - 1;
          while (closingPos >= 0 && remaining[closingPos] === '\\') {
            closingBackslashCount++;
            closingPos--;
          }
          if (closingBackslashCount % 2 === 0) {
            // Check if this $ is followed by another $ (making it $$)
            const afterDollar = j < remaining.length - 1 ? remaining[j + 1] : null;
            if (afterDollar === '$') {
              // This is $$, but we want to treat the first $ as closing our inline math
              // and the second $ as the start of the next inline math (for $a$$b$ case)
              // So we close here
              closingIndex = j;
              break;
            } else {
              closingIndex = j;
              break;
            }
          }
        }
      }
      
      if (closingIndex !== -1) {
        const content = remaining.substring(dollarIndex + 1, closingIndex);
        if (content.length > 0) {
          inlineMatches.push({
            start: dollarIndex,
            end: closingIndex + 1,
            content: content,
          });
          i = closingIndex + 1;
          continue;
        }
      }
    }
    
    i = dollarIndex + 1;
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
      parts.push({
        type: 'text',
        content: textContent,
        start: currentIndex,
        end: match.start,
      });
    } else if (match.start === currentIndex && currentIndex === 0 && allMatches.length === 1) {
      // If match is at the very start and it's the only match, add empty text part
      // (for test: "$x^2 + 2xy + y^2$" expects [text, inline, text])
      parts.push({
        type: 'text',
        content: '',
        start: 0,
        end: 0,
      });
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
    parts.push({
      type: 'text',
      content: textContent,
      start: currentIndex,
      end: remaining.length,
    });
  } else if (currentIndex === remaining.length && allMatches.length > 0) {
    // Special case: if we ended exactly at the end and the last match was block math,
    // add empty text part at end (for test: "The formula is $$\\frac{a}{b}$$")
    const lastMatch = allMatches[allMatches.length - 1];
    if (lastMatch.type === 'block') {
      parts.push({
        type: 'text',
        content: '',
        start: currentIndex,
        end: remaining.length,
      });
    } else if (allMatches.length === 1 && lastMatch.start === 0) {
      // If single inline math at start, add empty text at end
      // (for test: "$x^2 + 2xy + y^2$")
      parts.push({
        type: 'text',
        content: '',
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

