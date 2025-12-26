import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Hand, Moon } from 'lucide-react';
import { Language } from '../../types';

interface ReadingShufflePhaseProps {
  language: Language;
  onStop?: () => void;
  minDuration?: number; // Minimum shuffle time before allowing stop
}

const ReadingShufflePhase: React.FC<ReadingShufflePhaseProps> = ({
  language,
  onStop,
  minDuration = 1500,
}) => {
  const [canStop, setCanStop] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [shuffleIntensity, setShuffleIntensity] = useState(1);

  // Generate card positions once
  const cardAnimations = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      xRange: (Math.random() - 0.5) * 300,
      yRange: (Math.random() - 0.5) * 250,
      rotateRange: (Math.random() - 0.5) * 180,
      delay: i * 0.08,
      zIndex: 12 - i,
    }));
  }, []);

  // Enable stop button after minimum duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanStop(true);
    }, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  // Gradually increase shuffle intensity
  useEffect(() => {
    const interval = setInterval(() => {
      setShuffleIntensity((prev) => Math.min(prev + 0.1, 1.5));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleStop = useCallback(() => {
    if (canStop && onStop) {
      // Reduce intensity before stopping
      setShuffleIntensity(0.3);
      setTimeout(() => onStop(), 300);
    }
  }, [canStop, onStop]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] relative overflow-hidden px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/10 blur-2xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Floating sparkles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          initial={{
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            opacity: 0,
          }}
          animate={{
            y: [(Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300 - 100],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
        </motion.div>
      ))}

      {/* Card stack with enhanced animations */}
      <div className="relative w-48 h-72 perspective-1000">
        {cardAnimations.map((card) => (
          <motion.div
            key={`shuffle-card-${card.id}`}
            className="absolute inset-0 rounded-xl border-2 border-amber-500/60 shadow-card preserve-3d"
            style={{
              backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
              zIndex: card.zIndex,
            }}
            initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
            animate={{
              x: [0, card.xRange * shuffleIntensity, 0],
              y: [0, card.yRange * shuffleIntensity, 0],
              rotate: [0, card.rotateRange * shuffleIntensity, 0],
              scale: [1, 1.05 + Math.random() * 0.1, 1],
            }}
            transition={{
              duration: 1.5 / shuffleIntensity,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: card.delay,
            }}
          >
            {/* Card back design */}
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xl">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10 stars-bg" />

              {/* Center emblem */}
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Moon className="w-12 h-12 text-amber-400/60" />
              </div>

              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-500/40 rounded-tl" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-500/40 rounded-tr" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-500/40 rounded-bl" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-500/40 rounded-br" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Instructions and stop button */}
      <div className="mt-12 text-center relative z-10">
        <motion.h3
          className="text-xl font-heading text-amber-200 mb-6"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {language === 'en' ? 'Shuffling the deck...' : 'Mélange des cartes...'}
        </motion.h3>

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
              className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl
                text-white font-bold shadow-glow-purple overflow-hidden group
                border border-purple-400/30 hover:border-purple-400/60 transition-colors"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              <span className="relative flex items-center gap-3">
                <Hand className={`w-5 h-5 transition-transform ${isHovering ? 'rotate-12' : ''}`} />
                <span>
                  {language === 'en' ? 'Stop & Draw Cards' : 'Arrêter & Tirer les Cartes'}
                </span>
              </span>
            </motion.button>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="text-slate-400 text-sm"
            >
              {language === 'en' ? 'Focus your intention...' : 'Concentrez votre intention...'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReadingShufflePhase;
