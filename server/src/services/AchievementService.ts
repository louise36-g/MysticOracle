/**
 * Achievement Service
 * Handles checking and unlocking achievements for users
 *
 * Achievement triggers:
 * - first_reading: totalReadings === 1
 * - five_readings: totalReadings === 5
 * - ten_readings: totalReadings === 10
 * - celtic_master: spreadType === CELTIC_CROSS
 * - all_spreads: used all 6 spread types
 * - week_streak: loginStreak >= 7
 * - share_reading: (manual trigger when user shares)
 */

import { PrismaClient, SpreadType } from '@prisma/client';

// Achievement definitions with rewards
const ACHIEVEMENTS: Record<string, { reward: number }> = {
  first_reading: { reward: 3 },
  five_readings: { reward: 5 },
  ten_readings: { reward: 10 },
  celtic_master: { reward: 5 },
  all_spreads: { reward: 10 },
  week_streak: { reward: 10 },
  share_reading: { reward: 3 },
};

// All spread types that need to be used for 'all_spreads' achievement
const ALL_SPREAD_TYPES: SpreadType[] = [
  SpreadType.SINGLE,
  SpreadType.THREE_CARD,
  SpreadType.LOVE,
  SpreadType.CAREER,
  SpreadType.HORSESHOE,
  SpreadType.CELTIC_CROSS,
];

export interface UnlockedAchievement {
  achievementId: string;
  reward: number;
}

export interface AchievementContext {
  totalReadings?: number;
  spreadType?: SpreadType;
  loginStreak?: number;
  sharedReading?: boolean;
}

export class AchievementService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check and unlock any achievements the user has earned
   * Returns list of newly unlocked achievements
   */
  async checkAndUnlockAchievements(
    userId: string,
    context: AchievementContext
  ): Promise<UnlockedAchievement[]> {
    const unlockedAchievements: UnlockedAchievement[] = [];

    try {
      // Get user's existing achievements
      const existingAchievements = await this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      });
      const unlockedIds = new Set(existingAchievements.map(a => a.achievementId));

      // Check reading-based achievements
      if (context.totalReadings !== undefined) {
        // First reading
        if (context.totalReadings >= 1 && !unlockedIds.has('first_reading')) {
          const unlocked = await this.unlockAchievement(userId, 'first_reading');
          if (unlocked) unlockedAchievements.push(unlocked);
        }

        // Five readings
        if (context.totalReadings >= 5 && !unlockedIds.has('five_readings')) {
          const unlocked = await this.unlockAchievement(userId, 'five_readings');
          if (unlocked) unlockedAchievements.push(unlocked);
        }

        // Ten readings
        if (context.totalReadings >= 10 && !unlockedIds.has('ten_readings')) {
          const unlocked = await this.unlockAchievement(userId, 'ten_readings');
          if (unlocked) unlockedAchievements.push(unlocked);
        }
      }

      // Celtic Cross achievement
      if (context.spreadType === SpreadType.CELTIC_CROSS && !unlockedIds.has('celtic_master')) {
        const unlocked = await this.unlockAchievement(userId, 'celtic_master');
        if (unlocked) unlockedAchievements.push(unlocked);
      }

      // All spreads achievement - check if user has used all spread types
      if (context.spreadType && !unlockedIds.has('all_spreads')) {
        const usedSpreads = await this.prisma.reading.findMany({
          where: { userId },
          select: { spreadType: true },
          distinct: ['spreadType'],
        });
        const usedTypes = new Set(usedSpreads.map(r => r.spreadType));

        // Add current spread type
        usedTypes.add(context.spreadType);

        if (ALL_SPREAD_TYPES.every(type => usedTypes.has(type))) {
          const unlocked = await this.unlockAchievement(userId, 'all_spreads');
          if (unlocked) unlockedAchievements.push(unlocked);
        }
      }

      // Week streak achievement
      if (
        context.loginStreak !== undefined &&
        context.loginStreak >= 7 &&
        !unlockedIds.has('week_streak')
      ) {
        const unlocked = await this.unlockAchievement(userId, 'week_streak');
        if (unlocked) unlockedAchievements.push(unlocked);
      }

      // Share reading achievement
      if (context.sharedReading && !unlockedIds.has('share_reading')) {
        const unlocked = await this.unlockAchievement(userId, 'share_reading');
        if (unlocked) unlockedAchievements.push(unlocked);
      }

      if (unlockedAchievements.length > 0) {
        console.log(
          `[AchievementService] User ${userId} unlocked:`,
          unlockedAchievements.map(a => a.achievementId)
        );
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('[AchievementService] Error checking achievements:', error);
      // Don't throw - achievement failures shouldn't break the main flow
      return [];
    }
  }

  /**
   * Unlock a specific achievement for a user
   * Creates UserAchievement record and awards credit reward
   */
  async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<UnlockedAchievement | null> {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      console.error(`[AchievementService] Unknown achievement: ${achievementId}`);
      return null;
    }

    try {
      // Use transaction to ensure atomicity
      const result = await this.prisma.$transaction(async tx => {
        // Check if already unlocked (double-check within transaction)
        const existing = await tx.userAchievement.findUnique({
          where: {
            userId_achievementId: {
              userId,
              achievementId,
            },
          },
        });

        if (existing) {
          return null; // Already unlocked
        }

        // Create achievement record
        await tx.userAchievement.create({
          data: {
            userId,
            achievementId,
          },
        });

        // Award credits
        await tx.user.update({
          where: { id: userId },
          data: {
            credits: { increment: achievement.reward },
          },
        });

        // Create transaction record for the reward
        await tx.transaction.create({
          data: {
            userId,
            type: 'ACHIEVEMENT',
            amount: achievement.reward,
            description: `Achievement unlocked: ${achievementId}`,
          },
        });

        return { achievementId, reward: achievement.reward };
      });

      if (result) {
        console.log(
          `[AchievementService] ✅ Unlocked ${achievementId} for user ${userId}, awarded ${achievement.reward} credits`
        );
      }

      return result;
    } catch (error) {
      // Handle unique constraint violation (race condition)
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        console.log(
          `[AchievementService] Achievement ${achievementId} already unlocked (race condition)`
        );
        return null;
      }
      console.error(`[AchievementService] Error unlocking ${achievementId}:`, error);
      return null;
    }
  }

  /**
   * Get all achievements for a user with unlock status
   */
  async getUserAchievements(
    userId: string
  ): Promise<{ achievementId: string; unlockedAt: Date }[]> {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      select: {
        achievementId: true,
        unlockedAt: true,
      },
    });
  }
}

export default AchievementService;
