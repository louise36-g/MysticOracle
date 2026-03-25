import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Sparkles, Star, ArrowRight, Coins } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { FULL_DECK } from '../constants';
import { shuffleDeck } from '../utils/shuffle';
import { getCardImageUrl } from '../constants/cardImages';
import { fetchYesNoCards, purchaseThreeCardSpread, interpretYesNoCard, interpretThreeCardSpread } from '../services/api/yesNo';
import type { YesNoCardMap, YesNoCardData } from '../services/api/yesNo';
import { ROUTES } from '../routes/routes';
import { SEOTags } from '../utils/seo';
import Button from './Button';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

type Phase =
  | 'question'
  | 'shuffling'
  | 'drawing'
  | 'revealed'
  | 'three-card-intro'
  | 'three-card-shuffling'
  | 'three-card-revealed';

const theme = {
  accent: '#a78bfa',
  glow: '#8b5cf6',
  border: '#f59e0b',
};

const NUM_SHUFFLE_CARDS = 7;
const SHUFFLE_DURATION = 4000;

const DAILY_DRAW_KEY = 'celestiarcana_yesno_draw';

const THREE_CARD_LABELS = {
  en: ['Energy Around You', 'Obstacle or Opportunity', 'Likely Outcome'],
  fr: ['Énergie Autour de Vous', 'Obstacle ou Opportunité', 'Résultat Probable'],
};

const VERDICT_COLORS: Record<string, string> = {
  YES: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  NO: 'bg-red-500/20 text-red-300 border-red-500/40',
  UNCLEAR: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  WAIT: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

// ─────────────────────────────────────────────
// Shared sub-components (same as DailyTarotEnergy)
// ─────────────────────────────────────────────

const FloatingStar: React.FC<{
  size: number; x: string; y: string; delay: number; duration: number;
}> = ({ size, x, y, delay, duration }) => (
  <motion.div
    className="absolute text-amber-300/40"
    style={{ left: x, top: y }}
    animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1], y: [0, -8, 0] }}
    transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
    </svg>
  </motion.div>
);

