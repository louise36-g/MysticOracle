import { Router } from 'express';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user preferences
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { language } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        language: language || undefined,
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

    // Calculate bonus
    let bonusCredits = 2; // Base daily bonus
    if (newStreak % 7 === 0) bonusCredits += 5; // Weekly streak bonus

    // Update user and create transaction
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: bonusCredits },
          totalCreditsEarned: { increment: bonusCredits },
          loginStreak: newStreak,
          lastLoginDate: new Date()
        }
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'DAILY_BONUS',
          amount: bonusCredits,
          description: `Daily login bonus (${newStreak} day streak)`
        }
      })
    ]);

    res.json({
      success: true,
      creditsAwarded: bonusCredits,
      newBalance: updatedUser.credits,
      streak: newStreak
    });
  } catch (error) {
    console.error('Error claiming daily bonus:', error);
    res.status(500).json({ error: 'Failed to claim daily bonus' });
  }
});

export default router;
