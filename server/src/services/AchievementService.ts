/**
 * Achievement Service
 * Handles checking and unlocking achievements for users
 *
 * Achievement triggers:
 * - first_reading: totalReadings === 1
 * - five_readings: totalReadings === 5
 * - ten_readings: totalReadings === 10
 * - oracle: totalReadings === 25
 * - celtic_master: spreadType === CELTIC_CROSS
 * - all_spreads: used all 6 spread types
 * - week_streak: loginStreak >= 7
 * - true_believer: loginStreak >= 30
 * - lunar_cycle: readings in 4+ different weeks
 * - question_seeker: asked a follow-up question
 * - full_moon_reader: reading during full moon
 * - share_reading: (manual trigger when user shares)
 */

import { PrismaClient, SpreadType } from '@prisma/client';

// Achievement definitions with rewards
const ACHIEVEMENTS: Record<string, { reward: number }> = {
  first_reading: { reward: 3 },
  five_readings: { reward: 5 },
  ten_readings: { reward: 10 },
  oracle: { reward: 15 },
  celtic_master: { reward: 5 },
  all_spreads: { reward: 10 },
  week_streak: { reward: 10 },
  true_believer: { reward: 20 },
  lunar_cycle: { reward: 10 },
  question_seeker: { reward: 2 },
  full_moon_reader: { reward: 5 },
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
  askedFollowUp?: boolean;
  readingDate?: Date;
}

/**
 * Check if a given date falls on a full moon
 * Uses a simplified calculation based on the lunar cycle
 */
function isFullMoon(date: Date): boolean {
  // Known full moon date: January 13, 2025
  const knownFullMoon = new Date(2025, 0, 13);
  const lunarCycleMs = 29.53059 * 24 * 60 * 60 * 1000; // ~29.53 days in ms

  const diffMs = Math.abs(date.getTime() - knownFullMoon.getTime());
  const cyclePosition = diffMs % lunarCycleMs;

  // Consider it a full moon if within 24 hours of the actual full moon
  const toleranceMs = 24 * 60 * 60 * 1000;
  return cyclePosition < toleranceMs || lunarCycleMs - cyclePosition < toleranceMs;
}

/**
 * Get the ISO week number for a date
 */
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
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

        // Oracle - 25 readings
        if (context.totalReadings >= 25 && !unlockedIds.has('oracle')) {
          const unlocked = await this.unlockAchievement(userId, 'oracle');
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

      // True Believer - 30 day streak
      if (
        context.loginStreak !== undefined &&
        context.loginStreak >= 30 &&
        !unlockedIds.has('true_believer')
      ) {
        const unlocked = await this.unlockAchievement(userId, 'true_believer');
        if (unlocked) unlockedAchievements.push(unlocked);
      }

      // Lunar Cycle - readings in 4+ different weeks
      if (context.spreadType && !unlockedIds.has('lunar_cycle')) {
        const readings = await this.prisma.reading.findMany({
          where: { userId },
          select: { createdAt: true },
        });

        const uniqueWeeks = new Set(readings.map(r => getWeekNumber(r.createdAt)));
        // Add current reading's week
        uniqueWeeks.add(getWeekNumber(context.readingDate || new Date()));

        if (uniqueWeeks.size >= 4) {
          const unlocked = await this.unlockAchievement(userId, 'lunar_cycle');
          if (unlocked) unlockedAchievements.push(unlocked);
        }
      }

      // Question Seeker - asked a follow-up question
      if (context.askedFollowUp && !unlockedIds.has('question_seeker')) {
        const unlocked = await this.unlockAchievement(userId, 'question_seeker');
        if (unlocked) unlockedAchievements.push(unlocked);
      }

      // Full Moon Reader - reading during full moon
      if (context.readingDate && !unlockedIds.has('full_moon_reader')) {
        if (isFullMoon(context.readingDate)) {
          const unlocked = await this.unlockAchievement(userId, 'full_moon_reader');
          if (unlocked) unlockedAchievements.push(unlocked);
        }
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
