import React, { useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sparkles, Star } from 'lucide-react';

interface CreditAnimationItem {
  id: string;
  amount: number;
  x: number;
  y: number;
  isBonus?: boolean;
}

interface CreditEarnAnimationProps {
  // Trigger animation with amount
  trigger: { amount: number; isBonus?: boolean } | null;
  // Optional: target element to animate towards (e.g., credit counter in header)
  targetSelector?: string;
}

const CreditEarnAnimation: React.FC<CreditEarnAnimationProps> = ({
  trigger,
  targetSelector = '[data-credit-counter]',
}) => {
  const [animations, setAnimations] = useState<CreditAnimationItem[]>([]);

  useEffect(() => {
    if (trigger && trigger.amount > 0) {
      const id = `credit-${Date.now()}-${Math.random()}`;

      // Get target position (credit counter in header)
      let targetX = window.innerWidth / 2;
      let targetY = 50;

      try {
        const target = document.querySelector(targetSelector);
        if (target) {
          const rect = target.getBoundingClientRect();
          targetX = rect.left + rect.width / 2;
          targetY = rect.top + rect.height / 2;
        }
      } catch (e) {
        // Use defaults
      }

      // Start from center of screen
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight / 2;

      setAnimations((prev) => [
        ...prev,
        {
          id,
          amount: trigger.amount,
          x: startX,
          y: startY,
          isBonus: trigger.isBonus,
        },
      ]);

      // Remove after animation completes
      setTimeout(() => {
        setAnimations((prev) => prev.filter((a) => a.id !== id));
      }, 2000);
    }
  }, [trigger, targetSelector]);

  if (animations.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[150]">
      <AnimatePresence>
        {animations.map((anim) => (
          <motion.div
            key={anim.id}
            initial={{
              opacity: 0,
              scale: 0.5,
              x: anim.x,
              y: anim.y,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1, 0.8],
              y: [anim.y, anim.y - 50, anim.y - 100, 50],
              x: anim.x,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              times: [0, 0.2, 0.6, 1],
              ease: 'easeOut',
            }}
            className="absolute"
            style={{ left: 0, top: 0, transform: `translate(-50%, -50%)` }}
          >
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                anim.isBonus
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-glow-amber'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-glow-purple'
              }`}
            >
              {anim.isBonus ? (
                <Star className="w-5 h-5 text-white fill-current" />
              ) : (
                <Coins className="w-5 h-5 text-white" />
              )}
              <span className="text-lg font-bold text-white">
                +{anim.amount}
              </span>
              {anim.isBonus && (
                <Sparkles className="w-4 h-4 text-white animate-sparkle" />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Sparkle particles for bonus */}
      <AnimatePresence>
        {animations
          .filter((a) => a.isBonus)
          .map((anim) => (
            <React.Fragment key={`sparkles-${anim.id}`}>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`sparkle-${anim.id}-${i}`}
                  initial={{
                    opacity: 1,
                    scale: 0,
                    x: anim.x,
                    y: anim.y,
                  }}
                  animate={{
                    opacity: [1, 1, 0],
                    scale: [0, 1, 0.5],
                    x: anim.x + Math.cos((i * Math.PI) / 3) * 80,
                    y: anim.y + Math.sin((i * Math.PI) / 3) * 80 - 50,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.1 + i * 0.05,
                    ease: 'easeOut',
                  }}
                  className="absolute w-2 h-2"
                  style={{ left: 0, top: 0 }}
                >
                  <div className="w-full h-full rounded-full bg-amber-400 shadow-glow-amber" />
                </motion.div>
              ))}
            </React.Fragment>
          ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default memo(CreditEarnAnimation);
