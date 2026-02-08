/**
 * Users Routes - Profile & Preferences
 *
 * Endpoints:
 * - GET /me - Get current user profile
 * - PATCH /me - Update preferences
 * - GET /me/credits - Get credit balance
 */

import { Router, requireAuth, prisma, NotFoundError, debug } from './shared.js';

const router = Router();

// ============================================
// USER PROFILE
// ============================================

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile including credits, achievements, and reading count
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    debug.log('[Users /me] Fetching user with ID:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: true,
        _count: {
          select: {
            readings: true,
            referrals: true,
          },
        },
      },
    });

    if (!user) {
      debug.log('[Users /me] User not found for ID:', userId);
      throw new NotFoundError('User', userId);
    }

    debug.log('[Users /me] Found user, credits:', user.credits);
    res.json(user);
  } catch (error) {
    console.error('[Users /me] Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================
// UPDATE PREFERENCES
// ============================================

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
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ============================================
// USERNAME AVAILABILITY CHECK
// ============================================

// Check if username is available
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        available: false,
        reason: 'invalid_format',
        message: 'Username must be 3-20 characters, letters, numbers, and underscores only',
      });
    }

    // Check reserved usernames
    const reserved = [
      'admin',
      'administrator',
      'support',
      'help',
      'system',
      'mysticoracle',
      'moderator',
      'mod',
    ];
    if (reserved.includes(username.toLowerCase())) {
      return res.status(200).json({
        available: false,
        reason: 'reserved',
      });
    }

    // Check if username exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    res.json({
      available: !existingUser,
      reason: existingUser ? 'already_taken' : undefined,
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Failed to check username' });
  }
});

// ============================================
// CREDITS
// ============================================

// Get user credits
router.get('/me/credits', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

export default router;
