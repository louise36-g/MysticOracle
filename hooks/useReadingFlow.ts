/**
 * useReadingFlow Hook
 * Manages reading phase navigation and state transitions
 */

import { useState, useCallback } from 'react';
import { ReadingPhase } from '../components/reading/ReadingStepper';

interface UseReadingFlowResult {
  phase: ReadingPhase;
  setPhase: (phase: ReadingPhase) => void;
  navigateToPhase: (targetPhase: ReadingPhase) => void;
  canNavigateTo: (targetPhase: ReadingPhase) => boolean;
  resetPhaseState: () => void;
}

interface UseReadingFlowParams {
  onPhaseReset?: (targetPhase: ReadingPhase) => void;
}

const PHASE_ORDER: ReadingPhase[] = [
  'intro',
  'animating_shuffle',
  'drawing',
  'revealing',
  'reading',
];

export function useReadingFlow(params: UseReadingFlowParams = {}): UseReadingFlowResult {
  const { onPhaseReset } = params;
  const [phase, setPhase] = useState<ReadingPhase>('intro');

  // Navigate to a previous phase
  const navigateToPhase = useCallback(
    (targetPhase: ReadingPhase) => {
      const currentIndex = PHASE_ORDER.indexOf(phase);
      const targetIndex = PHASE_ORDER.indexOf(targetPhase);

      // Only allow going backwards
      if (targetIndex >= currentIndex) return;

      // Notify parent to reset state based on target phase
      if (onPhaseReset) {
        onPhaseReset(targetPhase);
      }

      setPhase(targetPhase);
    },
    [phase, onPhaseReset]
  );

  // Check if a phase can be navigated to
  const canNavigateTo = useCallback(
    (targetPhase: ReadingPhase): boolean => {
      const currentIndex = PHASE_ORDER.indexOf(phase);
      const targetIndex = PHASE_ORDER.indexOf(targetPhase);

      // Can only go backwards
      if (targetIndex >= currentIndex) return false;

      // All previous phases are navigable
      return true;
    },
    [phase]
  );

  // Reset to initial phase
  const resetPhaseState = useCallback(() => {
    setPhase('intro');
  }, []);

  return {
    phase,
    setPhase,
    navigateToPhase,
    canNavigateTo,
    resetPhaseState,
  };
}

export default useReadingFlow;
