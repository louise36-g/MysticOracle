import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/backend';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!
});

/**
 * Middleware to verify Clerk session token
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the session token with Clerk
    const session = await clerk.sessions.verifySession(
      req.headers['x-clerk-session-id'] as string || '',
      token
    );

    if (!session || session.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Attach auth info to request
    req.auth = {
      userId: session.userId,
      sessionId: session.id
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to optionally attach auth info (doesn't require auth)
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const sessionId = req.headers['x-clerk-session-id'] as string;

      if (sessionId) {
        const session = await clerk.sessions.verifySession(sessionId, token);

        if (session && session.status === 'active') {
          req.auth = {
            userId: session.userId,
            sessionId: session.id
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
}

/**
 * Middleware to require admin access
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // First verify auth
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const sessionId = req.headers['x-clerk-session-id'] as string;

    const session = await clerk.sessions.verifySession(sessionId, token);

    if (!session || session.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Check if user is admin in our database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.auth = {
      userId: session.userId,
      sessionId: session.id
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
