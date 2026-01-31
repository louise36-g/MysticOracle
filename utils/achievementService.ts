import { ACHIEVEMENTS, SpreadType } from '../types';
import { SPREADS } from '../constants';
import { ReadingData } from '../services/api';

// Achievement progress calculator types
export interface AchievementProgress {
    current: number;
    target: number;
}

export interface UserAchievementData {
    totalReadings: number;
    loginStreak: number;
    unlockedAchievements: string[];
    readings: ReadingData[];
}

/**
 * Calculate unique spread types used by the user
 * Pure function - no side effects
 */
export function calculateSpreadsUsed(readings: ReadingData[]): SpreadType[] {
    const uniqueSpreads = new Set<string>();

    readings.forEach(reading => {
        if (reading.spreadType) {
            // Normalize to uppercase to match backend format (SINGLE, THREE_CARD, etc.)
            const normalizedSpread = reading.spreadType.toUpperCase();
            uniqueSpreads.add(normalizedSpread);
        }
    });

    // Convert to SpreadType enum values (lowercase)
    const spreadsUsed: SpreadType[] = [];
    uniqueSpreads.forEach(spread => {
        const spreadKey = spread as keyof typeof SpreadType;
        if (SpreadType[spreadKey]) {
            spreadsUsed.push(SpreadType[spreadKey]);
        }
    });

    return spreadsUsed;
}

/**
 * Calculate total number of spread types available
 */
export function getTotalSpreadTypes(): number {
    return Object.keys(SPREADS).length;
}

/**
 * Check if user has completed a specific spread type
 */
export function hasCompletedSpreadType(
    readings: ReadingData[],
    spreadType: SpreadType
): boolean {
    return readings.some(r =>
        r.spreadType?.toLowerCase() === spreadType.toLowerCase()
    );
}

/**
 * Calculate progress for a specific achievement
 * Pure function - deterministic output based on input
 */
export function calculateAchievementProgress(
    achievementId: string,
    userData: UserAchievementData
): AchievementProgress {
    const { totalReadings, loginStreak, unlockedAchievements, readings } = userData;
    const spreadsUsed = calculateSpreadsUsed(readings);
    const totalSpreads = getTotalSpreadTypes();

    switch (achievementId) {
        case 'first_reading':
            return { current: Math.min(totalReadings, 1), target: 1 };

        case 'five_readings':
            return { current: Math.min(totalReadings, 5), target: 5 };

        case 'ten_readings':
            return { current: Math.min(totalReadings, 10), target: 10 };

        case 'celtic_master':
            return {
                current: hasCompletedSpreadType(readings, SpreadType.CELTIC_CROSS) ? 1 : 0,
                target: 1
            };

        case 'all_spreads':
            return {
                current: spreadsUsed.length,
                target: totalSpreads
            };

        case 'week_streak':
            return {
                current: Math.min(loginStreak, 7),
                target: 7
            };

        case 'share_reading':
            return {
                current: unlockedAchievements.includes('share_reading') ? 1 : 0,
                target: 1
            };

        default:
            console.warn(`[AchievementService] Unknown achievement: ${achievementId}`);
            return { current: 0, target: 1 };
    }
}

/**
 * Check if an achievement is unlocked
 * Clear, explicit logic
 */
export function isAchievementUnlocked(
    achievementId: string,
    unlockedAchievements: string[]
): boolean {
    return unlockedAchievements.includes(achievementId);
}

/**
 * Get all achievements with their unlock status and progress
 * Single source of truth for achievement state
 */
export function getAchievementsWithProgress(userData: UserAchievementData) {
    return ACHIEVEMENTS.map(achievement => {
        const isUnlocked = isAchievementUnlocked(achievement.id, userData.unlockedAchievements);
        const progress = calculateAchievementProgress(achievement.id, userData);

        return {
            ...achievement,
            isUnlocked,
            progress,
        };
    });
}

/**
 * Debug helper - log achievement status for troubleshooting
 */
export function debugAchievementStatus(userData: UserAchievementData): void {
    console.group('[AchievementService] Debug Status');
    console.log('Total Readings:', userData.totalReadings);
    console.log('Login Streak:', userData.loginStreak);
    console.log('Unlocked Achievements:', userData.unlockedAchievements);

    const spreadsUsed = calculateSpreadsUsed(userData.readings);
    console.log('Spreads Used:', spreadsUsed);
    console.log('Total Spreads Available:', getTotalSpreadTypes());

    const achievements = getAchievementsWithProgress(userData);
    achievements.forEach(ach => {
        console.log(`${ach.nameEn}: ${ach.isUnlocked ? '✓ UNLOCKED' : '✗ Locked'} (${ach.progress.current}/${ach.progress.target})`);
    });
    console.groupEnd();
}
