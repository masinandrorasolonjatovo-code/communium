import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { buildAuthUserPayload } from '../_utils';

export async function POST() {
  const { userId, sessionId } = await auth();

  if (!userId || !sessionId) {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: 'No active session.',
      },
      { status: 401 },
    );
  }

  const [user, client] = await Promise.all([currentUser(), clerkClient()]);
  const session = await client.sessions.getSession(sessionId);

  return NextResponse.json({
    success: true,
    authenticated: true,
    data: {
      sessionId,
      sessionStatus: session.status || null,
      lastActiveAt: session.lastActiveAt || null,
      expireAt: session.expireAt || null,
      refreshedAt: new Date().toISOString(),
      ...buildAuthUserPayload(user),
    },
  });
}
