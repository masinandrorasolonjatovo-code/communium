import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { buildAuthUserPayload } from '../_utils';

export async function GET() {
  const { userId, sessionId } = await auth();
  const user = userId ? await currentUser() : null;

  return NextResponse.json({
    success: true,
    authenticated: Boolean(userId && sessionId),
    data: {
      sessionId: sessionId || null,
      ...buildAuthUserPayload(user),
    },
  });
}
