import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { ROUTES, buildRoute } from '../routes/routes';
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
  SingleCardIntroPhase,
  ThreeCardIntroPhase,
} from './reading';
import { SingleCardCategory } from '../constants/singleCardQuestions';
import { ThreeCardCategory, ThreeCardLayoutId, getThreeCardCategory } from '../constants/threeCardLayouts';
import ReadingStepper, { ReadingPhase, SLUG_TO_PHASE } from './reading/ReadingStepper';

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
  const { spreadType: spreadSlug, phase: phaseSlug } = useParams<{ spreadType: string; phase?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, user, canAfford, addToHistory, refreshUser, t } = useApp();
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

  // Phase state - initialize from URL if available
  const [phase, setPhase] = useState<ReadingPhase>(() => {
    if (phaseSlug && SLUG_TO_PHASE[phaseSlug]) {
      return SLUG_TO_PHASE[phaseSlug];
    }
    return 'intro';
  });

  // Card state
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);

  // Reading state
  const [readingText, setReadingText] = useState<string>('');
  const [readingLanguage, setReadingLanguage] = useState<string | null>(null);

  // Single card oracle state
  const [singleCardCategory, setSingleCardCategory] = useState<SingleCardCategory | null>(null);

  // Guard against multiple save attempts
  const [isSavingReading, setIsSavingReading] = useState(false);
  const [singleCardQuestionId, setSingleCardQuestionId] = useState<string | null>(null);
  const [singleCardCustomQuestion, setSingleCardCustomQuestion] = useState('');
  const [isWritingOwnQuestion, setIsWritingOwnQuestion] = useState(false);

  // Three card intro state
  const [threeCardCategory, setThreeCardCategory] = useState<ThreeCardCategory | null>(null);
  const [threeCardLayout, setThreeCardLayout] = useState<ThreeCardLayoutId | null>(null);
  const [threeCardQuestionId, setThreeCardQuestionId] = useState<string | null>(null);
  const [threeCardCustomQuestion, setThreeCardCustomQuestion] = useState('');
  const [isWritingOwnThreeCard, setIsWritingOwnThreeCard] = useState(false);

  // Handle stepper navigation - go back to a previous phase
  const handleNavigateToPhase = useCallback((targetPhase: ReadingPhase) => {
    // Define phase order for comparison
    const phaseOrder: ReadingPhase[] = ['intro', 'animating_shuffle', 'drawing', 'revealing', 'reading'];
    const currentIndex = phaseOrder.indexOf(phase);
    const targetIndex = phaseOrder.indexOf(targetPhase);

    // Only allow going backwards
    if (targetIndex >= currentIndex) return;

    // Reset state based on what phase we're going back to
    if (targetIndex <= 0) {
      // Going back to intro - reset everything except question
      setDrawnCards([]);
      setReadingText('');
      setReadingLanguage(null);
    } else if (targetIndex <= 1) {
      // Going back to shuffle - reset cards and reading
      setDrawnCards([]);
      setReadingText('');
      setReadingLanguage(null);
    } else if (targetIndex <= 2) {
      // Going back to drawing - reset reading, keep partial cards
      setReadingText('');
      setReadingLanguage(null);
    }

    setPhase(targetPhase);
  }, [phase]);

  // Determine which phases can be navigated to
  // Question (intro) is always navigable since credits aren't spent until shuffle starts
  const canNavigateTo = useCallback((targetPhase: ReadingPhase): boolean => {
    const phaseOrder: ReadingPhase[] = ['intro', 'animating_shuffle', 'drawing', 'revealing', 'reading'];
    const currentIndex = phaseOrder.indexOf(phase);
    const targetIndex = phaseOrder.indexOf(targetPhase);

    // Can only go backwards
    if (targetIndex >= currentIndex) return false;

    // All previous phases are navigable (including intro)
    return true;
  }, [phase]);

  // Map phases to URL slugs for navigation
  const PHASE_TO_SLUG: Record<ReadingPhase, string> = useMemo(() => ({
    'intro': 'question',
    'animating_shuffle': 'shuffle',
    'drawing': 'draw',
    'revealing': 'reveal',
    'reading': 'reading',
  }), []);

  // Update phase and URL together (for forward navigation)
  // Uses push (not replace) so browser back/forward works
  const setPhaseWithUrl = useCallback((newPhase: ReadingPhase) => {
    setPhase(newPhase);
    // Update URL to match phase - push to history for back button support
    const slug = spreadSlug || '';
    if (slug) {
      const phaseUrlSlug = PHASE_TO_SLUG[newPhase];
      navigate(buildRoute(ROUTES.READING_PHASE, { spreadType: slug, phase: phaseUrlSlug }));
    }
  }, [spreadSlug, navigate, PHASE_TO_SLUG]);

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
    canAfford,
  });

  const loadingMessages = useMemo(() => LOADING_MESSAGES[language], [language]);

  // Initialize deck with Fisher-Yates shuffle
  useEffect(() => {
    setDeck(shuffleDeck(FULL_DECK));
  }, []);

  // Sync phase with URL changes (for browser back/forward)
  useEffect(() => {
    // Determine target phase from URL (default to 'intro' if no phase in URL)
    const urlPhase: ReadingPhase = (phaseSlug && SLUG_TO_PHASE[phaseSlug])
      ? SLUG_TO_PHASE[phaseSlug]
      : 'intro';

    if (urlPhase !== phase) {
      // Reset state based on what phase we're navigating to
      const phaseOrder: ReadingPhase[] = ['intro', 'animating_shuffle', 'drawing', 'revealing', 'reading'];
      const currentIndex = phaseOrder.indexOf(phase);
      const targetIndex = phaseOrder.indexOf(urlPhase);

      // Only allow going backwards via URL (prevents forward jumps via URL manipulation)
      if (targetIndex < currentIndex) {
        if (targetIndex <= 0) {
          // Going back to intro - reset everything except question
          setDrawnCards([]);
          setReadingText('');
          setReadingLanguage(null);
        } else if (targetIndex <= 1) {
          // Going back to shuffle - reset cards and reading
          setDrawnCards([]);
          setReadingText('');
          setReadingLanguage(null);
        } else if (targetIndex <= 2) {
          // Going back to drawing - reset reading, keep partial cards
          setReadingText('');
          setReadingLanguage(null);
        }
        setPhase(urlPhase);
      }
    }
  }, [phaseSlug, location.pathname, phase]);

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
        language,
        category: spread.id === SpreadType.SINGLE ? singleCardCategory : undefined,
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
  }, [generateReading, spread, isAdvanced, selectedStyles, drawnCards, question, language, singleCardCategory, t]);

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

  // Single card handlers
  const handleCategorySelect = useCallback((category: SingleCardCategory) => {
    setSingleCardCategory(category);
    setSingleCardQuestionId(null);
    setIsWritingOwnQuestion(false);
  }, []);

  const handleQuestionSelect = useCallback((questionId: string, questionText: string) => {
    setSingleCardQuestionId(questionId);
    handleQuestionChange({ target: { value: questionText } } as React.ChangeEvent<HTMLTextAreaElement>);
  }, [handleQuestionChange]);

  const handleCustomQuestionChange = useCallback((text: string) => {
    setSingleCardCustomQuestion(text);
    handleQuestionChange({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>);
  }, [handleQuestionChange]);

  const handleWriteOwnToggle = useCallback(() => {
    setIsWritingOwnQuestion(prev => !prev);
    if (!isWritingOwnQuestion) {
      setSingleCardQuestionId(null);
    }
  }, [isWritingOwnQuestion]);

  // Three card handlers
  const handleThreeCardCategorySelect = useCallback((category: ThreeCardCategory) => {
    setThreeCardCategory(category);
    setThreeCardQuestionId(null);
    // Auto-set layout to default for this category
    const categoryConfig = getThreeCardCategory(category);
    if (categoryConfig) {
      setThreeCardLayout(categoryConfig.defaultLayout);
    }
  }, []);

  const handleThreeCardLayoutSelect = useCallback((layoutId: ThreeCardLayoutId) => {
    setThreeCardLayout(layoutId);
  }, []);

  const handleThreeCardQuestionSelect = useCallback((questionId: string, questionText: string) => {
    setThreeCardQuestionId(questionId);
    handleQuestionChange({ target: { value: questionText } } as React.ChangeEvent<HTMLTextAreaElement>);
  }, [handleQuestionChange]);

  const handleThreeCardCustomQuestionChange = useCallback((text: string) => {
    setThreeCardCustomQuestion(text);
    handleQuestionChange({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>);
  }, [handleQuestionChange]);

  const handleThreeCardWriteOwnToggle = useCallback(() => {
    setIsWritingOwnThreeCard(prev => !prev);
    if (!isWritingOwnThreeCard) {
      setThreeCardQuestionId(null);
    }
  }, [isWritingOwnThreeCard]);

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

    setPhaseWithUrl('animating_shuffle');
    // User controls when to stop shuffling via ReadingShufflePhase
  }, [validateBeforeStart, displayCost, canAfford, setValidationMessage, t, setPhaseWithUrl]);

  // Handle shuffle stop - transitions to drawing phase
  const handleShuffleStop = useCallback(() => {
    setPhaseWithUrl('drawing');
  }, [setPhaseWithUrl]);

  const handleCardDraw = useCallback(() => {
    if (drawnCards.length >= spread.positions) return;

    const newCard = deck[drawnCards.length];
    const isReversed = Math.random() < 0.1;

    setDrawnCards(prev => [...prev, { card: newCard, isReversed }]);

    if (drawnCards.length + 1 === spread.positions) {
      setTimeout(() => setPhaseWithUrl('revealing'), 1000);
    }
  }, [drawnCards.length, deck, spread.positions, setPhaseWithUrl]);

  const startReading = useCallback(async () => {
    console.log('[Reading] startReading called at', new Date().toISOString());

    // Prevent multiple simultaneous saves
    if (isSavingReading) {
      console.warn('[Reading] Already saving, ignoring duplicate call');
      return;
    }
    setIsSavingReading(true);

    setPhaseWithUrl('reading');

    try {
      const result = await generateReading({
        spread,
        isAdvanced,
        selectedStyles,
        drawnCards,
        question,
        language,
        category: spread.id === SpreadType.SINGLE ? singleCardCategory : undefined,
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
  }, [generateReading, drawnCards, spread, isAdvanced, selectedStyles, question, language, singleCardCategory, addToHistory, getToken, displayCost, extendedQuestionPaid, refreshUser, t, setPhaseWithUrl, isSavingReading]);

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
      return <ReadingShufflePhase language={language} onStop={handleShuffleStop} spreadType={spread.id} />;
    }

    if (phase === 'intro') {
      // Use single card intro for single card spread
      if (spread.id === SpreadType.SINGLE) {
        return (
          <SingleCardIntroPhase
            spread={spread}
            language={language}
            selectedCategory={singleCardCategory}
            selectedQuestionId={singleCardQuestionId}
            customQuestion={singleCardCustomQuestion}
            isWritingOwn={isWritingOwnQuestion}
            onCategorySelect={handleCategorySelect}
            onQuestionSelect={handleQuestionSelect}
            onCustomQuestionChange={handleCustomQuestionChange}
            onWriteOwnToggle={handleWriteOwnToggle}
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

      // Use three card intro for three card spread
      if (spread.id === SpreadType.THREE_CARD) {
        return (
          <ThreeCardIntroPhase
            spread={spread}
            language={language}
            selectedCategory={threeCardCategory}
            selectedLayout={threeCardLayout}
            selectedQuestionId={threeCardQuestionId}
            customQuestion={threeCardCustomQuestion}
            isWritingOwn={isWritingOwnThreeCard}
            onCategorySelect={handleThreeCardCategorySelect}
            onLayoutSelect={handleThreeCardLayoutSelect}
            onQuestionSelect={handleThreeCardQuestionSelect}
            onCustomQuestionChange={handleThreeCardCustomQuestionChange}
            onWriteOwnToggle={handleThreeCardWriteOwnToggle}
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

      // Existing QuestionIntroPhase for other spreads
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
          totalCost={displayCost}
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
