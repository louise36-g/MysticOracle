import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Moon, Sparkles } from 'lucide-react';
import { Language } from '../../types';

interface ReadingShufflePhaseProps {
  language: Language;
  onStop?: () => void;
  minDuration?: number;
}

const NUM_CARDS = 7;

const ReadingShufflePhase: React.FC<ReadingShufflePhaseProps> = ({
  language,
  onStop,
  minDuration = 2000,
}) => {
  const [canStop, setCanStop] = useState(false);
  const [shufflePhase, setShufflePhase] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setCanStop(true), minDuration);
    return () => clearTimeout(timer);
  }, [minDuration]);

  // Cycle through shuffle phases for variety
  useEffect(() => {
    const interval = setInterval(() => {
      setShufflePhase((prev) => (prev + 1) % 3);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const handleStop = useCallback(() => {
    if (canStop && onStop) onStop();
  }, [canStop, onStop]);

  // Card back design with simple pattern
  const CardBack = ({ style, className = '' }: { style?: React.CSSProperties; className?: string }) => (
    <div
      style={style}
      className={`w-14 h-20 md:w-16 md:h-24 rounded-lg bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 shadow-xl border border-amber-500/30 ${className}`}
    >
      <div className="w-full h-full flex items-center justify-center relative rounded-md overflow-hidden">
        {/* Inner border */}
        <div className="absolute inset-1 border border-amber-500/20 rounded-sm" />
        {/* Decorative pattern */}
        <div className="absolute inset-2 opacity-30">
          <div className="w-full h-full border border-purple-400/30 rounded-sm" />
          <div className="absolute inset-1 border border-purple-400/20 rounded-sm" />
        </div>
        {/* Center symbol */}
        <Moon className="w-5 h-5 md:w-6 md:h-6 text-amber-400/60" />
      </div>
    </div>
  );

  // Generate card positions for arc spread
  const getArcPosition = (index: number, total: number, radius: number, spreadAngle: number) => {
    const startAngle = -spreadAngle / 2;
    const angleStep = spreadAngle / (total - 1);
    const angle = startAngle + index * angleStep;
    const rad = (angle * Math.PI) / 180;

    return {
      x: Math.sin(rad) * radius,
      y: -Math.cos(rad) * radius + radius * 0.3,
      rotation: angle * 0.6,
    };
  };

  // Different shuffle animation variants
  const getCardAnimation = (index: number) => {
    const centerIndex = Math.floor(NUM_CARDS / 2);
    const offset = index - centerIndex;

    switch (shufflePhase) {
      case 0: // Arc spread
        const arcPos = getArcPosition(index, NUM_CARDS, 120, 70);
        return {
          x: [0, arcPos.x, 0],
          y: [0, arcPos.y, 0],
          rotate: [0, arcPos.rotation, 0],
          scale: [1, 1.05, 1],
        };

      case 1: // Cascade/waterfall
        return {
          x: [0, offset * 25, 0],
          y: [0, Math.abs(offset) * 15, 0],
          rotate: [0, offset * 8, 0],
          scale: [1, 1, 1],
        };

      case 2: // Riffle interleave
        const isLeft = index % 2 === 0;
        return {
          x: [0, isLeft ? -40 : 40, 0],
          y: [0, -20 + index * 5, 0],
          rotate: [0, isLeft ? -10 : 10, 0],
          scale: [1, 1.02, 1],
        };

      default:
        return { x: 0, y: 0, rotate: 0, scale: 1 };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] relative px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${20 + i * 12}%`,
            top: `${25 + (i % 3) * 15}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-3 h-3 text-amber-400/50" />
        </motion.div>
      ))}

      {/* Card deck animation */}
      <div className="relative h-40 w-64 mb-8">
        {/* Shadow underneath deck */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-4 w-20 h-4 bg-black/30 rounded-full blur-md" />

        {/* Animated cards */}
        {[...Array(NUM_CARDS)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2"
            style={{
              zIndex: index,
              marginLeft: '-28px',
              marginTop: '-40px',
            }}
            initial={{ x: 0, y: 0, rotate: 0 }}
            animate={getCardAnimation(index)}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: [0.45, 0.05, 0.55, 0.95], // Custom easing for smooth motion
              delay: index * 0.05,
            }}
          >
            <CardBack
              className="transition-shadow duration-300"
              style={{
                boxShadow: `0 ${4 + index}px ${8 + index * 2}px rgba(0, 0, 0, 0.3)`,
              }}
            />
          </motion.div>
        ))}
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
            : "Concentrez-vous sur votre question pendant que les cartes s'alignent"}
        </p>

        <AnimatePresence mode="wait">
          {canStop && (
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReadingShufflePhase;
