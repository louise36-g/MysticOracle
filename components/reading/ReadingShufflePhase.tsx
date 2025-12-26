import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Moon, Sparkles } from 'lucide-react';
import { Language } from '../../types';

interface ReadingShufflePhaseProps {
  language: Language;
  onStop?: () => void;
  minDuration?: number;
}

const ReadingShufflePhase: React.FC<ReadingShufflePhaseProps> = ({
  language,
  onStop,
  minDuration = 2000,
}) => {
  const [canStop, setCanStop] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanStop(true), minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  const handleStop = useCallback(() => {
    if (canStop && onStop) onStop();
  }, [canStop, onStop]);

  // Card back component
  const CardBack = ({ className = '' }: { className?: string }) => (
    <div className={`w-16 h-24 md:w-20 md:h-28 rounded-lg border-2 border-amber-500/40 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 shadow-xl ${className}`}>
      <div className="w-full h-full flex items-center justify-center relative rounded-md overflow-hidden">
        <div className="absolute inset-1.5 border border-amber-500/20 rounded" />
        <Moon className="w-6 h-6 md:w-8 md:h-8 text-amber-400/50" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] relative px-4">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Floating sparkles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-amber-400/60"
          style={{
            left: `${25 + i * 15}%`,
            top: `${30 + (i % 2) * 20}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      ))}

      {/* Card deck animation - Smooth fanning shuffle */}
      <div className="relative h-36 w-56 mb-10">
        {/* Base stack of cards (static foundation) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60">
          <CardBack />
        </div>

        {/* Card 1 - fans left */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          animate={{
            x: ['-50%', '-110%', '-50%'],
            y: '-50%',
            rotate: [0, -25, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <CardBack />
        </motion.div>

        {/* Card 2 - fans right */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          animate={{
            x: ['-50%', '10%', '-50%'],
            y: '-50%',
            rotate: [0, 25, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.6,
          }}
        >
          <CardBack />
        </motion.div>

        {/* Card 3 - subtle lift in center */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2"
          animate={{
            y: ['-50%', '-65%', '-50%'],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
        >
          <CardBack className="shadow-2xl shadow-purple-500/30" />
        </motion.div>
      </div>

      {/* Text and button */}
      <div className="text-center relative z-10">
        <motion.h3
          className="text-xl md:text-2xl font-heading text-amber-200 mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {language === 'en' ? 'Shuffling the deck...' : 'Mélange des cartes...'}
        </motion.h3>

        <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">
          {language === 'en'
            ? 'Focus on your question as the cards align with your energy'
            : 'Concentrez-vous sur votre question pendant que les cartes s\'alignent'}
        </p>

        <AnimatePresence mode="wait">
          {canStop ? (
            <motion.button
              key="stop-btn"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl
                text-white font-bold shadow-lg shadow-purple-500/30
                border border-purple-400/40 hover:border-purple-400/70 transition-all"
            >
              <span className="flex items-center gap-2">
                <Hand className="w-5 h-5" />
                {language === 'en' ? 'Draw Cards' : 'Tirer les Cartes'}
              </span>
            </motion.button>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReadingShufflePhase;
