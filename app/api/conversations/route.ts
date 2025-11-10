import { NextRequest } from 'next/server';
import { requireAuth, handleApiError } from '../../lib/api-helpers';
import { prisma } from '../../lib/prisma';

export async function GET() {
  try {
    const session = await requireAuth();
    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(conversations);
  } catch (error) {
    if (error instanceof Response) return error;
    return handleApiError(error, 'fetch conversations');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();
    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: data.title,
        problemText: data.problemText,
        messages: data.messages,
        completed: data.completed || false,
        xpEarned: data.xpEarned || 0,
        problemType: data.problemType,
        difficulty: data.difficulty,
      },
    });

    return Response.json(conversation);
  } catch (error) {
    if (error instanceof Response) return error;
    return handleApiError(error, 'create conversation');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();
    const conversation = await prisma.conversation.update({
      where: {
        id: data.id,
        userId: session.user.id, // Ensure user owns this conversation
      },
      data: {
        messages: data.messages,
        updatedAt: new Date(),
        completed: data.completed,
        xpEarned: data.xpEarned,
      },
    });

    return Response.json(conversation);
  } catch (error) {
    if (error instanceof Response) return error;
    return handleApiError(error, 'update conversation');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return new Response('Missing conversation ID', { status: 400 });
    }

    await prisma.conversation.delete({
      where: {
        id,
        userId: session.user.id, // Ensure user owns this conversation
      },
    });

    return new Response('Deleted', { status: 200 });
  } catch (error) {
    if (error instanceof Response) return error;
    return handleApiError(error, 'delete conversation');
  }
}

