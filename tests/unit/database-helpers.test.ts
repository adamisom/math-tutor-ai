import { describe, it, expect } from 'vitest';
import { toTimestamp, mapDatabaseConversationToSession } from '../../app/lib/database-helpers';
import type { DatabaseConversation } from '../../app/lib/database-types';

describe('toTimestamp', () => {
  it('converts ISO date string to timestamp', () => {
    const dateStr = '2024-01-15T10:30:00Z';
    const result = toTimestamp(dateStr);
    expect(result).toBe(new Date(dateStr).getTime());
    expect(typeof result).toBe('number');
  });

  it('converts Date object to timestamp', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = toTimestamp(date);
    expect(result).toBe(date.getTime());
  });

  it('returns number timestamp as-is', () => {
    const timestamp = 1705315800000;
    const result = toTimestamp(timestamp);
    expect(result).toBe(timestamp);
  });

  it('handles various date string formats', () => {
    const formats = [
      '2024-01-15T10:30:00Z',
      '2024-01-15T10:30:00.000Z',
      'Mon, 15 Jan 2024 10:30:00 GMT',
    ];
    
    formats.forEach(format => {
      const result = toTimestamp(format);
      const expected = new Date(format).getTime();
      expect(result).toBe(expected);
    });
  });

  it('handles invalid date strings gracefully', () => {
    const invalidDate = 'not-a-date';
    const result = toTimestamp(invalidDate);
    // Should still return a number (NaN converted to number)
    expect(typeof result).toBe('number');
  });

  it('handles zero timestamp', () => {
    expect(toTimestamp(0)).toBe(0);
    expect(toTimestamp(new Date(0))).toBe(0);
  });

  it('handles negative timestamps', () => {
    const negative = -1000;
    expect(toTimestamp(negative)).toBe(negative);
  });
});

describe('mapDatabaseConversationToSession', () => {
  const createMockDatabaseConv = (overrides?: Partial<DatabaseConversation>): DatabaseConversation => ({
    id: 'test-id',
    userId: 'user-1',
    title: 'Test Problem',
    problemText: 'Solve x + 5 = 10',
    messages: [],
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-16T11:00:00Z'),
    completed: false,
    xpEarned: 10,
    problemType: 'Algebra',
    difficulty: 'beginner',
    ...overrides,
  });

  it('maps all required fields correctly', () => {
    const dbConv = createMockDatabaseConv();
    const result = mapDatabaseConversationToSession(dbConv);

    expect(result.id).toBe('test-id');
    expect(result.title).toBe('Test Problem');
    expect(result.problemText).toBe('Solve x + 5 = 10');
    expect(result.messages).toEqual([]);
    expect(result.completed).toBe(false);
    expect(result.xpEarned).toBe(10);
  });

  it('converts Date objects to timestamps', () => {
    const dbConv = createMockDatabaseConv();
    const result = mapDatabaseConversationToSession(dbConv);

    expect(result.createdAt).toBe(new Date('2024-01-15T10:30:00Z').getTime());
    expect(result.updatedAt).toBe(new Date('2024-01-16T11:00:00Z').getTime());
    expect(typeof result.createdAt).toBe('number');
    expect(typeof result.updatedAt).toBe('number');
  });

  it('converts string dates to timestamps', () => {
    const dbConv = createMockDatabaseConv({
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-16T11:00:00Z',
    });
    const result = mapDatabaseConversationToSession(dbConv);

    expect(result.createdAt).toBe(new Date('2024-01-15T10:30:00Z').getTime());
    expect(result.updatedAt).toBe(new Date('2024-01-16T11:00:00Z').getTime());
  });

  it('converts number timestamps correctly', () => {
    const timestamp1 = 1705315800000;
    const timestamp2 = 1705402800000;
    const dbConv = createMockDatabaseConv({
      createdAt: timestamp1,
      updatedAt: timestamp2,
    });
    const result = mapDatabaseConversationToSession(dbConv);

    expect(result.createdAt).toBe(timestamp1);
    expect(result.updatedAt).toBe(timestamp2);
  });

  it('handles null problemType by converting to undefined', () => {
    const dbConv = createMockDatabaseConv({ problemType: null });
    const result = mapDatabaseConversationToSession(dbConv);
    expect(result.problemType).toBeUndefined();
  });

  it('handles undefined problemType', () => {
    const dbConv = createMockDatabaseConv({ problemType: undefined });
    const result = mapDatabaseConversationToSession(dbConv);
    expect(result.problemType).toBeUndefined();
  });

  it('preserves valid problemType', () => {
    const dbConv = createMockDatabaseConv({ problemType: 'Geometry' });
    const result = mapDatabaseConversationToSession(dbConv);
    expect(result.problemType).toBe('Geometry');
  });

  it('handles null difficulty by converting to undefined', () => {
    const dbConv = createMockDatabaseConv({ difficulty: null });
    const result = mapDatabaseConversationToSession(dbConv);
    expect(result.difficulty).toBeUndefined();
  });

  it('handles undefined difficulty', () => {
    const dbConv = createMockDatabaseConv({ difficulty: undefined });
    const result = mapDatabaseConversationToSession(dbConv);
    expect(result.difficulty).toBeUndefined();
  });

  it('preserves valid difficulty values', () => {
    const difficulties: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];
    
    difficulties.forEach(difficulty => {
      const dbConv = createMockDatabaseConv({ difficulty });
      const result = mapDatabaseConversationToSession(dbConv);
      expect(result.difficulty).toBe(difficulty);
    });
  });

  it('handles invalid difficulty string by type coercion', () => {
    // Database might return invalid string, should be coerced
    const dbConv = createMockDatabaseConv({ difficulty: 'invalid' as 'beginner' | 'intermediate' | 'advanced' | undefined });
    const result = mapDatabaseConversationToSession(dbConv);
    // Should still return a value (type assertion allows it)
    expect(result.difficulty).toBe('invalid');
  });

  it('preserves messages array structure', () => {
    const messages = [
      { role: 'user' as const, content: 'Hello', timestamp: 1000 },
      { role: 'assistant' as const, content: 'Hi', timestamp: 2000 },
    ];
    const dbConv = createMockDatabaseConv({ messages });
    const result = mapDatabaseConversationToSession(dbConv);
    expect(result.messages).toEqual(messages);
  });

  it('handles empty messages array', () => {
    const dbConv = createMockDatabaseConv({ messages: [] });
    const result = mapDatabaseConversationToSession(dbConv);
    expect(result.messages).toEqual([]);
  });

  it('handles boolean completed field correctly', () => {
    expect(mapDatabaseConversationToSession(createMockDatabaseConv({ completed: true })).completed).toBe(true);
    expect(mapDatabaseConversationToSession(createMockDatabaseConv({ completed: false })).completed).toBe(false);
  });

  it('handles zero xpEarned', () => {
    const dbConv = createMockDatabaseConv({ xpEarned: 0 });
    const result = mapDatabaseConversationToSession(dbConv);
    expect(result.xpEarned).toBe(0);
  });

  it('handles large xpEarned values', () => {
    const dbConv = createMockDatabaseConv({ xpEarned: 999999 });
    const result = mapDatabaseConversationToSession(dbConv);
    expect(result.xpEarned).toBe(999999);
  });
});

