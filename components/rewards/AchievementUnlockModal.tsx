import React, { useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { Achievement } from '../../types';
import { useApp } from '../../context/AppContext';
import Confetti from './Confetti';
import CreditEarnAnimation from './CreditEarnAnimation';
import Button from '../Button';

interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  achievement,
  onClose,
}) => {
  const { language } = useApp();
  const [showConfetti, setShowConfetti] = useState(false);
  const [creditAnimation, setCreditAnimation] = useState<{ amount: number; isBonus?: boolean } | null>(null);

  useEffect(() => {
    if (achievement) {
      // Start celebrations
      setShowConfetti(true);

      // Trigger credit animation after a delay
      const timer = setTimeout(() => {
        setCreditAnimation({ amount: achievement.reward, isBonus: true });
      }, 800);

      // Auto-close confetti
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(confettiTimer);
      };
    }
  }, [achievement]);

  if (!achievement) return null;

  const name = language === 'en' ? achievement.nameEn : achievement.nameFr;
  const description = language === 'en' ? achievement.descriptionEn : achievement.descriptionFr;

  return createPortal(
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-amber-500/30 to-purple-500/30 rounded-3xl blur-xl"
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Card */}
            <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
              {/* Sparkle decorations */}
              <motion.div
                className="absolute top-4 right-6"
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-amber-400" />
              </motion.div>
              <motion.div
                className="absolute bottom-4 left-6"
                animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Star className="w-5 h-5 text-purple-400 fill-current" />
              </motion.div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Trophy icon */}
                <motion.div
                  className="relative w-24 h-24 mx-auto mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    delay: 0.2,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-glow-pulse" />
                  <div className="absolute inset-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>

                  {/* Orbiting stars */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3"
                      style={{
                        top: '50%',
                        left: '50%',
                      }}
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: i * 0.5,
                      }}
                    >
                      <motion.div
                        style={{
                          transform: `translateX(${40 + i * 10}px) translateY(-50%)`,
                        }}
                      >
                        <Star
                          className="w-3 h-3 text-amber-300 fill-current"
                          style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))' }}
                        />
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Title */}
                <motion.h2
                  className="text-2xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {language === 'en' ? 'Achievement Unlocked!' : 'Succès Débloqué !'}
                </motion.h2>

                {/* Achievement name */}
                <motion.h3
                  className="text-xl font-bold text-white mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {name}
                </motion.h3>

                {/* Description */}
                <motion.p
                  className="text-slate-400 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {description}
                </motion.p>

                {/* Reward */}
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring' }}
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-lg font-bold text-amber-300">
                    +{achievement.reward} {language === 'en' ? 'credits' : 'crédits'}
                  </span>
                </motion.div>

                {/* Close button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button variant="primary" onClick={onClose} className="w-full">
                    {language === 'en' ? 'Awesome!' : 'Super !'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <Confetti isActive={showConfetti} pieceCount={80} duration={4000} />
      <CreditEarnAnimation trigger={creditAnimation} />
    </>,
    document.body
  );
};

export default memo(AchievementUnlockModal);
