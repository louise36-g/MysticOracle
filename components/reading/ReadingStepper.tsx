import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Shuffle,
  Layers,
  Eye,
  Scroll,
  ChevronLeft
} from 'lucide-react';
import { SpreadType } from '../../types';
import { SPREAD_THEMES } from './SpreadThemes';

// ============================================
// READING STEPPER - Celestial Progress Navigation
// ============================================
// A mystical constellation-style stepper for the tarot reading flow.
// Users can navigate back to completed steps.

export type ReadingPhase = 'intro' | 'animating_shuffle' | 'drawing' | 'revealing' | 'reading';

interface StepConfig {
  id: ReadingPhase;
  labelEn: string;
  labelFr: string;
  icon: React.ReactNode;
  shortLabelEn: string;
  shortLabelFr: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'intro',
    labelEn: 'Focus Your Question',
    labelFr: 'Formulez Votre Question',
    shortLabelEn: 'Question',
    shortLabelFr: 'Question',
    icon: <MessageCircle className="w-4 h-4" />
  },
  {
    id: 'animating_shuffle',
    labelEn: 'Shuffle the Deck',
    labelFr: 'Mélangez le Jeu',
    shortLabelEn: 'Shuffle',
    shortLabelFr: 'Mélange',
    icon: <Shuffle className="w-4 h-4" />
  },
  {
    id: 'drawing',
    labelEn: 'Draw Your Cards',
    labelFr: 'Tirez Vos Cartes',
    shortLabelEn: 'Draw',
    shortLabelFr: 'Tirage',
    icon: <Layers className="w-4 h-4" />
  },
  {
    id: 'revealing',
    labelEn: 'Reveal the Spread',
    labelFr: 'Révélez le Tirage',
    shortLabelEn: 'Reveal',
    shortLabelFr: 'Révélation',
    icon: <Eye className="w-4 h-4" />
  },
  {
    id: 'reading',
    labelEn: 'Your Reading',
    labelFr: 'Votre Lecture',
    shortLabelEn: 'Reading',
    shortLabelFr: 'Lecture',
    icon: <Scroll className="w-4 h-4" />
  },
];

interface ReadingStepperProps {
  currentPhase: ReadingPhase;
  spreadType: SpreadType;
  language: 'en' | 'fr';
  onNavigate: (phase: ReadingPhase) => void;
  onBack: () => void;
  /** Which phases the user can navigate back to */
  canNavigateTo?: (phase: ReadingPhase) => boolean;
  /** Compact mode for mobile - shows only icons */
  compact?: boolean;
}

const ReadingStepper: React.FC<ReadingStepperProps> = ({
  currentPhase,
  spreadType,
  language,
  onNavigate,
  onBack,
  canNavigateTo,
  compact = false,
}) => {
  const theme = SPREAD_THEMES[spreadType];
  const currentStepIndex = STEPS.findIndex(s => s.id === currentPhase);

  // Default: can navigate to any step before current
  const canGoTo = canNavigateTo || ((phase: ReadingPhase) => {
    const targetIndex = STEPS.findIndex(s => s.id === phase);
    return targetIndex < currentStepIndex;
  });

  // Particle positions for constellation effect
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 2,
    })), []
  );

  return (
    <div className="relative">
      {/* Back to spread selector button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 border border-white/10 text-slate-400 hover:text-white hover:bg-black/60 hover:border-white/20 transition-all group"
        title={language === 'en' ? 'Back to spreads' : 'Retour aux tirages'}
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      </motion.button>

      {/* Main stepper container */}
      <div className={`
        relative ml-10 px-4 py-3 rounded-2xl
        bg-gradient-to-r from-black/40 via-black/30 to-black/40
        border border-white/[0.08]
        backdrop-blur-sm
        overflow-hidden
      `}>
        {/* Subtle animated particles (constellation stars) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-white/30"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
              }}
              animate={{
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="relative flex items-center justify-between gap-1 md:gap-2">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isFuture = index > currentStepIndex;
            const isNavigable = canGoTo(step.id);
            const isLastStep = index === STEPS.length - 1;

            return (
              <React.Fragment key={step.id}>
                {/* Step node */}
                <motion.button
                  onClick={() => isNavigable && onNavigate(step.id)}
                  disabled={!isNavigable}
                  className={`
                    relative flex items-center gap-2 px-2 py-1.5 rounded-xl
                    transition-all duration-300
                    ${isNavigable ? 'cursor-pointer' : 'cursor-default'}
                    ${isCurrent
                      ? 'bg-white/10 border border-white/20'
                      : isCompleted
                        ? 'hover:bg-white/5'
                        : ''
                    }
                  `}
                  whileHover={isNavigable ? { scale: 1.02 } : {}}
                  whileTap={isNavigable ? { scale: 0.98 } : {}}
                  title={isNavigable
                    ? (language === 'en' ? `Go back to ${step.labelEn}` : `Retourner à ${step.labelFr}`)
                    : undefined
                  }
                >
                  {/* Step icon circle */}
                  <div className={`
                    relative flex items-center justify-center w-7 h-7 rounded-full
                    transition-all duration-300
                    ${isCurrent
                      ? `bg-gradient-to-br from-amber-400/90 to-amber-600/90 text-slate-900 shadow-lg`
                      : isCompleted
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/5 text-slate-500 border border-white/10'
                    }
                  `}
                  style={isCurrent ? { boxShadow: `0 0 20px ${theme.glow}` } : {}}
                  >
                    {/* Pulse animation for current step */}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-amber-400/30"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                    <span className="relative z-10">{step.icon}</span>
                  </div>

                  {/* Step label (hidden on compact/mobile) */}
                  {!compact && (
                    <span className={`
                      hidden lg:block text-xs font-medium whitespace-nowrap
                      transition-colors duration-300
                      ${isCurrent
                        ? 'text-white'
                        : isCompleted
                          ? 'text-amber-300/80'
                          : 'text-slate-500'
                      }
                    `}>
                      {language === 'en' ? step.shortLabelEn : step.shortLabelFr}
                    </span>
                  )}

                  {/* Clickable indicator for completed steps */}
                  {isCompleted && isNavigable && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.button>

                {/* Connecting line (constellation path) */}
                {!isLastStep && (
                  <div className="flex-1 h-[2px] min-w-[12px] md:min-w-[20px] relative mx-0.5">
                    {/* Background line */}
                    <div className="absolute inset-0 bg-white/10 rounded-full" />

                    {/* Progress fill */}
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, rgba(251, 191, 36, 0.6), rgba(251, 191, 36, 0.3))`,
                      }}
                      initial={{ width: '0%' }}
                      animate={{
                        width: isCompleted || isCurrent ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />

                    {/* Traveling particle on active line */}
                    {(isCompleted || isCurrent) && index < currentStepIndex && (
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-300"
                        animate={{
                          left: ['0%', '100%'],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                          delay: index * 0.5,
                        }}
                      />
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current step label (mobile) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="lg:hidden text-center mt-2 pt-2 border-t border-white/5"
          >
            <span className="text-xs text-slate-400">
              {language === 'en'
                ? STEPS[currentStepIndex]?.labelEn
                : STEPS[currentStepIndex]?.labelFr
              }
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReadingStepper;
