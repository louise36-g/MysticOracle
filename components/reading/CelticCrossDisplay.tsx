// components/reading/CelticCrossDisplay.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { TarotCard } from '../../types';
import Card from '../Card';

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

// Shortened position labels for cleaner display
const SHORT_POSITIONS = {
  en: [
    'Present',
    'Crossing',
    'Unconscious',
    'Past',
    'Conscious',
    'Near Future',
    'Self',
    'Others',
    'Guidance',
    'Outcome',
  ],
  fr: [
    'Présent',
    'Obstacle',
    'Inconscient',
    'Passé',
    'Conscient',
    'Futur proche',
    'Soi',
    'Autres',
    'Guidance',
    'Issue',
  ],
};

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
  const positions = SHORT_POSITIONS[language];

  // Card dimensions - 25% smaller than before (was 60/80 x 96/128)
  const cardWidth = 'w-[45px] md:w-[60px]';
  const cardHeight = 'h-[72px] md:h-[96px]';

  // Render a single card with animation (for non-center cards)
  const renderCard = (index: number, extraClass = '') => {
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
          className="rounded-lg p-0.5"
          style={{ boxShadow: `0 0 10px ${theme.glow}` }}
        >
          <Card
            card={item.card}
            isRevealed={true}
            isReversed={item.isReversed}
            className={`${cardWidth} ${cardHeight}`}
            hideOverlay={true}
          />
        </div>
        <p
          className={`text-center mt-1 ${theme.textAccent} font-heading text-[7px] md:text-[9px] uppercase tracking-wider max-w-[60px] md:max-w-[70px] leading-tight`}
        >
          {positions[index]}
        </p>
        {item.isReversed && (
          <p className="text-center text-[6px] md:text-[7px] text-white/50 uppercase">
            {language === 'en' ? 'Rev.' : 'Inv.'}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-center">
      {/* The Cross (Cards 1-6) */}
      <div className="relative">
        {/* Cross grid using CSS Grid for precise positioning */}
        <div
          className="grid gap-y-1 gap-x-6 md:gap-x-10"
          style={{
            gridTemplateColumns: 'auto auto auto',
            gridTemplateRows: 'repeat(3, auto)',
          }}
        >
          {/* Row 1: Empty - Card 5 (Above) - Empty */}
          <div className="col-start-1" />
          <div className="col-start-2 flex justify-center">
            {renderCard(4)} {/* Position 5: Conscious */}
          </div>
          <div className="col-start-3" />

          {/* Row 2: Card 4 (Behind) - Cards 1&2 (Center) - Card 6 (Ahead) */}
          <div className="col-start-1 flex items-center justify-center">
            {renderCard(3)} {/* Position 4: Past */}
          </div>
          <div className="col-start-2 flex items-center justify-center">
            {/* Center: Card 1 with Card 2 crossing it at the bottom edge */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Card 1: Present */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                >
                  <div
                    className="rounded-lg p-0.5"
                    style={{ boxShadow: `0 0 10px ${theme.glow}` }}
                  >
                    <Card
                      card={drawnCards[0]?.card}
                      isRevealed={true}
                      isReversed={drawnCards[0]?.isReversed}
                      className={`${cardWidth} ${cardHeight}`}
                      hideOverlay={true}
                    />
                  </div>
                </motion.div>
                {/* Card 2: Crossing - positioned at bottom edge of Card 1, lower to leave Card 1 clickable */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + 0.08, type: 'spring', stiffness: 200 }}
                  className="absolute left-1/2 -translate-x-1/2 z-10"
                  style={{ bottom: '-20px' }}
                >
                  <div
                    className="rounded-lg p-0.5 rotate-90 origin-center"
                    style={{ boxShadow: `0 0 10px ${theme.glow}` }}
                  >
                    <Card
                      card={drawnCards[1]?.card}
                      isRevealed={true}
                      isReversed={drawnCards[1]?.isReversed}
                      className={`${cardWidth} ${cardHeight}`}
                      hideOverlay={true}
                    />
                  </div>
                </motion.div>
              </div>
              {/* Labels for Card 1 and Card 2 together */}
              <p
                className={`text-center mt-3 ${theme.textAccent} font-heading text-[7px] md:text-[9px] uppercase tracking-wider leading-tight`}
              >
                {positions[0]} / {positions[1]}
                {(drawnCards[0]?.isReversed || drawnCards[1]?.isReversed) && (
                  <span className="block text-[6px] md:text-[7px] text-white/50 mt-0.5">
                    {drawnCards[0]?.isReversed && drawnCards[1]?.isReversed
                      ? (language === 'en' ? 'Both Rev.' : 'Tous Inv.')
                      : drawnCards[0]?.isReversed
                        ? (language === 'en' ? '1st Rev.' : '1ère Inv.')
                        : (language === 'en' ? '2nd Rev.' : '2ème Inv.')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="col-start-3 flex items-center justify-center">
            {renderCard(5)} {/* Position 6: Near Future */}
          </div>

          {/* Row 3: Empty - Card 3 (Below) - Empty */}
          <div className="col-start-1" />
          <div className="col-start-2 flex justify-center">
            {renderCard(2)} {/* Position 3: Unconscious */}
          </div>
          <div className="col-start-3" />
        </div>
      </div>

      {/* The Staff (Cards 7-10) - vertical column from bottom to top */}
      <div className="flex flex-col-reverse gap-1 md:gap-2">
        {/* Render in order 7, 8, 9, 10 but display bottom to top */}
        {renderCard(6)} {/* Position 7: Self */}
        {renderCard(7)} {/* Position 8: Others */}
        {renderCard(8)} {/* Position 9: Guidance */}
        {renderCard(9)} {/* Position 10: Outcome */}
      </div>
    </div>
  );
};

export default CelticCrossDisplay;
