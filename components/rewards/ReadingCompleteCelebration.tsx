import React, { useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Gift, PartyPopper } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Confetti from './Confetti';
import CreditEarnAnimation from './CreditEarnAnimation';

interface ReadingCompleteCelebrationProps {
  isActive: boolean;
  onComplete: () => void;
  spreadName: string;
}

const MYSTERY_BONUS_CHANCE = 0.12; // 12% chance
const MYSTERY_BONUS_AMOUNTS = [1, 2, 3, 5]; // Possible bonus amounts

const ReadingCompleteCelebration: React.FC<ReadingCompleteCelebrationProps> = ({
  isActive,
  onComplete,
  spreadName,
}) => {
  const { language, addCredits } = useApp();
  const [phase, setPhase] = useState<'initial' | 'bonus' | 'done'>('initial');
  const [bonusAmount, setBonusAmount] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [creditAnimation, setCreditAnimation] = useState<{ amount: number; isBonus?: boolean } | null>(null);

  useEffect(() => {
    if (isActive) {
      // Reset state
      setPhase('initial');
      setBonusAmount(null);
      setShowConfetti(false);
      setCreditAnimation(null);

      // Check for mystery bonus
      const hasBonus = Math.random() < MYSTERY_BONUS_CHANCE;

      if (hasBonus) {
        // Determine bonus amount (weighted toward lower amounts)
        const weights = [0.5, 0.3, 0.15, 0.05]; // 1, 2, 3, 5 credits
        const random = Math.random();
        let cumulative = 0;
        let selectedAmount = MYSTERY_BONUS_AMOUNTS[0];

        for (let i = 0; i < weights.length; i++) {
          cumulative += weights[i];
          if (random < cumulative) {
            selectedAmount = MYSTERY_BONUS_AMOUNTS[i];
            break;
          }
        }

        setBonusAmount(selectedAmount);

        // Show initial celebration
        setTimeout(() => {
          setPhase('bonus');
          setShowConfetti(true);

          // Award the bonus credits
          addCredits(selectedAmount);

          // Show credit animation
          setTimeout(() => {
            setCreditAnimation({ amount: selectedAmount, isBonus: true });
          }, 500);

          // End celebration
          setTimeout(() => {
            setShowConfetti(false);
            setPhase('done');
            setTimeout(onComplete, 1000);
          }, 3500);
        }, 800);
      } else {
        // No bonus - just show quick completion
        setTimeout(() => {
          setPhase('done');
          onComplete();
        }, 1500);
      }
    }
  }, [isActive, addCredits, onComplete]);

  if (!isActive) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {phase !== 'done' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
          >
            {/* Quick flash effect for completion */}
            {phase === 'initial' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [0, 0.3, 0] }}
                transition={{ duration: 0.8 }}
                className="absolute w-96 h-96 rounded-full bg-purple-500/30 blur-3xl"
              />
            )}

            {/* Mystery Bonus Modal */}
            {phase === 'bonus' && bonusAmount && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative pointer-events-auto"
              >
                {/* Glow background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/40 via-yellow-500/40 to-amber-500/40 rounded-3xl blur-2xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 0.9, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />

                <div className="relative bg-gradient-to-br from-slate-900 via-amber-900/30 to-slate-900 border-2 border-amber-500/60 rounded-3xl p-8 shadow-2xl overflow-hidden max-w-sm">
                  {/* Sparkle decorations */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${10 + Math.random() * 80}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 180],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    >
                      <Star className="w-4 h-4 text-amber-400 fill-current" />
                    </motion.div>
                  ))}

                  <div className="text-center relative z-10">
                    {/* Icon */}
                    <motion.div
                      className="w-20 h-20 mx-auto mb-4 relative"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: 3 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-glow-pulse" />
                      <div className="absolute inset-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                        <Gift className="w-10 h-10 text-white" />
                      </div>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <PartyPopper className="w-5 h-5 text-amber-400" />
                        <h2 className="text-xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
                          {language === 'en' ? 'Mystery Bonus!' : 'Bonus Mystère !'}
                        </h2>
                        <PartyPopper className="w-5 h-5 text-amber-400 scale-x-[-1]" />
                      </div>

                      <p className="text-slate-400 text-sm mb-4">
                        {language === 'en'
                          ? 'The cards have blessed your reading!'
                          : 'Les cartes ont béni votre lecture !'}
                      </p>

                      {/* Bonus amount */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.4, type: 'spring' }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/50 rounded-full"
                      >
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        <span className="text-2xl font-bold text-amber-300">
                          +{bonusAmount}
                        </span>
                        <span className="text-amber-200">
                          {language === 'en' ? 'credits' : 'crédits'}
                        </span>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Confetti isActive={showConfetti} pieceCount={60} duration={3000} />
      <CreditEarnAnimation trigger={creditAnimation} />
    </>,
    document.body
  );
};

export default memo(ReadingCompleteCelebration);
