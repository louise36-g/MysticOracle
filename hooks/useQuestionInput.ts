import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { summarizeQuestion } from '../services/apiService';

/**
 * Question length thresholds
 * - FREE_LIMIT: Max characters before requiring payment or summarization
 * - HARD_LIMIT: Absolute maximum characters allowed
 */
export const QUESTION_LENGTH = {
  FREE_LIMIT: 500,
  HARD_LIMIT: 2000,
} as const;

/**
 * Question length status
 * - 'ok': Within free limit
 * - 'extended': Between free and hard limit (requires payment/summarization)
 * - 'exceeded': Beyond hard limit
 */
export type QuestionLengthStatus = 'ok' | 'extended' | 'exceeded';

/**
 * Parameters for the useQuestionInput hook
 */
export interface UseQuestionInputParams {
  language: 'en' | 'fr';
  refreshUser: () => Promise<void>;
  t: (key: string, fallback: string) => string;
}

/**
 * Return type for the useQuestionInput hook
 */
export interface UseQuestionInputReturn {
  // State
  question: string;
  questionError: boolean;
  validationMessage: string | null;
  showLengthModal: boolean;
  extendedQuestionPaid: boolean;
  isProcessingLength: boolean;

  // Computed values
  questionLength: number;
  currentLimit: number;
  questionLengthStatus: QuestionLengthStatus;

  // Setters
  setQuestion: (question: string) => void;
  setQuestionError: (error: boolean) => void;
  setValidationMessage: (message: string | null) => void;
  setShowLengthModal: (show: boolean) => void;
  setExtendedQuestionPaid: (paid: boolean) => void;

  // Handlers
  handleQuestionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleGeneralGuidance: () => void;
  handleAISummarize: () => Promise<void>;
  handleUseFullQuestion: (credits: number, baseCost: number) => void;
  handleShortenManually: () => void;

  // Validation
  validateBeforeStart: (baseCost: number) => boolean;
}

/**
 * Hook for managing question input in tarot readings.
 *
 * Handles:
 * - Question text state management
 * - Character count validation and limits
 * - AI summarization for long questions
 * - Extended question payment flow
 * - Validation before starting reading
 *
 * @example
 * ```tsx
 * const {
 *   question,
 *   questionError,
 *   handleQuestionChange,
 *   handleAISummarize,
 *   validateBeforeStart,
 *   questionLengthStatus,
 * } = useQuestionInput({
 *   language,
 *   refreshUser,
 *   t,
 * });
 * ```
 */
export function useQuestionInput({
  language,
  refreshUser,
  t,
}: UseQuestionInputParams): UseQuestionInputReturn {
  const { getToken } = useAuth();
  const mountedRef = useRef(true);

  // Question state
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Length modal state
  const [showLengthModal, setShowLengthModal] = useState(false);
  const [extendedQuestionPaid, setExtendedQuestionPaid] = useState(false);
  const [isProcessingLength, setIsProcessingLength] = useState(false);

  // Track mounted state to avoid setting state on unmounted component
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Computed values
  const questionLength = question.length;
  const currentLimit = extendedQuestionPaid ? QUESTION_LENGTH.HARD_LIMIT : QUESTION_LENGTH.FREE_LIMIT;

  const questionLengthStatus = useMemo((): QuestionLengthStatus => {
    if (questionLength <= QUESTION_LENGTH.FREE_LIMIT) return 'ok';
    if (questionLength <= QUESTION_LENGTH.HARD_LIMIT) return 'extended';
    return 'exceeded';
  }, [questionLength]);

  // Handle question input change
  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Enforce hard limit
    if (newValue.length > QUESTION_LENGTH.HARD_LIMIT) {
      return; // Don't allow input beyond hard limit
    }
    setQuestion(newValue);
    setExtendedQuestionPaid(false); // Reset when question changes
    if (newValue) {
      setQuestionError(false);
      setValidationMessage(null);
    }
  }, []);

  // Handle general guidance selection
  const handleGeneralGuidance = useCallback(() => {
    setQuestion(t('ActiveReading.tsx.ActiveReading.guidance_from_the', 'Guidance from the Tarot'));
    setQuestionError(false);
    setValidationMessage(null);
  }, [t]);

  // Handle AI summarization from modal
  const handleAISummarize = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsProcessingLength(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const result = await summarizeQuestion(token, question, language);

      if (mountedRef.current) {
        setQuestion(result.summary);
        setShowLengthModal(false);
        setExtendedQuestionPaid(false);
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to summarize question:', error);
      if (mountedRef.current) {
        setValidationMessage(t('reading.error.summarizeFailed', 'Failed to summarize question. Please try again.'));
      }
    } finally {
      if (mountedRef.current) {
        setIsProcessingLength(false);
      }
    }
  }, [question, language, getToken, refreshUser, t]);

  // Handle "use full question" from modal - adds 1 credit to total cost
  const handleUseFullQuestion = useCallback((credits: number, baseCost: number) => {
    // Check if user has enough credits for total cost including extended question
    const projectedCost = baseCost + 1; // +1 for extended
    if (credits < projectedCost) {
      setValidationMessage(t('ActiveReading.tsx.ActiveReading.insufficient_credits', 'Insufficient credits'));
      return;
    }
    setExtendedQuestionPaid(true);
    setShowLengthModal(false);
  }, [t]);

  // Handle "shorten manually" from modal
  const handleShortenManually = useCallback(() => {
    setShowLengthModal(false);
    // Focus will return to textarea automatically
  }, []);

  // Validate question before starting shuffle/reading
  const validateBeforeStart = useCallback((baseCost: number): boolean => {
    if (!question.trim()) {
      setQuestionError(true);
      setValidationMessage(t('reading.error.missingQuestion', 'Please write or choose your question before shuffling the cards.'));
      return false;
    }

    // Check question length
    if (questionLengthStatus === 'exceeded') {
      setValidationMessage(
        t('reading.error.questionTooLong', `Question too long (${questionLength}/${QUESTION_LENGTH.HARD_LIMIT} characters). Please shorten it.`)
      );
      return false;
    }

    // If extended (500-2000) and not paid, show modal
    if (questionLengthStatus === 'extended' && !extendedQuestionPaid) {
      setShowLengthModal(true);
      return false;
    }

    setValidationMessage(null);
    return true;
  }, [question, questionLengthStatus, questionLength, extendedQuestionPaid, t]);

  return {
    // State
    question,
    questionError,
    validationMessage,
    showLengthModal,
    extendedQuestionPaid,
    isProcessingLength,

    // Computed values
    questionLength,
    currentLimit,
    questionLengthStatus,

    // Setters
    setQuestion,
    setQuestionError,
    setValidationMessage,
    setShowLengthModal,
    setExtendedQuestionPaid,

    // Handlers
    handleQuestionChange,
    handleGeneralGuidance,
    handleAISummarize,
    handleUseFullQuestion,
    handleShortenManually,

    // Validation
    validateBeforeStart,
  };
}

export default useQuestionInput;
