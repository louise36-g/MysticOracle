import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../routes/routes';
import {
  SpreadConfig,
  SpreadType,
  InterpretationStyle,
  TarotCard,
  ReadingCategory,
  ReadingDepth,
  DEPTH_TO_SPREAD,
} from '../types';
import { FULL_DECK, SPREADS } from '../constants';
import { getCategory } from '../constants/categoryConfig';
import {
  createReading,
  updateReadingReflection,
} from '../services/api';
import { shuffleDeck } from '../utils/shuffle';
import { useReadingGeneration, useOracleChat, useQuestionInput, useReadingFlow } from '../hooks';
import {
  ReadingShufflePhase,
  DrawingPhase,
  RevealingPhase,
  InterpretationPhase,
} from './reading';
import CategoryIntroPhase from './reading/phases/CategoryIntroPhase';
import { ThreeCardLayoutId } from '../constants/threeCardLayouts';
import { FiveCardLayoutId } from '../constants/fiveCardLayouts';
import { HorseshoeLayoutId } from '../constants/horseshoeLayouts';
import { CelticCrossLayoutId } from '../constants/celticCrossLayouts';
import ReadingStepper, { ReadingPhase } from './reading/ReadingStepper';

interface ActiveReadingProps {
  spread?: SpreadConfig;
  style?: InterpretationStyle;
  onFinish?: () => void;
}

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

// ReadingPhase type is imported from ReadingStepper

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

/**
 * Determine layout ID based on spread type and selected layouts
 */
function getLayoutId(
  spreadType: SpreadType,
  threeCardLayout: ThreeCardLayoutId | null,
  fiveCardLayout: FiveCardLayoutId | null,
  horseshoeLayout: HorseshoeLayoutId | null,
  celticCrossLayout: CelticCrossLayoutId | null
): string | undefined {
  if (spreadType === SpreadType.THREE_CARD && threeCardLayout) {
    return threeCardLayout;
  }
  if (spreadType === SpreadType.FIVE_CARD && fiveCardLayout) {
    return fiveCardLayout;
  }
  if (spreadType === SpreadType.HORSESHOE && horseshoeLayout) {
    return horseshoeLayout;
  }
  if (spreadType === SpreadType.CELTIC_CROSS && celticCrossLayout) {
    return celticCrossLayout;
  }
  return undefined;
}

// Valid reading categories for URL validation
const VALID_CATEGORIES: ReadingCategory[] = ['love', 'career', 'money', 'life_path', 'family'];

