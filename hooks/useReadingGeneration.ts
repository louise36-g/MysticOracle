import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SpreadConfig, InterpretationStyle, TarotCard } from '../types';
import { generateTarotReading } from '../services/apiService';
import { toAPISpreadParams, toStyleStrings } from '../utils/readingApiHelpers';

/**
 * Parameters for generating a tarot reading
 */
export interface ReadingGenerationParams {
  spread: SpreadConfig;
  isAdvanced: boolean;
  selectedStyles: InterpretationStyle[];
  drawnCards: Array<{
    card: TarotCard;
    isReversed: boolean;
  }>;
  question: string;
  language: 'en' | 'fr';
  /** For single card readings: general, love, career, decision, healing */
  category?: string;
  /** For 3-card readings: the selected layout ID (e.g., past-present-future) */
  layoutId?: string;
}

/**
 * Result from the reading generation API
 */
export interface ReadingGenerationResult {
  interpretation: string;
  creditsRequired: number;
}

/**
 * Return type for the useReadingGeneration hook
 */
export interface UseReadingGenerationReturn {
  generateReading: (params: ReadingGenerationParams) => Promise<ReadingGenerationResult | null>;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for generating tarot readings via the backend AI service.
 *
 * Handles:
 * - Getting Clerk session token
 * - Calling the reading generation API
 * - Loading state management
 * - Error handling
 *
 * @example
 * ```tsx
 * const { generateReading, isGenerating, error } = useReadingGeneration();
 *
 * const handleGenerateReading = async () => {
 *   const result = await generateReading({
 *     spread,
 *     isAdvanced,
 *     selectedStyles,
 *     drawnCards,
 *     question,
 *     language
 *   });
 *   if (result) {
 *     setReadingText(result.interpretation);
 *   }
 *   // On failure, result is null and error state contains the message
 * };
 * ```
 */
export function useReadingGeneration(): UseReadingGenerationReturn {
  const { getToken } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Track mounted state to avoid setting state on unmounted component
  // Note: In React 18+, this is less critical but still good practice
  // for long-running async operations
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateReading = useCallback(async (
    params: ReadingGenerationParams
  ): Promise<ReadingGenerationResult | null> => {
    const { spread, isAdvanced, selectedStyles, drawnCards, question, language, category, layoutId } = params;

    setIsGenerating(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        if (mountedRef.current) {
          setError('Not authenticated');
        }
        return null;
      }

      // Transform cards to API format with position index
      // Note: API expects card.id as string, but TarotCard.id is number
      const cardsWithPosition = drawnCards.map((item, idx) => ({
        card: {
          id: String(item.card.id),
          nameEn: item.card.nameEn,
          nameFr: item.card.nameFr,
        },
        isReversed: item.isReversed,
        positionIndex: idx
      }));

      // Use utility functions for consistent parameter transformation
      const spreadParams = toAPISpreadParams(spread);
      const styleStrings = toStyleStrings(isAdvanced, selectedStyles);

      // Debug logging
      console.log('[useReadingGeneration] Sending to API:', {
        spreadId: spreadParams.id,
        isAdvanced,
        selectedStyles: selectedStyles.map(s => s.toString()),
        styleStrings,
        layoutId,
        category,
      });

      const result = await generateTarotReading(token, {
        spread: spreadParams,
        style: styleStrings,
        cards: cardsWithPosition,
        question,
        language,
        ...(category && { category }),
        ...(layoutId && { layoutId }),
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate reading';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setIsGenerating(false);
      }
    }
  }, [getToken]);

  return {
    generateReading,
    isGenerating,
    error,
    clearError
  };
}

export default useReadingGeneration;
