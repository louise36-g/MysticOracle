import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { SpreadConfig, InterpretationStyle, TarotCard } from '../types';
import { FULL_DECK } from '../constants';
import { generateTarotReading, generateFollowUpReading } from '../services/openrouterService';
import { summarizeQuestion, createReading, updateReadingReflection, addFollowUpQuestion } from '../services/apiService';
import { shuffleDeck } from '../utils/shuffle';
import {
  ReadingShufflePhase,
  QuestionIntroPhase,
  DrawingPhase,
  RevealingPhase,
  InterpretationPhase,
  QUESTION_LENGTH,
} from './reading';

interface ActiveReadingProps {
  spread: SpreadConfig;
  style: InterpretationStyle;
  onFinish: () => void;
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

const ActiveReading: React.FC<ActiveReadingProps> = ({ spread, onFinish }) => {
  const { language, user, deductCredits, addToHistory, refreshUser, t } = useApp();
  const { getToken } = useAuth();

  // Phase state
  const [phase, setPhase] = useState<ReadingPhase>('intro');

  // Card state
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);

  // Reading state
  const [readingText, setReadingText] = useState<string>('');
  const [readingLanguage, setReadingLanguage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Question length modal state
  const [showLengthModal, setShowLengthModal] = useState(false);
  const [extendedQuestionPaid, setExtendedQuestionPaid] = useState(false);
  const [isProcessingLength, setIsProcessingLength] = useState(false);

  // Options state
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<InterpretationStyle[]>([InterpretationStyle.CLASSIC]);

  // Chat state
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'model', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sessionQuestionCount, setSessionQuestionCount] = useState(0);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  // Backend reading ID (for saving reflections)
  const [backendReadingId, setBackendReadingId] = useState<string | null>(null);

  // Loading message state
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Reading context panel state (expanded by default to show question and cards)
  const [isContextExpanded, setIsContextExpanded] = useState(true);

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

  const regenerateReading = async () => {
    setIsGenerating(true);

    try {
      const cardsWithPosition = drawnCards.map((item, idx) => ({
        card: item.card,
        isReversed: item.isReversed,
        positionIndex: idx
      }));

      const result = await generateTarotReading({
        spread,
        style: isAdvanced ? selectedStyles : [InterpretationStyle.CLASSIC],
        cards: cardsWithPosition,
        question,
        language
      });

      setReadingText(result);
      setReadingLanguage(language);
    } catch (error) {
      console.error('Failed to regenerate reading:', error);
      setReadingText(language === 'en'
        ? 'Failed to generate reading. Please try again.'
        : 'Échec de la génération de la lecture. Veuillez réessayer.');
    } finally {
      setIsGenerating(false);
    }
  };

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

  // Character count and limits
  const questionLength = question.length;
  const currentLimit = extendedQuestionPaid ? QUESTION_LENGTH.HARD_LIMIT : QUESTION_LENGTH.FREE_LIMIT;

  const questionLengthStatus = useMemo(() => {
    if (questionLength <= QUESTION_LENGTH.FREE_LIMIT) return 'ok';
    if (questionLength <= QUESTION_LENGTH.HARD_LIMIT) return 'extended';
    return 'exceeded';
  }, [questionLength]);

  // Handle AI summarize from modal
  const handleAISummarize = useCallback(async () => {
    setIsProcessingLength(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const result = await summarizeQuestion(token, question, language);
      setQuestion(result.summary);
      setShowLengthModal(false);
      setExtendedQuestionPaid(false);
      refreshUser();
    } catch (error) {
      console.error('Failed to summarize question:', error);
      setValidationMessage(
        language === 'en'
          ? 'Failed to summarize question. Please try again.'
          : 'Échec du résumé de la question. Veuillez réessayer.'
      );
    } finally {
      setIsProcessingLength(false);
    }
  }, [question, language, getToken, refreshUser]);

  // Handle "use full question" from modal - adds 1 credit to total cost (deducted at reading start)
  const handleUseFullQuestion = useCallback(() => {
    // Check if user has enough credits for total cost including extended question
    const projectedCost = spread.cost + (isAdvanced ? 1 : 0) + 1; // +1 for extended
    if ((user?.credits || 0) < projectedCost) {
      setValidationMessage(t('ActiveReading.tsx.ActiveReading.insufficient_credits', 'Insufficient credits'));
      return;
    }
    setExtendedQuestionPaid(true);
    setShowLengthModal(false);
  }, [spread.cost, isAdvanced, user?.credits, language]);

  // Handle "shorten manually" from modal
  const handleShortenManually = useCallback(() => {
    setShowLengthModal(false);
    // Focus will return to textarea automatically
  }, []);

  const handleGeneralGuidance = useCallback(() => {
    setQuestion(t('ActiveReading.tsx.ActiveReading.guidance_from_the', "Guidance from the Tarot"));
    setQuestionError(false);
    setValidationMessage(null);
  }, [language]);

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

