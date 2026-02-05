// components/CategorySelector.tsx
// Category-first selection grid with inline depth expansion
// Enhanced "Arcana Sanctum" design with immersive effects

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { ChevronLeft, Coins, Sparkles, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, getDepthsForCategory, type CategoryConfig, type DepthOption } from '../constants/categoryConfig';
import type { ReadingCategory } from '../types';
import CreditShop from './CreditShop';
import DepthVisual from './reading/DepthVisual';

interface CategorySelectorProps {
  className?: string;
}

interface LocationState {
  expandCategory?: ReadingCategory;
}

// Mystical symbols for each category - adds unique character
const categorySymbols: Record<ReadingCategory, string> = {
  love: '♡',
  career: '⚔',
  money: '◈',
  life_path: '☽',
  family: '⌂',
  birth_cards: '✧',
};

// Unified color system - matches categoryConfig accent colors (Tailwind -400 variants)
// These must stay in sync with categoryConfig.ts colorTheme.accent values
const categoryColors: Record<ReadingCategory, {
  accent: string;      // Main accent color (matches categoryConfig accent)
  glow: string;        // Slightly brighter for glow effects
  ambient: string;     // For subtle ambient patterns
}> = {
  love: {
    accent: '#fb7185',    // rose-400 (matches categoryConfig.accent)
    glow: '#f43f5e',      // rose-500
    ambient: '#fda4af',   // rose-300
  },
  career: {
    accent: '#fbbf24',    // amber-400
    glow: '#f59e0b',      // amber-500
    ambient: '#fcd34d',   // amber-300
  },
  money: {
    accent: '#34d399',    // emerald-400
    glow: '#10b981',      // emerald-500
    ambient: '#6ee7b7',   // emerald-300
  },
  life_path: {
    accent: '#38bdf8',    // sky-400
    glow: '#0ea5e9',      // sky-500
    ambient: '#7dd3fc',   // sky-300
  },
  family: {
    accent: '#22d3ee',    // cyan-400
    glow: '#06b6d4',      // cyan-500
    ambient: '#67e8f9',   // cyan-300
  },
  birth_cards: {
    accent: '#a78bfa',    // violet-400
    glow: '#8b5cf6',      // violet-500
    ambient: '#c4b5fd',   // violet-300
  },
};

// Category-specific ambient patterns for expanded view - uses categoryColors for consistency
const getCategoryAmbientPatterns = (categoryId: ReadingCategory): React.ReactNode => {
  const colors = categoryColors[categoryId];

  const patterns: Record<ReadingCategory, React.ReactNode> = {
    love: (
      <>
        {/* Floating hearts */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl pointer-events-none"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              color: `${colors.ambient}30`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.15, 0.35, 0.15],
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.7 }}
          >
            ♡
          </motion.div>
        ))}
      </>
    ),
    career: (
      <>
        {/* Upward geometric lines */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px pointer-events-none"
            style={{
              left: `${20 + i * 15}%`,
              height: '60%',
              bottom: '20%',
              background: `linear-gradient(to top, transparent, ${colors.accent}50, transparent)`,
            }}
            animate={{
              opacity: [0.1, 0.4, 0.1],
              scaleY: [0.8, 1.2, 0.8],
            }}
            transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </>
    ),
    money: (
      <>
        {/* Coin sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 4) * 20}%`,
              backgroundColor: `${colors.accent}60`,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{ duration: 2 + i * 0.2, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </>
    ),
    life_path: (
      <>
        {/* Moon phases / star trails */}
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${12 + i * 13}%`,
              top: `${25 + (i % 3) * 20}%`,
              color: `${colors.ambient}35`,
            }}
            animate={{
              opacity: [0.1, 0.4, 0.1],
              scale: [0.8, 1.3, 0.8],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 6 + i * 0.5, repeat: Infinity, delay: i * 0.6 }}
          >
            {i % 2 === 0 ? '☽' : '✦'}
          </motion.div>
        ))}
      </>
    ),
    family: (
      <>
        {/* Interconnected circles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-8 h-8 rounded-full pointer-events-none"
            style={{
              left: `${20 + i * 14}%`,
              top: `${30 + (i % 2) * 25}%`,
              border: `1px solid ${colors.accent}30`,
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{ duration: 4 + i * 0.4, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </>
    ),
    birth_cards: (
      <>
        {/* Cosmic stars */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${8 + i * 9}%`,
              top: `${15 + (i % 4) * 18}%`,
              color: `${colors.ambient}40`,
            }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.3 }}
          >
            ✧
          </motion.div>
        ))}
      </>
    ),
  };

  return patterns[categoryId];
};

