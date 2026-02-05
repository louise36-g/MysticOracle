// components/reading/HorseshoeDisplay.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TarotCard } from '../../types';
import Card from '../Card';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

interface HorseshoeDisplayProps {
  drawnCards: DrawnCard[];
  language: 'en' | 'fr';
  theme: {
    glow: string;
    textAccent: string;
  };
}

// Position labels for the Horseshoe spread
const POSITION_LABELS = {
  en: ['Past', 'Present', 'Hidden', 'Obstacles', 'Others', 'Advice', 'Outcome'],
  fr: ['Passé', 'Présent', 'Caché', 'Obstacles', 'Autres', 'Conseil', 'Issue'],
};

/**
 * Horseshoe 7-card spread layout - pointing UP for luck
 *
 *            [4]
 *        [3]     [5]
 *      [2]         [6]
 *    [1]             [7]
 */
const HorseshoeDisplay: React.FC<HorseshoeDisplayProps> = ({
  drawnCards,
  language,
  theme,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Card dimensions - 1.4x size
  const cardWidth = 98;
  const cardHeight = 157;

  // Fixed positions for clean horseshoe arc pointing UP
  // Positions adjusted for larger cards
  const positions = [
    { x: 0, y: 180 },      // 1 - bottom left
    { x: 70, y: 118 },     // 2 - mid left
    { x: 158, y: 56 },     // 3 - upper left
    { x: 270, y: 0 },      // 4 - top center
    { x: 382, y: 56 },     // 5 - upper right
    { x: 470, y: 118 },    // 6 - mid right
    { x: 540, y: 180 },    // 7 - bottom right
  ];

  // Container dimensions - adjusted for larger cards + labels
  const containerWidth = 638;
  const containerHeight = 380;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        marginBottom: '32px'
      }}
    >
      {drawnCards.map((item, index) => {
        if (!item) return null;
        const pos = positions[index];
        const isHovered = hoveredIndex === index;

        return (
          <motion.div
            key={`horseshoe-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: isHovered ? 1.3 : 1,
              zIndex: isHovered ? 50 : 10,
            }}
            transition={{
              delay: 0.15 + index * 0.08,
              type: 'spring',
              stiffness: 200,
              scale: { duration: 0.15 }
            }}
            className="absolute cursor-pointer flex flex-col items-center"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="rounded-lg overflow-hidden transition-shadow duration-200"
              style={{
                boxShadow: isHovered
                  ? `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`
                  : `0 0 10px ${theme.glow}`
              }}
            >
              <Card
                card={item.card}
                isRevealed={true}
                isReversed={item.isReversed}
                width={cardWidth}
                height={cardHeight}
                hideOverlay={true}
              />
            </div>
            {/* Position label */}
            <span
              className={`mt-1 text-[9px] font-bold uppercase tracking-wider ${theme.textAccent} text-center whitespace-nowrap`}
            >
              {POSITION_LABELS[language][index]}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default HorseshoeDisplay;
