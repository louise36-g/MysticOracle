import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Sparkles } from 'lucide-react';
import { Language } from '../../types';

interface ReadingShufflePhaseProps {
  language: Language;
  onStop?: () => void;
  minDuration?: number;
}

const NUM_CARDS = 9;
const SHUFFLE_DURATION = 5000; // 5 seconds until "ready"

const ReadingShufflePhase: React.FC<ReadingShufflePhaseProps> = ({
  language,
  onStop,
  minDuration = 2000,
}) => {
  const [canStop, setCanStop] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(Math.ceil(SHUFFLE_DURATION / 1000));

  // Enable stop after minimum duration
  useEffect(() => {
    const timer = setTimeout(() => setCanStop(true), minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  // Countdown timer and ready state
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setIsReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const handleStop = useCallback(() => {
    if (canStop && onStop) onStop();
  }, [canStop, onStop]);

  // Ornate card back design
  const CardBack = ({ style, className = '' }: { style?: React.CSSProperties; className?: string }) => (
    <div
      style={style}
      className={`w-12 h-[68px] md:w-14 md:h-20 rounded-lg overflow-hidden ${className}`}
    >
      {/* Card base with gradient */}
      <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950 relative border border-amber-500/40">
        {/* Outer decorative border */}
        <div className="absolute inset-[3px] border border-amber-600/30 rounded-sm" />

        {/* Inner decorative border */}
        <div className="absolute inset-[6px] border border-amber-500/20 rounded-sm" />

        {/* Center diamond pattern */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 md:w-7 md:h-7 rotate-45 border-2 border-amber-500/40 bg-purple-900/50">
            <div className="w-full h-full border border-amber-400/30 flex items-center justify-center">
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-amber-500/50 rotate-45" />
            </div>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-amber-500/40 rounded-full" />
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500/40 rounded-full" />
        <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 bg-amber-500/40 rounded-full" />
        <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500/40 rounded-full" />

        {/* Subtle shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-50" />
      </div>
    </div>
  );

  // Riffle shuffle animation - split deck and interleave
  const getRiffleAnimation = (index: number) => {
    const isLeftHalf = index < NUM_CARDS / 2;
    const halfIndex = isLeftHalf ? index : index - Math.floor(NUM_CARDS / 2);
    const maxHalfIndex = Math.floor(NUM_CARDS / 2);

    // Offset from center for stacking
    const stackOffset = (index - Math.floor(NUM_CARDS / 2)) * 1.5;

    return {
      x: [stackOffset, isLeftHalf ? -50 : 50, stackOffset],
      y: [0, -10 + halfIndex * 6, 0],
      rotate: [0, isLeftHalf ? -12 : 12, 0],
      scale: [1, 1.02, 1],
    };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] relative px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.15, 0.5, 0.15],
            scale: [0.7, 1.1, 0.7],
          }}
          transition={{
            duration: 2.5 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-4 h-4 text-amber-400/60" />
        </motion.div>
      ))}

      {/* Card deck - Riffle shuffle */}
      <div className="relative h-32 w-48 mb-10">
        {/* Shadow underneath deck */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-8 w-24 h-5 bg-black/40 rounded-full blur-lg"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Animated cards */}
        {[...Array(NUM_CARDS)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2"
            style={{
              zIndex: index,
              marginLeft: '-24px',
              marginTop: '-34px',
            }}
            animate={getRiffleAnimation(index)}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: [0.4, 0, 0.6, 1],
              delay: index * 0.03,
            }}
          >
            <CardBack
              style={{
                boxShadow: `0 ${2 + index}px ${6 + index * 2}px rgba(0, 0, 0, 0.35)`,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Text and button */}
      <div className="text-center relative z-10">
        <AnimatePresence mode="wait">
          {!isReady ? (
            <motion.div
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <motion.h3
                className="text-xl md:text-2xl font-heading text-amber-200 mb-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {language === 'en' ? 'Shuffling the deck...' : 'Mélange des cartes...'}
              </motion.h3>

              <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                {language === 'en'
                  ? 'Focus on your question as the cards align with your energy'
                  : "Concentrez-vous sur votre question pendant que les cartes s'alignent"}
              </p>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-amber-400"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: SHUFFLE_DURATION / 1000, ease: 'linear' }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-6">{timeRemaining}s</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="mb-4"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-full">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 font-medium">
                    {language === 'en' ? 'The deck is ready' : 'Le jeu est prêt'}
                  </span>
                </div>
              </motion.div>

              <p className="text-sm text-slate-300 mb-6 max-w-xs mx-auto">
                {language === 'en'
                  ? 'The cards have aligned with your energy. Draw when you feel ready.'
                  : "Les cartes se sont alignées avec votre énergie. Tirez quand vous êtes prêt."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Draw button - always visible once canStop is true */}
        <AnimatePresence>
          {canStop && (
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all ${
                isReady
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30 border border-amber-400/50 hover:border-amber-300'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-500/30 border border-purple-400/40 hover:border-purple-400/70'
              }`}
            >
              <span className="flex items-center gap-2">
                <Hand className="w-5 h-5" />
                {language === 'en' ? 'Draw Cards' : 'Tirer les Cartes'}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Loading dots while waiting for canStop */}
        {!canStop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReadingShufflePhase;