const ParticleBurst: React.FC = () => {
  const particles = [...Array(12)].map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 60 + Math.random() * 30;
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, scale: 0.5 + Math.random() * 0.5, delay: i * 0.02 };
  });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: theme.border }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale }}
          transition={{ duration: 0.8, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const CardBack: React.FC<{ style?: React.CSSProperties; className?: string }> = ({ style, className = '' }) => (
  <div
    style={style}
    className={`w-14 h-20 md:w-16 md:h-24 rounded-lg bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 shadow-xl border-2 border-amber-500/50 ${className}`}
  >
    <div className="w-full h-full flex items-center justify-center relative rounded-md overflow-hidden">
      <div className="absolute inset-1 border border-amber-500/30 rounded-sm" />
      <img src="/logos/card-back-moon.webp" alt="" className="w-8 h-8 md:w-10 md:h-10 object-contain relative z-10" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

interface SavedDraw {
  date: string;
  cardId: number;
  isReversed: boolean;
  question: string;
  interpretation?: string;
  seen?: boolean;
}

function getSavedDraw(): SavedDraw | null {
  try {
    const raw = localStorage.getItem(DAILY_DRAW_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.date === getTodayString() && typeof data.cardId === 'number') return data;
    return null;
  } catch { return null; }
}

function saveDraw(cardId: number, isReversed: boolean, question: string): void {
  try {
    localStorage.setItem(DAILY_DRAW_KEY, JSON.stringify({
      date: getTodayString(), cardId, isReversed, question,
    }));
  } catch { /* non-blocking */ }
}

/**
 * Map a FULL_DECK card id (0-77) to the article key format (cardType:cardNumber)
 * used in the backend yes/no card map.
 */
function cardIdToArticleKey(id: number): string {
  if (id <= 21) {
    return `MAJOR_ARCANA:${id}`;
  }
  const minorIndex = id - 22;
  const suitIndex = Math.floor(minorIndex / 14);
  const rank = (minorIndex % 14) + 1; // 1=Ace, 2-10, 11=Page, 12=Knight, 13=Queen, 14=King
  const suits = ['SUIT_OF_WANDS', 'SUIT_OF_CUPS', 'SUIT_OF_SWORDS', 'SUIT_OF_PENTACLES'];
  return `${suits[suitIndex]}:${rank}`;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const YesNoReading: React.FC = () => {
  const { language, refreshUser } = useApp();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // Phases
  const [phase, setPhase] = useState<Phase>('question');
  const [shufflePhase, setShufflePhase] = useState(0);
  const [canDraw, setCanDraw] = useState(false);
  const [showParticleBurst, setShowParticleBurst] = useState(false);

  // Question
  const [question, setQuestion] = useState('');

  // Single card draw
  const [drawnCard, setDrawnCard] = useState<typeof FULL_DECK[0] | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);

  // Card data from API
  const [cardData, setCardData] = useState<YesNoCardMap | null>(null);
  const [cardInfo, setCardInfo] = useState<YesNoCardData | null>(null);

  // AI interpretation
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isRestoredDraw, setIsRestoredDraw] = useState(false);

  // 3-card spread
  const [threeCards, setThreeCards] = useState<Array<{ card: typeof FULL_DECK[0]; isReversed: boolean; info: YesNoCardData }>>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [threeCardError, setThreeCardError] = useState('');
  const [isLoadingThreeCard, setIsLoadingThreeCard] = useState(false);
  const [threeCardInterpretation, setThreeCardInterpretation] = useState<string | null>(null);

  // ── Fetch card data on mount ──
  useEffect(() => {
    fetchYesNoCards()
      .then(data => { setCardData(data); })
      .catch(() => { /* non-blocking */ });
  }, []);

  // ── Restore saved draw on mount ──
  useEffect(() => {
    const saved = getSavedDraw();
    if (saved) {
      const card = FULL_DECK.find(c => c.id === saved.cardId);
      if (card) {
        setDrawnCard(card);
        setIsReversed(saved.isReversed);
        setQuestion(saved.question);
        setIsCardRevealed(true);
        setPhase('revealed');
        // Only show "cards have spoken" message if the user already saw this reading once
        setIsRestoredDraw(!!saved.seen);
        // Restore cached AI interpretation if available
        if (saved.interpretation) {
          setAiInterpretation(saved.interpretation);
        }
        // Mark as seen for next visit
        if (!saved.seen) {
          try {
            saved.seen = true;
            localStorage.setItem(DAILY_DRAW_KEY, JSON.stringify(saved));
          } catch { /* non-blocking */ }
        }
      }
    }
  }, []);

  // ── Set card info when card is revealed or data arrives ──
  useEffect(() => {
    if (!drawnCard || !isCardRevealed || !cardData) return;
    const key = cardIdToArticleKey(drawnCard.id);
    const info = cardData[key];
    if (info) setCardInfo(info);
  }, [drawnCard, isCardRevealed, cardData]);

  // ── Fetch AI interpretation after fresh card reveal ──
  useEffect(() => {
    if (!drawnCard || !isCardRevealed || isRestoredDraw || aiInterpretation) return;
    if (!question.trim()) return;

    const cardKey = cardIdToArticleKey(drawnCard.id);
    setIsLoadingAI(true);

    interpretYesNoCard({
      question,
      cardKey,
      isReversed,
      language: language as 'en' | 'fr',
    })
      .then(result => {
        setAiInterpretation(result.interpretation);
        // Cache the interpretation in localStorage alongside the draw
        try {
          const raw = localStorage.getItem(DAILY_DRAW_KEY);
          if (raw) {
            const data = JSON.parse(raw);
            data.interpretation = result.interpretation;
            localStorage.setItem(DAILY_DRAW_KEY, JSON.stringify(data));
          }
        } catch { /* non-blocking */ }
      })
      .catch(() => { /* graceful degradation — static data still shows */ })
      .finally(() => setIsLoadingAI(false));
  }, [drawnCard, isCardRevealed, isRestoredDraw, aiInterpretation, question, isReversed, language]);

  // ── Shuffle animation cycling ──
  useEffect(() => {
    if (phase !== 'shuffling' && phase !== 'three-card-shuffling') return;
    const interval = setInterval(() => setShufflePhase(prev => (prev + 1) % 3), 2400);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Min shuffle duration ──
  useEffect(() => {
    if (phase !== 'shuffling' && phase !== 'three-card-shuffling') return;
    const timer = setTimeout(() => {
      setCanDraw(true);
      setShowParticleBurst(true);
      setTimeout(() => setShowParticleBurst(false), 1000);
    }, SHUFFLE_DURATION);
    return () => clearTimeout(timer);
  }, [phase]);

  // ── Shuffle animation positions ──
  const getCardAnimation = (index: number) => {
    const centerIndex = Math.floor(NUM_SHUFFLE_CARDS / 2);
    const offset = index - centerIndex;
    switch (shufflePhase) {
      case 0: {
        const spreadAngle = 70;
        const startAngle = -spreadAngle / 2;
        const angleStep = spreadAngle / (NUM_SHUFFLE_CARDS - 1);
        const angle = startAngle + index * angleStep;
        const rad = (angle * Math.PI) / 180;
        const radius = 120;
        return {
          x: [0, Math.sin(rad) * radius, 0],
          y: [0, -Math.cos(rad) * radius + radius * 0.3, 0],
          rotate: [0, angle * 0.6, 0],
          scale: [1, 1.05, 1],
        };
      }
      case 1:
        return { x: [0, offset * 25, 0], y: [0, Math.abs(offset) * 15, 0], rotate: [0, offset * 8, 0], scale: [1, 1, 1] };
      case 2: {
        const isLeft = index % 2 === 0;
        return { x: [0, isLeft ? -40 : 40, 0], y: [0, -20 + index * 5, 0], rotate: [0, isLeft ? -10 : 10, 0], scale: [1, 1.02, 1] };
      }
      default:
        return { x: 0, y: 0, rotate: 0, scale: 1 };
    }
  };

  // ── Handlers ──

  const handleAskCards = useCallback(() => {
    setPhase('shuffling');
    setCanDraw(false);
    setShowParticleBurst(false);
    setAiInterpretation(null);
    setIsRestoredDraw(false);
    setThreeCardInterpretation(null);
  }, []);

  const handleDraw = useCallback(() => {
    const shuffled = shuffleDeck([...FULL_DECK]);
    const card = shuffled[0];
    const reversed = Math.random() < 0.10;

    setDrawnCard(card);
    setIsReversed(reversed);
    setPhase('drawing');
    saveDraw(card.id, reversed, question);

    setTimeout(() => {
      setIsCardRevealed(true);
      setPhase('revealed');
    }, 600);
  }, [question]);

  const handleGoDeeper = useCallback(async () => {
    if (!isSignedIn) {
      navigate(ROUTES.SIGN_IN);
      return;
    }

    setThreeCardError('');
    setIsLoadingThreeCard(true);

    try {
      const token = await getToken();
      if (!token) {
        navigate(ROUTES.SIGN_IN);
        return;
      }

      // Draw 3 new cards (excluding the already-drawn card)
      const available = FULL_DECK.filter(c => c.id !== drawnCard?.id);
      const shuffled = shuffleDeck([...available]);
      const drawn = shuffled.slice(0, 3).map(card => ({
        card,
        isReversed: Math.random() < 0.10,
      }));

      const cardKeys = drawn.map(d => cardIdToArticleKey(d.card.id)) as [string, string, string];

      // Fast API call — just card data + credit deduction, no AI
      const result = await purchaseThreeCardSpread(token, cardKeys);

      setThreeCards(drawn.map((d, i) => ({
        ...d,
        info: result.cards[i],
      })));

      refreshUser();
      setRevealedCount(0);
      setThreeCardInterpretation(null);
      setPhase('three-card-shuffling');
      setCanDraw(false);
      setShowParticleBurst(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      console.error('[YesNo 3-card] Error:', message);
      if (message.includes('Insufficient') || message.includes('402') || message.includes('credit')) {
        setThreeCardError(language === 'en'
          ? 'You need 1 credit for the 3-card spread. Top up your credits to continue.'
          : 'Vous avez besoin d\'1 crédit pour le tirage à 3 cartes. Rechargez vos crédits pour continuer.');
      } else {
        setThreeCardError(language === 'en'
          ? `Something went wrong: ${message}. Please try again.`
          : `Une erreur est survenue : ${message}. Veuillez réessayer.`);
      }
    } finally {
      setIsLoadingThreeCard(false);
    }
  }, [isSignedIn, drawnCard, getToken, navigate, language, refreshUser]);

  // Draw the 3 cards after shuffle completes
  const handleDrawThreeCards = useCallback(() => {
    setPhase('three-card-revealed');
    // Reveal each card with a delay
    [0, 1, 2].forEach((i) => {
      setTimeout(() => setRevealedCount(i + 1), i * 800);
    });

    // Fetch AI interpretation in background after cards drawn
    (async () => {
      try {
        const token = await getToken();
        if (!token || !question.trim()) return;

        const cardKeys = threeCards.map(tc => cardIdToArticleKey(tc.card.id));
        const reversedFlags = threeCards.map(tc => tc.isReversed);

        const result = await interpretThreeCardSpread(token, {
          question,
          cardKeys,
          isReversed: reversedFlags,
          language: language as 'en' | 'fr',
        });

        setThreeCardInterpretation(result.interpretation);
      } catch {
        // Graceful degradation — static data still shows
      }
    })();
  }, [getToken, question, threeCards, language]);

  // ── Derived values ──

  const cardImageUrl = drawnCard ? getCardImageUrl(drawnCard.id) : '';
  const cardName = drawnCard ? (language === 'en' ? drawnCard.nameEn : drawnCard.nameFr) : '';

  // Hide the yes/no text when reversed — it describes the upright verdict and would contradict the flipped badge
  const yesNoText = cardInfo && !isReversed
    ? (language === 'en' ? cardInfo.yesNoEn : cardInfo.yesNoFr)
    : '';
  const coreMeaning = cardInfo
    ? (language === 'en' ? cardInfo.coreMeaningEn : cardInfo.coreMeaningFr)
    : '';
  const meaningText = cardInfo
    ? (isReversed
      ? (language === 'en' ? cardInfo.reversedEn : cardInfo.reversedFr)
      : (language === 'en' ? cardInfo.uprightEn : cardInfo.uprightFr))
    : '';
  const bestAdvice = cardInfo
    ? (language === 'en' ? cardInfo.bestAdviceEn : cardInfo.bestAdviceFr)
    : '';
  const rawVerdict = cardInfo?.verdict || 'UNCLEAR';
  // Reversed cards flip the verdict: YES ↔ NO, UNCLEAR/WAIT stay the same
  const verdict = isReversed
    ? (rawVerdict === 'YES' ? 'NO' : rawVerdict === 'NO' ? 'YES' : rawVerdict)
    : rawVerdict;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Helmet>
        <title>{language === 'en'
          ? 'Free Yes/No Tarot Reading — Get Your Answer | CelestiArcana'
          : 'Tirage Oui/Non Tarot Gratuit — Obtenez Votre Réponse | CelestiArcana'
        }</title>
        <meta name="description" content={language === 'en'
          ? 'Ask any yes or no question and draw a tarot card for your answer. Free daily yes/no tarot card reading with optional 3-card spread for deeper insight.'
          : 'Posez une question oui ou non et tirez une carte de tarot pour votre réponse. Tirage oui/non quotidien gratuit avec tirage à 3 cartes en option.'
        } />
        <link rel="canonical" href="https://celestiarcana.com/yes-no" />
        <meta property="og:title" content={language === 'en' ? 'Free Yes/No Tarot Reading | CelestiArcana' : 'Tirage Oui/Non Tarot Gratuit | CelestiArcana'} />
        <meta property="og:description" content={language === 'en'
          ? 'Ask any yes or no question and draw a tarot card for your answer.'
          : 'Posez une question oui ou non et tirez une carte de tarot.'
        } />
        <meta property="og:url" content="https://celestiarcana.com/yes-no" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <SEOTags path="/yes-no" />

      {/* Background */}
      <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-violet-500/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-amber-500/3 rounded-full blur-[80px]" />
        <FloatingStar size={12} x="10%" y="15%" delay={0} duration={4} />
        <FloatingStar size={8} x="85%" y="20%" delay={1.5} duration={5} />
        <FloatingStar size={10} x="20%" y="70%" delay={0.8} duration={4.5} />
        <FloatingStar size={6} x="75%" y="65%" delay={2} duration={3.5} />
        <FloatingStar size={14} x="50%" y="85%" delay={0.5} duration={5.5} />
        <FloatingStar size={8} x="30%" y="40%" delay={1.2} duration={4} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-8 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-3 h-3 text-amber-400/50" />
            <span className="text-xs uppercase tracking-[0.25em] text-amber-100/90 font-medium">
              {language === 'en' ? 'The 78 Cards' : 'Les 78 Cartes'}
            </span>
            <Star className="w-3 h-3 text-amber-400/50" />
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-purple-200 to-purple-400">
            {language === 'en' ? 'Yes/No Tarot Reading' : 'Tirage Tarot Oui/Non'}
          </h1>

          <p className="text-slate-300/90 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {language === 'en'
              ? 'Type your yes or no question, shuffle the deck, and draw a card. The tarot will guide your answer with ancient wisdom from all 78 cards.'
              : 'Tapez votre question oui ou non, mélangez le jeu et tirez une carte. Le tarot guidera votre réponse avec la sagesse ancestrale des 78 cartes.'
            }
          </p>

          <motion.div
            className="flex items-center justify-center gap-4 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/40" />
            <motion.div
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg className="w-4 h-4 text-amber-400/70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
              </svg>
            </motion.div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/40" />
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ══════════ QUESTION PHASE ══════════ */}
          {phase === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              {/* Card fan */}
              <div className="relative h-36 w-56 mb-8">
                {[...Array(5)].map((_, i) => {
                  const angle = (i - 2) * 12;
                  const yOffset = Math.abs(i - 2) * 4;
                  return (
                    <motion.div
                      key={i}
                      className="absolute left-1/2 top-1/2"
                      style={{ marginLeft: '-28px', marginTop: '-40px', zIndex: i }}
                      initial={{ rotate: 0, y: 0 }}
                      animate={{ rotate: angle, y: -yOffset }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                    >
                      <CardBack
                        style={{ boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 ${20 + i * 5}px ${theme.glow}15` }}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <div className="w-full max-w-md mb-6">
                <motion.label
                  className="block text-base font-heading text-amber-200/90 mb-3 text-center"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {language === 'en' ? 'Type your yes or no question below' : 'Tapez votre question oui ou non ci-dessous'}
                </motion.label>
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0px rgba(139,92,246,0), 0 0 0px rgba(245,158,11,0)',
                      '0 0 20px rgba(139,92,246,0.5), 0 0 8px rgba(245,158,11,0.3)',
                      '0 0 0px rgba(139,92,246,0), 0 0 0px rgba(245,158,11,0)',
                    ],
                    borderColor: [
                      'rgba(139,92,246,0.4)',
                      'rgba(245,158,11,0.6)',
                      'rgba(139,92,246,0.4)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="rounded-xl border-2 border-purple-500/40"
                >
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={language === 'en' ? 'Will I get the job offer?' : 'Vais-je obtenir cette offre d\'emploi ?'}
                    className="w-full px-4 py-3.5 bg-slate-800/60 border-0 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-0 transition-colors text-center text-lg"
                    maxLength={200}
                    autoFocus
                  />
                </motion.div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  {language === 'en' ? 'e.g. "Should I take this opportunity?" or "Is this the right time?"' : 'ex. « Dois-je saisir cette opportunité ? » ou « Est-ce le bon moment ? »'}
                </p>
              </div>

              <Button onClick={handleAskCards} variant="mystical" glow disabled={!question.trim()}>
                <Sparkles className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Ask the Cards' : 'Demander aux Cartes'}
              </Button>
            </motion.div>
          )}

          {/* ══════════ SHUFFLING PHASE ══════════ */}
          {(phase === 'shuffling' || phase === 'three-card-shuffling') && (
            <motion.div
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <motion.div
                  className="absolute w-80 h-80 rounded-full"
                  style={{ background: `radial-gradient(circle, ${theme.glow}25 0%, transparent 70%)` }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Floating sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{ left: `${25 + i * 10}%`, top: `${35 + (i % 3) * 10}%` }}
                  animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-3 h-3 text-amber-400/40" />
                </motion.div>
              ))}

              {/* Card deck animation */}
              <div className="relative h-40 w-64 mb-8 mt-4">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-6 w-24 h-6 bg-black/20 rounded-full blur-lg" />
                {[...Array(NUM_SHUFFLE_CARDS)].map((_, index) => (
                  <motion.div
                    key={index}
                    className="absolute left-1/2 top-1/2"
                    style={{ zIndex: index, marginLeft: '-28px', marginTop: '-40px' }}
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    animate={getCardAnimation(index)}
                    transition={{
                      duration: 1.2, repeat: Infinity, repeatType: 'reverse',
                      ease: [0.45, 0.05, 0.55, 0.95], delay: index * 0.05,
                    }}
                  >
                    <CardBack
                      style={{ boxShadow: `0 ${4 + index}px ${8 + index * 2}px rgba(0,0,0,0.3), 0 0 ${20 + index * 5}px ${theme.glow}15` }}
                    />
                  </motion.div>
                ))}
              </div>

              <motion.h3
                className="text-xl md:text-2xl font-heading text-purple-200 mb-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {language === 'en' ? 'Shuffling the Deck...' : 'Mélange du Jeu...'}
              </motion.h3>
              <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto text-center">
                {language === 'en'
                  ? 'Focus on your question as the cards align with your energy'
                  : 'Concentrez-vous sur votre question tandis que les cartes s\'alignent avec votre énergie'
                }
              </p>

              {/* Show the question during shuffle */}
              {question.trim() && (
                <p className="text-amber-300/70 text-sm italic mb-6 max-w-sm mx-auto text-center">
                  &ldquo;{question}&rdquo;
                </p>
              )}

              {/* Draw button */}
              {(phase === 'shuffling' || phase === 'three-card-shuffling') && (
                <div className="relative">
                  {showParticleBurst && <ParticleBurst />}
                  <AnimatePresence mode="wait">
                    {canDraw && (
                      <motion.button
                        key="draw-btn"
                        initial={{ opacity: 0, y: 15, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={phase === 'shuffling' ? handleDraw : handleDrawThreeCards}
                        className="group relative px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${theme.glow}, ${theme.accent})`,
                          boxShadow: `0 10px 30px ${theme.glow}40, 0 0 0 1px ${theme.border}40`,
                        }}
                      >
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <span className="relative flex items-center gap-2">
                          <Hand className="w-5 h-5 text-amber-300" />
                          <span>{phase === 'shuffling'
                            ? (language === 'en' ? 'Draw Your Card' : 'Tirez Votre Carte')
                            : (language === 'en' ? 'Draw Your Cards' : 'Tirez Vos Cartes')
                          }</span>
                        </span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════ DRAWING + REVEALED PHASE ══════════ */}
          {(phase === 'drawing' || phase === 'revealed') && drawnCard && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              {/* Card with flip animation */}
              <motion.div
                className="relative mb-8"
                style={{ perspective: '1000px' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <motion.div
                  className="absolute -inset-8 rounded-3xl pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${theme.glow}30 0%, transparent 70%)` }}
                  animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                <motion.div
                  className="relative w-[200px] h-[333px] md:w-[240px] md:h-[400px]"
                  initial={false}
                  animate={{ rotateY: isCardRevealed ? 180 : 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Card Back */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-xl shadow-2xl overflow-hidden"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e1b4b 100%)',
                      border: '2px solid #fbbf24',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="absolute inset-2 border border-amber-500/30 rounded-lg" />
                    <div className="absolute inset-4 border border-amber-500/20 rounded-md" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rotate-45 border-2 border-amber-500/40 bg-purple-900/50 flex items-center justify-center">
                        <div className="w-10 h-10 border border-amber-500/30 bg-indigo-900/50 flex items-center justify-center">
                          <div className="w-4 h-4 bg-amber-500/50 rotate-45" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Front */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-xl shadow-2xl bg-slate-900 overflow-hidden"
                    style={{
                      transform: `rotateY(180deg)${isReversed ? ' rotate(180deg)' : ''}`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      border: '2px solid #fbbf24',
                    }}
                  >
                    {cardImageUrl && (
                      <img src={cardImageUrl} alt={cardName} className="w-full h-full object-cover opacity-90" />
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 pt-12 text-center">
                      <h3 className="text-amber-100 font-heading text-lg md:text-xl font-bold tracking-wide drop-shadow-md">
                        {cardName}
                      </h3>
                      {isReversed && (
                        <p className="text-[11px] text-red-400/80 uppercase tracking-widest mt-1">
                          {language === 'en' ? 'Reversed' : 'Inversée'}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Result info */}
              <AnimatePresence>
                {isCardRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center max-w-lg"
                  >
                    {/* Verdict badge */}
                    {cardInfo && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                        className="mb-4"
                      >
                        <span className={`inline-block px-6 py-2 rounded-full text-lg font-heading font-bold border ${VERDICT_COLORS[verdict]}`}>
                          {verdict === 'YES' && (language === 'en' ? 'YES' : 'OUI')}
                          {verdict === 'NO' && (language === 'en' ? 'NO' : 'NON')}
                          {verdict === 'UNCLEAR' && (language === 'en' ? 'UNCLEAR' : 'INCERTAIN')}
                          {verdict === 'WAIT' && (language === 'en' ? 'WAIT' : 'ATTENDEZ')}
                        </span>
                      </motion.div>
                    )}

                    <h2 className="text-2xl md:text-3xl font-heading text-purple-200 mb-2">
                      {cardName}
                      {isReversed && <span className="text-red-400/70 text-lg ml-2">({language === 'en' ? 'Reversed' : 'Inversée'})</span>}
                    </h2>

                    {/* Yes/No text */}
                    {yesNoText && (
                      <p className="text-lg text-amber-300/90 font-medium mb-3">{yesNoText}</p>
                    )}

                    {/* Core meaning */}
                    {coreMeaning && (
                      <p className="text-slate-300/80 text-sm leading-relaxed mb-2">
                        <strong className="text-purple-300">{language === 'en' ? 'Core Meaning:' : 'Signification :'}</strong>{' '}
                        {coreMeaning}
                      </p>
                    )}

                    {/* Upright/Reversed meaning */}
                    {meaningText && (
                      <p className="text-slate-300/80 text-sm leading-relaxed mb-2">
                        <strong className="text-purple-300">
                          {isReversed
                            ? (language === 'en' ? 'Reversed:' : 'Inversée :')
                            : (language === 'en' ? 'Upright:' : 'Droite :')
                          }
                        </strong>{' '}
                        {meaningText}
                      </p>
                    )}

                    {/* Best advice */}
                    {bestAdvice && (
                      <p className="text-slate-300/80 text-sm leading-relaxed mb-4">
                        <strong className="text-purple-300">{language === 'en' ? 'Best Advice:' : 'Meilleur Conseil :'}</strong>{' '}
                        {bestAdvice}
                      </p>
                    )}

                    {/* AI Interpretation */}
                    {isLoadingAI && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 mb-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-amber-400/70" />
                          <span className="text-sm font-heading text-purple-200">
                            {language === 'en' ? 'Reading your cards...' : 'Lecture de vos cartes...'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-3 rounded-full bg-gradient-to-r from-violet-500/20 via-purple-400/30 to-violet-500/20 animate-pulse" style={{ width: `${90 - i * 15}%` }} />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {aiInterpretation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 mb-4 p-5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-left"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-amber-400/70" />
                          <span className="text-sm font-heading text-purple-200 font-medium">
                            {language === 'en' ? 'Your Personalized Insight' : 'Votre Interprétation Personnalisée'}
                          </span>
                        </div>
                        <p className="text-slate-300/90 text-sm leading-relaxed whitespace-pre-line font-normal">
                          {aiInterpretation}
                        </p>
                      </motion.div>
                    )}

                    {/* Returning user message */}
                    {isRestoredDraw && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-2 mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
                      >
                        <p className="text-amber-200/80 text-sm leading-relaxed italic">
                          {language === 'en'
                            ? 'The cards have already spoken today. Sit with this answer \u2014 sometimes the truths we resist are the ones we need most. Your next reading will be available tomorrow.'
                            : 'Les cartes ont d\u00e9j\u00e0 parl\u00e9 aujourd\u2019hui. Prenez le temps d\u2019accueillir cette r\u00e9ponse \u2014 parfois les v\u00e9rit\u00e9s que nous refusons sont celles dont nous avons le plus besoin. Votre prochain tirage sera disponible demain.'
                          }
                        </p>
                      </motion.div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/30" />
                      <Sparkles className="w-3 h-3 text-amber-400/50" />
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/30" />
                    </div>

                    {/* Link to full article */}
                    {cardInfo?.slug && (
                      <a
                        href={`/tarot/${cardInfo.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-purple-500/30 text-purple-200 text-sm font-medium hover:border-purple-400/50 hover:from-violet-600/30 hover:to-purple-600/30 transition-all duration-300 hover:-translate-y-0.5 mb-4"
                      >
                        <span>
                          {language === 'en'
                            ? `Read full meaning of ${drawnCard.nameEn}`
                            : `Lire la signification complète de ${drawnCard.nameFr}`
                          }
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}

                    {/* Go Deeper CTA */}
                    <div className="mt-6 mb-4">
                      <p className="text-slate-200/80 text-base mb-3">
                        {language === 'en' ? 'Want more context? A 3-card spread reveals the full picture.' : 'Envie de plus de contexte ? Un tirage à 3 cartes révèle la situation complète.'}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleGoDeeper}
                        disabled={isLoadingThreeCard}
                        className={`group relative px-8 py-3.5 rounded-xl text-white font-bold transition-all duration-300 overflow-hidden shadow-lg disabled:opacity-50 ${
                          isSignedIn
                            ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 shadow-purple-900/50 border border-purple-400/30'
                            : 'bg-slate-700/80 hover:bg-slate-600/80 shadow-slate-900/30 border border-slate-500/30'
                        }`}
                      >
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="relative flex items-center gap-2">
                          {!isSignedIn ? (
                            <>
                              <Sparkles className="w-4 h-4 text-purple-300" />
                              {language === 'en' ? 'Sign In for 3-Card Spread' : 'Connectez-vous pour le Tirage à 3 Cartes'}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-amber-300" />
                              {language === 'en' ? 'Go Deeper — 3-Card Spread' : 'Approfondir — Tirage à 3 Cartes'}
                              <span className="ml-1 flex items-center gap-1 text-xs text-amber-300/80">
                                <Coins className="w-3 h-3" />1
                              </span>
                            </>
                          )}
                        </span>
                      </motion.button>

                      {threeCardError && (
                        <p className="text-red-400/90 text-sm mt-3">{threeCardError}</p>
                      )}
                    </div>

                    {/* Secondary links — styled as buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                      <Link
                        to={ROUTES.READING}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-purple-500/30 text-purple-200 text-sm font-medium hover:border-purple-400/50 hover:from-violet-600/30 hover:to-purple-600/30 transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400/70" />
                        {language === 'en' ? 'Full tarot reading' : 'Tirage complet'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        to={ROUTES.HOROSCOPES}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-purple-500/30 text-purple-200 text-sm font-medium hover:border-purple-400/50 hover:from-violet-600/30 hover:to-purple-600/30 transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <Star className="w-4 h-4 text-amber-400/70" />
                        {language === 'en' ? 'Today\'s horoscope' : 'Horoscope du jour'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ══════════ THREE-CARD REVEALED PHASE ══════════ */}
          {phase === 'three-card-revealed' && threeCards.length === 3 && (
            <motion.div
              key="three-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-2xl md:text-3xl font-heading text-purple-200 mb-2 text-center">
                {language === 'en' ? '3-Card Yes/No Spread' : 'Tirage Oui/Non à 3 Cartes'}
              </h2>
              <p className="text-slate-400 text-sm mb-8 text-center max-w-md">
                {language === 'en'
                  ? `Your question: "${question}"`
                  : `Votre question : « ${question} »`
                }
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-8">
                {threeCards.map((tc, i) => {
                  const isVisible = i < revealedCount;
                  const label = language === 'en' ? THREE_CARD_LABELS.en[i] : THREE_CARD_LABELS.fr[i];
                  const imgUrl = getCardImageUrl(tc.card.id);
                  const name = language === 'en' ? tc.card.nameEn : tc.card.nameFr;
                  const tcYesNo = tc.isReversed ? '' : (language === 'en' ? tc.info.yesNoEn : tc.info.yesNoFr);
                  const tcMeaning = tc.isReversed
                    ? (language === 'en' ? tc.info.reversedEn : tc.info.reversedFr)
                    : (language === 'en' ? tc.info.uprightEn : tc.info.uprightFr);
                  // Hide upright advice when reversed — it contradicts the reversed meaning
                  const tcAdvice = tc.isReversed ? '' : (language === 'en' ? tc.info.bestAdviceEn : tc.info.bestAdviceFr);

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 0 }}
                      transition={{ duration: 0.6, delay: isVisible ? 0.1 : 0 }}
                      className="flex flex-col items-center"
                    >
                      {/* Position label */}
                      <div className="text-xs uppercase tracking-widest text-amber-400/80 mb-3 font-medium">
                        {label}
                      </div>

                      {/* Card */}
                      <div className="relative mb-4" style={{ perspective: '800px' }}>
                        <motion.div
                          className="relative w-[140px] h-[233px] md:w-[160px] md:h-[267px]"
                          initial={false}
                          animate={{ rotateY: isVisible ? 180 : 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {/* Back */}
                          <div
                            className="absolute inset-0 w-full h-full rounded-lg shadow-xl overflow-hidden"
                            style={{
                              backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e1b4b 100%)',
                              border: '2px solid #fbbf24',
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                            }}
                          >
                            <div className="absolute inset-2 border border-amber-500/30 rounded" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rotate-45 border-2 border-amber-500/40 bg-purple-900/50" />
                            </div>
                          </div>

                          {/* Front */}
                          <div
                            className="absolute inset-0 w-full h-full rounded-lg shadow-xl bg-slate-900 overflow-hidden"
                            style={{
                              transform: `rotateY(180deg)${tc.isReversed ? ' rotate(180deg)' : ''}`,
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              border: '2px solid #fbbf24',
                            }}
                          >
                            {imgUrl && <img src={imgUrl} alt={name} className="w-full h-full object-cover opacity-90" />}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2 pt-8 text-center">
                              <h4 className="text-amber-100 font-heading text-sm font-bold">{name}</h4>
                              {tc.isReversed && (
                                <p className="text-[10px] text-red-400/80 uppercase tracking-widest">
                                  {language === 'en' ? 'Reversed' : 'Inversée'}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Card info (visible after reveal) */}
                      {isVisible && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-center max-w-xs"
                        >
                          {/* Show verdict badge under every card — flip YES↔NO when reversed */}
                          {(() => {
                            const v = tc.isReversed
                              ? (tc.info.verdict === 'YES' ? 'NO' : tc.info.verdict === 'NO' ? 'YES' : tc.info.verdict)
                              : tc.info.verdict;
                            return (
                              <span className={`inline-block px-4 py-1 rounded-full text-sm font-heading font-bold border mb-2 ${VERDICT_COLORS[v]}`}>
                                {v === 'YES' && (language === 'en' ? 'YES' : 'OUI')}
                                {v === 'NO' && (language === 'en' ? 'NO' : 'NON')}
                                {v === 'UNCLEAR' && (language === 'en' ? 'UNCLEAR' : 'INCERTAIN')}
                                {v === 'WAIT' && (language === 'en' ? 'WAIT' : 'ATTENDEZ')}
                              </span>
                            );
                          })()}

                          {tcYesNo && (
                            <p className="text-amber-300/90 text-sm font-medium mb-2">{tcYesNo}</p>
                          )}

                          {tcMeaning && (
                            <p className="text-slate-300/70 text-xs leading-relaxed mb-1">
                              {tcMeaning}
                            </p>
                          )}

                          {tcAdvice && (
                            <p className="text-slate-400/70 text-xs italic">{tcAdvice}</p>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* 3-card AI interpretation — loading shimmer */}
              {revealedCount >= 3 && !threeCardInterpretation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full max-w-2xl mx-auto mb-8 p-5 rounded-xl bg-violet-500/10 border border-violet-500/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-400/70" />
                    <span className="text-sm font-heading text-purple-200">
                      {language === 'en' ? 'Reading your cards...' : 'Lecture de vos cartes...'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-3 rounded-full bg-gradient-to-r from-violet-500/20 via-purple-400/30 to-violet-500/20 animate-pulse" style={{ width: `${95 - i * 12}%` }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 3-card holistic AI interpretation */}
              {revealedCount >= 3 && threeCardInterpretation && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="w-full max-w-2xl mx-auto mb-8 p-5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-left"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-400/70" />
                    <span className="text-sm font-heading text-purple-200 font-medium">
                      {language === 'en' ? 'Your Complete Reading' : 'Votre Lecture Complète'}
                    </span>
                  </div>
                  <p className="text-slate-300/90 text-sm leading-relaxed whitespace-pre-line font-normal">
                    {threeCardInterpretation}
                  </p>
                </motion.div>
              )}

              {/* All revealed: secondary links */}
              {revealedCount >= 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/30" />
                    <Sparkles className="w-3 h-3 text-amber-400/50" />
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/30" />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to={ROUTES.READING}
                      className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-purple-500/30 text-purple-200 text-sm font-medium hover:border-purple-400/50 hover:from-violet-600/30 hover:to-purple-600/30 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400/70" />
                      {language === 'en' ? 'Full tarot reading' : 'Tirage complet'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to={ROUTES.HOROSCOPES}
                      className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-purple-500/30 text-purple-200 text-sm font-medium hover:border-purple-400/50 hover:from-violet-600/30 hover:to-purple-600/30 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <Star className="w-4 h-4 text-amber-400/70" />
                      {language === 'en' ? 'Today\'s horoscope' : 'Horoscope du jour'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default YesNoReading;
