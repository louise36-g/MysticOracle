import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Sparkles, Star, ArrowRight, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MAJOR_ARCANA } from '../constants';
import { shuffleDeck } from '../utils/shuffle';
import { getCardImageUrl } from '../constants/cardImages';
import { fetchBlogPosts, BlogPost } from '../services/api/blog';
import { ROUTES } from '../routes/routes';
import { SEOTags } from '../utils/seo';
import Button from './Button';

// Category slug for Major Arcana energy articles
const ENERGY_CATEGORY_SLUG = 'tarot-astrology';

type Phase = 'intro' | 'shuffling' | 'drawing' | 'revealed';

// Unified color theme
const theme = {
  accent: '#a78bfa',
  glow: '#8b5cf6',
  border: '#f59e0b',
};

const NUM_SHUFFLE_CARDS = 7;
const SHUFFLE_DURATION = 4000;

// Floating star for background
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

// Particle burst effect
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

// Card back design (matches existing reading)
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

const DailyTarotEnergy: React.FC = () => {
  const { language } = useApp();
  const [phase, setPhase] = useState<Phase>('intro');
  const [shufflePhase, setShufflePhase] = useState(0);
  const [canDraw, setCanDraw] = useState(false);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [drawnCard, setDrawnCard] = useState<typeof MAJOR_ARCANA[0] | null>(null);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [articleUrl, setArticleUrl] = useState<string | null>(null);
  const articlesCache = useRef<BlogPost[]>([]);

  // Fetch articles from the Tarot & Astrology category once
  useEffect(() => {
    fetchBlogPosts({ category: ENERGY_CATEGORY_SLUG, limit: 50 })
      .then(res => { articlesCache.current = res.posts; })
      .catch(() => { /* Non-blocking — link just won't appear */ });
  }, []);

  // When a card is revealed, find matching article
  useEffect(() => {
    if (!drawnCard || !isCardRevealed) return;
    const cardNameLower = drawnCard.nameEn.toLowerCase();
    const match = articlesCache.current.find(post => {
      const titleLower = post.titleEn.toLowerCase();
      const slugLower = post.slug.toLowerCase();
      return titleLower.includes(cardNameLower) || slugLower.includes(cardNameLower.replace(/\s+/g, '-'));
    });
    setArticleUrl(match ? `/blog/${match.slug}` : null);
  }, [drawnCard, isCardRevealed]);

  // Shuffle animation cycling
  useEffect(() => {
    if (phase !== 'shuffling') return;
    const interval = setInterval(() => setShufflePhase(prev => (prev + 1) % 3), 2400);
    return () => clearInterval(interval);
  }, [phase]);

  // Min shuffle duration before draw button appears
  useEffect(() => {
    if (phase !== 'shuffling') return;
    const timer = setTimeout(() => {
      setCanDraw(true);
      setShowParticleBurst(true);
      setTimeout(() => setShowParticleBurst(false), 1000);
    }, SHUFFLE_DURATION);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleStartShuffle = useCallback(() => {
    setPhase('shuffling');
    setCanDraw(false);
    setShowParticleBurst(false);
  }, []);

  const handleDraw = useCallback(() => {
    const shuffled = shuffleDeck([...MAJOR_ARCANA]);
    const card = shuffled[0];
    setDrawnCard(card);
    setPhase('drawing');

    // Brief pause then reveal
    setTimeout(() => {
      setIsCardRevealed(true);
      setPhase('revealed');
    }, 600);
  }, []);

  const handleReset = useCallback(() => {
    setPhase('intro');
    setDrawnCard(null);
    setIsCardRevealed(false);
    setArticleUrl(null);
    setCanDraw(false);
    setShufflePhase(0);
  }, []);

  // Shuffle animation positions
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

  const cardImageUrl = drawnCard ? getCardImageUrl(drawnCard.id) : '';
  const cardName = drawnCard ? (language === 'en' ? drawnCard.nameEn : drawnCard.nameFr) : '';
  const cardKeywords = drawnCard ? (language === 'en' ? drawnCard.keywordsEn : drawnCard.keywordsFr) : [];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Helmet>
        <title>{language === 'en' ? 'Daily Tarot Card Draw — Today\'s Energy | CelestiArcana' : 'Tirage de Tarot du Jour — Énergie du Jour | CelestiArcana'}</title>
        <meta name="description" content={language === 'en'
          ? 'Draw your daily tarot card from the 22 Major Arcana. Discover today\'s tarot and astrological energy with a single card draw. Free daily tarot card of the day.'
          : 'Tirez votre carte de tarot du jour parmi les 22 Arcanes Majeurs. Découvrez l\'énergie tarot et astrologique du jour. Tirage de tarot quotidien gratuit.'
        } />
        <link rel="canonical" href="https://celestiarcana.com/daily-tarot" />
        <meta property="og:title" content={language === 'en' ? 'Daily Tarot Card — Today\'s Energy | CelestiArcana' : 'Carte de Tarot du Jour | CelestiArcana'} />
        <meta property="og:description" content={language === 'en'
          ? 'Draw your daily tarot card from the Major Arcana and discover today\'s energy.'
          : 'Tirez votre carte de tarot du jour parmi les Arcanes Majeurs.'
        } />
        <meta property="og:url" content="https://celestiarcana.com/daily-tarot" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <SEOTags path="/daily-tarot" />

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

        {/* SEO H1 + Intro — always visible */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-3 h-3 text-amber-400/50" />
            <span className="text-xs uppercase tracking-[0.25em] text-amber-100/90 font-medium">
              {language === 'en' ? 'The Major Arcana' : 'Les Arcanes Majeurs'}
            </span>
            <Star className="w-3 h-3 text-amber-400/50" />
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-purple-200 to-purple-400">
            {language === 'en' ? 'Daily Tarot & Astrology Energy' : 'Énergie Tarot & Astrologie du Jour'}
          </h1>

          <p className="text-slate-300/90 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {language === 'en'
              ? 'Draw a single card from the 22 Major Arcana to discover today\'s tarot energy. Each archetype carries a unique cosmic message — a lens through which to view your day with clarity and intention.'
              : 'Tirez une seule carte parmi les 22 Arcanes Majeurs pour découvrir l\'énergie tarot du jour. Chaque archétype porte un message cosmique unique — une lentille à travers laquelle voir votre journée avec clarté et intention.'
            }
          </p>

          {/* Divider */}
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

        {/* ============ INTRO PHASE ============ */}
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              {/* Decorative card fan */}
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
                        style={{
                          boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 ${20 + i * 5}px ${theme.glow}15`,
                        }}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-slate-400 text-sm mb-6 text-center max-w-sm">
                {language === 'en'
                  ? 'Take a breath, set your intention, and shuffle the 22 Major Arcana.'
                  : 'Prenez une respiration, posez votre intention, et mélangez les 22 Arcanes Majeurs.'
                }
              </p>

              <Button onClick={handleStartShuffle} variant="mystical" glow>
                <Sparkles className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Shuffle the Arcana' : 'Mélanger les Arcanes'}
              </Button>
            </motion.div>
          )}

          {/* ============ SHUFFLING PHASE ============ */}
          {phase === 'shuffling' && (
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

              {/* Animated card deck */}
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

              {/* Text */}
              <motion.h3
                className="text-xl md:text-2xl font-heading text-purple-200 mb-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {language === 'en' ? 'Shuffling the Arcana...' : 'Mélange des Arcanes...'}
              </motion.h3>
              <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto text-center">
                {language === 'en'
                  ? 'Focus on this moment as the Major Arcana align with today\'s energy'
                  : 'Concentrez-vous sur cet instant tandis que les Arcanes Majeurs s\'alignent avec l\'énergie du jour'
                }
              </p>

              {/* Draw button */}
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
                      onClick={handleDraw}
                      className="group relative px-8 py-3 rounded-xl text-white font-bold transition-all duration-300 overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${theme.glow}, ${theme.accent})`,
                        boxShadow: `0 10px 30px ${theme.glow}40, 0 0 0 1px ${theme.border}40`,
                      }}
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="relative flex items-center gap-2">
                        <Hand className="w-5 h-5 text-amber-300" />
                        <span>{language === 'en' ? 'Draw Your Card' : 'Tirez Votre Carte'}</span>
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ============ DRAWING + REVEALED PHASE ============ */}
          {(phase === 'drawing' || phase === 'revealed') && drawnCard && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              {/* The card with flip animation */}
              <motion.div
                className="relative mb-8"
                style={{ perspective: '1000px' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* Glow behind card */}
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
                    <div className="absolute top-3 left-3 w-2 h-2 bg-amber-500/40 rounded-full" />
                    <div className="absolute top-3 right-3 w-2 h-2 bg-amber-500/40 rounded-full" />
                    <div className="absolute bottom-3 left-3 w-2 h-2 bg-amber-500/40 rounded-full" />
                    <div className="absolute bottom-3 right-3 w-2 h-2 bg-amber-500/40 rounded-full" />
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
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      border: '2px solid #fbbf24',
                    }}
                  >
                    {cardImageUrl ? (
                      <img
                        src={cardImageUrl}
                        alt={cardName}
                        className="w-full h-full object-cover opacity-90"
                      />
                    ) : (
                      <img
                        src={drawnCard.image}
                        alt={cardName}
                        className="w-full h-full object-cover opacity-90"
                      />
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 pt-12 text-center">
                      <h3 className="text-amber-100 font-heading text-lg md:text-xl font-bold tracking-wide drop-shadow-md">
                        {cardName}
                      </h3>
                      <p className="text-[11px] text-amber-400/80 uppercase tracking-widest mt-1">
                        {cardKeywords.join(' · ')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Result info — appears after reveal */}
              <AnimatePresence>
                {isCardRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center max-w-lg"
                  >
                    <h2 className="text-2xl md:text-3xl font-heading text-purple-200 mb-2">
                      {language === 'en' ? 'Today\'s Energy' : 'Énergie du Jour'}
                    </h2>
                    <p className="text-lg text-amber-300/90 font-medium mb-3">
                      {cardName}
                    </p>
                    <p className="text-slate-300/80 text-sm leading-relaxed mb-6">
                      {language === 'en'
                        ? `The ${drawnCard.nameEn} carries the energy of ${drawnCard.keywordsEn.join(', ').toLowerCase()}. Let this archetype guide your awareness today — notice where its themes appear in your interactions, decisions, and reflections.`
                        : `${drawnCard.nameFr} porte l'énergie de ${drawnCard.keywordsFr.join(', ').toLowerCase()}. Laissez cet archétype guider votre conscience aujourd'hui — remarquez où ses thèmes apparaissent dans vos interactions, décisions et réflexions.`
                      }
                    </p>

                    {/* Divider */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/30" />
                      <Sparkles className="w-3 h-3 text-amber-400/50" />
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/30" />
                    </div>

                    {/* CTA: Read the full article */}
                    {articleUrl && (
                      <Link
                        to={articleUrl}
                        className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600/30 to-purple-600/30 border border-amber-500/40 text-amber-200 font-medium hover:border-amber-400/60 hover:from-violet-600/40 hover:to-purple-600/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/20 mb-4"
                      >
                        <span>
                          {language === 'en'
                            ? `Read the full energy profile for ${drawnCard.nameEn}`
                            : `Lire le profil énergétique complet de ${drawnCard.nameFr}`
                          }
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}

                    {/* Secondary links */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                      <Link
                        to={ROUTES.HOROSCOPES}
                        className="text-sm text-purple-300/70 hover:text-purple-200 transition-colors"
                      >
                        {language === 'en' ? 'View today\'s horoscope →' : 'Voir l\'horoscope du jour →'}
                      </Link>
                      <span className="hidden sm:inline text-slate-600">·</span>
                      <Link
                        to={ROUTES.READING}
                        className="text-sm text-purple-300/70 hover:text-purple-200 transition-colors"
                      >
                        {language === 'en' ? 'Full tarot reading →' : 'Tirage complet →'}
                      </Link>
                    </div>

                    {/* Draw again */}
                    <div className="mt-8">
                      <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-purple-300 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {language === 'en' ? 'Draw again' : 'Tirer à nouveau'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DailyTarotEnergy;
