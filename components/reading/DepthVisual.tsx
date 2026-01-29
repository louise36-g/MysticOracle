// components/reading/DepthVisual.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ReadingCategory } from '../../types';

interface ColorTheme {
  glow: string;
}

interface DepthVisualProps {
  cards: number;
  category: ReadingCategory;
  colorTheme: ColorTheme;
}

/**
 * Visual representation of card stack for depth selection
 * Renders different layouts based on card count:
 * - 1 card: Single centered card
 * - 2 cards: Two cards side by side (birth cards only)
 * - 3 cards: Three cards in a row
 * - 5 cards: Five cards in a row (smaller)
 * - 7 cards: Horseshoe arc arrangement
 * - 10 cards: Mini Celtic cross layout
 */
const DepthVisual: React.FC<DepthVisualProps> = ({ cards, colorTheme }) => {
  // Base card styling
  const cardBaseClass = 'rounded-sm bg-gradient-to-br from-white/20 to-white/5 border border-white/30';

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: 'easeOut',
      },
    }),
  };

  // Single card (1)
  if (cards === 1) {
    return (
      <div className="flex items-center justify-center h-14">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className={`w-6 h-10 ${cardBaseClass}`}
          style={{ boxShadow: `0 0 8px ${colorTheme.glow}` }}
        />
      </div>
    );
  }

  // Two cards side by side (birth cards)
  if (cards === 2) {
    return (
      <div className="flex items-center justify-center h-14 gap-2">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={`w-5 h-8 ${cardBaseClass}`}
            style={{ boxShadow: `0 0 6px ${colorTheme.glow}` }}
          />
        ))}
      </div>
    );
  }

  // Three cards in a row
  if (cards === 3) {
    return (
      <div className="flex items-center justify-center h-14 gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={`w-5 h-8 ${cardBaseClass}`}
            style={{ boxShadow: `0 0 6px ${colorTheme.glow}` }}
          />
        ))}
      </div>
    );
  }

  // Five cards in a row (smaller)
  if (cards === 5) {
    return (
      <div className="flex items-center justify-center h-14 gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={`w-4 h-7 ${cardBaseClass}`}
            style={{ boxShadow: `0 0 5px ${colorTheme.glow}` }}
          />
        ))}
      </div>
    );
  }

  // Horseshoe arc (7 cards)
  if (cards === 7) {
    // Calculate positions along a horseshoe arc
    const horseshoeCards = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      // Arc from left to right, curving upward in the middle
      const angle = (Math.PI * i) / 6; // Spread across 180 degrees
      const rotation = -30 + i * 10; // Rotate cards to follow the arc
      return { index: i, angle, rotation };
    });

    return (
      <div className="flex items-center justify-center h-14">
        <div className="relative w-32 h-12">
          {horseshoeCards.map(({ index, angle, rotation }) => {
            // X position: spread across the width
            const x = 10 + (index * 16);
            // Y position: arc curve (higher in middle)
            const y = 20 - Math.sin(angle) * 14;

            return (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className={`absolute w-3 h-6 ${cardBaseClass}`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: `rotate(${rotation}deg)`,
                  boxShadow: `0 0 4px ${colorTheme.glow}`,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Celtic Cross (10 cards)
  if (cards === 10) {
    return (
      <div className="flex items-center justify-center h-14">
        <div className="flex items-center gap-3">
          {/* Cross portion (6 cards) */}
          <div className="relative w-14 h-12">
            {/* Top card (position 5) */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className={`absolute w-3 h-5 ${cardBaseClass}`}
              style={{
                left: '50%',
                top: '0',
                transform: 'translateX(-50%)',
                boxShadow: `0 0 3px ${colorTheme.glow}`,
              }}
            />

            {/* Left card (position 4) */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className={`absolute w-3 h-5 ${cardBaseClass}`}
              style={{
                left: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                boxShadow: `0 0 3px ${colorTheme.glow}`,
              }}
            />

            {/* Center card (position 1) */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className={`absolute w-3 h-5 ${cardBaseClass}`}
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 3px ${colorTheme.glow}`,
              }}
            />

            {/* Crossing card (position 2) - rotated */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className={`absolute w-3 h-5 ${cardBaseClass}`}
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                boxShadow: `0 0 3px ${colorTheme.glow}`,
                zIndex: 1,
              }}
            />

            {/* Right card (position 6) */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className={`absolute w-3 h-5 ${cardBaseClass}`}
              style={{
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                boxShadow: `0 0 3px ${colorTheme.glow}`,
              }}
            />

            {/* Bottom card (position 3) */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className={`absolute w-3 h-5 ${cardBaseClass}`}
              style={{
                left: '50%',
                bottom: '0',
                transform: 'translateX(-50%)',
                boxShadow: `0 0 3px ${colorTheme.glow}`,
              }}
            />
          </div>

          {/* Staff portion (4 cards) - vertical column */}
          <div className="flex flex-col gap-0.5">
            {[6, 7, 8, 9].map((i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className={`w-2.5 h-3 ${cardBaseClass}`}
                style={{ boxShadow: `0 0 2px ${colorTheme.glow}` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for any other number (shouldn't happen)
  return (
    <div className="flex items-center justify-center h-14 gap-1">
      {Array.from({ length: cards }).map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className={`w-4 h-6 ${cardBaseClass}`}
          style={{ boxShadow: `0 0 4px ${colorTheme.glow}` }}
        />
      ))}
    </div>
  );
};

export default DepthVisual;
