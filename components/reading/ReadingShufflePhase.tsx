import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Moon, Sparkles, Eye, Clock, Heart, TrendingUp, Compass } from 'lucide-react';
import { Language, SpreadType } from '../../types';

// Theme configuration for shuffle phase (matching ActiveReading & SpreadSelector)
const SHUFFLE_THEMES: Record<SpreadType, {
  name: string;
  icon: React.ReactNode;
  primary: string;
  secondary: string;
  glow: string;
  bgGradient: string;
  textAccent: string;
}> = {
  [SpreadType.SINGLE]: {
    name: "Oracle's Eye",
    icon: <Eye className="w-5 h-5" />,
    primary: 'rgb(34, 211, 238)',      // cyan-400
    secondary: 'rgb(99, 102, 241)',     // indigo-500
    glow: 'rgba(34, 211, 238, 0.3)',
    bgGradient: 'from-indigo-950 via-slate-900 to-indigo-950',
    textAccent: 'text-cyan-300',
  },
  [SpreadType.THREE_CARD]: {
    name: "River of Time",
    icon: <Clock className="w-5 h-5" />,
    primary: 'rgb(232, 121, 249)',      // fuchsia-400
    secondary: 'rgb(192, 38, 211)',     // fuchsia-600
    glow: 'rgba(232, 121, 249, 0.3)',
    bgGradient: 'from-fuchsia-950 via-purple-900 to-fuchsia-950',
    textAccent: 'text-fuchsia-300',
  },
  [SpreadType.LOVE]: {
    name: "Heart's Sanctum",
    icon: <Heart className="w-5 h-5" />,
    primary: 'rgb(244, 63, 94)',        // rose-500
    secondary: 'rgb(251, 113, 133)',    // rose-400
    glow: 'rgba(244, 63, 94, 0.25)',
    bgGradient: 'from-rose-950 via-pink-900 to-rose-950',
    textAccent: 'text-rose-300',
  },
  [SpreadType.CAREER]: {
    name: "The Ascent",
    icon: <TrendingUp className="w-5 h-5" />,
    primary: 'rgb(253, 224, 71)',       // yellow-300
    secondary: 'rgb(245, 158, 11)',     // amber-500
    glow: 'rgba(253, 224, 71, 0.35)',
    bgGradient: 'from-yellow-950 via-amber-900 to-yellow-950',
    textAccent: 'text-yellow-300',
  },
  [SpreadType.HORSESHOE]: {
    name: "Fortune's Arc",
    icon: <Sparkles className="w-5 h-5" />,
    primary: 'rgb(96, 165, 250)',       // blue-400
    secondary: 'rgb(59, 130, 246)',     // blue-500
    glow: 'rgba(96, 165, 250, 0.3)',
    bgGradient: 'from-blue-950 via-indigo-900 to-blue-950',
    textAccent: 'text-blue-300',
  },
  [SpreadType.CELTIC_CROSS]: {
    name: "Ancient Wisdom",
    icon: <Compass className="w-5 h-5" />,
    primary: 'rgb(52, 211, 153)',       // emerald-400
    secondary: 'rgb(20, 184, 166)',     // teal-500
    glow: 'rgba(52, 211, 153, 0.25)',
    bgGradient: 'from-emerald-950 via-teal-900 to-emerald-950',
    textAccent: 'text-emerald-300',
  },
};

interface ReadingShufflePhaseProps {
  language: Language;
  onStop?: () => void;
  minDuration?: number;
  spreadType?: SpreadType;
}

const NUM_CARDS = 7;

const ReadingShufflePhase: React.FC<ReadingShufflePhaseProps> = ({
  language,
  onStop,
  minDuration = 2000,
  spreadType = SpreadType.THREE_CARD,
}) => {
  const theme = SHUFFLE_THEMES[spreadType];
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

  // Card back design with simple pattern - themed
  const CardBack = ({ style, className = '' }: { style?: React.CSSProperties; className?: string }) => (
    <div
      style={{
        ...style,
        borderColor: `${theme.primary}50`,
      }}
      className={`w-14 h-20 md:w-16 md:h-24 rounded-lg bg-gradient-to-br ${theme.bgGradient} shadow-xl border ${className}`}
    >
      <div className="w-full h-full flex items-center justify-center relative rounded-md overflow-hidden">
        {/* Inner border */}
        <div className="absolute inset-1 border rounded-sm" style={{ borderColor: `${theme.primary}30` }} />
        {/* Decorative pattern */}
        <div className="absolute inset-2 opacity-30">
          <div className="w-full h-full border border-white/20 rounded-sm" />
          <div className="absolute inset-1 border border-white/10 rounded-sm" />
        </div>
        {/* Center symbol */}
        <Moon className={`w-5 h-5 md:w-6 md:h-6 ${theme.textAccent} opacity-60`} />
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
    <div className="min-h-screen relative">
      {/* Themed Background */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-br ${theme.bgGradient}`} />
      <div
        className="fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="flex flex-col items-center justify-center min-h-screen relative px-4 z-10">
        {/* Theme badge */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-white/10">
            <span className={theme.textAccent}>{theme.icon}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider">{theme.name}</span>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
            style={{
              background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
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
            <Sparkles className={`w-3 h-3 ${theme.textAccent} opacity-50`} />
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
            className={`text-xl md:text-2xl font-heading ${theme.textAccent} mb-2`}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {language === 'en' ? 'Shuffling the deck...' : 'Mélange des cartes...'}
          </motion.h3>

          <p className="text-sm text-white/50 mb-8 max-w-xs mx-auto">
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
                className="px-8 py-3 rounded-xl text-white font-bold transition-all"
                style={{
                  background: `linear-gradient(to right, ${theme.secondary}, ${theme.primary})`,
                  boxShadow: `0 10px 30px ${theme.glow}`,
                  border: `1px solid ${theme.primary}60`,
                }}
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
    </div>
  );
};

export default ReadingShufflePhase;
