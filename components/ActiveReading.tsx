import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../routes/routes';
import { SpreadConfig, SpreadType, InterpretationStyle, TarotCard } from '../types';
import { FULL_DECK, SPREADS } from '../constants';
import {
  createReading,
  updateReadingReflection,
} from '../services/apiService';
import { shuffleDeck } from '../utils/shuffle';
import { useReadingGeneration, useOracleChat, useQuestionInput } from '../hooks';
import {
  ReadingShufflePhase,
  QuestionIntroPhase,
  DrawingPhase,
  RevealingPhase,
  InterpretationPhase,
} from './reading';

interface ActiveReadingProps {
  spread?: SpreadConfig;
  style?: InterpretationStyle;
  onFinish?: () => void;
}

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

type ReadingPhase = 'intro' | 'animating_shuffle' | 'drawing' | 'revealing' | 'reading';

const LOADING_MESSAGES = {
  en: [
    "Consulting the spirits...",
    "Shuffling the astral deck...",
    "Listening to the whispers of fate...",
    "Aligning the cosmic energies...",
    "Channeling ancient wisdom...",
    "Reading the threads of destiny...",
    "Gazing into the void..."
  ],
  fr: [
    "Consultation des esprits...",
    "Mélange du jeu astral...",
    "Écoute des murmures du destin...",
    "Alignement des énergies cosmiques...",
    "Canalisation de la sagesse ancienne...",
    "Lecture des fils du destin...",
    "Regard dans le vide..."
  ]
};

// Map URL slugs to SpreadType enum
const SLUG_TO_SPREAD_TYPE: Record<string, SpreadType> = {
  'single': SpreadType.SINGLE,
  'three-card': SpreadType.THREE_CARD,
  'love': SpreadType.LOVE,
  'career': SpreadType.CAREER,
  'horseshoe': SpreadType.HORSESHOE,
  'celtic-cross': SpreadType.CELTIC_CROSS,
};

