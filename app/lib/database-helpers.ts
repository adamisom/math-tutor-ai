import { ConversationSession } from './conversation-history';
import { DatabaseConversation } from './database-types';

/**
 * Convert database date (string | Date | number) to timestamp (number)
 */
export function toTimestamp(date: string | Date | number): number {
  if (typeof date === 'string') {
    return new Date(date).getTime();
  }
  if (date instanceof Date) {
    return date.getTime();
  }
  return date;
}

/**
 * Convert DatabaseConversation to ConversationSession
 */
export function mapDatabaseConversationToSession(conv: DatabaseConversation): ConversationSession {
  return {
    id: conv.id,
    title: conv.title,
    problemText: conv.problemText,
    messages: conv.messages as ConversationSession['messages'],
    createdAt: toTimestamp(conv.createdAt),
    updatedAt: toTimestamp(conv.updatedAt),
    completed: conv.completed,
    xpEarned: conv.xpEarned,
    problemType: conv.problemType || undefined,
    difficulty: (conv.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined) || undefined,
  };
}

