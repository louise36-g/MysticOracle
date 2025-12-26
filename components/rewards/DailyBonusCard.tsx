import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Clock, Flame, Sparkles, Check, Coins } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DailyBonusCardProps {
  className?: string;
}

const DailyBonusCard: React.FC<DailyBonusCardProps> = ({ className = '' }) => {
  const { user, language, claimDailyBonus } = useApp();
  const [isClaiming, setIsClaiming] = useState(false);
  const [flyingCoins, setFlyingCoins] = useState<{ id: number; startX: number; startY: number }[]>([]);
  const [claimResult, setClaimResult] = useState<{ success: boolean; credits?: number; message?: string } | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [canClaim, setCanClaim] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate time until next bonus
  useEffect(() => {
    const calculateTimeUntilNext = () => {
      if (!user?.lastLoginDate) {
        setCanClaim(true);
        setTimeUntilNext('');
        return;
      }

      const lastLogin = new Date(user.lastLoginDate);
      const now = new Date();

      // Check if it's a new day (reset at midnight)
      const lastLoginDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (today > lastLoginDay) {
        setCanClaim(true);
        setTimeUntilNext('');
      } else {
        setCanClaim(false);
        // Calculate time until midnight
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const diff = tomorrow.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Show format based on time remaining
        if (hours > 0) {
          setTimeUntilNext(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeUntilNext(`${minutes}m ${seconds}s`);
        } else {
          setTimeUntilNext(`${seconds}s`);
        }
      }
    };

    calculateTimeUntilNext();
    // Update every second for more accurate countdown
    const interval = setInterval(calculateTimeUntilNext, 1000);

    return () => clearInterval(interval);
  }, [user?.lastLoginDate]);

  const handleClaim = useCallback(async () => {
    if (!canClaim || isClaiming || !buttonRef.current) return;

    // Get button position for coin animation
    const rect = buttonRef.current.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    setIsClaiming(true);
    setClaimResult(null);

    try {
      const result = await claimDailyBonus();

      if (result.success) {
        setClaimResult({ success: true, credits: result.amount });

        // Create flying coins from button position
        const coins = [
          { id: Date.now(), startX, startY },
          { id: Date.now() + 1, startX: startX - 20, startY },
        ];
        setFlyingCoins(coins);

        // Clear coins after animation
        setTimeout(() => setFlyingCoins([]), 1200);

        // Update canClaim state
        setCanClaim(false);
      } else {
        setClaimResult({
          success: false,
          message: language === 'en' ? 'Already claimed today' : 'Déjà réclamé aujourd\'hui',
        });
      }
    } catch (error) {
      setClaimResult({
        success: false,
        message: language === 'en' ? 'Failed to claim bonus' : 'Échec de la réclamation',
      });
    } finally {
      setIsClaiming(false);
    }
  }, [canClaim, isClaiming, claimDailyBonus, language]);

  const streakBonus = (user?.loginStreak || 0) >= 6;
  const baseCredits = 2;
  const streakCredits = streakBonus ? 5 : 0;
  const totalCredits = baseCredits + streakCredits;

  return (
    <>
      <motion.div
        className={`relative overflow-hidden rounded-xl border ${
          canClaim
            ? 'border-amber-500/50 bg-gradient-to-br from-amber-900/30 to-orange-900/20'
            : 'border-slate-700 bg-slate-800/50'
        } ${className}`}
        whileHover={canClaim ? { scale: 1.02 } : {}}
        whileTap={canClaim ? { scale: 0.98 } : {}}
      >
        {/* Animated background for claimable state */}
        {canClaim && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        <div className="relative p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  canClaim
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-slate-700'
                }`}
              >
                <Gift className={`w-5 h-5 ${canClaim ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div>
                <h3 className={`font-heading font-bold ${canClaim ? 'text-amber-100' : 'text-slate-300'}`}>
                  {language === 'en' ? 'Daily Bonus' : 'Bonus Quotidien'}
                </h3>
                {user?.loginStreak && user.loginStreak > 0 && (
                  <div className="flex items-center gap-1 text-xs text-orange-400">
                    <Flame className="w-3 h-3" />
                    <span>
                      {user.loginStreak} {language === 'en' ? 'day streak' : 'jours consécutifs'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Reward amount */}
            <div className="text-right">
              <div className={`text-2xl font-bold ${canClaim ? 'text-amber-400' : 'text-slate-500'}`}>
                +{totalCredits}
              </div>
              <div className="text-xs text-slate-400">
                {language === 'en' ? 'credits' : 'crédits'}
              </div>
            </div>
          </div>

          {/* Streak bonus indicator */}
          {streakBonus && canClaim && (
            <div className="mb-3 flex items-center gap-2 text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full w-fit">
              <Sparkles className="w-3 h-3" />
              <span>{language === 'en' ? '7-day streak bonus: +5' : 'Bonus 7 jours: +5'}</span>
            </div>
          )}

          {/* Claim button or countdown */}
          {canClaim ? (
            <motion.button
              ref={buttonRef}
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold
                hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50
                flex items-center justify-center gap-2 shadow-glow-amber"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isClaiming ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>{language === 'en' ? 'Claiming...' : 'Réclamation...'}</span>
                </>
              ) : claimResult?.success ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>{language === 'en' ? 'Claimed!' : 'Réclamé !'}</span>
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  <span>{language === 'en' ? 'Claim Bonus' : 'Réclamer le Bonus'}</span>
                </>
              )}
            </motion.button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 text-slate-400 bg-slate-800/50 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {language === 'en' ? 'Next bonus in' : 'Prochain bonus dans'}{' '}
                <span className="font-mono font-bold text-slate-300">{timeUntilNext || '...'}</span>
              </span>
            </div>
          )}

          {/* Error message */}
          <AnimatePresence>
            {claimResult && !claimResult.success && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-sm text-red-400 text-center"
              >
                {claimResult.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Flying Coins Animation - using fixed positioning with calculated values */}
      <AnimatePresence>
        {flyingCoins.map((coin) => {
          // Find the header credits element
          const headerCredits = document.querySelector('[data-credit-counter]');
          const targetRect = headerCredits?.getBoundingClientRect();
          const targetX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth - 100;
          const targetY = targetRect ? targetRect.top + targetRect.height / 2 : 30;

          return (
            <motion.div
              key={coin.id}
              className="fixed z-[9999] pointer-events-none"
              style={{ left: 0, top: 0 }}
              initial={{
                x: coin.startX - 12,
                y: coin.startY - 12,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: targetX - 12,
                y: targetY - 12,
                scale: [1, 1.5, 0.8],
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50">
                <Coins className="w-4 h-4 text-amber-900" />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
};

export default memo(DailyBonusCard);
