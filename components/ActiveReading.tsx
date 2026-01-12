import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { SpreadConfig, InterpretationStyle, TarotCard, SpreadType } from '../types';
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
import { Sparkles, Settings, Check, AlertCircle, ChevronDown, ChevronUp, Quote, Eye, Clock, Heart, TrendingUp, Compass } from 'lucide-react';

// ============================================
// SPREAD READING THEMES - Unique visual identity per spread
// ============================================
interface SpreadTheme {
  name: string;
  taglineEn: string;
  taglineFr: string;
  icon: React.ReactNode;
  // Colors
  primary: string;       // Main accent color
  secondary: string;     // Secondary accent
  glow: string;          // Glow color for effects
  bgGradient: string;    // Background gradient
  cardBorder: string;    // Card border color
  textAccent: string;    // Text accent class
  // Background effects
  pattern?: string;      // SVG pattern URL
  atmosphereClass: string; // Additional atmosphere styling
}

const SPREAD_THEMES: Record<SpreadType, SpreadTheme> = {
  [SpreadType.SINGLE]: {
    name: "Oracle's Eye",
    taglineEn: "One card. Infinite clarity.",
    taglineFr: "Une carte. Clarté infinie.",
    icon: <Eye className="w-5 h-5" />,
    primary: 'rgb(34, 211, 238)',      // cyan-400
    secondary: 'rgb(99, 102, 241)',     // indigo-500
    glow: 'rgba(34, 211, 238, 0.3)',
    bgGradient: 'from-indigo-950 via-slate-900 to-indigo-950',
    cardBorder: 'border-cyan-500/50',
    textAccent: 'text-cyan-300',
    atmosphereClass: 'single-card-atmosphere',
  },
  [SpreadType.THREE_CARD]: {
    name: "River of Time",
    taglineEn: "Past flows into future.",
    taglineFr: "Le passé coule vers l'avenir.",
    icon: <Clock className="w-5 h-5" />,
    primary: 'rgb(232, 121, 249)',      // fuchsia-400
    secondary: 'rgb(192, 38, 211)',     // fuchsia-600
    glow: 'rgba(232, 121, 249, 0.3)',
    bgGradient: 'from-fuchsia-950 via-purple-900 to-fuchsia-950',
    cardBorder: 'border-fuchsia-500/50',
    textAccent: 'text-fuchsia-300',
    atmosphereClass: 'three-card-atmosphere',
  },
  [SpreadType.LOVE]: {
    name: "Heart's Sanctum",
    taglineEn: "Where hearts reveal their truth.",
    taglineFr: "Où les cœurs révèlent leur vérité.",
    icon: <Heart className="w-5 h-5" />,
    primary: 'rgb(244, 63, 94)',        // rose-500
    secondary: 'rgb(251, 113, 133)',    // rose-400
    glow: 'rgba(244, 63, 94, 0.25)',
    bgGradient: 'from-rose-950 via-pink-900 to-rose-950',
    cardBorder: 'border-rose-500/50',
    textAccent: 'text-rose-300',
    atmosphereClass: 'love-atmosphere',
  },
  [SpreadType.CAREER]: {
    name: "The Ascent",
    taglineEn: "Chart your path to success.",
    taglineFr: "Tracez votre chemin vers le succès.",
    icon: <TrendingUp className="w-5 h-5" />,
    primary: 'rgb(253, 224, 71)',       // yellow-300
    secondary: 'rgb(245, 158, 11)',     // amber-500
    glow: 'rgba(253, 224, 71, 0.35)',
    bgGradient: 'from-yellow-950 via-amber-900 to-yellow-950',
    cardBorder: 'border-yellow-400/50',
    textAccent: 'text-yellow-300',
    atmosphereClass: 'career-atmosphere',
  },
  [SpreadType.HORSESHOE]: {
    name: "Fortune's Arc",
    taglineEn: "Seven steps to destiny.",
    taglineFr: "Sept pas vers le destin.",
    icon: <Sparkles className="w-5 h-5" />,
    primary: 'rgb(96, 165, 250)',       // blue-400
    secondary: 'rgb(59, 130, 246)',     // blue-500
    glow: 'rgba(96, 165, 250, 0.3)',
    bgGradient: 'from-blue-950 via-indigo-900 to-blue-950',
    cardBorder: 'border-blue-500/50',
    textAccent: 'text-blue-300',
    atmosphereClass: 'horseshoe-atmosphere',
  },
  [SpreadType.CELTIC_CROSS]: {
    name: "Ancient Wisdom",
    taglineEn: "The complete picture revealed.",
    taglineFr: "Le tableau complet révélé.",
    icon: <Compass className="w-5 h-5" />,
    primary: 'rgb(52, 211, 153)',       // emerald-400
    secondary: 'rgb(20, 184, 166)',     // teal-500
    glow: 'rgba(52, 211, 153, 0.25)',
    bgGradient: 'from-emerald-950 via-teal-900 to-emerald-950',
    cardBorder: 'border-emerald-500/50',
    textAccent: 'text-emerald-300',
    atmosphereClass: 'celtic-atmosphere',
  },
};

