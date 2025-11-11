/**
 * Unit Tests for XP System
 * 
 * Tests XP calculation logic - critical business logic for gamification
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAttemptXP,
  calculateSolveXP,
  calculateLevel,
} from '../../app/lib/xp-system';

describe('calculateAttemptXP', () => {
  it('should award base XP for first attempt', () => {
    expect(calculateAttemptXP(1)).toBe(1);
  });

  it('should award base XP for subsequent attempts', () => {
    expect(calculateAttemptXP(2)).toBe(1);
    expect(calculateAttemptXP(5)).toBe(1);
  });

  it('should award bonus XP when work is shown', () => {
    expect(calculateAttemptXP(1, true)).toBe(3); // base (1) + bonus (2)
    expect(calculateAttemptXP(3, true)).toBe(3);
  });

  it('should not award bonus when work is not shown', () => {
    expect(calculateAttemptXP(1, false)).toBe(1);
    expect(calculateAttemptXP(2, false)).toBe(1);
  });
});

describe('calculateSolveXP', () => {
  describe('beginner difficulty', () => {
    it('should award base XP for normal solve', () => {
      expect(calculateSolveXP('beginner', 2)).toBe(10);
      expect(calculateSolveXP('beginner', 3)).toBe(10);
      expect(calculateSolveXP('beginner', 4)).toBe(10);
    });

    it('should award first-try bonus', () => {
      expect(calculateSolveXP('beginner', 1)).toBe(15); // 10 + 5
    });

    it('should award persistence bonus after many attempts', () => {
      expect(calculateSolveXP('beginner', 5)).toBe(13); // 10 + 3
      expect(calculateSolveXP('beginner', 6)).toBe(13);
      expect(calculateSolveXP('beginner', 10)).toBe(13);
    });
  });

  describe('intermediate difficulty', () => {
    it('should award base XP for normal solve', () => {
      expect(calculateSolveXP('intermediate', 2)).toBe(15);
      expect(calculateSolveXP('intermediate', 3)).toBe(15);
      expect(calculateSolveXP('intermediate', 4)).toBe(15);
    });

    it('should award first-try bonus', () => {
      expect(calculateSolveXP('intermediate', 1)).toBe(20); // 15 + 5
    });

    it('should award persistence bonus after many attempts', () => {
      expect(calculateSolveXP('intermediate', 5)).toBe(18); // 15 + 3
      expect(calculateSolveXP('intermediate', 7)).toBe(18);
    });
  });

  describe('advanced difficulty', () => {
    it('should award base XP for normal solve', () => {
      expect(calculateSolveXP('advanced', 2)).toBe(20);
      expect(calculateSolveXP('advanced', 3)).toBe(20);
      expect(calculateSolveXP('advanced', 4)).toBe(20);
    });

    it('should award first-try bonus', () => {
      expect(calculateSolveXP('advanced', 1)).toBe(25); // 20 + 5
    });

    it('should award persistence bonus after many attempts', () => {
      expect(calculateSolveXP('advanced', 5)).toBe(23); // 20 + 3
      expect(calculateSolveXP('advanced', 8)).toBe(23);
    });
  });

  it('should prioritize first-try bonus over persistence bonus', () => {
    // First try should get first-try bonus, not persistence
    expect(calculateSolveXP('beginner', 1)).toBe(15); // Not 13
    expect(calculateSolveXP('intermediate', 1)).toBe(20); // Not 18
    expect(calculateSolveXP('advanced', 1)).toBe(25); // Not 23
  });
});

describe('calculateLevel', () => {
  // Exponential progression: XP needed for next level = 100 * 2^level
  // Level 1: 0-199 XP (200 XP needed for level 2)
  // Level 2: 200-599 XP (400 XP needed for level 3)
  // Level 3: 600-1399 XP (800 XP needed for level 4)
  // Level 4: 1400-2999 XP (1600 XP needed for level 5)
  
  it('should calculate level 1 for 0-199 XP', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(50)).toBe(1);
    expect(calculateLevel(100)).toBe(1);
    expect(calculateLevel(199)).toBe(1);
  });

  it('should calculate level 2 for 200-599 XP', () => {
    expect(calculateLevel(200)).toBe(2);
    expect(calculateLevel(300)).toBe(2);
    expect(calculateLevel(500)).toBe(2);
    expect(calculateLevel(599)).toBe(2);
  });

  it('should calculate level 3 for 600-1399 XP', () => {
    expect(calculateLevel(600)).toBe(3);
    expect(calculateLevel(800)).toBe(3);
    expect(calculateLevel(1000)).toBe(3);
    expect(calculateLevel(1399)).toBe(3);
  });

  it('should calculate level 4 for 1400-2999 XP', () => {
    expect(calculateLevel(1400)).toBe(4);
    expect(calculateLevel(2000)).toBe(4);
    expect(calculateLevel(2500)).toBe(4);
    expect(calculateLevel(2999)).toBe(4);
  });

  it('should calculate higher levels correctly', () => {
    expect(calculateLevel(3000)).toBe(5); // Level 5 starts at 3000
    expect(calculateLevel(5000)).toBe(5);
    expect(calculateLevel(6199)).toBe(5);
    expect(calculateLevel(6200)).toBe(6); // Level 6 starts at 6200
  });

  it('should handle edge cases', () => {
    expect(calculateLevel(1)).toBe(1);
    expect(calculateLevel(199)).toBe(1);
    expect(calculateLevel(200)).toBe(2);
    expect(calculateLevel(599)).toBe(2);
    expect(calculateLevel(600)).toBe(3);
  });
});

