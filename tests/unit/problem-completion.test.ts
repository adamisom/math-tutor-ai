/**
 * Unit Tests for Problem Completion Detection
 * 
 * Tests detection logic that determines when a problem is solved - critical for XP awards
 */

import { describe, it, expect } from 'vitest';
import {
  detectProblemCompletion,
  determineDifficulty,
} from '../../app/lib/problem-completion';

describe('detectProblemCompletion', () => {
  it('should return false for empty messages', () => {
    const result = detectProblemCompletion([], 'test problem');
    expect(result.isComplete).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('should return false when last message is from user', () => {
    const messages = [
      { role: 'user' as const, content: 'What is 2+2?' },
      { role: 'assistant' as const, content: 'Let me help you think about this.' },
      { role: 'user' as const, content: 'I think it might be 4' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(false);
  });

  it('should detect completion with "excellent work" when user provided answer and AI confirms', () => {
    const messages = [
      { role: 'user' as const, content: '2+2=4' },
      { role: 'assistant' as const, content: 'Excellent work! Your answer is correct and you solved it.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.9); // "excellent work" is a strong indicator
    expect(result.completionMessage).toContain('Excellent work');
  });

  it('should detect completion with "great job" when user provided answer and AI confirms', () => {
    const messages = [
      { role: 'user' as const, content: 'x=5' },
      { role: 'assistant' as const, content: 'Great job! That\'s correct. Your answer is right.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.7);
  });

  it('should detect completion with "you successfully solved"', () => {
    const messages = [
      { role: 'user' as const, content: 'The answer is 10' },
      { role: 'assistant' as const, content: 'You successfully solved the problem!' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.9);
  });

  it('should detect completion with "correct!" when user provided answer and AI confirms', () => {
    const messages = [
      { role: 'user' as const, content: 'x=3' },
      { role: 'assistant' as const, content: 'Correct! Your answer is exactly right. Well done.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.7);
  });

  it('should detect completion with celebration emoji when user provided answer and AI confirms', () => {
    const messages = [
      { role: 'user' as const, content: '42' },
      { role: 'assistant' as const, content: '🎉 Perfect! Your answer is correct. You solved it!' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.9); // "perfect" is a strong indicator
  });

  it('should detect completion with "that\'s correct" when user provided answer and AI confirms', () => {
    const messages = [
      { role: 'user' as const, content: 'y=7' },
      { role: 'assistant' as const, content: 'That\'s correct! Your answer is right. Good thinking.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.7);
  });

  it('should detect completion with "problem solved"', () => {
    const messages = [
      { role: 'user' as const, content: 'The solution is x=2' },
      { role: 'assistant' as const, content: 'Problem solved! Excellent work.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.9);
  });

  it('should detect completion with "you solved it"', () => {
    const messages = [
      { role: 'user' as const, content: 'Answer: 15' },
      { role: 'assistant' as const, content: 'You solved it! Great job.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.9);
  });

  it('should detect completion with "perfect!" when user provided answer and AI confirms', () => {
    const messages = [
      { role: 'user' as const, content: 'x=8' },
      { role: 'assistant' as const, content: 'Perfect! Your answer is exactly right and correct.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.7);
  });

  it('should detect completion with "well done" when user provided answer and AI confirms', () => {
    const messages = [
      { role: 'user' as const, content: '20' },
      { role: 'assistant' as const, content: 'Well done! Your answer is correct. You got it.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.9); // "well done" is a strong indicator
  });

  it('should detect completion with confirmation pattern when user provided answer', () => {
    const messages = [
      { role: 'user' as const, content: 'x=5' },
      { role: 'assistant' as const, content: 'Yes, that is correct. Your answer is right and you got it right.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.9); // "that is correct" is a strong indicator
  });

  it('should not detect completion for guidance messages', () => {
    const messages = [
      { role: 'user' as const, content: 'I think x=3' },
      { role: 'assistant' as const, content: 'Good thinking! Can you check if that works?' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(false);
  });

  it('should not detect completion for incorrect answers', () => {
    const messages = [
      { role: 'user' as const, content: 'x=10' },
      { role: 'assistant' as const, content: 'Not quite. Let\'s think about this differently.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(false);
  });

  it('should find last assistant message in long conversation', () => {
    const messages = [
      { role: 'user' as const, content: 'What is 2+2?' },
      { role: 'assistant' as const, content: 'Let me help you think about this.' },
      { role: 'user' as const, content: 'Is it 3?' },
      { role: 'assistant' as const, content: 'Not quite, try again.' },
      { role: 'user' as const, content: '4' },
      { role: 'assistant' as const, content: 'Excellent work! Your answer is correct and that\'s right.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.9); // "excellent work" is a strong indicator
  });

  it('should be case-insensitive', () => {
    const messages = [
      { role: 'user' as const, content: 'x=5' },
      { role: 'assistant' as const, content: 'EXCELLENT WORK! Your answer is correct and you got it.' },
    ];
    const result = detectProblemCompletion(messages, 'test problem');
    expect(result.isComplete).toBe(true);
    expect(result.confidence).toBe(0.9); // "excellent work" is a strong indicator
  });
});

describe('determineDifficulty', () => {
  describe('advanced difficulty', () => {
    it('should detect derivative problems', () => {
      expect(determineDifficulty('Find the derivative of x^2')).toBe('advanced');
    });

    it('should detect integral problems', () => {
      expect(determineDifficulty('Calculate the integral of x')).toBe('advanced');
    });

    it('should detect calculus problems', () => {
      expect(determineDifficulty('This is a calculus problem')).toBe('advanced');
    });

    it('should detect absolute value problems', () => {
      expect(determineDifficulty('Solve |x| = 5')).toBe('advanced');
      expect(determineDifficulty('Find the absolute value')).toBe('advanced');
    });

    it('should detect quadratic problems', () => {
      expect(determineDifficulty('Solve the quadratic equation')).toBe('advanced');
    });

    it('should detect complex problems', () => {
      expect(determineDifficulty('This is a complex problem')).toBe('advanced');
    });
  });

  describe('intermediate difficulty', () => {
    it('should detect distributive property', () => {
      expect(determineDifficulty('Use the distributive property')).toBe('intermediate');
    });

    it('should detect "both sides" problems', () => {
      expect(determineDifficulty('Add 5 to both sides')).toBe('intermediate');
    });

    it('should detect fraction problems', () => {
      expect(determineDifficulty('Solve this fraction problem')).toBe('intermediate');
    });

    it('should detect ratio problems', () => {
      expect(determineDifficulty('Find the ratio')).toBe('intermediate');
    });

    it('should detect percent problems', () => {
      expect(determineDifficulty('What percent is 20 of 100?')).toBe('intermediate');
    });

    it('should detect Pythagorean theorem', () => {
      expect(determineDifficulty('Use the Pythagorean theorem')).toBe('intermediate');
    });
  });

  describe('beginner difficulty', () => {
    it('should default to beginner for simple problems', () => {
      expect(determineDifficulty('What is 2 + 2?')).toBe('beginner');
      expect(determineDifficulty('Solve for x: x + 5 = 10')).toBe('beginner');
      expect(determineDifficulty('Calculate 3 * 4')).toBe('beginner');
    });

    it('should default to beginner when no indicators present', () => {
      expect(determineDifficulty('Solve this equation')).toBe('beginner');
      expect(determineDifficulty('Find the answer')).toBe('beginner');
    });
  });

  it('should prioritize advanced over intermediate', () => {
    expect(determineDifficulty('Find the derivative of this fraction')).toBe('advanced');
  });

  it('should be case-insensitive', () => {
    expect(determineDifficulty('FIND THE DERIVATIVE')).toBe('advanced');
    expect(determineDifficulty('This is a FRACTION problem')).toBe('intermediate');
  });
});

