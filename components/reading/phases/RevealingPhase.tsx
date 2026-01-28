import React from 'react';
import { motion } from 'framer-motion';
import { SpreadConfig, TarotCard, SpreadType } from '../../../types';
import Card from '../../Card';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import { SPREAD_THEMES } from '../SpreadThemes';
import { THREE_CARD_LAYOUTS, ThreeCardLayoutId } from '../../../constants/threeCardLayouts';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

interface RevealingPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  drawnCards: DrawnCard[];
  onStartReading: () => void;
  threeCardLayout?: ThreeCardLayoutId | null;
}

const RevealingPhase: React.FC<RevealingPhaseProps> = ({
  spread,
  language,
  drawnCards,
  onStartReading,
  threeCardLayout,
}) => {
  const theme = SPREAD_THEMES[spread.id];

  // Dynamically adjust card size based on number of cards to fit above fold
  const cardCount = drawnCards.length;
  const isLargeSpread = cardCount > 5;
  const isMediumSpread = cardCount > 3;

  return (
    <div className="flex flex-col items-center min-h-screen py-4 md:py-6 relative overflow-hidden">
      {/* Themed Background */}
      <ThemedBackground spreadType={spread.id} />

      <div className="relative z-10 flex flex-col items-center flex-1 w-full px-4">
        {/* Theme badge - compact */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10 mb-3"
        >
          <span className={theme.textAccent}>{theme.icon}</span>
          <span className="text-[10px] text-white/50 uppercase tracking-wider">{theme.name}</span>
        </motion.div>

        {/* Title and tagline - tighter spacing */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-heading text-white mb-1"
        >
          {language === 'en' ? 'The cards are laid.' : 'Les cartes sont posées.'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`text-xs md:text-sm ${theme.textAccent} mb-4 md:mb-6 italic`}
        >
          {spread.id === SpreadType.THREE_CARD && threeCardLayout && THREE_CARD_LAYOUTS[threeCardLayout]
            ? (language === 'en' ? THREE_CARD_LAYOUTS[threeCardLayout].taglineEn : THREE_CARD_LAYOUTS[threeCardLayout].taglineFr)
            : (language === 'en' ? theme.taglineEn : theme.taglineFr)}
        </motion.p>

        {/* Cards container - responsive sizing */}
        <div className={`flex gap-2 md:gap-3 flex-wrap justify-center mb-4 md:mb-6 max-w-6xl ${isLargeSpread ? 'max-w-4xl' : ''}`}>
          {drawnCards.map((item, i) => (
            <motion.div
              key={`reveal-${i}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center"
            >
              <div
                className="rounded-lg p-0.5"
                style={{ boxShadow: `0 0 15px ${theme.glow}` }}
              >
                <Card
                  card={item.card}
                  isRevealed={true}
                  isReversed={item.isReversed}
                  className={
                    isLargeSpread
                      ? "w-[70px] h-[112px] md:w-[90px] md:h-[144px]"
                      : isMediumSpread
                        ? "w-[80px] h-[128px] md:w-[110px] md:h-[176px]"
                        : "w-[90px] h-[144px] md:w-[130px] md:h-[208px]"
                  }
                />
              </div>
              <p className={`text-center mt-2 ${theme.textAccent} font-heading text-[10px] md:text-xs uppercase tracking-widest max-w-[100px] md:max-w-[130px] truncate`}>
                {spread.id === SpreadType.THREE_CARD && threeCardLayout && THREE_CARD_LAYOUTS[threeCardLayout]
                  ? THREE_CARD_LAYOUTS[threeCardLayout].positions[language][i]
                  : language === 'en' ? spread.positionMeaningsEn[i] : spread.positionMeaningsFr[i]}
              </p>
              {item.isReversed && (
                <p className="text-center text-[8px] md:text-[10px] text-white/50 uppercase tracking-wider">
                  {language === 'en' ? 'Reversed' : 'Renversée'}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Reveal button - always visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + cardCount * 0.1 + 0.2 }}
          className="pb-4"
        >
          <Button
            onClick={onStartReading}
            size="lg"
            className="animate-pulse hover:animate-none hover:scale-105 transition-transform"
            style={{ boxShadow: `0 0 30px ${theme.glow}` }}
          >
            {language === 'en' ? 'Reveal Interpretation' : "Révéler l'Interprétation"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default RevealingPhase;
