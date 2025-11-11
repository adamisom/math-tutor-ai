/**
 * XP System for Gamification
 * 
 * Tracks XP points, awards for attempts and solves, manages level progression
 */

export interface XPTransaction {
  id: string;
  amount: number;
  reason: 'attempt' | 'solve' | 'bonus';
  timestamp: number;
  problemId?: string;
}

export interface XPState {
  totalXP: number;
  level: number;
  transactions: XPTransaction[];
}

const STORAGE_KEY = 'math-tutor-xp';

const XP_REWARDS = {
  ATTEMPT: {
    base: 1,
    bonus: 2,
  },
  SOLVE: {
    beginner: 10,
    intermediate: 15,
    advanced: 20,
  },
  BONUS: {
    firstTry: 5,
    persistence: 3,
  },
};

export function calculateAttemptXP(
  attemptNumber: number,
  showedWork: boolean = false
): number {
  const base = XP_REWARDS.ATTEMPT.base;
  const bonus = showedWork ? XP_REWARDS.ATTEMPT.bonus : 0;
  return base + bonus;
}

export function calculateSolveXP(
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  attemptNumber: number
): number {
  const base = XP_REWARDS.SOLVE[difficulty];
  
  if (attemptNumber === 1) {
    return base + XP_REWARDS.BONUS.firstTry;
  }
  
  if (attemptNumber >= 5) {
    return base + XP_REWARDS.BONUS.persistence;
  }
  
  return base;
}

export function addXP(amount: number, reason: XPTransaction['reason'], problemId?: string): XPTransaction {
  if (typeof window === 'undefined') {
    return { id: '', amount: 0, reason, timestamp: 0 };
  }
  
  const transaction: XPTransaction = {
    id: `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount,
    reason,
    timestamp: Date.now(),
    problemId,
  };
  
  const currentXP = getTotalXP();
  const newTotal = currentXP + amount;
  
  const state: XPState = {
    totalXP: newTotal,
    level: calculateLevel(newTotal),
    transactions: [transaction, ...getRecentTransactions()].slice(0, 10),
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save XP:', error);
  }
  
  return transaction;
}

export function getTotalXP(): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state: XPState = JSON.parse(stored);
      return state.totalXP;
    }
  } catch (error) {
    console.warn('Failed to load XP:', error);
  }
  return 0;
}

/**
 * Calculate level from total XP using exponential progression.
 * XP needed for next level = 100 * 2^level
 * 
 * Examples:
 * - Level 1: 0-199 XP (200 XP needed for level 2)
 * - Level 2: 200-599 XP (400 XP needed for level 3)
 * - Level 3: 600-1399 XP (800 XP needed for level 4)
 * - Level 4: 1400-2999 XP (1600 XP needed for level 5)
 */
export function calculateLevel(totalXP: number): number {
  if (totalXP < 0) return 1;
  
  let level = 1;
  let cumulativeXP = 0;
  
  // Calculate cumulative XP needed for each level
  // Level N requires 100 * 2^N XP to reach
  while (cumulativeXP <= totalXP) {
    const xpForNextLevel = 100 * Math.pow(2, level);
    cumulativeXP += xpForNextLevel;
    if (cumulativeXP > totalXP) {
      return level;
    }
    level++;
  }
  
  return level;
}

/**
 * Calculate XP needed to reach the next level from current level
 */
export function getXPForNextLevel(level: number): number {
  return 100 * Math.pow(2, level);
}

/**
 * Calculate cumulative XP needed to reach a specific level
 */
export function getCumulativeXPForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let cumulative = 0;
  for (let i = 1; i < level; i++) {
    cumulative += 100 * Math.pow(2, i);
  }
  return cumulative;
}

function getRecentTransactions(): XPTransaction[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state: XPState = JSON.parse(stored);
      return state.transactions || [];
    }
  } catch (error) {
    console.warn('Failed to load XP transactions:', error);
  }
  return [];
}

export function getXPState(): XPState {
  if (typeof window === 'undefined') {
    return { totalXP: 0, level: 1, transactions: [] };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load XP state:', error);
  }
  
  return { totalXP: 0, level: 1, transactions: [] };
}

