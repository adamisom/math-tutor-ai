import { NextRequest } from 'next/server';
import { requireAuth, handleApiError } from '../../lib/api-helpers';
import { prisma } from '../../lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    // Use upsert to get or create default XP state
    const xpState = await prisma.xPState.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        userId: session.user.id,
        totalXP: 0,
        level: 1,
        transactions: [],
      },
    });

    return Response.json(xpState);
  } catch (error) {
    if (error instanceof Response) return error;
    return handleApiError(error, 'fetch XP state');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();
    
    // Upsert XP state
    const xpState = await prisma.xPState.upsert({
      where: { userId: session.user.id },
      update: {
        totalXP: data.totalXP,
        level: data.level,
        transactions: data.transactions,
      },
      create: {
        userId: session.user.id,
        totalXP: data.totalXP,
        level: data.level,
        transactions: data.transactions,
      },
    });

    return Response.json(xpState);
  } catch (error) {
    if (error instanceof Response) return error;
    return handleApiError(error, 'update XP state');
  }
}

