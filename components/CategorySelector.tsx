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

// Unified color theme - consistent purple/amber for all categories
const unifiedTheme = {
  accent: '#a78bfa',      // Purple-400
  glow: '#8b5cf6',        // Purple-500
  ambient: '#c4b5fd',     // Purple-300
  border: '#f59e0b',      // Amber-500
  borderHover: '#fbbf24', // Amber-400
};

// Unified ambient pattern for expanded view - subtle mystical stars
const getUnifiedAmbientPattern = (): React.ReactNode => (
  <>
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute pointer-events-none"
        style={{
          left: `${10 + i * 11}%`,
          top: `${15 + (i % 4) * 20}%`,
          color: `${unifiedTheme.ambient}30`,
        }}
        animate={{
          opacity: [0.1, 0.4, 0.1],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
      >
        ✧
      </motion.div>
    ))}
  </>
);

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

// Particle burst effect on expand
const ParticleBurst: React.FC = () => {
  const particles = [...Array(12)].map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 80 + Math.random() * 40;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      scale: 0.5 + Math.random() * 0.5,
      delay: i * 0.02,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
          style={{
            background: i % 2 === 0 ? unifiedTheme.accent : unifiedTheme.border,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: 0,
            scale: particle.scale,
          }}
          transition={{
            duration: 0.8,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

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
    <div className={`w-full relative flex-grow flex flex-col ${className}`}>
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
        className="relative text-center pt-12 mb-10"
      >
        {/* Decorative top element */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/60" />
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </motion.div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/60" />
        </div>

        <h2 className="text-2xl md:text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-purple-200 mb-3 tracking-wide">
          {language === 'fr'
            ? "Choisissez Votre Chemin"
            : 'Choose Your Path'}
        </h2>

        <p className="text-purple-200/80 text-sm md:text-base max-w-lg mx-auto leading-relaxed mb-8">
          {language === 'fr'
            ? 'Six chemins. Une destinée. Les arcanes vous attendent.'
            : 'Six paths. One destiny. The arcana await.'}
        </p>

        {/* Decorative divider before buttons */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-500/40" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-purple-400/60 text-xs"
          >
            ✦
          </motion.div>
          <div className="h-px w-8 bg-purple-500/30" />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="text-amber-400/70 text-sm"
          >
            ◇
          </motion.div>
          <div className="h-px w-8 bg-purple-500/30" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="text-purple-400/60 text-xs"
          >
            ✦
          </motion.div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-500/40" />
        </div>
      </motion.div>

      {/* Expanded Category View */}
      <AnimatePresence mode="wait">
        {expandedCategory && (() => {
          const category = CATEGORIES.find(c => c.id === expandedCategory);
          if (!category) return null;
          const depths = getDepthsForCategory(category.id);

          return (
            <motion.div
              key="expanded-category"
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  opacity: { duration: 0.3 }
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 20,
                transition: { duration: 0.3 }
              }}
              className="relative mb-8"
            >
              {/* Particle burst on open */}
              <ParticleBurst />

              {/* Animated pulsing glow behind the container */}
              <motion.div
                className="absolute inset-0 mx-4 md:mx-8 rounded-3xl pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, ${unifiedTheme.glow}30 0%, transparent 70%)`,
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div
                className="relative overflow-hidden rounded-3xl border-2 backdrop-blur-xl bg-gradient-to-br from-violet-600/25 via-purple-600/20 to-fuchsia-600/25 mx-4 md:mx-8 mb-8"
                style={{
                  borderColor: `${unifiedTheme.border}66`,
                  boxShadow: `
                    0 25px 60px rgba(0,0,0,0.4),
                    0 0 20px ${unifiedTheme.glow}30,
                    0 0 40px ${unifiedTheme.glow}20,
                    0 0 80px ${unifiedTheme.glow}10
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

                {/* Unified purple tint */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-fuchsia-500/30"
                />

                {/* Unified ambient patterns */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {getUnifiedAmbientPattern()}
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
                            group relative p-4 rounded-xl border backdrop-blur-md
                            border-white/10 bg-white/5
                            ${!canAfford ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          whileHover={canAfford ? {
                            scale: 1.05,
                            y: -6,
                            borderColor: `${unifiedTheme.border}`,
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            boxShadow: `0 15px 40px ${unifiedTheme.glow}50, 0 0 30px ${unifiedTheme.border}40, 0 0 60px ${unifiedTheme.glow}20`,
                            transition: { type: "tween", duration: 0.2, ease: "easeOut" }
                          } : {}}
                          whileTap={canAfford ? { scale: 0.95 } : {}}
                          style={{
                            boxShadow: `0 4px 15px rgba(0,0,0,0.2), 0 0 10px ${unifiedTheme.glow}15`
                          }}
                        >
                          {/* Card visual */}
                          <div className="mb-3">
                            <DepthVisual
                              cards={depth.cards}
                              category={category.id}
                              colorTheme={{
                                glow: unifiedTheme.glow,
                                accent: unifiedTheme.accent,
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

                          {/* Locked overlay with buy credits button */}
                          {!canAfford && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCreditShop(true);
                                }}
                                className="text-xs font-semibold text-black bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 rounded-full border border-amber-300 shadow-lg shadow-amber-500/30 hover:from-amber-300 hover:to-yellow-400 hover:scale-105 transition-all duration-200"
                              >
                                {language === 'fr' ? 'Acheter des crédits' : 'Get More Credits'}
                              </button>
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
                                  ? `0 15px 40px ${unifiedTheme.glow}50, 0 0 30px ${unifiedTheme.border}40`
                                  : `0 4px 15px rgba(0,0,0,0.2)`
                              }}
                            >
                              {/* Card visual */}
                              <div className="mb-3">
                                <DepthVisual
                                  cards={depth.cards}
                                  category={category.id}
                                  colorTheme={{
                                    glow: unifiedTheme.glow,
                                    accent: unifiedTheme.accent,
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

                              {/* Locked overlay with buy credits button */}
                              {!canAfford && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowCreditShop(true);
                                    }}
                                    className="text-xs font-semibold text-black bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 rounded-full border border-amber-300 shadow-lg shadow-amber-500/30 hover:from-amber-300 hover:to-yellow-400 hover:scale-105 transition-all duration-200"
                                  >
                                    {language === 'fr' ? 'Acheter des crédits' : 'Get More Credits'}
                                  </button>
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
      <AnimatePresence mode="wait">
        {!expandedCategory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20, filter: "blur(8px)" }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-8"
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
                  className="group w-full relative overflow-hidden rounded-2xl border-2 transition-all duration-300 backdrop-blur-md bg-gradient-to-br from-violet-600/25 via-purple-600/20 to-fuchsia-600/25"
                  style={{
                    borderColor: `${unifiedTheme.border}66`,
                    boxShadow: `
                      0 8px 25px rgba(0,0,0,0.3),
                      0 0 15px ${unifiedTheme.glow}25,
                      0 0 30px ${unifiedTheme.glow}10
                    `,
                  }}
                  whileHover={{
                    scale: 1.05,
                    y: -12,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={(e, info) => {
                    const el = e.target as HTMLElement | null;
                    if (el?.style) {
                      el.style.borderColor = unifiedTheme.borderHover;
                      el.style.boxShadow = `
                        0 25px 50px rgba(0,0,0,0.5),
                        0 0 20px ${unifiedTheme.glow}50,
                        0 0 40px ${unifiedTheme.border}35,
                        0 0 80px ${unifiedTheme.glow}20,
                        inset 0 0 30px ${unifiedTheme.glow}15
                      `;
                    }
                  }}
                  onHoverEnd={(e, info) => {
                    const el = e.target as HTMLElement | null;
                    if (el?.style) {
                      el.style.borderColor = `${unifiedTheme.border}66`;
                      el.style.boxShadow = `
                        0 8px 25px rgba(0,0,0,0.3),
                        0 0 15px ${unifiedTheme.glow}25,
                        0 0 30px ${unifiedTheme.glow}10
                      `;
                    }
                  }}
                >
                  {/* Subtle glow ring */}
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 -z-10 opacity-60" />

                  {/* Border glow pulse on hover */}
                  <motion.div
                    className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 -z-10"
                    style={{
                      background: `linear-gradient(135deg, ${unifiedTheme.border}60, ${unifiedTheme.glow}40, ${unifiedTheme.border}60)`,
                    }}
                    initial={false}
                    whileHover={{
                      opacity: [0, 1, 0.6],
                      transition: { duration: 0.4, ease: "easeOut" }
                    }}
                  />

                  {/* Animated glow pulse on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${unifiedTheme.glow}50 0%, transparent 60%)`,
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
                  <div className="relative px-3 py-4 flex items-center gap-3">
                    {/* Icon/Symbol container */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 border border-white/30 group-hover:scale-110 transition-all duration-300 shadow-lg"
                      >
                        {/* Mystical symbol */}
                        <span
                          className="text-lg transition-all duration-300 group-hover:scale-110 text-white"
                        >
                          {categorySymbols[category.id]}
                        </span>
                      </div>
                      {/* Glow behind icon on hover */}
                      <div
                        className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 opacity-50 blur-md -z-10 group-hover:opacity-80 transition-opacity duration-300"
                      />
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-base text-white group-hover:text-white transition-colors mb-0.5">
                        {getLabel(category)}
                      </h3>
                      <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors leading-snug line-clamp-2">
                        {getTagline(category)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom decorative section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="flex-grow flex flex-col items-center justify-center min-h-[120px] mt-8"
      >
        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-purple-500/30 to-purple-500/50" />
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="text-purple-400/40"
          >
            ✧
          </motion.div>
          <div className="h-px w-20 bg-gradient-to-l from-transparent via-purple-500/30 to-purple-500/50" />
        </div>

        {/* Mystical quote */}
        <p className="text-purple-200/80 text-sm md:text-base text-center max-w-lg px-4 leading-relaxed">
          {language === 'fr'
            ? '"Les cartes ne mentent jamais, elles révèlent ce que nous savons déjà."'
            : '"The cards never lie, they reveal what we already know."'}
        </p>
      </motion.div>

      {/* Credit Shop Modal */}
      <CreditShop
        isOpen={showCreditShop}
        onClose={() => setShowCreditShop(false)}
      />
    </div>
  );
};

export default CategorySelector;
