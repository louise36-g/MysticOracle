import { Router } from 'express';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * DEV ONLY ROUTES
 * These endpoints are only available in non-production environments
 * for testing and development purposes.
 */

// Reset daily bonus for testing
router.post('/reset-daily-bonus', requireAuth, async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.user.update({
      where: { id: req.auth.userId },
      data: { lastLoginDate: yesterday },
    });

    return res.json({ success: true, message: 'Daily bonus reset - you can claim again!' });
  } catch (error) {
    console.error('Error resetting daily bonus:', error);
    return res.status(500).json({ error: 'Failed to reset daily bonus' });
  }
});

export default router;
