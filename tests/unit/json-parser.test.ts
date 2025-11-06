/**
 * Unit Tests for JSON Parser
 * 
 * Tests the parseExtractionJSON function for handling AI response parsing
 */

import { describe, it, expect } from 'vitest';
import { parseExtractionJSON } from '../../app/lib/json-parser';

describe('parseExtractionJSON', () => {
  it('should parse clean JSON', () => {
    const input = '{"type":"SINGLE_PROBLEM","confidence":"high","problems":["2x + 5 = 13"]}';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('SINGLE_PROBLEM');
    expect(result.confidence).toBe('high');
    expect(result.problems).toEqual(['2x + 5 = 13']);
  });

  it('should extract JSON from markdown code blocks', () => {
    const input = '```json\n{"type":"TWO_PROBLEMS","confidence":"high","problems":["Problem 1","Problem 2"]}\n```';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('TWO_PROBLEMS');
    expect(result.confidence).toBe('high');
    expect(result.problems).toHaveLength(2);
    expect(result.problems).toEqual(['Problem 1', 'Problem 2']);
  });

  it('should handle JSON with extra text before/after', () => {
    const input = 'Here is the result: {"type":"SINGLE_PROBLEM","confidence":"medium","problems":["x = 5"]} That was the problem.';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('SINGLE_PROBLEM');
    expect(result.confidence).toBe('medium');
    expect(result.problems).toEqual(['x = 5']);
  });

  it('should validate required fields (type, confidence)', () => {
    const input = '{"problems":["test"]}'; // Missing type and confidence
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('UNCLEAR_IMAGE');
    expect(result.confidence).toBe('low');
    expect(result.problems).toEqual([]);
  });

  it('should default problems array if missing', () => {
    const input = '{"type":"SOLUTION_DETECTED","confidence":"high"}';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('SOLUTION_DETECTED');
    expect(result.confidence).toBe('high');
    expect(result.problems).toEqual([]);
  });

  it('should handle malformed JSON gracefully', () => {
    const input = 'This is not JSON at all!';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('UNCLEAR_IMAGE');
    expect(result.confidence).toBe('low');
    expect(result.extracted_text).toBeDefined();
    expect(result.extracted_text).toBe('This is not JSON at all!');
  });

  it('should return UNCLEAR_IMAGE for parse failures', () => {
    const input = '{invalid json}';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('UNCLEAR_IMAGE');
    expect(result.confidence).toBe('low');
    expect(result.problems).toEqual([]);
  });

  it('should preserve extracted_text in fallback (first 500 chars)', () => {
    const longText = 'A'.repeat(1000);
    const result = parseExtractionJSON(longText);
    expect(result.type).toBe('UNCLEAR_IMAGE');
    expect(result.extracted_text).toBe('A'.repeat(500));
  });

  it('should handle all extraction types correctly', () => {
    const types = ['SINGLE_PROBLEM', 'TWO_PROBLEMS', 'MULTIPLE_PROBLEMS', 'SOLUTION_DETECTED', 'UNCLEAR_IMAGE'];
    types.forEach(type => {
      const input = `{"type":"${type}","confidence":"high","problems":[]}`;
      const result = parseExtractionJSON(input);
      expect(result.type).toBe(type);
      expect(result.confidence).toBe('high');
    });
  });

  it('should handle markdown with language identifier', () => {
    const input = '```json\n{"type":"SINGLE_PROBLEM","confidence":"high","problems":["test"]}\n```';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('SINGLE_PROBLEM');
    expect(result.problems).toEqual(['test']);
  });

  it('should handle nested markdown code blocks', () => {
    const input = 'Some text ```json\n{"type":"TWO_PROBLEMS","confidence":"medium","problems":["p1","p2"]}\n``` more text';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('TWO_PROBLEMS');
    expect(result.confidence).toBe('medium');
    expect(result.problems).toEqual(['p1', 'p2']);
  });

  it('should handle JSON with whitespace', () => {
    const input = '  {"type":"SINGLE_PROBLEM","confidence":"high","problems":["test"]}  ';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('SINGLE_PROBLEM');
  });

  it('should handle missing type field', () => {
    const input = '{"confidence":"high","problems":[]}';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('UNCLEAR_IMAGE');
  });

  it('should handle missing confidence field', () => {
    const input = '{"type":"SINGLE_PROBLEM","problems":[]}';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('UNCLEAR_IMAGE');
  });

  it('should handle empty string input', () => {
    const result = parseExtractionJSON('');
    expect(result.type).toBe('UNCLEAR_IMAGE');
    expect(result.confidence).toBe('low');
  });

  it('should handle MULTIPLE_PROBLEMS with 3+ problems', () => {
    const input = '{"type":"MULTIPLE_PROBLEMS","confidence":"high","problems":["p1","p2","p3","p4"]}';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('MULTIPLE_PROBLEMS');
    expect(result.problems).toHaveLength(4);
  });

  it('should handle UNCLEAR_IMAGE with extracted_text', () => {
    const input = '{"type":"UNCLEAR_IMAGE","confidence":"low","problems":[],"extracted_text":"Some text"}';
    const result = parseExtractionJSON(input);
    expect(result.type).toBe('UNCLEAR_IMAGE');
    expect(result.extracted_text).toBe('Some text');
  });
});

