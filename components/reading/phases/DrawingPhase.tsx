import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { SpreadConfig, TarotCard, SpreadType } from '../../../types';
import ThemedBackground from '../ThemedBackground';
import { SPREAD_THEMES } from '../SpreadThemes';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

interface DrawingPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  drawnCards: DrawnCard[];
  onCardDraw: () => void;
}

const DrawingPhase: React.FC<DrawingPhaseProps> = ({
  spread,
  language,
  drawnCards,
  onCardDraw,
}) => {
  const theme = SPREAD_THEMES[spread.id];
  const progressPercent = (drawnCards.length / spread.positions) * 100;
  const cardsRemaining = spread.positions - drawnCards.length;

  return (
    <div className="flex flex-col items-center px-4 py-6 md:py-10 relative min-h-screen">
      {/* Themed Background */}
      <ThemedBackground spreadType={spread.id} />

      {/* Header with progress */}
      <div className="w-full max-w-2xl mb-6 relative z-10">
        {/* Theme badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10">
            <span className={theme.textAccent}>{theme.icon}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider">{theme.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg md:text-xl font-heading text-white">
              {language === 'en' ? 'Draw Your Cards' : 'Tirez Vos Cartes'}
            </h3>
            <p className={`text-xs md:text-sm ${theme.textAccent} opacity-70`}>
              {language === 'en' ? spread.nameEn : spread.nameFr}
            </p>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-heading ${theme.textAccent}`}>{cardsRemaining}</span>
            <p className="text-slate-500 text-xs">
              {language === 'en' ? 'remaining' : 'restantes'}
            </p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full"
            style={{ background: `linear-gradient(to right, ${theme.secondary}, ${theme.primary})` }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main drawing area */}
      <div className="w-full max-w-3xl relative z-10">
        {/* Deck - clickable area */}
        <div className="flex justify-center mb-6">
          <motion.div
            className="relative cursor-pointer group"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCardDraw}
          >
            {/* Deck stack effect */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`deck-stack-${i}`}
                className={`absolute w-[90px] h-[140px] md:w-[110px] md:h-[170px] rounded-lg bg-slate-900/90 ${theme.cardBorder}`}
                style={{ top: -i * 2, left: -i * 2, zIndex: 5 - i }}
              />
            ))}
            {/* Top card */}
            <div
              className={`relative z-10 w-[90px] h-[140px] md:w-[110px] md:h-[170px] rounded-lg bg-gradient-to-br ${theme.bgGradient} border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300`}
              style={{
                borderColor: theme.primary,
                boxShadow: `0 0 25px ${theme.glow}`,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={theme.textAccent}
              >
                <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
              </motion.div>
              <span className={`${theme.textAccent} font-heading text-sm md:text-base font-bold tracking-wider`}>
                {language === 'en' ? 'TAP' : 'TOUCHER'}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Card slots grid */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-4 md:p-6">
          <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
            {Array.from({ length: spread.positions }).map((_, i) => {
              const positionLabel = language === 'en'
                ? spread.positionMeaningsEn[i]
                : spread.positionMeaningsFr[i];

              return (
                <div key={`slot-${i}`} className="flex flex-col items-center gap-1.5">
                  <div className="relative w-[70px] h-[108px] md:w-[85px] md:h-[130px]">
                    {/* Empty slot */}
                    <div className={`absolute inset-0 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 ${
                      i < drawnCards.length
                        ? 'opacity-0 border-transparent'
                        : i === drawnCards.length
                          ? `${theme.cardBorder} bg-white/5`
                          : 'border-white/10'
                    }`}
                    style={i === drawnCards.length ? { borderColor: `${theme.primary}50` } : {}}
                    >
                      <span className={`font-heading text-xl ${i === drawnCards.length ? theme.textAccent : 'text-white/15'}`} style={{ opacity: i === drawnCards.length ? 0.6 : 1 }}>
                        {i + 1}
                      </span>
                    </div>

                    {/* Drawn card */}
                    <AnimatePresence>
                      {i < drawnCards.length && (
                        <motion.div
                          initial={{ y: -100, opacity: 0, scale: 0.7 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 150, damping: 18 }}
                          className="absolute inset-0"
                        >
                          <div
                            className={`w-full h-full rounded-lg bg-gradient-to-br ${theme.bgGradient} border-2 shadow-lg flex items-center justify-center`}
                            style={{ borderColor: `${theme.primary}99` }}
                          >
                            <span className={`${theme.textAccent} font-heading text-lg`}>✓</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Position label */}
                  <span className={`text-[10px] md:text-xs text-center max-w-[80px] truncate ${
                    i < drawnCards.length ? theme.textAccent : 'text-slate-500'
                  }`} style={{ opacity: i < drawnCards.length ? 0.7 : 1 }}>
                    {positionLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingPhase;