  const startShuffleAnimation = useCallback(async () => {
    if (!question.trim()) {
      setQuestionError(true);
      setValidationMessage(
        language === 'en'
          ? "Please enter a question above or select 'General Guidance'."
          : "Veuillez entrer une question ou sélectionner 'Guidance Générale'."
      );
      return;
    }

    // Check question length
    if (questionLengthStatus === 'exceeded') {
      setValidationMessage(
        language === 'en'
          ? `Question too long (${questionLength}/${QUESTION_LENGTH.HARD_LIMIT} characters). Please shorten it.`
          : `Question trop longue (${questionLength}/${QUESTION_LENGTH.HARD_LIMIT} caractères). Veuillez la raccourcir.`
      );
      return;
    }

    // If extended (500-2000) and not paid, show modal
    if (questionLengthStatus === 'extended' && !extendedQuestionPaid) {
      setShowLengthModal(true);
      return;
    }

    setValidationMessage(null);

    const result = await deductCredits(totalCost);
    if (!result.success) {
      setValidationMessage(t('error.insufficientCredits', 'Insufficient credits'));
      return;
    }

    setPhase('animating_shuffle');
    // User controls when to stop shuffling via ReadingShufflePhase
  }, [question, totalCost, deductCredits, language, questionLengthStatus, questionLength, extendedQuestionPaid]);

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
    setIsGenerating(true);

    const cardsWithPosition = drawnCards.map((item, idx) => ({
      card: item.card,
      isReversed: item.isReversed,
      positionIndex: idx
    }));

    const result = await generateTarotReading({
      spread,
      style: isAdvanced ? selectedStyles : [InterpretationStyle.CLASSIC],
      cards: cardsWithPosition,
      question,
      language
    });

    setReadingText(result);
    setReadingLanguage(language);
    setIsGenerating(false);

    // Trigger completion celebration (may include mystery bonus)
    setShowCelebration(true);

    // Save to local history
    addToHistory({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      spreadType: spread.id,
      cards: drawnCards.map(c => c.card.id),
      interpretation: result,
      question
    });

    // Save to backend (credits are deducted here)
    try {
      const token = await getToken();
      if (token) {
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
          interpretation: result,
          creditCost: totalCost,
        });
        console.log('[Reading] Saved successfully! Reading:', savedReading);
        setBackendReadingId(savedReading.id);
        // Refresh user to get updated credit balance from backend
        await refreshUser();
        console.log('[Reading] User refreshed after credit deduction');
      } else {
        console.error('[Reading] No auth token available - reading will NOT be saved to backend!');
      }
    } catch (error) {
      // Log the full error for debugging
      console.error('[Reading] FAILED to save reading to backend:', error);
      if (error instanceof Error) {
        console.error('[Reading] Error message:', error.message);
        console.error('[Reading] Error stack:', error.stack);
      }
      console.error('[Reading] Full error object:', JSON.stringify(error, null, 2));
      // Note: Reading still works locally, but credits weren't deducted
    }
  }, [drawnCards, spread, isAdvanced, selectedStyles, question, language, addToHistory, getToken, totalCost, refreshUser]);

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

  const getQuestionCost = useCallback(() => {
    // 2 questions for 1 credit: charge on even counts (0, 2, 4...), free on odd counts (1, 3, 5...)
    if (sessionQuestionCount % 2 === 0) return 1;
    return 0;
  }, [sessionQuestionCount]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const cost = getQuestionCost();
    if (cost > 0) {
      const result = await deductCredits(cost);
      if (!result.success) {
        alert(t('error.insufficientCredits', 'Insufficient credits'));
        return;
      }
    }

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    setSessionQuestionCount(prev => prev + 1);

    try {
      const response = await generateFollowUpReading({
        context: readingText,
        history: chatHistory,
        newQuestion: userMsg,
        language
      });

      setChatHistory(prev => [...prev, { role: 'model', content: response }]);

      // Save follow-up question to backend
      if (backendReadingId) {
        try {
          const token = await getToken();
          if (token) {
            await addFollowUpQuestion(token, backendReadingId, userMsg, response);
          }
        } catch (saveError) {
          // Non-blocking - follow-up just won't be saved to history if save fails
          console.error('Failed to save follow-up to backend:', saveError);
        }
      }
    } catch (error) {
      console.error('Failed to generate follow-up response:', error);
      const errorMessage = language === 'en'
        ? 'Sorry, I could not process your question. Please try again.'
        : 'Désolé, je n\'ai pas pu traiter votre question. Veuillez réessayer.';
      setChatHistory(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, getQuestionCost, deductCredits, language, readingText, chatHistory, backendReadingId, getToken]);

  const handleChatInputChange = useCallback((value: string) => {
    setChatInput(value);
  }, []);

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
        onUseFullQuestion={handleUseFullQuestion}
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
      questionCost={getQuestionCost()}
      onContextToggle={() => setIsContextExpanded(!isContextExpanded)}
      onFinish={onFinish}
      onCelebrationComplete={handleCelebrationComplete}
      onSaveReflection={handleSaveReflection}
      onChatInputChange={handleChatInputChange}
      onSendMessage={handleSendMessage}
    />
  );
};

export default ActiveReading;
