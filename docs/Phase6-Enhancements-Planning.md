# Phase 6: Enhancements Planning Document

**Version:** 1.1  
**Date:** December 2024  
**Timeline:** 4-6 weeks  
**Primary Goal:** Add gamification (XP), conversation history, AI problem generation, voice interface, and polished intro screen

---

## Table of Contents
1. [Overview](#overview)
2. [Feature 1: Enhanced Conversation History](#feature-1-enhanced-conversation-history)
3. [Feature 2: XP System with Animations](#feature-2-xp-system-with-animations)
4. [Feature 3: AI-Generated Problems](#feature-3-ai-generated-problems)
5. [Feature 4: Voice Interface](#feature-4-voice-interface)
6. [Feature 5: Polished Intro Screen](#feature-5-polished-intro-screen)
7. [Implementation Phases](#implementation-phases)
8. [Technical Architecture](#technical-architecture)
9. [Testing Strategy](#testing-strategy)
10. [Cost & Timeline Estimates](#cost--timeline-estimates)

---

## Overview

This document outlines the planning for five major enhancements to the AI Math Tutor:

1. **Enhanced Conversation History** - Persistent, searchable conversation history stored in localStorage
2. **XP System** - Gamification with points, animations, and progress tracking
3. **AI-Generated Problems** - Dynamic problem generation with variety matching the test interface
4. **Voice Interface** - Text-to-speech responses and speech-to-text input
5. **Polished Intro Screen** - Beautiful welcome screen with animations and smooth transitions

### Success Criteria
- [ ] Users can view and search past conversations
- [ ] XP accumulates across problems with engaging animations
- [ ] AI generates problems matching test interface variety
- [ ] Voice input/output works seamlessly on modern browsers
- [ ] Intro screen provides engaging first impression with smooth animations
- [ ] All features work together without conflicts
- [ ] Performance remains smooth with new features

---

## Feature 1: Enhanced Conversation History

### Current State
- Basic conversation saving exists in `chat-interface.tsx`
- Messages saved to `localStorage` with key `math-tutor-conversation`
- No search, filtering, or organization features
- No way to view past conversations

### Goals
- Persistent conversation history across sessions
- Search and filter capabilities
- Organized by date/problem
- Export functionality
- Storage management (handle quota limits)

### Implementation Details

#### 1.1 Data Structure Enhancement

```typescript
// app/lib/conversation-history.ts

export interface ConversationSession {
  id: string; // UUID or timestamp-based
  title: string; // Auto-generated from first problem or user-provided
  problemText: string; // The initial problem
  messages: ConversationMessage[];
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  completed: boolean; // Whether problem was solved
  xpEarned: number; // XP from this session
  problemType?: string; // Algebra, Geometry, etc.
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  // Optional: image data if message had image
  imageBase64?: string;
}

// Storage structure
interface ConversationHistoryStorage {
  sessions: ConversationSession[];
  currentSessionId: string | null;
  lastUpdated: number;
  version: number; // For migration support
}
```

#### 1.2 Storage Management

```typescript
// app/lib/conversation-history.ts

const STORAGE_KEY = 'math-tutor-conversation-history';
const MAX_SESSIONS = 50; // Limit to prevent quota issues
const MAX_SESSION_SIZE = 100; // Max messages per session

export function saveConversationSession(session: ConversationSession): void {
  const history = loadConversationHistory();
  
  // Update or add session
  const existingIndex = history.sessions.findIndex(s => s.id === session.id);
  if (existingIndex >= 0) {
    history.sessions[existingIndex] = session;
  } else {
    history.sessions.unshift(session); // Add to beginning
    // Limit total sessions
    if (history.sessions.length > MAX_SESSIONS) {
      history.sessions = history.sessions.slice(0, MAX_SESSIONS);
    }
  }
  
  history.lastUpdated = Date.now();
  history.currentSessionId = session.id;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    // Handle quota exceeded - remove oldest sessions
    if (error instanceof DOMException && error.code === 22) {
      handleStorageQuotaExceeded(history);
    }
  }
}

export function loadConversationHistory(): ConversationHistoryStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration logic if version changes
      return migrateIfNeeded(parsed);
    }
  } catch (error) {
    console.warn('Failed to load conversation history:', error);
  }
  
  return {
    sessions: [],
    currentSessionId: null,
    lastUpdated: Date.now(),
    version: 1,
  };
}

function handleStorageQuotaExceeded(history: ConversationHistoryStorage): void {
  // Remove oldest 25% of sessions
  const removeCount = Math.ceil(history.sessions.length * 0.25);
  history.sessions = history.sessions.slice(0, -removeCount);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Still failing - clear all and start fresh
    localStorage.removeItem(STORAGE_KEY);
    console.warn('Storage quota exceeded - cleared conversation history');
  }
}
```

#### 1.3 UI Components

**Conversation History Sidebar/Modal:**

```typescript
// app/components/conversation-history.tsx

'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, X, Download, Trash2 } from 'lucide-react';
import { 
  loadConversationHistory, 
  ConversationSession,
  deleteConversationSession,
  exportConversationSession 
} from '../lib/conversation-history';

export function ConversationHistory({
  onSelectSession,
  onClose,
}: {
  onSelectSession: (session: ConversationSession) => void;
  onClose: () => void;
}) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  useEffect(() => {
    const history = loadConversationHistory();
    setSessions(history.sessions);
  }, []);
  
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.problemText.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || session.problemType === filterType;
    
    return matchesSearch && matchesFilter;
  });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Conversation History</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="p-4 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="Algebra">Algebra</option>
            <option value="Geometry">Geometry</option>
            <option value="Word Problem">Word Problem</option>
            <option value="Fractions">Fractions</option>
            <option value="Calculus">Calculus</option>
          </select>
        </div>
        
        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No conversations found
            </p>
          ) : (
            <div className="space-y-2">
              {filteredSessions.map(session => (
                <ConversationSessionCard
                  key={session.id}
                  session={session}
                  onSelect={() => onSelectSession(session)}
                  onDelete={() => {
                    deleteConversationSession(session.id);
                    setSessions(prev => prev.filter(s => s.id !== session.id));
                  }}
                  onExport={() => exportConversationSession(session)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationSessionCard({
  session,
  onSelect,
  onDelete,
  onExport,
}: {
  session: ConversationSession;
  onSelect: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const date = new Date(session.createdAt);
  
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={onSelect}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{session.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {session.problemText}
          </p>
        </div>
        <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onExport}
            className="p-1 hover:bg-gray-200 rounded"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {date.toLocaleDateString()}
        </span>
        {session.problemType && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {session.problemType}
          </span>
        )}
        {session.completed && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
            Completed
          </span>
        )}
        {session.xpEarned > 0 && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
            +{session.xpEarned} XP
          </span>
        )}
      </div>
    </div>
  );
}
```

#### 1.4 Integration Points

- **Auto-save**: Update `chat-interface.tsx` to save sessions after each message
- **Session creation**: Create new session when user starts a new problem
- **Session updates**: Update existing session when continuing conversation
- **Completion detection**: Mark session as completed when problem is solved (see XP system)

---

## Feature 2: XP System with Animations

### Goals
- Award XP for attempts (small amounts: +1, +2)
- Award larger XP for solving problems (e.g., +10, +20)
- Animated XP notifications
- Cumulative XP tracking across all problems
- Level system (optional future enhancement)
- Celebration animations on problem completion

### Implementation Details

#### 2.1 XP Calculation Logic

```typescript
// app/lib/xp-system.ts

export interface XPTransaction {
  id: string;
  amount: number;
  reason: 'attempt' | 'solve' | 'bonus';
  timestamp: number;
  problemId?: string;
}

export interface XPState {
  totalXP: number;
  level: number; // Future: calculate from totalXP
  transactions: XPTransaction[]; // Last N transactions for display
}

const XP_REWARDS = {
  ATTEMPT: {
    base: 1,
    bonus: 2, // For good attempts (e.g., showing work)
  },
  SOLVE: {
    beginner: 10,
    intermediate: 15,
    advanced: 20,
  },
  BONUS: {
    firstTry: 5, // Solved on first attempt
    persistence: 3, // Solved after many attempts (encouragement)
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
  
  // Bonus for solving on first try
  if (attemptNumber === 1) {
    return base + XP_REWARDS.BONUS.firstTry;
  }
  
  // Small bonus for persistence (solved after 5+ attempts)
  if (attemptNumber >= 5) {
    return base + XP_REWARDS.BONUS.persistence;
  }
  
  return base;
}

export function addXP(amount: number, reason: XPTransaction['reason'], problemId?: string): XPTransaction {
  const transaction: XPTransaction = {
    id: `xp_${Date.now()}_${Math.random()}`,
    amount,
    reason,
    timestamp: Date.now(),
    problemId,
  };
  
  const currentXP = getTotalXP();
  const newTotal = currentXP + amount;
  
  // Save to localStorage
  const state: XPState = {
    totalXP: newTotal,
    level: calculateLevel(newTotal),
    transactions: [transaction, ...getRecentTransactions()].slice(0, 10), // Keep last 10
  };
  
  localStorage.setItem('math-tutor-xp', JSON.stringify(state));
  
  return transaction;
}

export function getTotalXP(): number {
  try {
    const stored = localStorage.getItem('math-tutor-xp');
    if (stored) {
      const state: XPState = JSON.parse(stored);
      return state.totalXP;
    }
  } catch (error) {
    console.warn('Failed to load XP:', error);
  }
  return 0;
}

function calculateLevel(totalXP: number): number {
  // Simple level calculation: 100 XP per level
  return Math.floor(totalXP / 100) + 1;
}

function getRecentTransactions(): XPTransaction[] {
  try {
    const stored = localStorage.getItem('math-tutor-xp');
    if (stored) {
      const state: XPState = JSON.parse(stored);
      return state.transactions || [];
    }
  } catch (error) {
    console.warn('Failed to load XP transactions:', error);
  }
  return [];
}
```

#### 2.2 XP Animation Component

```typescript
// app/components/xp-animation.tsx

'use client';

import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface XPAnimationProps {
  amount: number;
  reason: 'attempt' | 'solve' | 'bonus';
  onComplete?: () => void;
}

export function XPAnimation({ amount, reason, onComplete }: XPAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [scale, setScale] = useState(0);
  
  useEffect(() => {
    // Entrance animation
    setScale(1);
    
    // Exit animation after delay
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 300); // Wait for fade out
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  if (!isVisible) return null;
  
  const isSolve = reason === 'solve';
  const size = isSolve ? 'large' : 'small';
  
  return (
    <div
      className={`fixed top-20 right-4 z-50 pointer-events-none ${
        isVisible ? 'animate-fade-in' : 'animate-fade-out'
      }`}
      style={{
        transform: `scale(${scale})`,
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
      }}
    >
      <div
        className={`bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-2xl p-4 flex items-center gap-3 ${
          size === 'large' ? 'px-6 py-4' : 'px-4 py-2'
        }`}
      >
        {isSolve && <Sparkles className="w-6 h-6 text-white animate-pulse" />}
        {!isSolve && <TrendingUp className="w-5 h-5 text-white" />}
        <div>
          <div className="text-white font-bold text-lg">
            +{amount} XP
          </div>
          {isSolve && (
            <div className="text-white text-xs opacity-90">
              Problem Solved! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for managing XP animations
export function useXPAnimation() {
  const [animations, setAnimations] = useState<Array<{
    id: string;
    amount: number;
    reason: 'attempt' | 'solve' | 'bonus';
  }>>([]);
  
  const showXP = (amount: number, reason: 'attempt' | 'solve' | 'bonus') => {
    const id = `xp_${Date.now()}_${Math.random()}`;
    setAnimations(prev => [...prev, { id, amount, reason }]);
  };
  
  const removeAnimation = (id: string) => {
    setAnimations(prev => prev.filter(a => a.id !== id));
  };
  
  return { animations, showXP, removeAnimation };
}
```

#### 2.3 Problem Completion Detection

```typescript
// app/lib/problem-completion.ts

import { Message } from '../components/chat-interface';

/**
 * Detect if a problem has been solved based on assistant's response
 */
export function detectProblemCompletion(
  messages: Message[],
  currentProblem: string
): {
  isComplete: boolean;
  confidence: number;
  completionMessage?: string;
} {
  // Look for completion indicators in the last assistant message
  const lastAssistantMessage = [...messages]
    .reverse()
    .find(msg => msg.role === 'assistant');
  
  if (!lastAssistantMessage) {
    return { isComplete: false, confidence: 0 };
  }
  
  const content = lastAssistantMessage.content.toLowerCase();
  
  // Strong completion indicators
  const strongIndicators = [
    'excellent work',
    'great job',
    'you successfully solved',
    'correct!',
    'that\'s correct',
    'problem solved',
    'you solved it',
    '🎉', // Celebration emoji
  ];
  
  // Check for verification tool results indicating correctness
  // (This would need to be passed from the API response)
  
  const hasStrongIndicator = strongIndicators.some(indicator => 
    content.includes(indicator)
  );
  
  // Also check if assistant explicitly confirms correctness
  const confirmsCorrectness = 
    content.includes('correct') && 
    (content.includes('yes') || content.includes('exactly') || content.includes('right'));
  
  if (hasStrongIndicator || confirmsCorrectness) {
    return {
      isComplete: true,
      confidence: hasStrongIndicator ? 0.9 : 0.7,
      completionMessage: lastAssistantMessage.content,
    };
  }
  
  return { isComplete: false, confidence: 0 };
}
```

#### 2.4 Integration with Chat Interface

```typescript
// In chat-interface.tsx - add XP tracking

import { addXP, calculateAttemptXP, calculateSolveXP } from '../lib/xp-system';
import { detectProblemCompletion } from '../lib/problem-completion';
import { XPAnimation, useXPAnimation } from './xp-animation';

// Inside component:
const { animations, showXP, removeAnimation } = useXPAnimation();
const [problemSolved, setProblemSolved] = useState(false);

// In submitProblem, after getting response:
useEffect(() => {
  if (messages.length > 0 && !isLoading) {
    const currentProblem = getCurrentProblemFromMessages(messages);
    
    // Check for completion
    const completion = detectProblemCompletion(messages, currentProblem || '');
    
    if (completion.isComplete && !problemSolved) {
      setProblemSolved(true);
      
      // Award solve XP
      const difficulty = determineDifficulty(currentProblem || ''); // Helper function
      const attemptCount = getAttemptCountForProblem(currentProblem || '');
      const solveXP = calculateSolveXP(difficulty, attemptCount);
      
      addXP(solveXP, 'solve', currentProblem || undefined);
      showXP(solveXP, 'solve');
      
      // Show "try another problem" prompt
      setTimeout(() => {
        showTryAnotherProblemPrompt();
      }, 2000);
    } else if (!completion.isComplete) {
      // Award attempt XP (small amount)
      const attemptXP = calculateAttemptXP(attemptCount);
      addXP(attemptXP, 'attempt', currentProblem || undefined);
      showXP(attemptXP, 'attempt');
    }
  }
}, [messages, isLoading]);

// "Try Another Problem" prompt component
function TryAnotherProblemPrompt({ onTryAnother, onGenerateAI }: {
  onTryAnother: () => void;
  onGenerateAI: () => void;
}) {
  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 bg-white border-2 border-blue-500 rounded-lg shadow-xl p-6 max-w-md">
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        🎉 Great job solving that problem!
      </h3>
      <p className="text-gray-700 mb-4">
        Would you like to try another problem?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onTryAnother}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Choose Problem
        </button>
        <button
          onClick={onGenerateAI}
          className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          AI Generate Problem
        </button>
      </div>
    </div>
  );
}
```

#### 2.5 XP Display Component

```typescript
// app/components/xp-display.tsx

'use client';

import { Trophy, TrendingUp } from 'lucide-react';
import { getTotalXP, calculateLevel } from '../lib/xp-system';

export function XPDisplay() {
  const totalXP = getTotalXP();
  const level = calculateLevel(totalXP);
  const xpForNextLevel = level * 100;
  const xpProgress = totalXP % 100;
  const progressPercent = (xpProgress / 100) * 100;
  
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
      <Trophy className="w-5 h-5 text-yellow-600" />
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-semibold text-gray-900">
            Level {level}
          </span>
          <span className="text-gray-600">
            {totalXP} XP
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {xpForNextLevel - totalXP} XP to Level {level + 1}
        </div>
      </div>
    </div>
  );
}
```

---

## Feature 3: AI-Generated Problems

### Goals
- Generate problems matching test interface variety
- Support all math fields: Algebra, Geometry, Word Problems, Fractions, Calculus
- Support all difficulty levels: Beginner, Intermediate, Advanced
- Seamless integration with existing problem flow
- Update "try another problem" prompt to include AI generation option

### Implementation Details

#### 3.1 Problem Generation API

```typescript
// app/api/chat/generate-problem/route.ts

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';

const PROBLEM_GENERATION_PROMPT = `You are a math problem generator. Generate educational math problems that are appropriate for students.

REQUIREMENTS:
1. Generate problems that can be solved using Socratic questioning (not just calculation)
2. Match the specified math field and difficulty level
3. Problems should be clear, well-formatted, and educational
4. Include variety - don't generate the same problem repeatedly

RESPONSE FORMAT (JSON only):
{
  "problem": "The math problem text",
  "type": "Algebra" | "Geometry" | "Word Problem" | "Fractions" | "Calculus",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "hints": ["hint 1", "hint 2"], // Optional hints for the tutor
  "estimatedTime": 5, // Minutes
}

MATH FIELD VARIETIES:

Algebra:
- Beginner: Simple linear equations (2x + 5 = 13)
- Intermediate: Multi-step equations, distributive property, variables on both sides
- Advanced: Complex multi-step, absolute value, quadratic simplification

Geometry:
- Beginner: Area/perimeter of basic shapes
- Intermediate: Pythagorean theorem, angle problems
- Advanced: Complex area calculations, coordinate geometry

Word Problems:
- Beginner: Simple one-step word problems
- Intermediate: Multi-step with variables, ratios, percentages
- Advanced: Complex real-world scenarios, mixture problems

Fractions:
- Beginner: Basic addition/subtraction
- Intermediate: Mixed numbers, multiplication, division
- Advanced: Complex operations, order of operations

Calculus:
- Beginner: Basic derivatives (power rule)
- Intermediate: Chain rule, product rule
- Advanced: Integration, complex derivatives

DIFFICULTY GUIDELINES:
- Beginner: 1-2 steps, straightforward concepts
- Intermediate: 3-4 steps, requires some reasoning
- Advanced: 5+ steps, complex reasoning, multiple concepts

Generate a problem now based on the requested type and difficulty.`;

export async function POST(req: NextRequest) {
  try {
    const { type, difficulty, excludeProblems = [] } = await req.json();
    
    // Validate inputs
    const validTypes = ['Algebra', 'Geometry', 'Word Problem', 'Fractions', 'Calculus'];
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    
    if (!validTypes.includes(type) || !validDifficulties.includes(difficulty)) {
      return new Response(
        JSON.stringify({ error: 'Invalid type or difficulty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Build prompt with exclusions to avoid duplicates
    const exclusionText = excludeProblems.length > 0
      ? `\n\nEXCLUDE THESE PROBLEMS (generate something different):\n${excludeProblems.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`
      : '';
    
    const fullPrompt = `${PROBLEM_GENERATION_PROMPT}\n\nGenerate a ${difficulty} ${type} problem.${exclusionText}`;
    
    // Generate problem
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt: fullPrompt,
      temperature: 0.8, // Higher for variety
      maxTokens: 500,
    });
    
    // Parse JSON response
    let problemData;
    try {
      problemData = JSON.parse(result.text);
    } catch (parseError) {
      // If not JSON, try to extract problem from text
      const problemMatch = result.text.match(/problem["\s:]+"([^"]+)"/i);
      if (problemMatch) {
        problemData = {
          problem: problemMatch[1],
          type,
          difficulty,
        };
      } else {
        throw new Error('Failed to parse problem generation response');
      }
    }
    
    // Validate response
    if (!problemData.problem) {
      throw new Error('Generated problem is empty');
    }
    
    return new Response(
      JSON.stringify(problemData),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Problem generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate problem' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

#### 3.2 Problem Generation UI

```typescript
// app/components/problem-generator.tsx

'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface ProblemGeneratorProps {
  onProblemGenerated: (problem: string) => void;
  onClose?: () => void;
}

export function ProblemGenerator({ onProblemGenerated, onClose }: ProblemGeneratorProps) {
  const [type, setType] = useState<string>('Algebra');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, difficulty }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate problem');
      }
      
      const data = await response.json();
      onProblemGenerated(data.problem);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate problem');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="bg-white border rounded-lg shadow-lg p-6 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold">Generate AI Problem</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Math Field
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isGenerating}
          >
            <option value="Algebra">Algebra</option>
            <option value="Geometry">Geometry</option>
            <option value="Word Problem">Word Problem</option>
            <option value="Fractions">Fractions</option>
            <option value="Calculus">Calculus</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <div className="flex gap-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                disabled={isGenerating}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  difficulty === level
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Problem
              </>
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 3.3 Integration with Chat Interface

Update the "Try Another Problem" prompt to include AI generation:

```typescript
// In chat-interface.tsx

function TryAnotherProblemPrompt({ 
  onTryAnother, 
  onGenerateAI,
  onSelectFromTest 
}: {
  onTryAnother: () => void;
  onGenerateAI: () => void;
  onSelectFromTest: () => void;
}) {
  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 bg-white border-2 border-blue-500 rounded-lg shadow-xl p-6 max-w-md">
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        🎉 Great job solving that problem!
      </h3>
      <p className="text-gray-700 mb-4">
        Would you like to try another problem? We can create one with AI!
      </p>
      <div className="space-y-2">
        <button
          onClick={onGenerateAI}
          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Generate AI Problem
        </button>
        <button
          onClick={onSelectFromTest}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Choose from Test Problems
        </button>
        <button
          onClick={onTryAnother}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Type Your Own Problem
        </button>
      </div>
    </div>
  );
}
```

---

## Feature 4: Voice Interface

### Goals
- Text-to-speech for assistant responses
- Speech-to-text for user input
- Toggle controls for voice features
- Browser compatibility handling
- Graceful fallbacks

### Implementation Details

#### 4.1 Text-to-Speech (TTS)

```typescript
// app/lib/tts.ts

export interface TTSOptions {
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  voice?: SpeechSynthesisVoice;
}

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isEnabled: boolean = false;
  private options: TTSOptions = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };
  
  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadSettings();
    }
  }
  
  enable() {
    this.isEnabled = true;
    this.saveSettings();
  }
  
  disable() {
    this.isEnabled = false;
    this.stop();
    this.saveSettings();
  }
  
  isAvailable(): boolean {
    return this.synth !== null;
  }
  
  speak(text: string, options?: Partial<TTSOptions>) {
    if (!this.synth || !this.isEnabled) return;
    
    // Stop any current speech
    this.stop();
    
    // Clean text (remove LaTeX markers, etc.)
    const cleanText = this.cleanTextForSpeech(text);
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Apply options
    const finalOptions = { ...this.options, ...options };
    utterance.rate = finalOptions.rate || 1.0;
    utterance.pitch = finalOptions.pitch || 1.0;
    utterance.volume = finalOptions.volume || 1.0;
    
    if (finalOptions.voice) {
      utterance.voice = finalOptions.voice;
    }
    
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    
    return utterance;
  }
  
  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
  
  pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }
  
  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }
  
  private cleanTextForSpeech(text: string): string {
    // Remove LaTeX markers
    let clean = text.replace(/\$[^$]+\$/g, '');
    clean = clean.replace(/\$\$[^$]+\$\$/g, '');
    
    // Replace common math symbols with words
    clean = clean.replace(/=/g, ' equals ');
    clean = clean.replace(/\+/g, ' plus ');
    clean = clean.replace(/-/g, ' minus ');
    clean = clean.replace(/\*/g, ' times ');
    clean = clean.replace(/\//g, ' divided by ');
    clean = clean.replace(/\^/g, ' to the power of ');
    clean = clean.replace(/x\^2/g, 'x squared');
    clean = clean.replace(/x\^3/g, 'x cubed');
    
    // Remove markdown formatting
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
    clean = clean.replace(/\*([^*]+)\*/g, '$1');
    
    // Clean up extra spaces
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
  }
  
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }
  
  private loadSettings() {
    try {
      const stored = localStorage.getItem('math-tutor-tts-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.isEnabled = settings.enabled || false;
        this.options = { ...this.options, ...settings.options };
      }
    } catch (error) {
      console.warn('Failed to load TTS settings:', error);
    }
  }
  
  private saveSettings() {
    try {
      localStorage.setItem('math-tutor-tts-settings', JSON.stringify({
        enabled: this.isEnabled,
        options: this.options,
      }));
    } catch (error) {
      console.warn('Failed to save TTS settings:', error);
    }
  }
}

export const ttsService = new TTSService();
```

#### 4.2 Speech-to-Text (STT)

```typescript
// app/lib/stt.ts

export interface STTOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

class STTService {
  private recognition: SpeechRecognition | null = null;
  private isEnabled: boolean = false;
  private isListening: boolean = false;
  
  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
        this.loadSettings();
      }
    }
  }
  
  isAvailable(): boolean {
    return this.recognition !== null;
  }
  
  enable() {
    this.isEnabled = true;
    this.saveSettings();
  }
  
  disable() {
    this.isEnabled = false;
    this.stop();
    this.saveSettings();
  }
  
  private setupRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
  }
  
  start(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition || !this.isEnabled || this.isListening) return;
    
    this.isListening = true;
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      this.isListening = false;
    };
    
    this.recognition.onerror = (event) => {
      const error = (event as any).error;
      onError?.(error);
      this.isListening = false;
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
    
    try {
      this.recognition.start();
    } catch (error) {
      console.warn('Failed to start speech recognition:', error);
      this.isListening = false;
    }
  }
  
  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.isListening = false;
    }
  }
  
  private loadSettings() {
    try {
      const stored = localStorage.getItem('math-tutor-stt-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.isEnabled = settings.enabled || false;
      }
    } catch (error) {
      console.warn('Failed to load STT settings:', error);
    }
  }
  
  private saveSettings() {
    try {
      localStorage.setItem('math-tutor-stt-settings', JSON.stringify({
        enabled: this.isEnabled,
      }));
    } catch (error) {
      console.warn('Failed to save STT settings:', error);
    }
  }
}

export const sttService = new STTService();
```

#### 4.3 Voice Controls Component

```typescript
// app/components/voice-controls.tsx

'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { ttsService } from '../lib/tts';
import { sttService } from '../lib/stt';

interface VoiceControlsProps {
  onSpeechResult?: (text: string) => void;
  autoSpeak?: boolean; // Auto-speak assistant messages
  assistantMessage?: string; // Current assistant message to speak
}

export function VoiceControls({
  onSpeechResult,
  autoSpeak = false,
  assistantMessage,
}: VoiceControlsProps) {
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [sttEnabled, setSttEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [sttAvailable, setSttAvailable] = useState(false);
  
  useEffect(() => {
    setTtsAvailable(ttsService.isAvailable());
    setSttAvailable(sttService.isAvailable());
    
    // Load saved preferences
    const ttsStored = localStorage.getItem('math-tutor-tts-settings');
    const sttStored = localStorage.getItem('math-tutor-stt-settings');
    
    if (ttsStored) {
      const settings = JSON.parse(ttsStored);
      if (settings.enabled) {
        setTtsEnabled(true);
        ttsService.enable();
      }
    }
    
    if (sttStored) {
      const settings = JSON.parse(sttStored);
      if (settings.enabled) {
        setSttEnabled(true);
        sttService.enable();
      }
    }
  }, []);
  
  // Auto-speak assistant messages
  useEffect(() => {
    if (autoSpeak && ttsEnabled && assistantMessage) {
      ttsService.speak(assistantMessage);
    }
  }, [assistantMessage, autoSpeak, ttsEnabled]);
  
  const toggleTTS = () => {
    if (ttsEnabled) {
      ttsService.disable();
      setTtsEnabled(false);
    } else {
      ttsService.enable();
      setTtsEnabled(true);
    }
  };
  
  const toggleSTT = () => {
    if (sttEnabled) {
      sttService.disable();
      setSttEnabled(false);
    } else {
      sttService.enable();
      setSttEnabled(true);
    }
  };
  
  const startListening = () => {
    if (!sttEnabled || isListening) return;
    
    setIsListening(true);
    sttService.start(
      (text) => {
        onSpeechResult?.(text);
        setIsListening(false);
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      }
    );
  };
  
  const stopListening = () => {
    sttService.stop();
    setIsListening(false);
  };
  
  if (!ttsAvailable && !sttAvailable) {
    return null; // No voice features available
  }
  
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      {ttsAvailable && (
        <button
          onClick={toggleTTS}
          className={`p-2 rounded-lg transition-colors ${
            ttsEnabled
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
        >
          {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      )}
      
      {sttAvailable && (
        <>
          <button
            onClick={toggleSTT}
            className={`p-2 rounded-lg transition-colors ${
              sttEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={sttEnabled ? 'Disable speech-to-text' : 'Enable speech-to-text'}
          >
            {sttEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          {sttEnabled && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!sttEnabled}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } disabled:opacity-50`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

#### 4.4 Integration with Message Input

```typescript
// In message-input.tsx - add voice input support

import { VoiceControls } from './voice-controls';

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  placeholder,
  onImageUpload,
  showImageUpload,
}: MessageInputProps) {
  const [voiceInput, setVoiceInput] = useState('');
  
  const handleSpeechResult = (text: string) => {
    setVoiceInput(text);
    handleInputChange({ target: { value: text } } as any);
  };
  
  return (
    <div className="space-y-2">
      <VoiceControls
        onSpeechResult={handleSpeechResult}
        autoSpeak={true}
      />
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input || voiceInput}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={isLoading}
        />
        {/* ... rest of form */}
      </form>
    </div>
  );
}
```

---

## Feature 5: Polished Intro Screen

### Goals
- Create an engaging welcome screen for first-time and returning users
- Smooth animations and transitions
- Clear value proposition
- Quick start options
- Professional, modern design
- Lightweight and performant

### Implementation Details

#### 5.1 Intro Screen Component

```typescript
// app/components/intro-screen.tsx

'use client';

import { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Mic, History, TrendingUp, ArrowRight, X } from 'lucide-react';
import { getTotalXP } from '../lib/xp-system';
import { loadConversationHistory } from '../lib/conversation-history';

interface IntroScreenProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

export function IntroScreen({ onGetStarted, onSkip }: IntroScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animationStage, setAnimationStage] = useState<'entering' | 'visible' | 'exiting'>('entering');
  const [hasHistory, setHasHistory] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  
  useEffect(() => {
    // Check if user has history
    const history = loadConversationHistory();
    setHasHistory(history.sessions.length > 0);
    setTotalXP(getTotalXP());
    
    // Entrance animation
    setTimeout(() => {
      setAnimationStage('visible');
    }, 100);
  }, []);
  
  const handleGetStarted = () => {
    setAnimationStage('exiting');
    setTimeout(() => {
      setIsVisible(false);
      onGetStarted();
    }, 500);
  };
  
  const handleSkip = () => {
    setAnimationStage('exiting');
    setTimeout(() => {
      setIsVisible(false);
      onSkip();
    }, 300);
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center transition-opacity duration-500 ${
        animationStage === 'entering' ? 'opacity-0' : 
        animationStage === 'exiting' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingMathSymbols />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl w-full px-6 py-8">
        <div
          className={`bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-12 transition-all duration-700 ${
            animationStage === 'entering' ? 'translate-y-8 opacity-0' : 
            animationStage === 'exiting' ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          {/* Close button */}
          {hasHistory && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Skip intro"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg animate-bounce-subtle">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Math Tutor
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Learn math through Socratic questioning. I'll guide you to discover solutions yourself.
            </p>
          </div>
          
          {/* Stats (if returning user) */}
          {hasHistory && totalXP > 0 && (
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalXP}</div>
                <div className="text-sm text-gray-600">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{history.sessions.length}</div>
                <div className="text-sm text-gray-600">Problems Solved</div>
              </div>
            </div>
          )}
          
          {/* Features grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Socratic Learning"
              description="I guide you through questions, never giving direct answers. Discover solutions yourself!"
              delay={200}
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI-Generated Problems"
              description="Get personalized problems across algebra, geometry, calculus, and more."
              delay={300}
            />
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Voice Interface"
              description="Speak your problems and hear responses. Perfect for hands-free learning."
              delay={400}
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Track Progress"
              description="Earn XP, level up, and see your improvement over time."
              delay={500}
            />
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            {hasHistory && (
              <button
                onClick={handleSkip}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors"
              >
                Continue Learning
              </button>
            )}
          </div>
          
          {/* Quick tips */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              💡 Tip: You can type problems, upload images, or use voice input to get started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div
      className={`p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FloatingMathSymbols() {
  const symbols = ['+', '−', '×', '÷', '=', 'x', 'y', 'π', '√'];
  
  return (
    <>
      {symbols.map((symbol, index) => (
        <div
          key={index}
          className="absolute text-6xl md:text-8xl text-blue-200/30 font-bold select-none pointer-events-none"
          style={{
            left: `${(index * 137.5) % 100}%`,
            top: `${(index * 73.7) % 100}%`,
            animation: `float ${5 + (index % 3)}s ease-in-out infinite`,
            animationDelay: `${index * 0.3}s`,
          }}
        >
          {symbol}
        </div>
      ))}
    </>
  );
}
```

#### 5.2 Animation Styles

```css
/* Add to globals.css or create intro-animations.css */

@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
    opacity: 0.5;
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-fade-out {
  animation: fadeOut 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
```

#### 5.3 Intro Screen Logic

```typescript
// app/lib/intro-screen.ts

const INTRO_SHOWN_KEY = 'math-tutor-intro-shown';
const INTRO_VERSION = 1; // Increment to show intro again after updates

export function shouldShowIntro(): boolean {
  // Only show intro if:
  // 1. User hasn't seen it before, OR
  // 2. Intro version has changed (after updates)
  
  try {
    const stored = localStorage.getItem(INTRO_SHOWN_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.version !== INTRO_VERSION;
    }
    return true; // First time user
  } catch (error) {
    console.warn('Failed to check intro status:', error);
    return true; // Default to showing intro
  }
}

export function markIntroAsShown(): void {
  try {
    localStorage.setItem(INTRO_SHOWN_KEY, JSON.stringify({
      version: INTRO_VERSION,
      shownAt: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to save intro status:', error);
  }
}

export function resetIntro(): void {
  try {
    localStorage.removeItem(INTRO_SHOWN_KEY);
  } catch (error) {
    console.warn('Failed to reset intro:', error);
  }
}
```

#### 5.4 Integration with Main Page

```typescript
// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from './components/chat-interface';
import { ErrorBoundary } from './components/error-boundary';
import { IntroScreen } from './components/intro-screen';
import { shouldShowIntro, markIntroAsShown } from './lib/intro-screen';

export default function Home() {
  const [showIntro, setShowIntro] = useState(false);
  
  useEffect(() => {
    setShowIntro(shouldShowIntro());
  }, []);
  
  const handleGetStarted = () => {
    markIntroAsShown();
    setShowIntro(false);
  };
  
  const handleSkipIntro = () => {
    markIntroAsShown();
    setShowIntro(false);
  };
  
  return (
    <>
      {showIntro && (
        <IntroScreen
          onGetStarted={handleGetStarted}
          onSkip={handleSkipIntro}
        />
      )}
      <ErrorBoundary>
        <ChatInterface />
      </ErrorBoundary>
    </>
  );
}
```

#### 5.5 Optional: Skip Intro for Returning Users

```typescript
// Enhanced intro screen logic

export function shouldShowIntro(): boolean {
  try {
    const stored = localStorage.getItem(INTRO_SHOWN_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Check if intro version changed (show again after updates)
      if (data.version !== INTRO_VERSION) {
        return true;
      }
      
      // Check if user has significant history (skip if they do)
      const history = loadConversationHistory();
      const totalXP = getTotalXP();
      
      // Skip intro if user has solved 3+ problems or has 50+ XP
      if (history.sessions.length >= 3 || totalXP >= 50) {
        return false;
      }
      
      // Show intro if it's been a while (e.g., 30 days)
      const daysSinceShown = (Date.now() - data.shownAt) / (1000 * 60 * 60 * 24);
      if (daysSinceShown > 30) {
        return true; // Show again after 30 days
      }
      
      return false; // Already shown recently
    }
    return true; // First time user
  } catch (error) {
    console.warn('Failed to check intro status:', error);
    return true;
  }
}
```

### Design Considerations

#### Visual Elements
- **Gradient backgrounds**: Soft blue-to-purple gradients
- **Floating math symbols**: Subtle animated background elements
- **Glassmorphism**: Frosted glass effect on main card
- **Smooth transitions**: Fade and slide animations
- **Responsive design**: Works on mobile and desktop

#### Animation Timing
- **Entrance**: 500ms fade + slide up
- **Feature cards**: Staggered appearance (200ms, 300ms, 400ms, 500ms delays)
- **Exit**: 300-500ms fade out
- **Background symbols**: Continuous slow float animation

#### Performance
- Use CSS animations (GPU-accelerated)
- Lazy load heavy components
- Optimize images/icons
- Minimize JavaScript during animations

---

## Implementation Phases

### Phase 6.1: Conversation History (Week 1)
- [ ] Implement data structures and storage
- [ ] Build conversation history UI
- [ ] Add search and filtering
- [ ] Integrate with chat interface
- [ ] Test storage quota handling

### Phase 6.2: XP System (Week 1-2)
- [ ] Implement XP calculation logic
- [ ] Build XP animation components
- [ ] Add problem completion detection
- [ ] Integrate XP tracking with chat
- [ ] Build "try another problem" prompt
- [ ] Add XP display component

### Phase 6.3: AI Problem Generation (Week 2)
- [ ] Build problem generation API
- [ ] Create problem generator UI
- [ ] Integrate with "try another problem" flow
- [ ] Test variety and quality
- [ ] Add problem exclusion logic

### Phase 6.4: Voice Interface (Week 3)
- [ ] Implement TTS service
- [ ] Implement STT service
- [ ] Build voice controls UI
- [ ] Integrate with message input/output
- [ ] Test browser compatibility
- [ ] Add fallbacks and error handling

### Phase 6.5: Intro Screen (Week 3-4)
- [ ] Design intro screen layout
- [ ] Implement animations and transitions
- [ ] Build feature cards and stats display
- [ ] Add intro screen logic (show/hide)
- [ ] Integrate with main page
- [ ] Test on mobile and desktop
- [ ] Polish animations and timing

### Phase 6.6: Integration & Polish (Week 4)
- [ ] Ensure all features work together
- [ ] Performance optimization
- [ ] Mobile testing and optimization
- [ ] User testing and feedback
- [ ] Documentation updates

---

## Technical Architecture

### Storage Structure

```
localStorage:
  - math-tutor-conversation-history: ConversationHistoryStorage
  - math-tutor-xp: XPState
  - math-tutor-tts-settings: TTS settings
  - math-tutor-stt-settings: STT settings
  - math-tutor-conversation: Current session (existing)
  - attempts_*: Attempt tracking (existing)
```

### Component Hierarchy

```
Home (page.tsx)
├── IntroScreen (conditional)
└── ChatInterface
    ├── ConversationHistory (modal)
    ├── XPDisplay
    ├── XPAnimation (overlay)
    ├── VoiceControls
    ├── ProblemGenerator (modal)
    ├── TryAnotherProblemPrompt (overlay)
    ├── MessageList
    └── MessageInput
        └── VoiceControls
```

### API Routes

```
/api/chat/generate-problem (POST)
  - Generate AI problems
  - Returns: { problem, type, difficulty, ... }
```

---

## Testing Strategy

### Unit Tests
- XP calculation logic
- Problem completion detection
- Conversation history storage/retrieval
- TTS/STT service methods

### Integration Tests
- XP awarded on attempts and solves
- Conversation history saves correctly
- Problem generation produces valid problems
- Voice features work in supported browsers
- Intro screen shows/hides correctly based on user state

### E2E Tests
- Complete flow: solve problem → earn XP → view history
- Generate AI problem → solve it → earn XP
- Voice input → get response → TTS speaks it
- Intro screen appears for new users, skips for returning users
- Intro screen animations and transitions work smoothly

### Browser Compatibility
- Chrome/Edge: Full voice support
- Safari: Limited STT support
- Firefox: Limited voice support
- Mobile: Test on iOS Safari and Android Chrome

---

## Cost & Timeline Estimates

### Development Time
- **Phase 6.1 (Conversation History)**: 3-4 days
- **Phase 6.2 (XP System)**: 4-5 days
- **Phase 6.3 (AI Problem Generation)**: 3-4 days
- **Phase 6.4 (Voice Interface)**: 4-5 days
- **Phase 6.5 (Intro Screen)**: 2-3 days
- **Phase 6.6 (Integration & Polish)**: 3-4 days
- **Total**: 19-25 days (~4-5 weeks)

### API Costs
- **Problem Generation**: ~$0.01-0.02 per problem (Claude API)
- **Voice Features**: No API costs (browser APIs)
- **Storage**: No costs (localStorage)

### Dependencies
- No new npm packages required (using browser APIs)
- Existing Claude API usage for problem generation

---

## Future Enhancements

### XP System
- Level-based rewards
- Achievement badges
- Leaderboards (if multi-user)
- XP streaks

### Conversation History
- Cloud sync (if user accounts added)
- Sharing conversations
- Export to PDF
- Conversation analytics

### Problem Generation
- Custom difficulty curves
- Adaptive problem selection
- Problem sets/sequences
- Spaced repetition

### Voice Interface
- Multiple language support
- Voice command shortcuts
- Custom voice selection
- Pronunciation learning

### LaTeX Rendering Fixes (DEFERRED - LOWEST PRIORITY)
- ⚠️ **EXPLICITLY DEFERRED** - Experimental work contained in `attempted-latex-rendering-fixes` branch
- See `docs/misc/LaTeX-Rendering-Experimental-Branch.md` for details
- **Do NOT work on this until ALL Phase 6 features are complete**
- Current LaTeX rendering is functional (may have minor issues but not blocking)
- Experimental XML tag approach exists but needs thorough testing
- Revisit only after: XP system, conversation history, AI problems, voice interface, and intro screen are all complete and stable

---

**End of Planning Document**