// Themed background component for the reading experience
const ThemedBackground: React.FC<{ spreadType: SpreadType }> = ({ spreadType }) => {
  const theme = SPREAD_THEMES[spreadType];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient}`} />

      {/* Spread-specific atmospheric effects */}
      {spreadType === SpreadType.SINGLE && (
        <>
          {/* Central eye/spotlight effect */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute inset-[100px] bg-cyan-400/5 rounded-full blur-2xl" />
          </div>
          {/* Radiating circles */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute border border-cyan-500/10 rounded-full"
                style={{
                  width: `${200 + i * 150}px`,
                  height: `${200 + i * 150}px`,
                  left: `${-(100 + i * 75)}px`,
                  top: `${-(100 + i * 75)}px`,
                  animation: `pulse ${3 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {spreadType === SpreadType.THREE_CARD && (
        <>
          {/* Horizontal time flow gradient - fuchsia/purple */}
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-950/30 via-purple-900/20 to-fuchsia-950/30" />
          {/* Flowing lines - fuchsia */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-fuchsia-500/30 via-purple-400/40 to-fuchsia-500/30" />
          <div className="absolute top-[48%] left-0 right-0 h-px bg-gradient-to-r from-fuchsia-500/20 via-transparent to-fuchsia-500/20" />
          <div className="absolute top-[52%] left-0 right-0 h-px bg-gradient-to-r from-fuchsia-500/20 via-transparent to-fuchsia-500/20" />
          {/* Time orbs - fuchsia/magenta tones */}
          <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/15 rounded-full blur-2xl" />
          <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl" />
        </>
      )}

      {spreadType === SpreadType.LOVE && (
        <>
          {/* Warm romantic glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-rose-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-red-500/10 rounded-full blur-3xl" />
          {/* Subtle heart shapes using CSS */}
          <div className="absolute top-[20%] left-[10%] w-8 h-8 opacity-10"
               style={{
                 background: 'rgb(244, 63, 94)',
                 transform: 'rotate(-45deg)',
                 borderRadius: '50% 50% 0 50%',
               }} />
          <div className="absolute bottom-[30%] right-[15%] w-6 h-6 opacity-10"
               style={{
                 background: 'rgb(251, 113, 133)',
                 transform: 'rotate(-45deg)',
                 borderRadius: '50% 50% 0 50%',
               }} />
        </>
      )}

      {spreadType === SpreadType.CAREER && (
        <>
          {/* Upward-pointing geometric elements - bright gold */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-yellow-500/10 to-transparent" />
          {/* Warm golden ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-yellow-900/10" />
          {/* Diagonal ascending lines - golden */}
          <svg className="absolute inset-0 w-full h-full opacity-15" preserveAspectRatio="none">
            <defs>
              <linearGradient id="career-line" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(253, 224, 71)" stopOpacity="0" />
                <stop offset="50%" stopColor="rgb(253, 224, 71)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(253, 224, 71)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1={`${10 + i * 30}%`}
                y1="100%"
                x2={`${40 + i * 30}%`}
                y2="20%"
                stroke="url(#career-line)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          {/* Achievement glow at top - bright gold */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-yellow-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-[200px] h-[200px] bg-amber-500/10 rounded-full blur-3xl" />
        </>
      )}

      {spreadType === SpreadType.HORSESHOE && (
        <>
          {/* Arc-shaped glow - deep blue/sapphire */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]">
            <div
              className="absolute inset-0 border-t-4 border-l-4 border-r-4 border-blue-500/20 rounded-t-full"
              style={{ borderBottom: 'none' }}
            />
          </div>
          {/* Sparkle points along the arc - sapphire */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const angle = (Math.PI * i) / 6;
            const x = 50 + Math.cos(angle) * 35;
            const y = 60 - Math.sin(angle) * 25;
            return (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400/30 rounded-full blur-sm"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  animation: `pulse ${2 + i * 0.3}s ease-in-out infinite`,
                }}
              />
            );
          })}
          {/* Central fortune glow - sapphire blue */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-3xl" />
        </>
      )}

      {spreadType === SpreadType.CELTIC_CROSS && (
        <>
          {/* Subtle emerald/teal atmosphere - no heavy pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-teal-950/20" />
          {/* Cross glow at center - emerald */}
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-[200px] h-[400px] bg-teal-500/10 blur-3xl" />
          {/* Subtle mystical edges - emerald tone */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-950/30 via-emerald-950/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-950/30 via-emerald-950/10 to-transparent" />
          {/* Soft corner accents */}
          <div className="absolute top-[20%] left-[10%] w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-teal-500/5 rounded-full blur-3xl" />
        </>
      )}

      {/* Subtle noise texture overlay for all themes */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
};

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

  // Get current theme based on spread type
  const theme = SPREAD_THEMES[spread.id];

  // Render based on phase
  if (phase === 'animating_shuffle') {
    return <ReadingShufflePhase language={language} onStop={handleShuffleStop} spreadType={spread.id} />;
  }

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center px-4 py-6 md:py-8 relative min-h-screen">
        {/* Themed Background */}
        <ThemedBackground spreadType={spread.id} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg relative z-10"
        >
          {/* Themed Spread Header */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 mb-3`}>
              <span className={theme.textAccent}>{theme.icon}</span>
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{theme.name}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
              {language === 'en' ? spread.nameEn : spread.nameFr}
            </h2>
            <p className={`text-sm ${theme.textAccent} italic`}>
              {language === 'en' ? theme.taglineEn : theme.taglineFr}
            </p>
          </div>

          {/* Spread Info Bar */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider">
                {spread.positions} {language === 'en' ? 'cards' : 'cartes'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xl font-heading ${theme.textAccent}`}>{totalCost}</span>
              <span className="text-slate-500 text-xs">
                {language === 'en' ? 'credits' : 'crédits'}
              </span>
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
      <div className="flex flex-col items-center px-4 py-6 md:py-10 relative min-h-screen">
        {/* Themed Background */}
        <ThemedBackground spreadType={spread.id} />

        {/* Header with progress */}
        <div className="w-full max-w-2xl mb-6 relative z-10">
          {/* Theme badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10">
              <span className={theme.textAccent}>{theme.icon}</span>
              <span className="text-xs text-white/50 uppercase tracking-wider">{theme.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg md:text-xl font-heading text-white">
                {language === 'en' ? 'Draw Your Cards' : 'Tirez Vos Cartes'}
              </h3>
              <p className={`text-xs md:text-sm ${theme.textAccent} opacity-70`}>
                {language === 'en' ? spread.nameEn : spread.nameFr}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-heading ${theme.textAccent}`}>{cardsRemaining}</span>
              <p className="text-slate-500 text-xs">
                {language === 'en' ? 'remaining' : 'restantes'}
              </p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full"
              style={{ background: `linear-gradient(to right, ${theme.secondary}, ${theme.primary})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main drawing area */}
        <div className="w-full max-w-3xl relative z-10">
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
                  className={`absolute w-[90px] h-[140px] md:w-[110px] md:h-[170px] rounded-lg bg-slate-900/90 ${theme.cardBorder}`}
                  style={{ top: -i * 2, left: -i * 2, zIndex: 5 - i }}
                />
              ))}
              {/* Top card */}
              <div
                className={`relative z-10 w-[90px] h-[140px] md:w-[110px] md:h-[170px] rounded-lg bg-gradient-to-br ${theme.bgGradient} border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300`}
                style={{
                  borderColor: theme.primary,
                  boxShadow: `0 0 25px ${theme.glow}`,
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={theme.textAccent}
                >
                  <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
                </motion.div>
                <span className={`${theme.textAccent} font-heading text-sm md:text-base font-bold tracking-wider`}>
                  {language === 'en' ? 'TAP' : 'TOUCHER'}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Card slots grid */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-4 md:p-6">
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
                            ? `${theme.cardBorder} bg-white/5`
                            : 'border-white/10'
                      }`}
                      style={i === drawnCards.length ? { borderColor: `${theme.primary}50` } : {}}
                      >
                        <span className={`font-heading text-xl ${i === drawnCards.length ? theme.textAccent : 'text-white/15'}`} style={{ opacity: i === drawnCards.length ? 0.6 : 1 }}>
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
                            <div
                              className={`w-full h-full rounded-lg bg-gradient-to-br ${theme.bgGradient} border-2 shadow-lg flex items-center justify-center`}
                              style={{ borderColor: `${theme.primary}99` }}
                            >
                              <span className={`${theme.textAccent} font-heading text-lg`}>✓</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Position label */}
                    <span className={`text-[10px] md:text-xs text-center max-w-[80px] truncate ${
                      i < drawnCards.length ? theme.textAccent : 'text-slate-500'
                    }`} style={{ opacity: i < drawnCards.length ? 0.7 : 1 }}>
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
      <div className="flex flex-col items-center justify-center min-h-screen py-10 relative">
        {/* Themed Background */}
        <ThemedBackground spreadType={spread.id} />

        <div className="relative z-10 flex flex-col items-center">
          {/* Theme badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-white/10 mb-6"
          >
            <span className={theme.textAccent}>{theme.icon}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider">{theme.name}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-heading text-white mb-4"
          >
            {language === 'en' ? 'The cards are laid.' : 'Les cartes sont posées.'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`text-sm ${theme.textAccent} mb-12 italic`}
          >
            {language === 'en' ? theme.taglineEn : theme.taglineFr}
          </motion.p>

          <div className="flex gap-4 flex-wrap justify-center mb-12 max-w-5xl">
            {drawnCards.map((item, i) => (
              <motion.div
                key={`reveal-${i}`}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.15, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div
                  className="rounded-lg p-1"
                  style={{ boxShadow: `0 0 20px ${theme.glow}` }}
                >
                  <Card
                    card={item.card}
                    isRevealed={true}
                    isReversed={item.isReversed}
                    className="w-[100px] h-[160px] md:w-[140px] md:h-[220px]"
                  />
                </div>
                <p className={`text-center mt-4 ${theme.textAccent} font-heading text-xs uppercase tracking-widest max-w-[140px] truncate`}>
                  {language === 'en' ? spread.positionMeaningsEn[i] : spread.positionMeaningsFr[i]}
                </p>
                {item.isReversed && (
                  <p className="text-center text-[10px] text-white/50 uppercase tracking-wider">
                    {language === 'en' ? 'Reversed' : 'Renversée'}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + drawnCards.length * 0.15 + 0.3 }}
          >
            <Button
              onClick={startReading}
              size="lg"
              className="animate-bounce"
              style={{ boxShadow: `0 0 30px ${theme.glow}` }}
            >
              {language === 'en' ? 'Reveal Interpretation' : "Révéler l'Interprétation"}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Reading Phase
  return (
    <div className="relative min-h-screen">
      {/* Themed Background */}
      <ThemedBackground spreadType={spread.id} />

      <div className="container mx-auto max-w-4xl px-4 py-6 pb-32 relative z-10">
      {/* Loading State */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[50vh] py-12"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/20 rounded-full"></div>
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-spin"
              style={{ borderTopColor: theme.primary }}
            />
            <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${theme.textAccent}`}>
              {theme.icon}
            </span>
          </div>
          <motion.p
            key={loadingMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white font-heading text-xl mt-6"
          >
            {loadingMessages[loadingMessageIndex]}
          </motion.p>
          <p className={`text-sm mt-2 ${theme.textAccent} opacity-60`}>
            {language === 'en'
              ? 'Your personalized reading is being channeled...'
              : 'Votre lecture personnalisée est en cours de canalisation...'}
          </p>
        </motion.div>
      )}

      {/* Main Content - Only show when not generating */}
      {!isGenerating && (
        <>
          {/* Theme Header */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-white/10">
              <span className={theme.textAccent}>{theme.icon}</span>
              <span className="text-xs text-white/50 uppercase tracking-wider">{theme.name}</span>
              <span className="text-white/30">•</span>
              <span className="text-xs text-white/40">{language === 'en' ? spread.nameEn : spread.nameFr}</span>
            </div>
          </div>

          {/* Collapsible Reading Context Panel */}
          <div className="mb-4">
            <button
              onClick={() => setIsContextExpanded(!isContextExpanded)}
              className="w-full bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 hover:bg-black/40 transition-colors group"
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
                  <div className="bg-black/20 border-x border-b border-white/10 rounded-b-xl p-4 md:p-6 -mt-2">
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
                          <span className={`text-[10px] ${theme.textAccent} mt-2 font-bold uppercase tracking-wider text-center max-w-[100px]`}>
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
              <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${theme.primary}50)` }}></div>
              <span className={`text-xs font-bold ${theme.textAccent} uppercase tracking-[0.2em]`}>
                {language === 'en' ? 'The Oracle Speaks' : 'L\'Oracle Parle'}
              </span>
              <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${theme.primary}50)` }}></div>
            </div>

            {/* Reading content box */}
            <div
              className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-10"
              style={{ boxShadow: `0 0 60px ${theme.glow}` }}
            >
              <div className="prose prose-invert max-w-none">
                {readingText.split('\n').map((line, i) => {
                  if (!line.trim()) return null;
                  if (line.startsWith('**')) {
                    return (
                      <h3 key={`line-${i}`} className={`text-lg md:text-xl font-bold ${theme.textAccent} mt-6 mb-3 first:mt-0`}>
                        {line.replace(/\*\*/g, '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('#')) {
                    return (
                      <h2 key={`line-${i}`} className="text-xl md:text-2xl font-bold text-white mt-8 mb-4 first:mt-0">
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
    </div>
  );
};

export default ActiveReading;
