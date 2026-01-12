import React from 'react';
import { motion } from 'framer-motion';
import { SpreadConfig, TarotCard, SpreadType } from '../../../types';
import Card from '../../Card';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import { SPREAD_THEMES } from '../SpreadThemes';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

interface RevealingPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  drawnCards: DrawnCard[];
  onStartReading: () => void;
}

const RevealingPhase: React.FC<RevealingPhaseProps> = ({
  spread,
  language,
  drawnCards,
  onStartReading,
}) => {
  const theme = SPREAD_THEMES[spread.id];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 relative">
      {/* Themed Background */}
      <ThemedBackground spreadType={spread.id} />

      <div className="relative z-10 flex flex-col items-center">
        {/* Theme badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-white/10 mb-6"
        >
          <span className={theme.textAccent}>{theme.icon}</span>
          <span className="text-xs text-white/50 uppercase tracking-wider">{theme.name}</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-heading text-white mb-4"
        >
          {language === 'en' ? 'The cards are laid.' : 'Les cartes sont posées.'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`text-sm ${theme.textAccent} mb-12 italic`}
        >
          {language === 'en' ? theme.taglineEn : theme.taglineFr}
        </motion.p>

        <div className="flex gap-4 flex-wrap justify-center mb-12 max-w-5xl">
          {drawnCards.map((item, i) => (
            <motion.div
              key={`reveal-${i}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.15, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center"
            >
              <div
                className="rounded-lg p-1"
                style={{ boxShadow: `0 0 20px ${theme.glow}` }}
              >
                <Card
                  card={item.card}
                  isRevealed={true}
                  isReversed={item.isReversed}
                  className="w-[100px] h-[160px] md:w-[140px] md:h-[220px]"
                />
              </div>
              <p className={`text-center mt-4 ${theme.textAccent} font-heading text-xs uppercase tracking-widest max-w-[140px] truncate`}>
                {language === 'en' ? spread.positionMeaningsEn[i] : spread.positionMeaningsFr[i]}
              </p>
              {item.isReversed && (
                <p className="text-center text-[10px] text-white/50 uppercase tracking-wider">
                  {language === 'en' ? 'Reversed' : 'Renversée'}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + drawnCards.length * 0.15 + 0.3 }}
        >
          <Button
            onClick={onStartReading}
            size="lg"
            className="animate-bounce"
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
