/**
 * Users Routes - Profile & Preferences
 *
 * Endpoints:
 * - GET /me - Get current user profile
 * - PATCH /me - Update preferences
 * - GET /me/credits - Get credit balance
 */

import { Router, requireAuth, prisma, NotFoundError } from './shared.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { ValidationError, ConflictError } from '../../shared/errors/ApplicationError.js';

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
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.auth.userId;

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
      throw new NotFoundError('User', userId);
    }

    res.json(user);
  })
);

// ============================================
// UPDATE PREFERENCES
// ============================================

// Update user preferences
router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.auth.userId;
    const { language, welcomeCompleted, username } = req.body;

    // If updating username, validate it
    if (username !== undefined) {
      // Validate format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        throw new ValidationError(
          'Username must be 3-20 characters, letters, numbers, and underscores only'
        );
      }

      // Check reserved usernames
      const reserved = [
        'admin',
        'administrator',
        'support',
        'help',
        'system',
        'celestiarcana',
        'moderator',
        'mod',
      ];
      if (reserved.includes(username.toLowerCase())) {
        throw new ValidationError('This username is reserved');
      }

      // Check if username is taken (case-insensitive, excluding current user)
      const existingUser = await prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive',
          },
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUser) {
        throw new ConflictError('Username is already taken');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        language: language || undefined,
        welcomeCompleted: typeof welcomeCompleted === 'boolean' ? welcomeCompleted : undefined,
        username: username || undefined,
      },
    });

    res.json(user);
  })
);

// ============================================
// USERNAME AVAILABILITY CHECK
// ============================================

// Check if username is available
router.get(
  '/check-username',
  asyncHandler(async (req, res) => {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      throw new ValidationError('Username is required');
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
      'celestiarcana',
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
  })
);

// ============================================
// CREDITS
// ============================================

// Get user credits
router.get(
  '/me/credits',
  requireAuth,
  asyncHandler(async (req, res) => {
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
  })
);

export default router;