const ActiveReading: React.FC<ActiveReadingProps> = ({ spread: propSpread, onFinish }) => {
  // Category-first URL params: /reading/:category/:depth
  const { category: categoryParam, depth: depthParam } = useParams<{
    category: string;
    depth: string;
  }>();

  // Parse and validate category and depth from URL
  const category = categoryParam as ReadingCategory;
  const depth = parseInt(depthParam || '1', 10) as ReadingDepth;
  const categoryConfig = getCategory(category);
  const navigate = useNavigate();
  const { language, user, canAfford, addToHistory, refreshUser, t } = useApp();
  const { getToken } = useAuth();
  const { generateReading, isGenerating, error: generationError } = useReadingGeneration();

  // Get spread from props or from depth (category-first URL)
  const spread = useMemo(() => {
    if (propSpread) return propSpread;
    // Derive spread type from depth
    if (depth && DEPTH_TO_SPREAD[depth]) {
      const spreadType = DEPTH_TO_SPREAD[depth];
      if (SPREADS[spreadType]) {
        return SPREADS[spreadType];
      }
    }
    return null;
  }, [propSpread, depth]);

  // Validate category and depth, redirect if invalid
  useEffect(() => {
    // Check for valid category (not birth_cards - that's handled by BirthCardEntry)
    const isValidCategory = VALID_CATEGORIES.includes(category);
    const isValidDepth = [1, 3, 5, 7, 10].includes(depth);

    if (!spread || !isValidCategory || !isValidDepth) {
      navigate(ROUTES.READING, { replace: true });
    }
  }, [spread, category, depth, navigate]);

  // Handle finish - navigate to spread selector
  const handleFinish = useCallback(() => {
    if (onFinish) {
      onFinish();
    } else {
      navigate(ROUTES.READING);
    }
  }, [onFinish, navigate]);

  // Handle cancel - navigate back to spread selector
  const handleCancel = useCallback(() => {
    navigate(ROUTES.READING);
  }, [navigate]);

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

  // Phase management using dedicated hook
  const {
    phase,
    setPhase,
    navigateToPhase: handleNavigateToPhase,
    canNavigateTo,
  } = useReadingFlow({
    onPhaseReset: (targetPhase) => {
      // Reset state based on what phase we're going back to
      const phaseOrder: ReadingPhase[] = ['intro', 'animating_shuffle', 'drawing', 'revealing', 'reading'];
      const targetIndex = phaseOrder.indexOf(targetPhase);
      if (targetIndex <= 1) {
        // Going back to intro or shuffle - reset everything except question
        setDrawnCards([]);
        setReadingText('');
        setReadingLanguage(null);
      } else if (targetIndex <= 2) {
        // Going back to drawing - reset reading, keep partial cards
        setReadingText('');
        setReadingLanguage(null);
      }
    },
  });

  // Card state
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);

  // Reading state
  const [readingText, setReadingText] = useState<string>('');
  const [readingLanguage, setReadingLanguage] = useState<string | null>(null);

  // Guard against multiple save attempts
  const [isSavingReading, setIsSavingReading] = useState(false);

  // Layout state (used for 3-card and 5-card spreads)
  const [threeCardLayout, setThreeCardLayout] = useState<ThreeCardLayoutId | null>(null);
  const [fiveCardLayout, setFiveCardLayout] = useState<FiveCardLayoutId | null>(null);

  // Horseshoe and Celtic Cross layouts (not user-selectable but tracked for consistency)
  const [horseshoeLayout] = useState<HorseshoeLayoutId | null>(null);
  const [celticCrossLayout] = useState<CelticCrossLayoutId | null>(null);


  // Options state
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<InterpretationStyle[]>([]);

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
    canAfford,
  });

  const loadingMessages = useMemo(() => LOADING_MESSAGES[language], [language]);

  // Initialize deck with Fisher-Yates shuffle
  useEffect(() => {
    setDeck(shuffleDeck(FULL_DECK));
  }, []);

  // Set default layouts based on category config on mount
  useEffect(() => {
    if (categoryConfig) {
      // Set default 3-card layout if not already set
      if (!threeCardLayout && depth === 3 && categoryConfig.defaultLayouts?.[3]) {
        setThreeCardLayout(categoryConfig.defaultLayouts[3] as ThreeCardLayoutId);
      }
      // Set default 5-card layout if not already set
      if (!fiveCardLayout && depth === 5 && categoryConfig.defaultLayouts?.[5]) {
        setFiveCardLayout(categoryConfig.defaultLayouts[5] as FiveCardLayoutId);
      }
    }
  }, [category, depth, categoryConfig, threeCardLayout, fiveCardLayout]);

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
    const layoutId = getLayoutId(spread.id, threeCardLayout, fiveCardLayout, horseshoeLayout, celticCrossLayout);

    try {
      const result = await generateReading({
        spread,
        isAdvanced,
        selectedStyles,
        drawnCards,
        question,
        language,
        category, // Use the category from URL params
        layoutId,
      });

      // Handle null result (API error)
      if (!result) {
        console.error('[Reading] regenerateReading returned null - API error occurred');
        setReadingText(t('reading.error.generateFailed', 'Failed to generate reading. Please try again.'));
        return;
      }

      setReadingText(result.interpretation);
      setReadingLanguage(language);
    } catch (error) {
      console.error('Failed to regenerate reading:', error);
      setReadingText(t('reading.error.generateFailed', 'Failed to generate reading. Please try again.'));
    }
  }, [generateReading, spread, isAdvanced, selectedStyles, drawnCards, question, language, category, threeCardLayout, fiveCardLayout, horseshoeLayout, t]);

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

  // Display cost for UI only - backend calculates actual cost
  const displayCost = useMemo(() => {
    // For single card, advanced options cost +1 total (not per style)
    if (spread.id === SpreadType.SINGLE) {
      return spread.cost + (isAdvanced && selectedStyles.length > 0 ? 1 : 0);
    }
    // Other spreads: base + style + extended
    return spread.cost + (isAdvanced ? 1 : 0) + (extendedQuestionPaid ? 1 : 0);
  }, [spread.id, spread.cost, isAdvanced, selectedStyles.length, extendedQuestionPaid]);

  // Wrapper for handleUseFullQuestion to pass current credits and base cost
  const handleUseFullQuestionWrapper = useCallback(() => {
    const baseCost = spread.cost + (isAdvanced ? 1 : 0);
    handleUseFullQuestion(user?.credits || 0, baseCost);
  }, [handleUseFullQuestion, spread.cost, isAdvanced, user?.credits]);

  const startShuffleAnimation = useCallback(() => {
    // Validate user can afford the reading (actual deduction happens on backend)
    if (!validateBeforeStart(displayCost)) {
      return;
    }

    // Check credits locally before proceeding (backend will do actual deduction)
    if (!canAfford(displayCost)) {
      setValidationMessage(t('error.insufficientCredits', 'Insufficient credits'));
      return;
    }

    // Reshuffle deck for new reading and reset drawn cards
    setDeck(shuffleDeck(FULL_DECK));
    setDrawnCards([]);

    setPhase('animating_shuffle');
    // User controls when to stop shuffling via ReadingShufflePhase
  }, [validateBeforeStart, displayCost, canAfford, setValidationMessage, t, setPhase]);

  // Handle shuffle stop - transitions to drawing phase
  const handleShuffleStop = useCallback(() => {
    setPhase('drawing');
  }, [setPhase]);

  const handleCardDraw = useCallback(() => {
    if (drawnCards.length >= spread.positions) return;

    const newCard = deck[drawnCards.length];
    const isReversed = Math.random() < 0.1;

    setDrawnCards(prev => [...prev, { card: newCard, isReversed }]);

    if (drawnCards.length + 1 === spread.positions) {
      setTimeout(() => setPhase('revealing'), 1000);
    }
  }, [drawnCards.length, deck, spread.positions, setPhase]);

  const startReading = useCallback(async () => {
    console.log('[Reading] startReading called at', new Date().toISOString());

    // Prevent multiple simultaneous saves
    if (isSavingReading) {
      console.warn('[Reading] Already saving, ignoring duplicate call');
      return;
    }
    setIsSavingReading(true);

    setPhase('reading');

    const layoutId = getLayoutId(spread.id, threeCardLayout, fiveCardLayout, horseshoeLayout, celticCrossLayout);

    try {
      const result = await generateReading({
        spread,
        isAdvanced,
        selectedStyles,
        drawnCards,
        question,
        language,
        category, // Use the category from URL params
        layoutId,
      });

      // Handle null result (API error)
      if (!result) {
        console.error('[Reading] generateReading returned null - API error occurred');
        const errorMessage = t('reading.error.generateFailed', 'Failed to generate reading. Please try again.');
        setReadingText(errorMessage);
        return;
      }

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
        console.log('[Reading] Saving reading:', {
          displayCost, // For reference only - backend calculates actual cost
          spreadType: spread.id,
          isAdvanced,
          hasExtendedQuestion: extendedQuestionPaid,
        });
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
          hasExtendedQuestion: extendedQuestionPaid,
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
    } finally {
      setIsSavingReading(false);
    }
  }, [generateReading, drawnCards, spread, isAdvanced, selectedStyles, question, language, category, threeCardLayout, fiveCardLayout, addToHistory, getToken, displayCost, extendedQuestionPaid, refreshUser, t, setPhase, isSavingReading]);

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

  // Render phase content
  const renderPhaseContent = () => {
    if (phase === 'animating_shuffle') {
      return <ReadingShufflePhase language={language} onStop={handleShuffleStop} spreadType={spread.id} category={category} />;
    }

    if (phase === 'intro') {
      // Use the new CategoryIntroPhase for category-first flow
      // This component handles all depths (1, 3, 5, 7, 10) with unified UX
      return (
        <CategoryIntroPhase
          spread={spread}
          language={language}
          category={category}
          depth={depth}
          selectedLayout={threeCardLayout || fiveCardLayout}
          onLayoutSelect={(layoutId) => {
            // Set appropriate layout state based on depth
            if (depth === 3) {
              setThreeCardLayout(layoutId as ThreeCardLayoutId);
            } else if (depth === 5) {
              setFiveCardLayout(layoutId as FiveCardLayoutId);
            }
          }}
          customQuestion={question}
          onCustomQuestionChange={(text) => {
            handleQuestionChange({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>);
          }}
          isAdvanced={isAdvanced}
          selectedStyles={selectedStyles}
          onAdvancedToggle={() => setIsAdvanced(!isAdvanced)}
          onStyleToggle={toggleStyle}
          validationMessage={validationMessage}
          totalCost={displayCost}
          credits={user?.credits || 0}
          onStartShuffle={startShuffleAnimation}
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
          threeCardLayout={threeCardLayout}
          fiveCardLayout={fiveCardLayout}
          category={category}
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
          threeCardLayout={threeCardLayout}
          fiveCardLayout={fiveCardLayout}
          category={category}
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
        threeCardLayout={threeCardLayout}
        fiveCardLayout={fiveCardLayout}
        category={category}
        onContextToggle={() => setIsContextExpanded(!isContextExpanded)}
        onFinish={handleFinish}
        onCelebrationComplete={handleCelebrationComplete}
        onSaveReflection={handleSaveReflection}
        onChatInputChange={handleChatInputChange}
        onSendMessage={handleSendMessage}
      />
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Stepper - fixed bar below header */}
      <div className="sticky top-16 z-40 px-4 py-3 bg-slate-950/90 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <ReadingStepper
            currentPhase={phase}
            spreadType={spread.id}
            language={language}
            onNavigate={handleNavigateToPhase}
            onExit={handleCancel}
            canNavigateTo={canNavigateTo}
          />
        </div>
      </div>

      {/* Phase content */}
      {renderPhaseContent()}
    </div>
  );
};

export default ActiveReading;