const ActiveReading: React.FC<ActiveReadingProps> = ({ spread: propSpread, onFinish }) => {
  const { spreadType: spreadSlug } = useParams<{ spreadType: string }>();
  const navigate = useNavigate();
  const { language, user, deductCredits, addToHistory, refreshUser, t } = useApp();
  const { getToken } = useAuth();
  const { generateReading, isGenerating, error: generationError } = useReadingGeneration();

  // Get spread from props or URL params
  const spread = useMemo(() => {
    if (propSpread) return propSpread;
    if (spreadSlug) {
      const spreadType = SLUG_TO_SPREAD_TYPE[spreadSlug];
      if (spreadType && SPREADS[spreadType]) {
        return SPREADS[spreadType];
      }
    }
    return null;
  }, [propSpread, spreadSlug]);

  // Redirect to spread selector if no valid spread
  useEffect(() => {
    if (!spread) {
      navigate(ROUTES.READING, { replace: true });
    }
  }, [spread, navigate]);

  // Handle finish - navigate to spread selector
  const handleFinish = useCallback(() => {
    if (onFinish) {
      onFinish();
    } else {
      navigate(ROUTES.READING);
    }
  }, [onFinish, navigate]);

  // Don't render if no spread
  if (!spread) {
    return null;
  }

  // Question input hook
  const {
    question,
    questionError,
    validationMessage,
    showLengthModal,
    extendedQuestionPaid,
    isProcessingLength,
    setShowLengthModal,
    setValidationMessage,
    handleQuestionChange,
    handleGeneralGuidance,
    handleAISummarize,
    handleUseFullQuestion,
    handleShortenManually,
    validateBeforeStart,
  } = useQuestionInput({ language, refreshUser, t });

  // Phase state
  const [phase, setPhase] = useState<ReadingPhase>('intro');

  // Card state
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);

  // Reading state
  const [readingText, setReadingText] = useState<string>('');
  const [readingLanguage, setReadingLanguage] = useState<string | null>(null);

  // Options state
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<InterpretationStyle[]>([InterpretationStyle.CLASSIC]);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  // Backend reading ID (for saving reflections)
  const [backendReadingId, setBackendReadingId] = useState<string | null>(null);

  // Loading message state
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Reading context panel state (expanded by default to show question and cards)
  const [isContextExpanded, setIsContextExpanded] = useState(true);

  // Oracle chat hook for follow-up questions
  const {
    messages: chatHistory,
    sendMessage,
    isSending: isChatLoading,
    chatInput,
    setChatInput,
    questionCost
  } = useOracleChat({
    readingText,
    backendReadingId,
    language,
    deductCredits
  });

  const loadingMessages = useMemo(() => LOADING_MESSAGES[language], [language]);

  // Initialize deck with Fisher-Yates shuffle
  useEffect(() => {
    setDeck(shuffleDeck(FULL_DECK));
  }, []);

  // Scroll to top when phase changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  // Regenerate reading when language changes (if one is already displayed)
  useEffect(() => {
    if (phase === 'reading' && readingText && readingLanguage !== language && !isGenerating) {
      regenerateReading();
    }
  }, [language]);

  const regenerateReading = useCallback(async () => {
    try {
      const result = await generateReading({
        spread,
        isAdvanced,
        selectedStyles,
        drawnCards,
        question,
        language
      });

      setReadingText(result.interpretation);
      setReadingLanguage(language);
    } catch (error) {
      console.error('Failed to regenerate reading:', error);
      setReadingText(t('reading.error.generateFailed', 'Failed to generate reading. Please try again.'));
    }
  }, [generateReading, spread, isAdvanced, selectedStyles, drawnCards, question, language, t]);

  // Cycle loading messages
  useEffect(() => {
    if (!isGenerating) return;

    setLoadingMessageIndex(0);
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isGenerating, loadingMessages.length]);

  const toggleStyle = useCallback((style: InterpretationStyle) => {
    setSelectedStyles(prev =>
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  }, []);

  const totalCost = useMemo(() => {
    return spread.cost + (isAdvanced ? 1 : 0) + (extendedQuestionPaid ? 1 : 0);
  }, [spread.cost, isAdvanced, extendedQuestionPaid]);

  // Wrapper for handleUseFullQuestion to pass current credits and base cost
  const handleUseFullQuestionWrapper = useCallback(() => {
    const baseCost = spread.cost + (isAdvanced ? 1 : 0);
    handleUseFullQuestion(user?.credits || 0, baseCost);
  }, [handleUseFullQuestion, spread.cost, isAdvanced, user?.credits]);

  const startShuffleAnimation = useCallback(async () => {
    // Use hook's validation
    const baseCost = spread.cost + (isAdvanced ? 1 : 0);
    if (!validateBeforeStart(baseCost)) {
      return;
    }

    const result = await deductCredits(totalCost);
    if (!result.success) {
      setValidationMessage(t('error.insufficientCredits', 'Insufficient credits'));
      return;
    }

    setPhase('animating_shuffle');
    // User controls when to stop shuffling via ReadingShufflePhase
  }, [validateBeforeStart, spread.cost, isAdvanced, totalCost, deductCredits, setValidationMessage, t]);

  // Handle shuffle stop - transitions to drawing phase
  const handleShuffleStop = useCallback(() => {
    setPhase('drawing');
  }, []);

  const handleCardDraw = useCallback(() => {
    if (drawnCards.length >= spread.positions) return;

    const newCard = deck[drawnCards.length];
    const isReversed = Math.random() < 0.1;

    setDrawnCards(prev => [...prev, { card: newCard, isReversed }]);

    if (drawnCards.length + 1 === spread.positions) {
      setTimeout(() => setPhase('revealing'), 1000);
    }
  }, [drawnCards.length, deck, spread.positions]);

  const startReading = useCallback(async () => {
    setPhase('reading');

    try {
      const result = await generateReading({
        spread,
        isAdvanced,
        selectedStyles,
        drawnCards,
        question,
        language
      });

      setReadingText(result.interpretation);
      setReadingLanguage(language);

      // Trigger completion celebration (may include mystery bonus)
      setShowCelebration(true);

      // Save to local history
      addToHistory({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        spreadType: spread.id,
        cards: drawnCards.map(c => c.card.id),
        interpretation: result.interpretation,
        question
      });

      // Save to backend (credits are deducted here)
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }
        console.log('[Reading] Saving to backend with spreadType:', spread.id);
        console.log('[Reading] Card data:', drawnCards.map((item, idx) => ({
          cardId: String(item.card.id),
          position: idx,
          isReversed: item.isReversed,
        })));
        const savedReading = await createReading(token, {
          spreadType: spread.id,
          interpretationStyle: isAdvanced && selectedStyles.length > 0
            ? selectedStyles[0]
            : 'CLASSIC',
          question,
          cards: drawnCards.map((item, idx) => ({
            cardId: String(item.card.id),
            position: idx,
            isReversed: item.isReversed,
          })),
          interpretation: result.interpretation,
          creditCost: totalCost,
        });
        console.log('[Reading] Saved successfully! Reading:', savedReading);
        setBackendReadingId(savedReading.id);
        // Refresh user to get updated credit balance from backend
        await refreshUser();
        console.log('[Reading] User refreshed after credit deduction');
      } catch (saveError) {
        // Log the full error for debugging
        console.error('[Reading] FAILED to save reading to backend:', saveError);
        if (saveError instanceof Error) {
          console.error('[Reading] Error message:', saveError.message);
          console.error('[Reading] Error stack:', saveError.stack);
        }
        console.error('[Reading] Full error object:', JSON.stringify(saveError, null, 2));
        // Note: Reading still works locally, but credits weren't deducted
      }
    } catch (error) {
      console.error('Failed to generate reading:', error);
      const errorMessage = t('reading.error.generateFailed', 'Failed to generate reading. Please try again.');
      setReadingText(errorMessage);
    }
  }, [generateReading, drawnCards, spread, isAdvanced, selectedStyles, question, language, addToHistory, getToken, totalCost, refreshUser, t]);

  // Handle celebration complete
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Handle saving reflection
  const handleSaveReflection = useCallback(async (reflection: string) => {
    if (!backendReadingId) {
      throw new Error('No reading ID available');
    }
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    await updateReadingReflection(token, backendReadingId, reflection);
  }, [backendReadingId, getToken]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
  }, [chatInput, sendMessage]);

  const handleChatInputChange = useCallback((value: string) => {
    setChatInput(value);
  }, [setChatInput]);

  // Render based on phase
  if (phase === 'animating_shuffle') {
    return <ReadingShufflePhase language={language} onStop={handleShuffleStop} spreadType={spread.id} />;
  }

  if (phase === 'intro') {
    return (
      <QuestionIntroPhase
        spread={spread}
        language={language}
        question={question}
        questionError={questionError}
        validationMessage={validationMessage}
        isAdvanced={isAdvanced}
        selectedStyles={selectedStyles}
        extendedQuestionPaid={extendedQuestionPaid}
        totalCost={totalCost}
        credits={user?.credits || 0}
        showLengthModal={showLengthModal}
        isProcessingLength={isProcessingLength}
        onQuestionChange={handleQuestionChange}
        onGeneralGuidance={handleGeneralGuidance}
        onAdvancedToggle={() => setIsAdvanced(!isAdvanced)}
        onStyleToggle={toggleStyle}
        onStartShuffle={startShuffleAnimation}
        onShowLengthModal={setShowLengthModal}
        onShortenManually={handleShortenManually}
        onAISummarize={handleAISummarize}
        onUseFullQuestion={handleUseFullQuestionWrapper}
      />
    );
  }

  if (phase === 'drawing') {
    return (
      <DrawingPhase
        spread={spread}
        language={language}
        drawnCards={drawnCards}
        onCardDraw={handleCardDraw}
      />
    );
  }

  if (phase === 'revealing') {
    return (
      <RevealingPhase
        spread={spread}
        language={language}
        drawnCards={drawnCards}
        onStartReading={startReading}
      />
    );
  }

  // Reading Phase
  return (
    <InterpretationPhase
      spread={spread}
      language={language}
      drawnCards={drawnCards}
      question={question}
      readingText={readingText}
      isGenerating={isGenerating}
      loadingMessages={loadingMessages}
      loadingMessageIndex={loadingMessageIndex}
      isContextExpanded={isContextExpanded}
      showCelebration={showCelebration}
      backendReadingId={backendReadingId}
      credits={user?.credits || 0}
      chatHistory={chatHistory}
      chatInput={chatInput}
      isChatLoading={isChatLoading}
      questionCost={questionCost}
      onContextToggle={() => setIsContextExpanded(!isContextExpanded)}
      onFinish={handleFinish}
      onCelebrationComplete={handleCelebrationComplete}
      onSaveReflection={handleSaveReflection}
      onChatInputChange={handleChatInputChange}
      onSendMessage={handleSendMessage}
    />
  );
};

export default ActiveReading;
