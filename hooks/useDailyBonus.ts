/**
 * useDailyBonus Hook
 * Manages daily bonus claiming logic and countdown timer
 */

import { useState, useEffect, useCallback } from 'react';

interface UseDailyBonusParams {
  lastLoginDate: string | null | undefined;
  loginStreak: number;
  language: 'en' | 'fr';
  claimBonusFn: () => Promise<{ success: boolean }>;
  onSuccess?: (credits: number) => void;
  onError?: (message: string) => void;
}

interface UseDailyBonusReturn {
  canClaimBonus: boolean;
  isClaiming: boolean;
  timeUntilBonus: string;
  claimBonus: () => Promise<void>;
  bonusAmount: number;
}

export function useDailyBonus({
  lastLoginDate,
  loginStreak,
  language,
  claimBonusFn,
  onSuccess,
  onError,
}: UseDailyBonusParams): UseDailyBonusReturn {
  const [canClaimBonus, setCanClaimBonus] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [timeUntilBonus, setTimeUntilBonus] = useState('');

  // Calculate bonus amount based on streak
  // Backend logic: bonus triggers when (loginStreak + 1) % 7 === 0
  const nextStreak = loginStreak + 1;
  const bonusAmount = (nextStreak >= 7 && nextStreak % 7 === 0) ? 7 : 2;

  // Timer effect
  useEffect(() => {
    const calculateTimeUntilNext = () => {
      if (!lastLoginDate) {
        setCanClaimBonus(true);
        setTimeUntilBonus('');
        return;
      }

      const lastClaim = new Date(lastLoginDate);
      const now = new Date();
      const nextClaimTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const diff = nextClaimTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCanClaimBonus(true);
        setTimeUntilBonus('');
      } else {
        setCanClaimBonus(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilBonus(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
      }
    };

    calculateTimeUntilNext();
    const interval = setInterval(calculateTimeUntilNext, 60000);
    return () => clearInterval(interval);
  }, [lastLoginDate]);

  // Claim bonus handler
  const claimBonus = useCallback(async () => {
    if (!canClaimBonus || isClaiming) return;

    setIsClaiming(true);
    try {
      const result = await claimBonusFn();
      if (result.success) {
        onSuccess?.(bonusAmount);
        setCanClaimBonus(false);
      }
    } catch (error) {
      const errorMsg = language === 'en' ? 'Failed to claim bonus' : 'Échec de la réclamation';
      onError?.(errorMsg);
    } finally {
      setIsClaiming(false);
    }
  }, [canClaimBonus, isClaiming, claimBonusFn, bonusAmount, language, onSuccess, onError]);

  return {
    canClaimBonus,
    isClaiming,
    timeUntilBonus,
    claimBonus,
    bonusAmount,
  };
}

export default useDailyBonus;
