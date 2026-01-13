import React, { useState, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Flame, Sparkles, Coins, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/TranslationContext';

interface DailyBonusPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const DailyBonusPopup: React.FC<DailyBonusPopupProps> = ({ isOpen, onClose }) => {
  const { user, language, claimDailyBonus } = useApp();
  const { t } = useTranslation();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [flyingCoins, setFlyingCoins] = useState<{ id: number; startX: number; startY: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const streakBonus = (user?.loginStreak || 0) >= 6;
  const baseCredits = 2;
  const streakCredits = streakBonus ? 5 : 0;
  const totalCredits = baseCredits + streakCredits;

  const handleClaim = useCallback(async () => {
    if (isClaiming || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    setIsClaiming(true);
    setError(null);

    try {
      const result = await claimDailyBonus();

      if (result.success) {
        setClaimed(true);
        setClaimedAmount(result.amount);

        // Create flying coins
        const coins = [
          { id: Date.now(), startX, startY },
          { id: Date.now() + 1, startX: startX - 20, startY },
          { id: Date.now() + 2, startX: startX + 20, startY },
        ];
        setFlyingCoins(coins);

        // Clear coins after animation
        setTimeout(() => setFlyingCoins([]), 1200);

        // Auto-close after success
        setTimeout(() => {
          onClose();
          // Reset state for next time
          setTimeout(() => {
            setClaimed(false);
            setClaimedAmount(0);
            setError(null);
          }, 300);
        }, 2500);
      } else {
        // Handle failure case
        setError(language === 'en'
          ? 'Already claimed today. Come back tomorrow!'
          : 'Déjà réclamé aujourd\'hui. Revenez demain !');
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            setError(null);
          }, 300);
        }, 2500);
      }
    } catch (error: any) {
      console.error('Failed to claim bonus:', error);
      const errorMessage = error?.message || (language === 'en'
        ? 'Already claimed today. Come back tomorrow!'
        : 'Déjà réclamé aujourd\'hui. Revenez demain !');
      setError(errorMessage);

      // Auto-close after error
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setError(null);
        }, 300);
      }, 2500);
    } finally {
      setIsClaiming(false);
    }
  }, [isClaiming, claimDailyBonus, onClose, language]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-amber-500/30 shadow-2xl shadow-amber-500/20 pointer-events-auto overflow-hidden">
                {/* Animated background shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative p-6 text-center">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
                  >
                    {claimed ? (
                      <Check className="w-10 h-10 text-white" />
                    ) : (
                      <Gift className="w-10 h-10 text-white" />
                    )}
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-2xl font-heading font-bold text-amber-100 mb-2">
                    {claimed
                      ? (t('rewards.DailyBonusPopup.bonus_claimed', 'Bonus Claimed!'))
                      : (t('rewards.DailyBonusPopup.daily_bonus_available', 'Daily Bonus Available!'))
                    }
                  </h2>

                  {/* Streak info */}
                  {!claimed && user?.loginStreak && user.loginStreak > 0 && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm mb-4">
                      <Flame className="w-4 h-4" />
                      <span>
                        {user.loginStreak} {t('rewards.DailyBonusPopup.day_streak', 'day streak')}
                      </span>
                    </div>
                  )}

                  {/* Reward display */}
                  <div className="my-6">
                    <div className="text-5xl font-bold text-amber-400 flex items-center justify-center gap-2">
                      <Coins className="w-10 h-10" />
                      +{claimed ? claimedAmount : totalCredits}
                    </div>
                    <div className="text-slate-400 mt-1">
                      {t('rewards.DailyBonusPopup.credits', 'credits')}
                    </div>
                  </div>

                  {/* Streak bonus indicator */}
                  {!claimed && streakBonus && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-sm text-orange-300">
                      <Sparkles className="w-4 h-4" />
                      <span>{t('rewards.DailyBonusPopup.includes_7day_streak', 'Includes 7-day streak bonus!')}</span>
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-400 font-medium mb-4"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Claim button or success message */}
                  {claimed ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-green-400 font-medium"
                    >
                      {t('rewards.DailyBonusPopup.credits_added_to', 'Credits added to your account!')}
                    </motion.div>
                  ) : error ? null : (
                    <motion.button
                      ref={buttonRef}
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg
                        hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50
                        flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
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
                          <span>{t('rewards.DailyBonusPopup.claiming', 'Claiming...')}</span>
                        </>
                      ) : (
                        <>
                          <Gift className="w-5 h-5" />
                          <span>{t('rewards.DailyBonusPopup.claim_your_bonus', 'Claim Your Bonus')}</span>
                        </>
                      )}
                    </motion.button>
                  )}

                  {/* Skip link */}
                  {!claimed && (
                    <button
                      onClick={onClose}
                      className="mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {t('rewards.DailyBonusPopup.maybe_later', 'Maybe later')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Flying Coins Animation */}
      <AnimatePresence>
        {flyingCoins.map((coin) => {
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

export default memo(DailyBonusPopup);
