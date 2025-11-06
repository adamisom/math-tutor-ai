/**
 * Unit Tests for LaTeX Parser
 * 
 * Tests LaTeX parsing logic
 */

import { describe, it, expect } from 'vitest';
import { parseLaTeX } from '../../app/lib/latex-parser';

describe('parseLaTeX', () => {
  it('should parse inline math expressions', () => {
    const result = parseLaTeX('Solve for $x$ in the equation');
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('text');
    expect(result[0].content).toBe('Solve for ');
    expect(result[1].type).toBe('inline');
    expect(result[1].content).toBe('x');
    expect(result[2].type).toBe('text');
    expect(result[2].content).toBe(' in the equation');
  });

  it('should parse block math expressions', () => {
    const result = parseLaTeX('The formula is $$\\frac{a}{b}$$');
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('text');
    expect(result[0].content).toBe('The formula is ');
    expect(result[1].type).toBe('block');
    expect(result[1].content).toBe('\\frac{a}{b}');
    expect(result[2].type).toBe('text');
    expect(result[2].content).toBe('');
  });

  it('should parse multiple inline math expressions', () => {
    const result = parseLaTeX('$x^2$ plus $y^2$ equals $z^2$');
    expect(result).toHaveLength(5);
    expect(result[0].type).toBe('inline');
    expect(result[0].content).toBe('x^2');
    expect(result[1].type).toBe('text');
    expect(result[1].content).toBe(' plus ');
    expect(result[2].type).toBe('inline');
    expect(result[2].content).toBe('y^2');
    expect(result[3].type).toBe('text');
    expect(result[3].content).toBe(' equals ');
    expect(result[4].type).toBe('inline');
    expect(result[4].content).toBe('z^2');
  });

  it('should handle text with no math', () => {
    const result = parseLaTeX('This is just plain text');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    expect(result[0].content).toBe('This is just plain text');
  });

  it('should handle empty string', () => {
    const result = parseLaTeX('');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text');
    expect(result[0].content).toBe('');
  });

  it('should handle only inline math', () => {
    const result = parseLaTeX('$x = 5$');
    expect(result.length).toBeGreaterThanOrEqual(1);
    const inlinePart = result.find(p => p.type === 'inline');
    expect(inlinePart).toBeDefined();
    expect(inlinePart?.content).toBe('x = 5');
  });

  it('should handle only block math', () => {
    const result = parseLaTeX('$$\\int_0^1 x dx$$');
    expect(result.length).toBeGreaterThanOrEqual(1);
    const blockPart = result.find(p => p.type === 'block');
    expect(blockPart).toBeDefined();
    expect(blockPart?.content).toBe('\\int_0^1 x dx');
  });

  it('should not parse inline math inside block math', () => {
    const result = parseLaTeX('$$x = $5$$');
    expect(result).toHaveLength(3);
    expect(result[1].type).toBe('block');
    // The $5 inside should be part of the block content, not parsed separately
    expect(result[1].content).toContain('$5');
  });

  it('should handle escaped dollar signs', () => {
    const result = parseLaTeX('The price is \\$5 and $x$ is a variable');
    // Should only parse the $x$, not the \$5
    const inlineParts = result.filter(p => p.type === 'inline');
    expect(inlineParts).toHaveLength(1);
    expect(inlineParts[0].content).toBe('x');
    // The \$ should be in text
    expect(result.some(p => p.content.includes('\\$5'))).toBe(true);
  });

  it('should handle mixed inline and block math', () => {
    const result = parseLaTeX('Inline: $x$ and block: $$\\frac{1}{2}$$');
    expect(result).toHaveLength(5);
    const types = result.map(p => p.type);
    expect(types).toEqual(['text', 'inline', 'text', 'block', 'text']);
  });

  it('should preserve text between math expressions', () => {
    const result = parseLaTeX('Start $a$ middle $b$ end');
    expect(result).toHaveLength(5);
    expect(result[0].content).toBe('Start ');
    expect(result[1].content).toBe('a');
    expect(result[2].content).toBe(' middle ');
    expect(result[3].content).toBe('b');
    expect(result[4].content).toBe(' end');
  });

  it('should handle complex math expressions', () => {
    const result = parseLaTeX('$x^2 + 2xy + y^2$');
    expect(result).toHaveLength(3);
    expect(result[1].type).toBe('inline');
    expect(result[1].content).toBe('x^2 + 2xy + y^2');
  });

  it('should handle block math with newlines', () => {
    const result = parseLaTeX('$$\\begin{matrix}1 & 2\\\\3 & 4\\end{matrix}$$');
    expect(result.length).toBeGreaterThanOrEqual(1);
    const blockPart = result.find(p => p.type === 'block');
    expect(blockPart).toBeDefined();
    expect(blockPart?.content).toContain('matrix');
  });

  it('should handle math at start of string', () => {
    const result = parseLaTeX('$x$ is a variable');
    expect(result.length).toBeGreaterThanOrEqual(2);
    const inlinePart = result.find(p => p.type === 'inline');
    expect(inlinePart).toBeDefined();
    expect(inlinePart?.content).toBe('x');
    const textPart = result.find(p => p.type === 'text' && p.content.includes('is a variable'));
    expect(textPart).toBeDefined();
  });

  it('should handle math at end of string', () => {
    const result = parseLaTeX('The answer is $42$');
    expect(result.length).toBeGreaterThanOrEqual(2);
    const inlinePart = result.find(p => p.type === 'inline');
    expect(inlinePart).toBeDefined();
    expect(inlinePart?.content).toBe('42');
  });

  it('should include position information', () => {
    const result = parseLaTeX('Text $x$ more');
    expect(result[1].type).toBe('inline');
    expect(result[1].start).toBeGreaterThanOrEqual(0);
    expect(result[1].end).toBeGreaterThan(result[1].start);
  });

  it('should handle consecutive math expressions', () => {
    const result = parseLaTeX('$a$$b$');
    expect(result.length).toBeGreaterThanOrEqual(2);
    const inlineParts = result.filter(p => p.type === 'inline');
    expect(inlineParts).toHaveLength(2);
    expect(inlineParts[0].content).toBe('a');
    expect(inlineParts[1].content).toBe('b');
  });
});

