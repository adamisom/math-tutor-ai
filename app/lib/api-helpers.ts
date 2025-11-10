import { auth } from './auth';
import type { Session } from 'next-auth';

/**
 * Get authenticated user session or return 401
 */
export async function requireAuth(): Promise<Session & { user: { id: string } }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session as Session & { user: { id: string } };
}

/**
 * Handle API errors with consistent response format
 */
export function handleApiError(error: unknown, context: string): Response {
  console.error(`Failed to ${context}:`, error);
  return new Response('Internal Server Error', { status: 500 });
}

