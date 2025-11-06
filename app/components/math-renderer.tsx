'use client';

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { parseLaTeX } from '../lib/latex-parser';

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

  // Parse LaTeX expressions
  const parts = parseLaTeX(content);
  
  // If no math found, return original text
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
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

