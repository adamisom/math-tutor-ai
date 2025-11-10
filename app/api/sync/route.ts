import { NextRequest } from 'next/server';
import { requireAuth, handleApiError } from '../../lib/api-helpers';
import { prisma } from '../../lib/prisma';
import { toTimestamp } from '../../lib/database-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();
    const userId = session.user.id;

    let conversationsSynced = 0;
    let xpSynced = false;

    // Sync conversations
    if (data.conversations && Array.isArray(data.conversations)) {
      for (const conv of data.conversations) {
        await prisma.conversation.upsert({
          where: {
            id: conv.id,
            userId: userId,
          },
          update: {
            messages: conv.messages,
            updatedAt: new Date(toTimestamp(conv.updatedAt || Date.now())),
            completed: conv.completed,
            xpEarned: conv.xpEarned,
          },
          create: {
            id: conv.id,
            userId: userId,
            title: conv.title,
            problemText: conv.problemText,
            messages: conv.messages,
            createdAt: new Date(toTimestamp(conv.createdAt || Date.now())),
            updatedAt: new Date(toTimestamp(conv.updatedAt || Date.now())),
            completed: conv.completed || false,
            xpEarned: conv.xpEarned || 0,
            problemType: conv.problemType,
            difficulty: conv.difficulty,
          },
        });
        conversationsSynced++;
      }
    }

    // Sync XP state
    if (data.xp) {
      await prisma.xPState.upsert({
        where: { userId },
        update: {
          totalXP: data.xp.totalXP,
          level: data.xp.level,
          transactions: data.xp.transactions,
        },
        create: {
          userId,
          totalXP: data.xp.totalXP || 0,
          level: data.xp.level || 1,
          transactions: data.xp.transactions || [],
        },
      });
      xpSynced = true;
    }

    return Response.json({ 
      success: true,
      conversationsSynced,
      xpSynced
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return handleApiError(error, 'sync data');
  }
}

