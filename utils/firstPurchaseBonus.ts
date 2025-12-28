/**
 * First Purchase Bonus Utility
 * Tracks whether users have completed their first purchase to award bonus credits
 */

const FIRST_PURCHASE_KEY = 'mysticoracle_first_purchase';

export const FIRST_PURCHASE_BONUS_PERCENT = 25;

/**
 * Check if a user has already completed their first purchase
 */
export function hasCompletedFirstPurchase(userId: string): boolean {
  try {
    const completedUsers = JSON.parse(localStorage.getItem(FIRST_PURCHASE_KEY) || '[]');
    return completedUsers.includes(userId);
  } catch {
    return false;
  }
}

/**
 * Mark a user as having completed their first purchase
 */
export function markFirstPurchaseComplete(userId: string): void {
  try {
    const completedUsers = JSON.parse(localStorage.getItem(FIRST_PURCHASE_KEY) || '[]');
    if (!completedUsers.includes(userId)) {
      completedUsers.push(userId);
      localStorage.setItem(FIRST_PURCHASE_KEY, JSON.stringify(completedUsers));
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Calculate the bonus credits for a first purchase
 */
export function calculateFirstPurchaseBonus(baseCredits: number): number {
  return Math.floor(baseCredits * (FIRST_PURCHASE_BONUS_PERCENT / 100));
}

/**
 * Get first purchase bonus info for display
 */
export function getFirstPurchaseBonusInfo(userId: string | undefined, baseCredits: number): {
  isEligible: boolean;
  bonusCredits: number;
  totalCredits: number;
  bonusPercent: number;
} {
  const isEligible = userId ? !hasCompletedFirstPurchase(userId) : false;
  const bonusCredits = isEligible ? calculateFirstPurchaseBonus(baseCredits) : 0;

  return {
    isEligible,
    bonusCredits,
    totalCredits: baseCredits + bonusCredits,
    bonusPercent: FIRST_PURCHASE_BONUS_PERCENT,
  };
}
