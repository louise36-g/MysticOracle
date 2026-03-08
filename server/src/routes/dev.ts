import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

/**
 * DEV ONLY ROUTES
 * These endpoints are only available in non-production environments
 * for testing and development purposes.
 */

// Block all dev routes in production
const blockInProduction = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
};

router.use(blockInProduction);

// Reset daily bonus for testing
router.post(
  '/reset-daily-bonus',
  requireAuth,
  asyncHandler(async (req, res) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.user.update({
      where: { id: req.auth.userId },
      data: { lastLoginDate: yesterday },
    });

    res.json({ success: true, message: 'Daily bonus reset - you can claim again!' });
  })
);

export default router;
