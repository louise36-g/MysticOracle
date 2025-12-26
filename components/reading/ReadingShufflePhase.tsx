import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Moon } from 'lucide-react';
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
  const [isHovering, setIsHovering] = useState(false);

  // Enable stop button after minimum duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanStop(true);
    }, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  const handleStop = useCallback(() => {
    if (canStop && onStop) {
      onStop();
    }
  }, [canStop, onStop]);

  // Card component for the deck
  const CardBack = ({ className = '' }: { className?: string }) => (
    <div className={`w-20 h-28 md:w-24 md:h-32 rounded-lg border-2 border-amber-500/50 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 shadow-lg ${className}`}>
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-md">
        <div className="absolute inset-2 border border-amber-500/20 rounded" />
        <Moon className="w-8 h-8 text-amber-400/60" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-purple-600/15 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Card shuffle animation - elegant riffle shuffle effect */}
      <div className="relative h-40 w-64 mb-8">
        {/* Base deck (static) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <CardBack />
        </div>

        {/* Shuffling cards - left pile */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          animate={{
            x: ['-50%', '-120%', '-50%'],
            y: ['-50%', '-55%', '-50%'],
            rotateZ: [0, -8, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <CardBack />
        </motion.div>

        {/* Shuffling cards - right pile */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          animate={{
            x: ['-50%', '20%', '-50%'],
            y: ['-50%', '-55%', '-50%'],
            rotateZ: [0, 8, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.4,
          }}
        >
          <CardBack />
        </motion.div>

        {/* Flying card effect */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{
            y: [0, -20, 0],
            rotateY: [0, 180, 360],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.2,
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <CardBack className="shadow-xl shadow-purple-500/20" />
        </motion.div>
      </div>

      {/* Instructions and stop button */}
      <div className="text-center relative z-10">
        <motion.h3
          className="text-xl font-heading text-amber-200 mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {language === 'en' ? 'Shuffling the deck...' : 'Mélange des cartes...'}
        </motion.h3>

        <p className="text-sm text-slate-400 mb-6">
          {language === 'en'
            ? 'Focus on your question while the cards align'
            : 'Concentrez-vous sur votre question pendant que les cartes s\'alignent'}
        </p>

        <AnimatePresence>
          {canStop ? (
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="relative px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl
                text-white font-bold shadow-lg shadow-purple-500/25 overflow-hidden
                border border-purple-400/30 hover:border-purple-400/60 transition-colors"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <span className="relative flex items-center gap-2">
                <Hand className={`w-5 h-5 transition-transform ${isHovering ? 'rotate-12' : ''}`} />
                <span>{language === 'en' ? 'Draw Cards' : 'Tirer les Cartes'}</span>
              </span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2"
            >
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReadingShufflePhase;
