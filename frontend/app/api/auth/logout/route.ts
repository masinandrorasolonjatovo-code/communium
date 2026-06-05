import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const { sessionId, userId } = await auth();

  if (sessionId) {
    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);
  }

  return NextResponse.json({
    success: true,
    authenticated: false,
    data: {
      clerkUserId: userId || null,
      sessionRevoked: Boolean(sessionId),
    },
  });
}
