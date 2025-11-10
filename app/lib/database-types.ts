/**
 * Types for database responses (from Prisma)
 */

export interface DatabaseConversation {
  id: string;
  userId: string;
  title: string;
  problemText: string;
  messages: unknown;
  createdAt: string | Date;
  updatedAt: string | Date;
  completed: boolean;
  xpEarned: number;
  problemType?: string | null;
  difficulty?: string | null;
}

export interface DatabaseXPState {
  id: string;
  userId: string;
  totalXP: number;
  level: number;
  transactions: unknown;
  updatedAt: string | Date;
}

