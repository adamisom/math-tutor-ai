/**
 * Conversation History Management
 * 
 * Handles persistent conversation history with search, filtering, and storage management
 */

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageBase64?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  problemText: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  xpEarned: number;
  problemType?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface ConversationHistoryStorage {
  sessions: ConversationSession[];
  currentSessionId: string | null;
  lastUpdated: number;
  version: number;
}

const STORAGE_KEY = 'math-tutor-conversation-history';
const MAX_SESSIONS = 50;
const MAX_SESSION_SIZE = 100;
const CURRENT_VERSION = 1;

export function saveConversationSession(session: ConversationSession): void {
  if (typeof window === 'undefined') return;
  
  const history = loadConversationHistory();
  
  // Limit messages per session
  if (session.messages.length > MAX_SESSION_SIZE) {
    session.messages = session.messages.slice(-MAX_SESSION_SIZE);
  }
  
  // Update or add session
  const existingIndex = history.sessions.findIndex(s => s.id === session.id);
  if (existingIndex >= 0) {
    history.sessions[existingIndex] = session;
  } else {
    history.sessions.unshift(session);
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
    if (error instanceof DOMException && error.code === 22) {
      handleStorageQuotaExceeded(history);
    }
  }
}

export function loadConversationHistory(): ConversationHistoryStorage {
  if (typeof window === 'undefined') {
    return {
      sessions: [],
      currentSessionId: null,
      lastUpdated: Date.now(),
      version: CURRENT_VERSION,
    };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return migrateIfNeeded(parsed);
    }
  } catch (error) {
    console.warn('Failed to load conversation history:', error);
  }
  
  return {
    sessions: [],
    currentSessionId: null,
    lastUpdated: Date.now(),
    version: CURRENT_VERSION,
  };
}

function migrateIfNeeded(data: ConversationHistoryStorage): ConversationHistoryStorage {
  if (data.version === CURRENT_VERSION) {
    return data;
  }
  
  // Future: Add migration logic here when version changes
  return {
    ...data,
    version: CURRENT_VERSION,
  };
}

function handleStorageQuotaExceeded(history: ConversationHistoryStorage): void {
  const removeCount = Math.ceil(history.sessions.length * 0.25);
  history.sessions = history.sessions.slice(0, -removeCount);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    console.warn('Storage quota exceeded - cleared conversation history');
  }
}

export function deleteConversationSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  
  const history = loadConversationHistory();
  history.sessions = history.sessions.filter(s => s.id !== sessionId);
  
  if (history.currentSessionId === sessionId) {
    history.currentSessionId = null;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to delete conversation session:', error);
  }
}

export function getConversationSession(sessionId: string): ConversationSession | null {
  const history = loadConversationHistory();
  return history.sessions.find(s => s.id === sessionId) || null;
}

export function exportConversationSession(session: ConversationSession): string {
  const exportData = {
    ...session,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportData, null, 2);
}

export function createSessionFromMessages(
  messages: Array<{ role: string; content: string }>,
  problemText: string
): ConversationSession {
  const now = Date.now();
  const sessionId = `session_${now}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate title from problem text
  const title = problemText.length > 50 
    ? problemText.substring(0, 50) + '...'
    : problemText;
  
  const sessionMessages: ConversationMessage[] = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: now,
  }));
  
  return {
    id: sessionId,
    title,
    problemText,
    messages: sessionMessages,
    createdAt: now,
    updatedAt: now,
    completed: false,
    xpEarned: 0,
  };
}

