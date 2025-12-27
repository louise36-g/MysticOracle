import { Request, Response, NextFunction } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import prisma from '../db/prisma.js';

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
 * Middleware to verify Clerk JWT token
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

    // Verify the JWT token with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach auth info to request
    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid as string || ''
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

      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      if (payload && payload.sub) {
        req.auth = {
          userId: payload.sub,
          sessionId: payload.sid as string || ''
        };
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
}

// List of usernames that should automatically be granted admin access
const AUTO_ADMIN_USERNAMES = ['mooks', 'louisegriffin', 'louise'];

/**
 * Middleware to require admin access (use after requireAuth)
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // requireAuth should have already set req.auth
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin in our database
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { isAdmin: true, username: true }
    });

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Auto-grant admin to specific usernames (and update DB for future)
    if (!user.isAdmin && AUTO_ADMIN_USERNAMES.includes(user.username.toLowerCase())) {
      await prisma.user.update({
        where: { id: req.auth.userId },
        data: { isAdmin: true }
      });
      console.log(`Auto-granted admin access to user: ${user.username}`);
      return next();
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(403).json({ error: 'Admin verification failed' });
  }
}
