/**
 * Users Routes - Daily Bonus
 *
 * Endpoints:
 * - POST /me/daily-bonus - Claim daily login bonus
 */

import {
  Router,
  requireAuth,
  prisma,
  creditService,
  CREDIT_COSTS,
  NotFoundError,
  ConflictError,
  achievementService,
} from './shared.js';

const router = Router();

// ============================================
// DAILY BONUS
// ============================================

/**
 * @openapi
 * /api/v1/users/me/daily-bonus:
 *   post:
 *     tags:
 *       - Users
 *     summary: Claim daily login bonus
 *     description: Claim the daily login bonus. Awards 2 credits daily, with an additional 5 credit bonus every 7 days (7-day streak)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daily bonus claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 creditsAwarded:
 *                   type: integer
 *                   example: 7
 *                 newBalance:
 *                   type: integer
 *                   example: 50
 *                 streak:
 *                   type: integer
 *                   example: 7
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Daily bonus already claimed today
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/me/daily-bonus', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = new Date(user.lastLoginDate);
    lastLogin.setHours(0, 0, 0, 0);

    if (today.getTime() === lastLogin.getTime()) {
      throw new ConflictError('Daily bonus already claimed for today');
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
      description: `Daily login bonus (${newStreak} day streak)`,
    });

    // Verify credits were actually added before updating user state
    if (!result.success) {
      console.error('[Daily Bonus] Credit addition failed:', result.error);
      throw new Error(result.error || 'Failed to add bonus credits');
    }

    // Update streak and last login date (only after credits confirmed)
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginStreak: newStreak,
        lastLoginDate: new Date(),
      },
    });

    // Check for streak-based achievements (non-critical)
    let unlockedAchievements: { achievementId: string; reward: number }[] = [];
    try {
      unlockedAchievements = await achievementService.checkAndUnlockAchievements(userId, {
        loginStreak: newStreak,
      });
    } catch (achievementError) {
      console.warn('[Daily Bonus] Failed to check achievements:', achievementError);
    }

    res.json({
      success: true,
      creditsAwarded: bonusCredits,
      newBalance: result.newBalance + unlockedAchievements.reduce((sum, a) => sum + a.reward, 0),
      streak: newStreak,
      unlockedAchievements,
    });
  } catch (error) {
    console.error('Error claiming daily bonus:', error);
    next(error); // Pass to error handler middleware
  }
});

export default router;
