import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SpreadConfig, InterpretationStyle, TarotCard } from '../types';
import { FULL_DECK } from '../constants';
import { generateTarotReading, generateFollowUpReading } from '../services/openrouterService';
import { shuffleDeck } from '../utils/shuffle';
import Card from './Card';
import Button from './Button';
import ReadingShufflePhase from './reading/ReadingShufflePhase';
import OracleChat from './reading/OracleChat';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Settings, Check, AlertCircle } from 'lucide-react';

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
  const { language, user, deductCredits, addToHistory } = useApp();

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

  // Options state
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<InterpretationStyle[]>([InterpretationStyle.CLASSIC]);

  // Chat state
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'model', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sessionQuestionCount, setSessionQuestionCount] = useState(0);

  // Loading message state
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = useMemo(() => LOADING_MESSAGES[language], [language]);

  // Initialize deck with Fisher-Yates shuffle
  useEffect(() => {
    setDeck(shuffleDeck(FULL_DECK));
  }, []);

  // Regenerate reading when language changes (if one is already displayed)
  useEffect(() => {
    if (phase === 'reading' && readingText && readingLanguage !== language && !isGenerating) {
      regenerateReading();
    }
  }, [language]);

  const regenerateReading = async () => {
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
    return spread.cost + (isAdvanced ? 1 : 0);
  }, [spread.cost, isAdvanced]);

  const handleGeneralGuidance = useCallback(() => {
    setQuestion(language === 'en' ? "Guidance from the Tarot" : "Guidance du Tarot");
    setQuestionError(false);
    setValidationMessage(null);
  }, [language]);

  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    if (e.target.value) {
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

    setValidationMessage(null);

    const result = await deductCredits(totalCost);
    if (!result.success) {
      setValidationMessage(result.message || (language === 'en' ? "Transaction failed." : "La transaction a échoué."));
      return;
    }

    setPhase('animating_shuffle');
    setTimeout(() => setPhase('drawing'), 2500);
  }, [question, totalCost, deductCredits, language]);

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

    addToHistory({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      spreadType: spread.id,
      cards: drawnCards.map(c => c.card.id),
      interpretation: result,
      question
    });
  }, [drawnCards, spread, isAdvanced, selectedStyles, question, language, addToHistory]);

  const getQuestionCost = useCallback(() => {
    if (sessionQuestionCount === 0) return 0;
    const nextGlobalCount = (user?.totalQuestionsAsked || 0) + 1;
    if (nextGlobalCount % 5 === 0) return 0;
    return 1;
  }, [sessionQuestionCount, user?.totalQuestionsAsked]);

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

    const response = await generateFollowUpReading({
      context: readingText,
      history: chatHistory,
      newQuestion: userMsg,
      language
    });

    setChatHistory(prev => [...prev, { role: 'model', content: response }]);
    setIsChatLoading(false);
  }, [chatInput, isChatLoading, getQuestionCost, deductCredits, language, readingText, chatHistory]);

  const handleChatInputChange = useCallback((value: string) => {
    setChatInput(value);
  }, []);

  // Render based on phase
  if (phase === 'animating_shuffle') {
    return <ReadingShufflePhase language={language} />;
  }

  if (phase === 'intro') {
    const baseCost = spread.cost;
    const advancedCost = isAdvanced ? 1 : 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4 text-center pb-20 pt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-purple-500/20 w-full shadow-xl"
        >
          {/* 1. Intention Section */}
          <div className="mb-10">
            <h2 className={`text-2xl font-heading mb-2 transition-colors ${questionError ? 'text-red-400' : 'text-purple-100'}`}>
              {language === 'en' ? '1. Focus on your intent' : '1. Concentrez-vous sur votre intention'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {language === 'en'
                ? 'What question lays heavy on your heart? The cards answer best to open-ended inquiries.'
                : 'Quelle question pèse sur votre cœur ? Les cartes répondent mieux aux questions ouvertes.'}
            </p>

            <div className="flex flex-col gap-4">
              <div className="relative">
                <textarea
                  value={question}
                  onChange={handleQuestionChange}
                  placeholder={language === 'en' ? 'Type your question here...' : 'Écrivez votre question ici...'}
                  className={`w-full bg-slate-900/80 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-center text-lg min-h-[100px] resize-none transition-all ${
                    questionError
                      ? 'border-2 border-red-500 focus:ring-red-500/50'
                      : 'border border-purple-500/30 focus:border-amber-500 focus:ring-amber-500/50'
                  }`}
                />
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase tracking-widest">{language === 'en' ? 'OR' : 'OU'}</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                onClick={handleGeneralGuidance}
                className="group relative flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/30 hover:border-amber-500/60 text-amber-100 transition-all duration-300"
              >
                <div className="p-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20 text-amber-400 transition-colors">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium text-sm md:text-base">
                    {language === 'en' ? "I want to receive guidance/message from the Tarot" : "Je veux recevoir une guidance/message du Tarot"}
                  </span>
                  <span className="text-xs text-amber-400/70">
                    {language === 'en' ? "Ask for General Guidance from the Universe" : "Demander une Guidance Générale de l'Univers"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Mode Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-heading text-purple-200 mb-4">
              {language === 'en' ? '2. Select Reading Depth' : '2. Sélectionnez la Profondeur'}
            </h2>
            <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5">
              <div className="flex justify-center gap-4 mb-4">
                <button
                  onClick={() => setIsAdvanced(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${!isAdvanced ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {language === 'en' ? 'Standard' : 'Standard'}
                </button>
                <button
                  onClick={() => setIsAdvanced(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isAdvanced ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  <Settings className="w-4 h-4" />
                  {language === 'en' ? 'Advanced' : 'Avancé'}
                </button>
              </div>

              <AnimatePresence>
                {isAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left pt-2 pb-2">
                      {[
                        { id: InterpretationStyle.SPIRITUAL, labelEn: 'Spiritual', labelFr: 'Spirituel' },
                        { id: InterpretationStyle.PSYCHO_EMOTIONAL, labelEn: 'Psycho-Emotional', labelFr: 'Psycho-Émotionnel' },
                        { id: InterpretationStyle.NUMEROLOGY, labelEn: 'Numerology', labelFr: 'Numérologie' },
                        { id: InterpretationStyle.ELEMENTAL, labelEn: 'Suits & Elements', labelFr: 'Signes & Éléments' }
                      ].map((option) => (
                        <div
                          key={option.id}
                          onClick={() => toggleStyle(option.id)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border
                            ${selectedStyles.includes(option.id)
                              ? 'bg-amber-900/30 border-amber-500/50 text-amber-100'
                              : 'bg-slate-950/30 border-transparent text-slate-400 hover:bg-slate-800'}
                          `}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedStyles.includes(option.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-500'}`}>
                            {selectedStyles.includes(option.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm font-medium">{language === 'en' ? option.labelEn : option.labelFr}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 italic">
                      {language === 'en' ? 'Select multiple focus areas for a deeper reading.' : 'Sélectionnez plusieurs domaines pour une lecture plus approfondie.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 3. Cost Breakdown & Action */}
          <div className="flex flex-col gap-3 bg-slate-950/50 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center text-sm text-slate-400">
              <span>{language === 'en' ? 'Base Spread Cost:' : 'Coût de Base:'}</span>
              <span>{baseCost}</span>
            </div>
            {isAdvanced && (
              <div className="flex justify-between items-center text-sm text-amber-400">
                <span>{language === 'en' ? 'Advanced Options:' : 'Options Avancées:'}</span>
                <span>+{advancedCost}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold text-white border-t border-white/10 pt-2 mt-1 mb-2">
              <span>Total:</span>
              <span className="text-lg">{totalCost} {language === 'en' ? 'Credits' : 'Crédits'}</span>
            </div>

            {validationMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm mb-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationMessage}</span>
              </motion.div>
            )}

            <Button onClick={startShuffleAnimation} size="lg" className="w-full">
              {language === 'en' ? `Pay ${totalCost} Credits & Begin` : `Payer ${totalCost} Crédits & Commencer`}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'drawing') {
    const progressPercent = (drawnCards.length / spread.positions) * 100;

    return (
      <div className="flex flex-col items-center min-h-[80vh] py-10 relative">
        <div className="w-full max-w-md px-4 mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>{language === 'en' ? 'Progress' : 'Progression'}</span>
            <span>{drawnCards.length} / {spread.positions}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <h3 className="text-2xl font-heading text-purple-100 mb-2 animate-pulse">
          {language === 'en' ? 'Draw a Card' : 'Tirez une Carte'}
        </h3>
        <p className="text-slate-400 mb-8 text-sm">
          {language === 'en'
            ? 'Tap on the deck to reveal your destiny'
            : 'Appuyez sur le paquet pour révéler votre destin'}
        </p>

        <div className="relative w-full max-w-5xl h-[500px] bg-slate-900/30 rounded-3xl border border-purple-900/30 shadow-inner flex items-center justify-center overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:left-20 md:translate-x-0 z-20">
            <motion.div
              className="relative cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCardDraw}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`deck-stack-${i}`}
                  className="absolute w-[120px] h-[190px] md:w-[150px] md:h-[240px] rounded-xl bg-indigo-900 border border-amber-600/50 shadow-xl"
                  style={{ top: -i * 1.5, left: -i * 1.5, zIndex: 5 - i }}
                />
              ))}
              <div className="relative z-10 w-[120px] h-[190px] md:w-[150px] md:h-[240px] rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center group-hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all">
                <div className="text-amber-500/80 font-heading text-lg font-bold border-2 border-amber-500/30 px-3 py-1 rounded">
                  {language === 'en' ? 'DRAW' : 'TIRER'}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute inset-0 flex flex-wrap gap-4 items-center justify-center md:pl-[250px] p-4 overflow-y-auto">
            {Array.from({ length: spread.positions }).map((_, i) => (
              <div key={`slot-${i}`} className="relative w-[100px] h-[160px] md:w-[120px] md:h-[190px] flex-shrink-0">
                <div className={`absolute inset-0 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center transition-opacity duration-500 ${i < drawnCards.length ? 'opacity-0' : 'opacity-100'}`}>
                  <span className="text-white/20 font-heading text-2xl">{i + 1}</span>
                </div>

                <AnimatePresence>
                  {i < drawnCards.length && (
                    <motion.div
                      initial={{ x: -200, y: 0, opacity: 0, scale: 0.5, rotateY: 180 }}
                      animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotateY: 0 }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      className="absolute inset-0"
                    >
                      <div
                        className="w-full h-full rounded-xl bg-indigo-900 border-2 border-amber-600/60 shadow-lg backface-hidden"
                        style={{ backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
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
    <div className="container mx-auto max-w-4xl py-12 px-4 pb-32">
      <div className="mb-8 text-center">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
          {language === 'en' ? 'Your Inquiry' : 'Votre Question'}
        </h3>
        <p className="text-2xl font-heading text-amber-100 italic">
          "{question}"
        </p>
      </div>

      <div className="flex justify-center gap-6 flex-wrap pb-8 mb-8 border-b border-white/10">
        <div className="w-full text-center mb-4">
          <h3 className="text-xl font-heading text-amber-200/80 border-b border-white/5 pb-2 inline-block">
            {language === 'en' ? 'Your Cards' : 'Vos Cartes'}
          </h3>
        </div>
        {drawnCards.map((item, i) => (
          <motion.div
            key={`result-card-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="relative group">
              <Card
                card={item.card}
                isRevealed={true}
                isReversed={item.isReversed}
                width={140}
                height={220}
                className="shadow-2xl"
              />
            </div>
            <span className="text-xs text-amber-400 mt-3 font-bold uppercase tracking-wider">
              {language === 'en' ? spread.positionMeaningsEn[i] : spread.positionMeaningsFr[i]}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {language === 'en' ? item.card.nameEn : item.card.nameFr}
              {item.isReversed && (language === 'en' ? ' (Rev.)' : ' (Ren.)')}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-8 md:p-12 shadow-2xl mb-12">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-amber-400 rounded-full animate-spin"></div>
            <motion.p
              key={loadingMessageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-purple-200 font-heading text-lg transition-all duration-300"
            >
              {loadingMessages[loadingMessageIndex]}
            </motion.p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-slate-300">
              {readingText.split('\n').map((line, i) => {
                if (line.startsWith('**')) return <h3 key={`line-${i}`} className="text-xl font-bold text-amber-200 mt-6 mb-2">{line.replace(/\*\*/g, '')}</h3>;
                if (line.startsWith('#')) return <h2 key={`line-${i}`} className="text-2xl font-bold text-purple-300 mt-8 mb-4">{line.replace(/#/g, '')}</h2>;
                return <p key={`line-${i}`} className="mb-4">{line.replace(/\*\*/g, '')}</p>;
              })}
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 flex justify-center">
              <Button onClick={onFinish} variant="secondary">
                {language === 'en' ? 'Start New Reading' : 'Nouvelle Lecture'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {!isGenerating && (
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
      )}
    </div>
  );
};

export default ActiveReading;
