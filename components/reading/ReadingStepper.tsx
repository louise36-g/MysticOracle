import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Shuffle,
  Layers,
  Eye,
  Scroll,
  ChevronLeft,
  Check
} from 'lucide-react';
import { SpreadType } from '../../types';

// ============================================
// READING STEPPER - Celestial Progress Navigation
// ============================================
// A mystical constellation-style stepper for the tarot reading flow.
// Uses internal state for phase navigation.

export type ReadingPhase = 'intro' | 'animating_shuffle' | 'drawing' | 'revealing' | 'reading';

// Map URL slugs to phases (kept for backwards compatibility)
export const SLUG_TO_PHASE: Record<string, ReadingPhase> = {
  'question': 'intro',
  'shuffle': 'animating_shuffle',
  'draw': 'drawing',
  'reveal': 'revealing',
  'reading': 'reading',
};

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
  /** Called when user wants to exit reading entirely (back to spread selector) */
  onExit: () => void;
  /** Which phases the user can navigate back to */
  canNavigateTo?: (phase: ReadingPhase) => boolean;
}

const ReadingStepper: React.FC<ReadingStepperProps> = ({
  currentPhase,
  spreadType,
  language,
  onNavigate,
  onExit,
  canNavigateTo,
}) => {
  const currentStepIndex = STEPS.findIndex(s => s.id === currentPhase);

  // Default: can navigate to any step before current (question is always navigable)
  const canGoTo = canNavigateTo || ((phase: ReadingPhase) => {
    const targetIndex = STEPS.findIndex(s => s.id === phase);
    return targetIndex < currentStepIndex;
  });

  // Get previous navigable step (for back button)
  const previousNavigableStep = useMemo(() => {
    for (let i = currentStepIndex - 1; i >= 0; i--) {
      if (canGoTo(STEPS[i].id)) {
        return STEPS[i];
      }
    }
    return null;
  }, [currentStepIndex, canGoTo]);

  // Handle step click - uses internal state navigation (no URL changes)
  const handleStepClick = (step: StepConfig) => {
    if (!canGoTo(step.id)) return;

    // Call the state update callback - URL navigation is handled by parent
    onNavigate(step.id);
  };

  // Handle back button click - go to previous step or exit
  const handleBackClick = () => {
    if (previousNavigableStep) {
      handleStepClick(previousNavigableStep);
    } else {
      onExit();
    }
  };

  // Back button tooltip text
  const backButtonTitle = previousNavigableStep
    ? (language === 'en'
        ? `Back to ${previousNavigableStep.shortLabelEn}`
        : `Retour à ${previousNavigableStep.shortLabelFr}`)
    : (language === 'en' ? 'Exit reading' : 'Quitter la lecture');

  // Particle positions for constellation effect (static, no animation)
  const particles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
    })), []
  );

  return (
    <div className="relative">
      {/* Back button - goes to previous step or exits */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={handleBackClick}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 border border-white/10 text-slate-400 hover:text-white hover:bg-black/60 hover:border-white/20 transition-all group"
        title={backButtonTitle}
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      </motion.button>

      {/* Main stepper container */}
      <div className="relative ml-10 px-4 py-3 rounded-2xl bg-gradient-to-r from-black/40 via-black/30 to-black/40 border border-white/[0.08] backdrop-blur-sm overflow-hidden">
        {/* Static particles (constellation stars) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white/20"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
              }}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="relative flex items-center justify-between gap-1 md:gap-2">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isNavigable = canGoTo(step.id);
            const isLastStep = index === STEPS.length - 1;

            // Build tooltip text
            let tooltipText: string | undefined;
            if (isNavigable) {
              tooltipText = language === 'en' ? `Go back to ${step.labelEn}` : `Retourner à ${step.labelFr}`;
            }

            return (
              <React.Fragment key={step.id}>
                {/* Step node */}
                <button
                  onClick={() => isNavigable && handleStepClick(step)}
                  disabled={!isNavigable}
                  className={`
                    relative flex items-center gap-2 px-2 py-1.5 rounded-xl
                    transition-all duration-300
                    ${isNavigable ? 'cursor-pointer hover:bg-white/5' : 'cursor-default pointer-events-none'}
                    ${isCurrent ? 'bg-white/10 border border-white/20' : 'border border-transparent'}
                  `}
                  title={tooltipText}
                >
                  {/* Step icon circle */}
                  <div className={`
                    relative flex items-center justify-center w-7 h-7 rounded-full
                    transition-all duration-300
                    ${isCurrent
                      ? 'bg-gradient-to-br from-amber-400/90 to-amber-600/90 text-slate-900 shadow-lg shadow-amber-500/30'
                      : isCompleted
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/5 text-slate-500 border border-white/10'
                    }
                  `}>
                    {/* Pulse animation for current step only */}
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
                    {/* Show checkmark for completed steps, otherwise show step icon */}
                    <span className="relative z-10">
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.icon}
                    </span>
                  </div>

                  {/* Step label (hidden on mobile, visible on lg+) */}
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
                </button>

                {/* Connecting line (constellation path) */}
                {!isLastStep && (
                  <div className="flex-1 h-[2px] min-w-[12px] md:min-w-[20px] relative mx-0.5">
                    {/* Background line */}
                    <div className="absolute inset-0 bg-white/10 rounded-full" />

                    {/* Progress fill */}
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400/60 to-amber-400/30"
                      initial={{ width: '0%' }}
                      animate={{
                        width: isCompleted || isCurrent ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current step label (mobile) */}
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden text-center mt-2 pt-2 border-t border-white/5"
        >
          <span className="text-xs text-slate-400">
            {language === 'en'
              ? STEPS[currentStepIndex]?.labelEn
              : STEPS[currentStepIndex]?.labelFr
            }
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default ReadingStepper;
