import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Moon, Sparkles } from 'lucide-react';
import { Language, SpreadType, ReadingCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import { getCategory } from '../../constants/categoryConfig';

// Unified color theme - matching HomePage, CategorySelector, HoroscopeReading
const unifiedTheme = {
  accent: '#a78bfa',      // Purple-400
  glow: '#8b5cf6',        // Purple-500
  ambient: '#c4b5fd',     // Purple-300
  border: '#f59e0b',      // Amber-500
  borderHover: '#fbbf24', // Amber-400
};

interface ReadingShufflePhaseProps {
  language: Language;
  onStop?: () => void;
  minDuration?: number;
  spreadType?: SpreadType;
  category?: ReadingCategory;
}

const NUM_CARDS = 7;

// Floating star component for background ambiance
const FloatingStar: React.FC<{ delay: number; duration: number; left: string; top: string; size: number }> = ({
  delay, duration, left, top, size
}) => (
  <motion.div
    className="absolute rounded-full bg-white pointer-events-none"
    style={{ left, top, width: size, height: size }}
    animate={{
      opacity: [0.2, 0.8, 0.2],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Particle burst effect when button appears
const ParticleBurst: React.FC = () => {
  const particles = [...Array(12)].map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 60 + Math.random() * 30;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      scale: 0.5 + Math.random() * 0.5,
      delay: i * 0.02,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: unifiedTheme.border }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: 0,
            scale: particle.scale,
          }}
          transition={{
            duration: 0.8,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

const ReadingShufflePhase: React.FC<ReadingShufflePhaseProps> = ({
  language,
  onStop,
  minDuration = 5000,
  spreadType = SpreadType.THREE_CARD,
  category,
}) => {
  const { t } = useApp();
  const [canStop, setCanStop] = useState(false);
  const [shufflePhase, setShufflePhase] = useState(0);
  const [showParticleBurst, setShowParticleBurst] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanStop(true);
      setShowParticleBurst(true);
      // Hide particle burst after animation
      setTimeout(() => setShowParticleBurst(false), 1000);
    }, minDuration);
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

  // Card back design with unified theme
  const CardBack = ({ style, className = '' }: { style?: React.CSSProperties; className?: string }) => (
    <div
      style={style}
      className={`w-14 h-20 md:w-16 md:h-24 rounded-lg bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 shadow-xl border-2 border-amber-500/50 ${className}`}
    >
      <div className="w-full h-full flex items-center justify-center relative rounded-md overflow-hidden">
        {/* Inner border */}
        <div className="absolute inset-1 border border-amber-500/30 rounded-sm" />
        {/* Decorative pattern */}
        <div className="absolute inset-2">
          <div className="w-full h-full border border-purple-400/40 rounded-sm" />
          <div className="absolute inset-1 border border-purple-400/25 rounded-sm" />
        </div>
        {/* Center symbol */}
        <Moon className="w-5 h-5 md:w-6 md:h-6 text-amber-400/80" />
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Unified Background - matching other pages */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950 via-purple-950/50 to-slate-950" />

      {/* Gradient orbs - matching HomePage */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-violet-500/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-amber-500/4 rounded-full blur-[80px]" />
      </div>

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Floating stars - matching HomePage */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FloatingStar size={3} left="10%" top="15%" delay={0} duration={4} />
        <FloatingStar size={2} left="85%" top="20%" delay={1.5} duration={5} />
        <FloatingStar size={2.5} left="20%" top="70%" delay={0.8} duration={4.5} />
        <FloatingStar size={2} left="75%" top="65%" delay={2} duration={3.5} />
        <FloatingStar size={3} left="50%" top="85%" delay={0.5} duration={5.5} />
        <FloatingStar size={2} left="30%" top="40%" delay={1.2} duration={4} />
        <FloatingStar size={2.5} left="90%" top="50%" delay={2.5} duration={4.8} />
        <FloatingStar size={2} left="5%" top="55%" delay={1.8} duration={3.8} />
      </div>

      <div className="flex flex-col items-center min-h-screen relative px-4 z-10 pt-8">
        {/* Header badge */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-amber-500/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-purple-200/80 uppercase tracking-wider font-medium">
              {language === 'en' ? 'Preparing Your Reading' : 'Préparation de Votre Tirage'}
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
        </motion.div>

        {/* Ambient glow behind cards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <motion.div
            className="absolute w-80 h-80 rounded-full"
            style={{
              background: `radial-gradient(circle, ${unifiedTheme.glow}25 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Floating sparkles around cards */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${25 + i * 10}%`,
              top: `${30 + (i % 3) * 12}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          >
            <Sparkles className="w-3 h-3 text-amber-400/40" />
          </motion.div>
        ))}

        {/* Card deck animation */}
        <div className="relative h-40 w-64 mb-8 mt-8 md:mt-16">
          {/* Shadow underneath deck */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-6 w-24 h-6 bg-black/20 rounded-full blur-lg" />

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
                ease: [0.45, 0.05, 0.55, 0.95],
                delay: index * 0.05,
              }}
            >
              <CardBack
                className="transition-shadow duration-300 hover:border-amber-400/60"
                style={{
                  boxShadow: `0 ${4 + index}px ${8 + index * 2}px rgba(0, 0, 0, 0.3), 0 0 ${20 + index * 5}px ${unifiedTheme.glow}15`,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Decorative divider */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/30" />
          <motion.div
            animate={{ rotate: [0, 5, 0, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="w-4 h-4 text-amber-400/60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
            </svg>
          </motion.div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/30" />
        </motion.div>

        {/* Text and button */}
        <div className="text-center relative z-10">
          <motion.h3
            className="text-xl md:text-2xl font-heading text-purple-200 mb-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {t('reading.ReadingShufflePhase.shuffling_the_deck', 'Shuffling the deck...')}
          </motion.h3>

          <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">
            {t('reading.ReadingShufflePhase.focus_on_your', 'Focus on your question as the cards align with your energy')}
          </p>

          <div className="relative">
            {/* Particle burst when button appears */}
            {showParticleBurst && <ParticleBurst />}

            <AnimatePresence mode="wait">
              {canStop && (
                <motion.button
                  key="stop-btn"
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStop}
                  className="group relative px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${unifiedTheme.glow}, ${unifiedTheme.accent})`,
                    boxShadow: `0 10px 30px ${unifiedTheme.glow}40, 0 0 0 1px ${unifiedTheme.border}40`,
                  }}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Button glow on hover */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"
                    style={{ background: `linear-gradient(135deg, ${unifiedTheme.glow}, ${unifiedTheme.accent})` }}
                  />

                  <span className="relative flex items-center gap-2">
                    <Hand className="w-5 h-5 text-amber-300" />
                    <span>{t('reading.ReadingShufflePhase.draw_cards', 'Draw Cards')}</span>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingShufflePhase;
