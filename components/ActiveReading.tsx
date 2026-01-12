import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { SpreadConfig, InterpretationStyle, TarotCard } from '../types';
import { FULL_DECK } from '../constants';
import { generateTarotReading, generateFollowUpReading } from '../services/openrouterService';
import { summarizeQuestion, createReading, updateReadingReflection, addFollowUpQuestion } from '../services/apiService';
import { shuffleDeck } from '../utils/shuffle';
import Card from './Card';
import Button from './Button';
import ReadingShufflePhase from './reading/ReadingShufflePhase';
import OracleChat from './reading/OracleChat';
import ReflectionPrompt from './reading/ReflectionPrompt';
import QuestionLengthModal from './QuestionLengthModal';
import { ReadingCompleteCelebration } from './rewards';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Settings, Check, AlertCircle, ChevronDown, ChevronUp, Quote } from 'lucide-react';

// Question length thresholds
const QUESTION_LENGTH = {
  FREE_LIMIT: 500,
  HARD_LIMIT: 2000,
} as const;

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
  const { language, user, deductCredits, addToHistory, refreshUser } = useApp();
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

  // Color based on current allowed limit (not the hard limit)
  const questionLengthColor = useMemo(() => {
    if (questionLength <= currentLimit * 0.9) return 'text-slate-400';
    if (questionLength <= currentLimit) return 'text-green-400';
    return 'text-red-400';
  }, [questionLength, currentLimit]);

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
      setValidationMessage(language === 'en' ? 'Insufficient credits' : 'Crédits insuffisants');
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
    setQuestion(language === 'en' ? "Guidance from the Tarot" : "Guidance du Tarot");
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
      setValidationMessage(result.message || (language === 'en' ? "Transaction failed." : "La transaction a échoué."));
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
    const isReversed = Math.random() < 0.3;

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
        const savedReading = await createReading(token, {
          spreadType: spread.id,
          interpretationStyle: isAdvanced && selectedStyles.length > 0
            ? selectedStyles[0]
            : 'CLASSIC',
          question,
          cards: drawnCards.map((item, idx) => ({
            cardId: item.card.id,
            position: idx,
            isReversed: item.isReversed,
          })),
          interpretation: result,
          creditCost: totalCost,
        });
        console.log('[Reading] Saved successfully, ID:', savedReading.id);
        setBackendReadingId(savedReading.id);
        // Refresh user to get updated credit balance from backend
        await refreshUser();
        console.log('[Reading] User refreshed after credit deduction');
      } else {
        console.error('[Reading] No auth token available - credits will not be deducted!');
      }
    } catch (error) {
      // Log the full error for debugging
      console.error('[Reading] Failed to save reading to backend:', error);
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
        alert(result.message || (language === 'en' ? "Insufficient credits!" : "Crédits insuffisants!"));
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
    return <ReadingShufflePhase language={language} onStop={handleShuffleStop} />;
  }

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center px-4 py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Spread Context Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-heading text-purple-100">
                {language === 'en' ? spread.nameEn : spread.nameFr}
              </h2>
              <p className="text-slate-500 text-xs">
                {spread.positions} {language === 'en' ? 'cards' : 'cartes'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-heading text-amber-400">{totalCost}</span>
              <p className="text-slate-500 text-xs">
                {language === 'en' ? 'credits' : 'crédits'}
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
            {/* Question Input Section */}
            <div className="p-4 md:p-5">
              <label className={`block text-sm font-medium mb-2 ${questionError ? 'text-red-400' : 'text-slate-300'}`}>
                {language === 'en' ? 'Your Question' : 'Votre Question'}
              </label>
              <textarea
                value={question}
                onChange={handleQuestionChange}
                placeholder={language === 'en' ? 'What weighs on your heart?' : 'Qu\'est-ce qui pèse sur votre cœur?'}
                maxLength={QUESTION_LENGTH.HARD_LIMIT}
                rows={2}
                className={`w-full bg-slate-950/60 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 text-sm md:text-base resize-none transition-all ${
                  questionError
                    ? 'border border-red-500 focus:ring-red-500/50'
                    : questionLength > currentLimit
                      ? 'border border-red-500 focus:ring-red-500/50'
                      : 'border border-slate-700 focus:border-amber-500 focus:ring-amber-500/30'
                }`}
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={handleGeneralGuidance}
                  className="flex items-center gap-1.5 text-xs text-amber-500/80 hover:text-amber-400 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{language === 'en' ? 'Use General Guidance' : 'Guidance Générale'}</span>
                </button>
                <span className={`text-xs ${questionLengthColor}`}>
                  {questionLength}/{currentLimit}
                </span>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="border-t border-slate-800">
              <button
                onClick={() => setIsAdvanced(!isAdvanced)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400">
                    {language === 'en' ? 'Advanced Options' : 'Options Avancées'}
                  </span>
                  {isAdvanced && (
                    <span className="text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      +1
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isAdvanced ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                      {[
                        { id: InterpretationStyle.SPIRITUAL, labelEn: 'Spiritual', labelFr: 'Spirituel' },
                        { id: InterpretationStyle.PSYCHO_EMOTIONAL, labelEn: 'Psycho-Emotional', labelFr: 'Psycho-Émotionnel' },
                        { id: InterpretationStyle.NUMEROLOGY, labelEn: 'Numerology', labelFr: 'Numérologie' },
                        { id: InterpretationStyle.ELEMENTAL, labelEn: 'Elements', labelFr: 'Éléments' }
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => toggleStyle(option.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            selectedStyles.includes(option.id)
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800/50 text-slate-500 border border-transparent hover:bg-slate-800'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                            selectedStyles.includes(option.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
                          }`}>
                            {selectedStyles.includes(option.id) && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          {language === 'en' ? option.labelEn : option.labelFr}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Validation Error */}
            {validationMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mx-4 mb-3 flex items-center gap-2 p-2.5 bg-red-500/15 border border-red-500/30 rounded-lg text-red-300 text-xs"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{validationMessage}</span>
              </motion.div>
            )}

            {/* CTA Button */}
            <div className="p-4 bg-slate-950/50">
              <Button onClick={startShuffleAnimation} size="lg" className="w-full">
                {language === 'en' ? 'Begin Reading' : 'Commencer la Lecture'}
              </Button>
              {(isAdvanced || extendedQuestionPaid) && (
                <p className="text-center text-xs text-slate-500 mt-2">
                  {spread.cost} {isAdvanced && `+ 1`} {extendedQuestionPaid && `+ 1`} = {totalCost} {language === 'en' ? 'credits' : 'crédits'}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Question Length Modal */}
        <QuestionLengthModal
          isOpen={showLengthModal}
          onClose={() => setShowLengthModal(false)}
          question={question}
          language={language}
          credits={user?.credits || 0}
          onShortenManually={handleShortenManually}
          onAISummarize={handleAISummarize}
          onUseFullQuestion={handleUseFullQuestion}
          isLoading={isProcessingLength}
        />
      </div>
    );
  }

  if (phase === 'drawing') {
    const progressPercent = (drawnCards.length / spread.positions) * 100;
    const cardsRemaining = spread.positions - drawnCards.length;

    return (
      <div className="flex flex-col items-center px-4 py-6 md:py-10">
        {/* Header with progress */}
        <div className="w-full max-w-2xl mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg md:text-xl font-heading text-purple-100">
                {language === 'en' ? 'Draw Your Cards' : 'Tirez Vos Cartes'}
              </h3>
              <p className="text-slate-400 text-xs md:text-sm">
                {language === 'en' ? spread.nameEn : spread.nameFr}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-heading text-amber-400">{cardsRemaining}</span>
              <p className="text-slate-500 text-xs">
                {language === 'en' ? 'remaining' : 'restantes'}
              </p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main drawing area */}
        <div className="w-full max-w-3xl">
          {/* Deck - clickable area */}
          <div className="flex justify-center mb-6">
            <motion.div
              className="relative cursor-pointer group"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCardDraw}
            >
              {/* Deck stack effect */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`deck-stack-${i}`}
                  className="absolute w-[90px] h-[140px] md:w-[110px] md:h-[170px] rounded-lg bg-indigo-900/90 border border-amber-600/30"
                  style={{ top: -i * 2, left: -i * 2, zIndex: 5 - i }}
                />
              ))}
              {/* Top card */}
              <div className="relative z-10 w-[90px] h-[140px] md:w-[110px] md:h-[170px] rounded-lg bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 border-2 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex flex-col items-center justify-center gap-2 group-hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] group-hover:border-amber-400 transition-all duration-300">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-amber-400/90"
                >
                  <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
                </motion.div>
                <span className="text-amber-400 font-heading text-sm md:text-base font-bold tracking-wider">
                  {language === 'en' ? 'TAP' : 'TOUCHER'}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Card slots grid */}
          <div className="bg-slate-900/40 rounded-2xl border border-purple-900/30 p-4 md:p-6">
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
              {Array.from({ length: spread.positions }).map((_, i) => {
                const positionLabel = language === 'en'
                  ? spread.positionMeaningsEn[i]
                  : spread.positionMeaningsFr[i];

                return (
                  <div key={`slot-${i}`} className="flex flex-col items-center gap-1.5">
                    <div className="relative w-[70px] h-[108px] md:w-[85px] md:h-[130px]">
                      {/* Empty slot */}
                      <div className={`absolute inset-0 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 ${
                        i < drawnCards.length
                          ? 'opacity-0 border-transparent'
                          : i === drawnCards.length
                            ? 'border-amber-500/50 bg-amber-500/5'
                            : 'border-white/10'
                      }`}>
                        <span className={`font-heading text-xl ${i === drawnCards.length ? 'text-amber-500/60' : 'text-white/15'}`}>
                          {i + 1}
                        </span>
                      </div>

                      {/* Drawn card */}
                      <AnimatePresence>
                        {i < drawnCards.length && (
                          <motion.div
                            initial={{ y: -100, opacity: 0, scale: 0.7 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 150, damping: 18 }}
                            className="absolute inset-0"
                          >
                            <div className="w-full h-full rounded-lg bg-gradient-to-br from-indigo-900 to-purple-950 border-2 border-amber-600/60 shadow-lg flex items-center justify-center">
                              <span className="text-amber-500/70 font-heading text-lg">✓</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Position label */}
                    <span className={`text-[10px] md:text-xs text-center max-w-[80px] truncate ${
                      i < drawnCards.length ? 'text-amber-500/70' : 'text-slate-500'
                    }`}>
                      {positionLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'revealing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] py-10">
        <h2 className="text-3xl font-heading text-amber-100 mb-12">
          {language === 'en' ? 'The cards are laid.' : 'Les cartes sont posées.'}
        </h2>

        <div className="flex gap-4 flex-wrap justify-center mb-12 max-w-5xl">
          {drawnCards.map((item, i) => (
            <motion.div
              key={`reveal-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
            >
              <Card
                card={item.card}
                isRevealed={true}
                isReversed={item.isReversed}
                className="w-[100px] h-[160px] md:w-[140px] md:h-[220px]"
              />
              <p className="text-center mt-4 text-purple-200 font-heading text-xs uppercase tracking-widest max-w-[140px] truncate">
                {language === 'en' ? spread.positionMeaningsEn[i] : spread.positionMeaningsFr[i]}
              </p>
              {item.isReversed && (
                <p className="text-center text-[10px] text-amber-500/80 uppercase tracking-wider">
                  {language === 'en' ? 'Reversed' : 'Renversée'}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <Button onClick={startReading} size="lg" className="animate-bounce">
          {language === 'en' ? 'Reveal Interpretation' : "Révéler l'Interprétation"}
        </Button>
      </div>
    );
  }

  // Reading Phase
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 pb-32">
      {/* Loading State */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[50vh] py-12"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-800 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-amber-400 rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-amber-400/80" />
          </div>
          <motion.p
            key={loadingMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-purple-200 font-heading text-xl mt-6"
          >
            {loadingMessages[loadingMessageIndex]}
          </motion.p>
          <p className="text-slate-500 text-sm mt-2">
            {language === 'en'
              ? 'Your personalized reading is being channeled...'
              : 'Votre lecture personnalisée est en cours de canalisation...'}
          </p>
        </motion.div>
      )}

      {/* Main Content - Only show when not generating */}
      {!isGenerating && (
        <>
          {/* Collapsible Reading Context Panel */}
          <div className="mb-4">
            <button
              onClick={() => setIsContextExpanded(!isContextExpanded)}
              className="w-full bg-slate-900/60 backdrop-blur-sm border border-purple-900/30 rounded-xl p-3 md:p-4 hover:bg-slate-900/80 transition-colors group"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Question preview */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Quote className="w-4 h-4 text-amber-500/70 flex-shrink-0" />
                  <p className="text-amber-100/90 text-sm md:text-base italic truncate">
                    {question}
                  </p>
                </div>

                {/* Mini card thumbnails */}
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  {drawnCards.slice(0, 5).map((item, i) => (
                    <div
                      key={`mini-${i}`}
                      className="w-6 h-9 md:w-7 md:h-10 rounded bg-gradient-to-br from-indigo-900 to-purple-950 border border-amber-600/40 flex items-center justify-center text-[8px] text-amber-500/60 font-bold"
                    >
                      {i + 1}
                    </div>
                  ))}
                  {drawnCards.length > 5 && (
                    <span className="text-xs text-slate-500 ml-1">+{drawnCards.length - 5}</span>
                  )}
                </div>

                {/* Expand/collapse indicator */}
                <div className="flex-shrink-0 text-slate-400 group-hover:text-purple-300 transition-colors">
                  {isContextExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded cards view */}
            <AnimatePresence>
              {isContextExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-slate-900/40 border-x border-b border-purple-900/30 rounded-b-xl p-4 md:p-6 -mt-2">
                    <div className="flex flex-wrap gap-4 justify-center">
                      {drawnCards.map((item, i) => (
                        <motion.div
                          key={`expanded-card-${i}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex flex-col items-center"
                        >
                          <Card
                            card={item.card}
                            isRevealed={true}
                            isReversed={item.isReversed}
                            width={100}
                            height={155}
                            className="shadow-lg"
                          />
                          <span className="text-[10px] text-amber-400 mt-2 font-bold uppercase tracking-wider text-center max-w-[100px]">
                            {language === 'en' ? spread.positionMeaningsEn[i] : spread.positionMeaningsFr[i]}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 text-center max-w-[100px] truncate">
                            {language === 'en' ? item.card.nameEn : item.card.nameFr}
                            {item.isReversed && (language === 'en' ? ' (R)' : ' (R)')}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* The Oracle's Interpretation - Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Decorative header */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50"></div>
              <span className="text-xs font-bold text-amber-500/70 uppercase tracking-[0.2em]">
                {language === 'en' ? 'The Oracle Speaks' : 'L\'Oracle Parle'}
              </span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50"></div>
            </div>

            {/* Reading content box */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-purple-500/20 rounded-2xl p-6 md:p-10 shadow-[0_0_60px_rgba(139,92,246,0.1)]">
              <div className="prose prose-invert max-w-none">
                {readingText.split('\n').map((line, i) => {
                  if (!line.trim()) return null;
                  if (line.startsWith('**')) {
                    return (
                      <h3 key={`line-${i}`} className="text-lg md:text-xl font-bold text-amber-200 mt-6 mb-3 first:mt-0">
                        {line.replace(/\*\*/g, '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('#')) {
                    return (
                      <h2 key={`line-${i}`} className="text-xl md:text-2xl font-bold text-purple-300 mt-8 mb-4 first:mt-0">
                        {line.replace(/#/g, '').trim()}
                      </h2>
                    );
                  }
                  return (
                    <p key={`line-${i}`} className="text-slate-300 leading-relaxed mb-4 text-base md:text-lg">
                      {line.replace(/\*\*/g, '')}
                    </p>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="mt-10 pt-6 border-t border-white/10 flex justify-center">
                <Button onClick={onFinish} variant="secondary">
                  {language === 'en' ? 'Start New Reading' : 'Nouvelle Lecture'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Reflection prompt */}
          <ReflectionPrompt
            readingId={backendReadingId}
            onSave={handleSaveReflection}
          />

          {/* Oracle Chat for follow-up questions */}
          <OracleChat
            language={language}
            credits={user?.credits || 0}
            chatHistory={chatHistory}
            chatInput={chatInput}
            isChatLoading={isChatLoading}
            questionCost={getQuestionCost()}
            onInputChange={handleChatInputChange}
            onSendMessage={handleSendMessage}
          />
        </>
      )}

      {/* Reading completion celebration with mystery bonus chance */}
      <ReadingCompleteCelebration
        isActive={showCelebration}
        onComplete={handleCelebrationComplete}
        spreadName={language === 'en' ? spread.nameEn : spread.nameFr}
      />
    </div>
  );
};

export default ActiveReading;
