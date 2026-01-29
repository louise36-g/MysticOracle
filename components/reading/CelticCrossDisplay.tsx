// components/reading/CelticCrossDisplay.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { TarotCard } from '../../types';
import Card from '../Card';
import { CELTIC_CROSS_LAYOUT } from '../../constants/celticCrossLayouts';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

interface CelticCrossDisplayProps {
  drawnCards: DrawnCard[];
  language: 'en' | 'fr';
  theme: {
    glow: string;
    textAccent: string;
  };
}

/**
 * Celtic Cross 10-card spread layout
 *
 * Visual arrangement:
 *            [5]
 *     [4]  [1][2]  [6]         [10]
 *            [3]                [9]
 *                               [8]
 *                               [7]
 *
 * Card 2 crosses Card 1 horizontally (rotated 90°)
 * Cards 1-6 form the cross, Cards 7-10 form the staff
 */
const CelticCrossDisplay: React.FC<CelticCrossDisplayProps> = ({
  drawnCards,
  language,
  theme,
}) => {
  const positions = CELTIC_CROSS_LAYOUT.positions[language];

  // Card dimensions - compact for 10 cards
  const cardWidth = 'w-[60px] md:w-[80px]';
  const cardHeight = 'h-[96px] md:h-[128px]';

  // Render a single card with animation
  const renderCard = (index: number, extraClass = '', isRotated = false) => {
    const item = drawnCards[index];
    if (!item) return null;

    return (
      <motion.div
        key={`celtic-${index}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 + index * 0.08, type: 'spring', stiffness: 200 }}
        className={`flex flex-col items-center ${extraClass}`}
      >
        <div
          className={`rounded-lg p-0.5 ${isRotated ? 'rotate-90' : ''}`}
          style={{ boxShadow: `0 0 12px ${theme.glow}` }}
        >
          <Card
            card={item.card}
            isRevealed={true}
            isReversed={item.isReversed}
            className={`${cardWidth} ${cardHeight}`}
          />
        </div>
        <p
          className={`text-center mt-1.5 ${theme.textAccent} font-heading text-[8px] md:text-[10px] uppercase tracking-wider max-w-[70px] md:max-w-[90px] leading-tight`}
        >
          {positions[index]}
        </p>
        {item.isReversed && (
          <p className="text-center text-[7px] md:text-[8px] text-white/50 uppercase">
            {language === 'en' ? 'Reversed' : 'Renversée'}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-center">
      {/* The Cross (Cards 1-6) */}
      <div className="relative">
        {/* Cross grid using CSS Grid for precise positioning */}
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, auto)',
            width: 'fit-content',
          }}
        >
          {/* Row 1: Empty - Card 5 (Above) - Empty */}
          <div className="col-start-1" />
          <div className="col-start-2 flex justify-center">
            {renderCard(4)} {/* Position 5: What's above */}
          </div>
          <div className="col-start-3" />

          {/* Row 2: Card 4 (Behind) - Cards 1&2 (Center) - Card 6 (Ahead) */}
          <div className="col-start-1 flex items-center justify-center">
            {renderCard(3)} {/* Position 4: What's behind */}
          </div>
          <div className="col-start-2 flex items-center justify-center">
            {/* Center: Card 1 with Card 2 crossing it */}
            <div className="relative">
              {/* Card 1: Heart of the matter */}
              {renderCard(0)}
              {/* Card 2: What's blocking - positioned crossing Card 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + 1 * 0.08, type: 'spring', stiffness: 200 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div
                  className="rounded-lg p-0.5 rotate-90 origin-center"
                  style={{ boxShadow: `0 0 12px ${theme.glow}` }}
                >
                  <Card
                    card={drawnCards[1]?.card}
                    isRevealed={true}
                    isReversed={drawnCards[1]?.isReversed}
                    className={`${cardWidth} ${cardHeight}`}
                  />
                </div>
              </motion.div>
            </div>
          </div>
          <div className="col-start-3 flex items-center justify-center">
            {renderCard(5)} {/* Position 6: What's ahead */}
          </div>

          {/* Row 3: Empty - Card 3 (Below) - Empty */}
          <div className="col-start-1" />
          <div className="col-start-2 flex justify-center">
            {renderCard(2)} {/* Position 3: What's beneath */}
          </div>
          <div className="col-start-3" />
        </div>

        {/* Position label for Card 2 - positioned below the cross */}
        <div className="flex justify-center mt-2">
          <p
            className={`text-center ${theme.textAccent} font-heading text-[8px] md:text-[10px] uppercase tracking-wider max-w-[90px] leading-tight`}
          >
            {positions[1]}
            {drawnCards[1]?.isReversed && (
              <span className="block text-[7px] md:text-[8px] text-white/50">
                {language === 'en' ? 'Reversed' : 'Renversée'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* The Staff (Cards 7-10) - vertical column from bottom to top */}
      <div className="flex flex-col-reverse gap-2 md:gap-3">
        {/* Render in order 7, 8, 9, 10 but display bottom to top */}
        {renderCard(6)} {/* Position 7: How you see yourself */}
        {renderCard(7)} {/* Position 8: How others see you */}
        {renderCard(8)} {/* Position 9: What you need to know */}
        {renderCard(9)} {/* Position 10: Where this leads */}
      </div>
    </div>
  );
};

export default CelticCrossDisplay;
