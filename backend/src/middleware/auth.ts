/**
 * Clerk Authentication Middleware
 * Verifies Clerk JWT tokens and extracts user information
 */

import express, { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/backend';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        mfaEnabled?: boolean;
      };
    }
  }
}

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const headerToken = req.headers.authorization?.split('Bearer ')[1];

    if (!headerToken) {
      res.status(401).json({ error: 'Missing authentication token' });
      return;
    }

    // Verify JWT token
    const session = await clerk.sessions.verifySession(headerToken);

    if (!session.userId) {
      res.status(401).json({ error: 'Invalid authentication token' });
      return;
    }

    // Get user information
    const user = await clerk.users.getUser(session.userId);

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      role: user.publicMetadata?.role || 'Regular',
      mfaEnabled: user.twoFactorEnabled,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function requireMFA(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Check if user has MFA enabled (required for VIP)
  if (req.user?.role === 'VIP' && !req.user?.mfaEnabled) {
    res.status(403).json({
      error: 'MFA is required for VIP accounts',
      code: 'MFA_REQUIRED',
    });
    return;
  }

  next();
}

export default authenticateUser;
