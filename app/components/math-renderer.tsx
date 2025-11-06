'use client';

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  enableLaTeX?: boolean;
}

/**
 * Parse and render LaTeX math expressions in text
 * Supports:
 * - Inline math: $expression$
 * - Block math: $$expression$$
 * - Escaped dollars: \$
 * 
 * Note: This component handles LaTeX only. Bold markdown (**text**) should be
 * handled separately before or after LaTeX rendering.
 */
export function MathRenderer({ content, enableLaTeX = true }: MathRendererProps) {
  // If LaTeX is disabled, return plain text
  if (!enableLaTeX) {
    return <span>{content}</span>;
  }

  // Split content into parts: text and math expressions
  const parts: Array<{ type: 'text' | 'inline' | 'block'; content: string }> = [];
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

  // Build parts array
  let currentIndex = 0;
  
  for (const match of allMatches) {
    // Add text before match
    if (match.start > currentIndex) {
      const textContent = remaining.substring(currentIndex, match.start);
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    // Add math expression
    parts.push({ type: match.type, content: match.content });
    
    currentIndex = match.end;
  }
  
  // Add remaining text
  if (currentIndex < remaining.length) {
    const textContent = remaining.substring(currentIndex);
    if (textContent) {
      parts.push({ type: 'text', content: textContent });
    }
  }
  
  // If no math found, return original text
  if (parts.length === 0) {
    return <span>{content}</span>;
  }

  // Render parts
  return (
    <span>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        } else if (part.type === 'inline') {
          return (
            <MathErrorBoundary key={index} fallback={`$${part.content}$`}>
              <InlineMath math={part.content} />
            </MathErrorBoundary>
          );
        } else {
          // Block math
          return (
            <MathErrorBoundary key={index} fallback={`$$${part.content}$$`}>
              <div className="my-2 overflow-x-auto">
                <BlockMath math={part.content} />
              </div>
            </MathErrorBoundary>
          );
        }
      })}
    </span>
  );
}

/**
 * Error boundary for LaTeX rendering
 * Falls back to showing raw LaTeX if rendering fails
 */
class MathErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('LaTeX rendering error:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return <span className="font-mono text-sm">{this.props.fallback}</span>;
    }

    return this.props.children;
  }
}

