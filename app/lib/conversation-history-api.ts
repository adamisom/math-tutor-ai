import { ConversationSession } from './conversation-history';
import { mapDatabaseConversationToSession } from './database-helpers';

/**
 * Hybrid storage: Save to both localStorage and database (if authenticated)
 */
export async function saveConversationSessionHybrid(session: ConversationSession, isAuthenticated: boolean): Promise<void> {
  // Always save to localStorage (for anonymous users)
  const { saveConversationSession } = await import('./conversation-history');
  saveConversationSession(session);

  // If authenticated, also save to database
  if (isAuthenticated) {
    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.id,
          title: session.title,
          problemText: session.problemText,
          messages: session.messages,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          completed: session.completed,
          xpEarned: session.xpEarned,
          problemType: session.problemType,
          difficulty: session.difficulty,
        }),
      });
    } catch (error) {
      console.warn('Failed to save conversation to database, using localStorage only:', error);
    }
  }
}

/**
 * Hybrid storage: Update conversation in both localStorage and database
 */
export async function updateConversationSessionHybrid(session: ConversationSession, isAuthenticated: boolean): Promise<void> {
  // Always update localStorage
  const { saveConversationSession } = await import('./conversation-history');
  saveConversationSession(session);

  // If authenticated, also update in database
  if (isAuthenticated) {
    try {
      await fetch('/api/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.id,
          messages: session.messages,
          updatedAt: session.updatedAt,
          completed: session.completed,
          xpEarned: session.xpEarned,
        }),
      });
    } catch (error) {
      console.warn('Failed to update conversation in database, using localStorage only:', error);
    }
  }
}

/**
 * Hybrid storage: Load conversations from database (if authenticated) or localStorage
 */
export async function loadConversationHistoryHybrid(isAuthenticated: boolean): Promise<{ sessions: ConversationSession[] }> {
  if (isAuthenticated) {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const conversations = await response.json();
        return {
          sessions: conversations.map(mapDatabaseConversationToSession),
        };
      }
    } catch (error) {
      console.warn('Failed to load conversations from database, falling back to localStorage:', error);
    }
  }

  // Fallback to localStorage (for anonymous users or if database fails)
  const { loadConversationHistory } = await import('./conversation-history');
  return loadConversationHistory();
}

/**
 * Sync localStorage data to database on login
 */
export async function syncLocalStorageToServer(): Promise<void> {
  const { loadConversationHistory } = await import('./conversation-history');
  const { getXPState } = await import('./xp-system');
  
  const localHistory = loadConversationHistory();
  const localXP = getXPState();

  console.log('[Sync] Starting localStorage to database sync...', {
    conversations: localHistory.sessions.length,
    xp: localXP.totalXP,
    level: localXP.level,
    transactions: localXP.transactions?.length || 0,
    xpStateObject: localXP
  });

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversations: localHistory.sessions,
        xp: localXP,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sync failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[Sync] ✅ Successfully synced to database:', {
      conversationsSynced: result.conversationsSynced || localHistory.sessions.length,
      xpSynced: result.xpSynced !== undefined ? result.xpSynced : true
    });
  } catch (error) {
    console.error('[Sync] ❌ Failed to sync localStorage to server:', error);
    throw error;
  }
}

