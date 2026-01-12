import { Router } from 'express';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { creditService, CREDIT_COSTS } from '../services/CreditService.js';

const router = Router();

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    console.log('[Users /me] Fetching user with ID:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: true,
        _count: {
          select: {
            readings: true,
            referrals: true
          }
        }
      }
    });

    if (!user) {
      console.log('[Users /me] User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[Users /me] Found user, credits:', user.credits);
    res.json(user);
  } catch (error) {
    console.error('[Users /me] Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user preferences
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { language, welcomeCompleted } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        language: language || undefined,
        welcomeCompleted: typeof welcomeCompleted === 'boolean' ? welcomeCompleted : undefined,
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user credits
router.get('/me/credits', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

// Get user reading history
router.get('/me/readings', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { limit = 20, offset = 0 } = req.query;

    const readings = await prisma.reading.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      include: {
        followUps: true
      }
    });

    const total = await prisma.reading.count({ where: { userId } });

    res.json({ readings, total });
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

// Get user transactions
router.get('/me/transactions', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { limit = 50, offset = 0 } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.transaction.count({ where: { userId } });

    res.json({ transactions, total });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Claim daily bonus
router.post('/me/daily-bonus', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = new Date(user.lastLoginDate);
    lastLogin.setHours(0, 0, 0, 0);

    if (today.getTime() === lastLogin.getTime()) {
      return res.status(400).json({ error: 'Already claimed today' });
    }

    // Calculate streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isConsecutive = lastLogin.getTime() === yesterday.getTime();
    const newStreak = isConsecutive ? user.loginStreak + 1 : 1;

    // Calculate bonus using CreditService constants
    let bonusCredits = CREDIT_COSTS.DAILY_BONUS_BASE;
    if (newStreak % 7 === 0) bonusCredits += CREDIT_COSTS.WEEKLY_STREAK_BONUS;

    // Add credits using CreditService (handles transaction + audit)
    const result = await creditService.addCredits({
      userId,
      amount: bonusCredits,
      type: 'DAILY_BONUS',
      description: `Daily login bonus (${newStreak} day streak)`
    });

    // Update streak and last login date
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginStreak: newStreak,
        lastLoginDate: new Date()
      }
    });

    res.json({
      success: true,
      creditsAwarded: bonusCredits,
      newBalance: result.newBalance,
      streak: newStreak
    });
  } catch (error) {
    console.error('Error claiming daily bonus:', error);
    res.status(500).json({ error: 'Failed to claim daily bonus' });
  }
});

// DEV ONLY - Reset daily bonus for testing
router.post('/me/reset-daily-bonus', requireAuth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not allowed in production' });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.user.update({
      where: { id: req.auth.userId },
      data: { lastLoginDate: yesterday }
    });

    return res.json({ success: true, message: 'Daily bonus reset - you can claim again!' });
  } catch (error) {
    console.error('Error resetting daily bonus:', error);
    return res.status(500).json({ error: 'Failed to reset daily bonus' });
  }
});

export default router;