// Decorative corner component
const CornerDecoration: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br'; className?: string }> = ({ position, className = '' }) => {
  const rotations = { tl: '', tr: 'rotate-90', bl: '-rotate-90', br: 'rotate-180' };
  return (
    <svg
      className={`absolute w-8 h-8 text-white/20 ${rotations[position]} ${className}`}
      style={{
        top: position.includes('t') ? '8px' : 'auto',
        bottom: position.includes('b') ? '8px' : 'auto',
        left: position.includes('l') ? '8px' : 'auto',
        right: position.includes('r') ? '8px' : 'auto',
      }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M2 12 L2 2 L12 2" />
      <circle cx="2" cy="2" r="1.5" fill="currentColor" />
    </svg>
  );
};

// Floating particle component
const FloatingParticle: React.FC<{ delay: number; x: string; y: string }> = ({ delay, x, y }) => (
  <motion.div
    className="absolute w-1 h-1 bg-white/30 rounded-full"
    style={{ left: x, top: y }}
    animate={{
      opacity: [0.2, 0.6, 0.2],
      scale: [1, 1.5, 1],
      y: [0, -10, 0],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const CategorySelector: React.FC<CategorySelectorProps> = ({ className = '' }) => {
  const { language, user, t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const [expandedCategory, setExpandedCategory] = useState<ReadingCategory | null>(null);

  // Auto-expand category if passed in location state (from SubNav dropdown)
  useEffect(() => {
    if (locationState?.expandCategory) {
      setExpandedCategory(locationState.expandCategory);
      window.history.replaceState({}, document.title);
    }
  }, [locationState?.expandCategory]);

  const [showCreditShop, setShowCreditShop] = useState(false);
  const [hoveredDepth, setHoveredDepth] = useState<number | null>(null);

  // Mobile swipe state for depth options
  const [currentDepthIndex, setCurrentDepthIndex] = useState(0);
  const swipeX = useMotionValue(0);
  const depthContainerRef = useRef<HTMLDivElement>(null);

  // Reset swipe index when category changes
  useEffect(() => {
    setCurrentDepthIndex(0);
  }, [expandedCategory]);

  // Handle category card click
  const handleCategoryClick = useCallback((categoryId: ReadingCategory) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  }, [expandedCategory]);

  // Handle depth selection
  const handleDepthSelect = useCallback((category: CategoryConfig, depth: DepthOption) => {
    const userCredits = user?.credits ?? 0;
    if (userCredits < depth.cost) {
      setShowCreditShop(true);
      return;
    }

    const categoryPath = category.id === 'birth_cards' ? 'birth-cards' : category.id;
    navigate(`/reading/${categoryPath}/${depth.cards}`);
  }, [user?.credits, navigate]);

  // Close expanded category
  const handleClose = useCallback(() => {
    setExpandedCategory(null);
  }, []);

  // Mobile swipe handlers for depth carousel
  const handleSwipe = useCallback((direction: 'left' | 'right', depths: DepthOption[]) => {
    if (direction === 'left' && currentDepthIndex < depths.length - 1) {
      setCurrentDepthIndex(prev => prev + 1);
    } else if (direction === 'right' && currentDepthIndex > 0) {
      setCurrentDepthIndex(prev => prev - 1);
    }
  }, [currentDepthIndex]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, depths: DepthOption[]) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      handleSwipe('left', depths);
    } else if (info.offset.x > threshold) {
      handleSwipe('right', depths);
    }
  }, [handleSwipe]);

  // Get label based on language
  const getLabel = (category: CategoryConfig) =>
    language === 'fr' ? category.labelFr : category.labelEn;

  const getTagline = (category: CategoryConfig) =>
    language === 'fr' ? category.taglineFr : category.taglineEn;

  const getDepthLabel = (depth: DepthOption) =>
    language === 'fr' ? depth.labelFr : depth.labelEn;

  return (
    <div className={`w-full relative ${className}`}>
      {/* Background atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative text-center mb-8"
      >
        {/* Decorative top element */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/60" />
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </motion.div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/60" />
        </div>

        <h2 className="text-2xl md:text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-purple-300 mb-2">
          {language === 'fr'
            ? "Choisissez Votre Chemin"
            : 'Choose Your Path'}
        </h2>

        <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          {language === 'fr'
            ? 'Chaque porte mène vers une sagesse différente. Laquelle vous appelle ?'
            : 'Each doorway leads to different wisdom. Which one calls to you?'}
        </p>
      </motion.div>

      {/* Expanded Category View */}
      <AnimatePresence>
        {expandedCategory && (() => {
          const category = CATEGORIES.find(c => c.id === expandedCategory);
          if (!category) return null;
          const depths = getDepthsForCategory(category.id);

          return (
            <motion.div
              key="expanded-category"
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative mb-10"
            >
              {/* Animated pulsing glow behind the container */}
              <motion.div
                className="absolute inset-0 mx-4 md:mx-8 rounded-3xl pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, ${categoryColors[category.id].glow}40 0%, transparent 70%)`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div
                className="relative overflow-hidden rounded-3xl border backdrop-blur-xl bg-black/40 mx-4 md:mx-8 mb-8"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  boxShadow: `
                    0 25px 60px rgba(0,0,0,0.4),
                    0 0 20px ${categoryColors[category.id].glow}30,
                    0 0 40px ${categoryColors[category.id].glow}20,
                    0 0 80px ${categoryColors[category.id].glow}10
                  `,
                }}
              >
                {/* Subtle noise texture overlay */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }}
                />

                {/* Category color tint - increased opacity */}
                <div
                  className={`absolute inset-0 pointer-events-none opacity-50 bg-gradient-to-br ${category.colorTheme.gradient}`}
                />

                {/* Category-specific ambient patterns */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {getCategoryAmbientPatterns(category.id)}
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <FloatingParticle
                      key={i}
                      delay={i * 0.5}
                      x={`${10 + i * 11}%`}
                      y={`${20 + (i % 4) * 18}%`}
                    />
                  ))}
                </div>

                {/* Decorative corners */}
                <CornerDecoration position="tl" />
                <CornerDecoration position="tr" />
                <CornerDecoration position="bl" />
                <CornerDecoration position="br" />

                {/* Header Section - Compact */}
                <div className="relative p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Smaller mystical symbol */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20">
                          <span className="text-2xl text-white/90">{categorySymbols[category.id]}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-heading text-lg md:text-xl text-white">
                          {getLabel(category)}
                        </h3>
                        <p className="text-sm text-white/60">
                          {getTagline(category)}
                        </p>
                      </div>
                    </div>

                    {/* Back button - smaller */}
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={handleClose}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all text-white text-xs font-medium"
                      whileHover={{ x: -4 }}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>{language === 'fr' ? 'Retour' : 'Back'}</span>
                    </motion.button>
                  </div>
                </div>

                {/* Depth Selection Section */}
                <div className="relative px-4 md:px-6 pb-6">
                  {/* Subtle divider */}
                  <div className="relative mb-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>

                  {/* Question prompt - smaller */}
                  <p className="text-white/70 text-center mb-5 text-sm">
                    {language === 'fr'
                      ? "Quelle profondeur d'exploration souhaitez-vous ?"
                      : 'How deep would you like to explore?'}
                  </p>

                  {/* Depth Options - Desktop Grid */}
                  <div className={`hidden md:grid gap-3 ${
                    depths.length <= 3
                      ? 'grid-cols-3 max-w-lg mx-auto'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                  }`}>
                    {depths.map((depth, index) => {
                      const isHovered = hoveredDepth === depth.cards;
                      const userCredits = user?.credits ?? 0;
                      const canAfford = userCredits >= depth.cost;

                      return (
                        <motion.button
                          key={depth.cards}
                          initial={{ opacity: 0, scale: 0.8, y: 30 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                          }}
                          onClick={() => handleDepthSelect(category, depth)}
                          onMouseEnter={() => setHoveredDepth(depth.cards)}
                          onMouseLeave={() => setHoveredDepth(null)}
                          disabled={!canAfford}
                          className={`
                            group relative p-4 rounded-xl border transition-all duration-300 backdrop-blur-md
                            ${isHovered && canAfford
                              ? 'border-white/50 bg-white/15'
                              : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                            }
                            ${!canAfford ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          whileHover={canAfford ? { scale: 1.05, y: -6 } : {}}
                          whileTap={canAfford ? { scale: 0.95 } : {}}
                          style={{
                            boxShadow: isHovered && canAfford
                              ? `0 15px 40px ${categoryColors[category.id].glow}50, 0 0 30px ${categoryColors[category.id].glow}40, 0 0 60px ${categoryColors[category.id].glow}20`
                              : `0 4px 15px rgba(0,0,0,0.2), 0 0 10px ${categoryColors[category.id].glow}15`
                          }}
                        >
                          {/* Card visual */}
                          <div className="mb-3">
                            <DepthVisual
                              cards={depth.cards}
                              category={category.id}
                              colorTheme={{
                                glow: category.colorTheme.glow,
                                accent: category.colorTheme.accent,
                              }}
                            />
                          </div>

                          {/* Label */}
                          <p className="text-white font-medium text-center mb-2 text-xs leading-tight min-h-[2rem] flex items-center justify-center">
                            {getDepthLabel(depth)}
                          </p>

                          {/* Cost badge */}
                          <div className={`
                            flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                            ${canAfford
                              ? 'text-amber-300 bg-amber-500/20 border border-amber-400/40'
                              : 'text-red-300 bg-red-500/20 border border-red-400/40'
                            }
                          `}>
                            <Coins className="w-3 h-3" />
                            <span className="font-bold">{depth.cost}</span>
                          </div>

                          {/* Locked overlay */}
                          {!canAfford && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm">
                              <span className="text-xs text-white/80 bg-black/80 px-4 py-2 rounded-full border border-white/20">
                                {language === 'fr' ? 'Crédits insuffisants' : 'Need more credits'}
                              </span>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Depth Options - Mobile Swipe Carousel */}
                  <div className="md:hidden relative">
                    {/* Swipe instruction */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-center text-white/40 text-xs mb-3 flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>{language === 'fr' ? 'Glissez pour explorer' : 'Swipe to explore'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </motion.p>

                    {/* Carousel container */}
                    <div className="overflow-hidden" ref={depthContainerRef}>
                      <motion.div
                        className="flex gap-4 px-4"
                        drag="x"
                        dragConstraints={{ left: -((depths.length - 1) * 200), right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(e, info) => handleDragEnd(e, info, depths)}
                        animate={{ x: -currentDepthIndex * 200 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        {depths.map((depth, index) => {
                          const userCredits = user?.credits ?? 0;
                          const canAfford = userCredits >= depth.cost;
                          const isActive = currentDepthIndex === index;

                          return (
                            <motion.button
                              key={depth.cards}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{
                                opacity: 1,
                                scale: isActive ? 1 : 0.9,
                              }}
                              transition={{
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                              }}
                              onClick={() => {
                                if (isActive) {
                                  handleDepthSelect(category, depth);
                                } else {
                                  setCurrentDepthIndex(index);
                                }
                              }}
                              disabled={!canAfford && isActive}
                              className={`
                                relative flex-shrink-0 w-[180px] p-4 rounded-xl border transition-all duration-300 backdrop-blur-md
                                ${isActive
                                  ? 'border-white/50 bg-white/15'
                                  : 'border-white/10 bg-white/5'
                                }
                                ${!canAfford ? 'opacity-40' : ''}
                              `}
                              style={{
                                boxShadow: isActive
                                  ? `0 15px 40px ${categoryColors[category.id].glow}50, 0 0 30px ${categoryColors[category.id].glow}40`
                                  : `0 4px 15px rgba(0,0,0,0.2)`
                              }}
                            >
                              {/* Card visual */}
                              <div className="mb-3">
                                <DepthVisual
                                  cards={depth.cards}
                                  category={category.id}
                                  colorTheme={{
                                    glow: category.colorTheme.glow,
                                    accent: category.colorTheme.accent,
                                  }}
                                />
                              </div>

                              {/* Label */}
                              <p className="text-white font-medium text-center mb-2 text-sm leading-tight">
                                {getDepthLabel(depth)}
                              </p>

                              {/* Cost badge */}
                              <div className={`
                                flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                                ${canAfford
                                  ? 'text-amber-300 bg-amber-500/20 border border-amber-400/40'
                                  : 'text-red-300 bg-red-500/20 border border-red-400/40'
                                }
                              `}>
                                <Coins className="w-3 h-3" />
                                <span className="font-bold">{depth.cost}</span>
                              </div>

                              {/* Tap to select indicator for active card */}
                              {isActive && canAfford && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-amber-300 text-xs mt-2 text-center"
                                >
                                  {language === 'fr' ? 'Appuyez pour sélectionner' : 'Tap to select'}
                                </motion.p>
                              )}

                              {/* Locked overlay */}
                              {!canAfford && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                                  <span className="text-xs text-white/80 bg-black/80 px-4 py-2 rounded-full border border-white/20">
                                    {language === 'fr' ? 'Crédits insuffisants' : 'Need more credits'}
                                  </span>
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </div>

                    {/* Pagination dots */}
                    <div className="flex justify-center gap-2 mt-4">
                      {depths.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentDepthIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            currentDepthIndex === index
                              ? 'w-6 bg-white'
                              : 'bg-white/30 hover:bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Credit balance display */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-white/60 text-sm">
                        {language === 'fr' ? 'Solde:' : 'Balance:'}
                      </span>
                      <span className="text-amber-300 font-bold">
                        {user?.credits ?? 0}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Category Grid */}
      <AnimatePresence>
        {!expandedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-8 px-4 md:px-8"
          >
            {CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                <motion.button
                  onClick={() => handleCategoryClick(category.id)}
                  className="group w-full relative overflow-hidden rounded-2xl border-2 transition-all duration-300 backdrop-blur-md"
                  style={{
                    borderColor: `${categoryColors[category.id].glow}50`,
                    boxShadow: `
                      0 8px 25px rgba(0,0,0,0.3),
                      0 0 15px ${categoryColors[category.id].glow}25,
                      0 0 30px ${categoryColors[category.id].glow}10
                    `,
                  }}
                  whileHover={{
                    scale: 1.04,
                    y: -8,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={(e, info) => {
                    const el = e.target as HTMLElement | null;
                    if (el?.style) {
                      el.style.borderColor = categoryColors[category.id].glow;
                      el.style.boxShadow = `
                        0 25px 50px rgba(0,0,0,0.5),
                        0 0 20px ${categoryColors[category.id].glow}50,
                        0 0 40px ${categoryColors[category.id].glow}35,
                        0 0 80px ${categoryColors[category.id].glow}20,
                        inset 0 0 30px ${categoryColors[category.id].glow}15
                      `;
                    }
                  }}
                  onHoverEnd={(e, info) => {
                    const el = e.target as HTMLElement | null;
                    if (el?.style) {
                      el.style.borderColor = `${categoryColors[category.id].glow}50`;
                      el.style.boxShadow = `
                        0 8px 25px rgba(0,0,0,0.3),
                        0 0 15px ${categoryColors[category.id].glow}25,
                        0 0 30px ${categoryColors[category.id].glow}10
                      `;
                    }
                  }}
                >
                  {/* Base background */}
                  <div className="absolute inset-0 bg-black/40" />

                  {/* Category color tint - more visible */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${category.colorTheme.gradient} opacity-50 group-hover:opacity-75 transition-opacity duration-300`}
                  />

                  {/* Animated glow pulse on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${categoryColors[category.id].glow}50 0%, transparent 60%)`,
                    }}
                    initial={false}
                    whileHover={{
                      scale: [1, 1.2, 1],
                      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  />

                  {/* Corner decorations */}
                  <CornerDecoration position="tl" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CornerDecoration position="br" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                  {/* Content */}
                  <div className="relative p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon/Symbol container */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-all duration-300"
                          style={{
                            boxShadow: `0 0 0 ${categoryColors[category.id].glow}00`,
                          }}
                        >
                          {/* Mystical symbol */}
                          <span
                            className="text-xl transition-all duration-300 group-hover:scale-110"
                            style={{ color: categoryColors[category.id].accent }}
                          >
                            {categorySymbols[category.id]}
                          </span>
                        </div>
                        {/* Glow behind icon on hover */}
                        <div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 blur-md -z-10"
                          style={{ backgroundColor: categoryColors[category.id].glow }}
                        />
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-base text-white group-hover:text-white transition-colors mb-0.5">
                          {getLabel(category)}
                        </h3>
                        <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors leading-snug line-clamp-2">
                          {getTagline(category)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom action hint */}
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-white/10">
                      <motion.div
                        className="flex items-center gap-1.5 text-white/50 transition-colors"
                        initial={false}
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <span
                          className="text-xs font-medium transition-colors"
                          style={{ color: 'inherit' }}
                        >
                          {language === 'fr' ? 'Explorer' : 'Explore'}
                        </span>
                        <span
                          className="text-sm transition-colors group-hover:translate-x-0.5"
                          style={{ color: categoryColors[category.id].accent }}
                        >
                          →
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit Shop Modal */}
      <CreditShop
        isOpen={showCreditShop}
        onClose={() => setShowCreditShop(false)}
      />
    </div>
  );
};

export default CategorySelector;
