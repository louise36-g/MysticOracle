// components/CategorySelector.tsx
// Category-first selection grid with inline depth expansion
// Enhanced "Arcana Sanctum" design

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Coins, Sparkles } from 'lucide-react';
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
              <div
                className={`
                  relative overflow-hidden rounded-3xl border
                  bg-gradient-to-br ${category.colorTheme.gradient}
                `}
                style={{
                  borderColor: `${category.colorTheme.glow}`,
                  boxShadow: `0 25px 80px rgba(0,0,0,0.5), 0 0 60px ${category.colorTheme.glow}`,
                }}
              >
                {/* Decorative corners */}
                <CornerDecoration position="tl" />
                <CornerDecoration position="tr" />
                <CornerDecoration position="bl" />
                <CornerDecoration position="br" />

                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                  {/* Floating particles */}
                  {[...Array(8)].map((_, i) => (
                    <FloatingParticle key={i} delay={i * 0.5} x={`${10 + i * 12}%`} y={`${20 + (i % 3) * 25}%`} />
                  ))}
                </div>

                {/* Header Section */}
                <div className="relative p-8 md:p-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      {/* Large mystical symbol */}
                      <div className="relative">
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20"
                          style={{ boxShadow: `0 0 30px ${category.colorTheme.glow}` }}
                        >
                          <span className="text-4xl text-white/90">{categorySymbols[category.id]}</span>
                        </div>
                        {/* Glow ring */}
                        <div
                          className="absolute inset-0 rounded-2xl opacity-50 blur-xl"
                          style={{ backgroundColor: category.colorTheme.glow }}
                        />
                      </div>

                      <div>
                        <h3 className="font-heading text-2xl md:text-3xl text-white mb-1">
                          {getLabel(category)}
                        </h3>
                        <p className="text-base text-white/70">
                          {getTagline(category)}
                        </p>
                      </div>
                    </div>

                    {/* Back button */}
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={handleClose}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all text-white text-sm font-medium"
                      whileHover={{ x: -4 }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{language === 'fr' ? 'Retour' : 'Back'}</span>
                    </motion.button>
                  </div>
                </div>

                {/* Depth Selection Section */}
                <div className="relative px-8 md:px-10 pb-10">
                  {/* Elegant divider */}
                  <div className="relative mb-10">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-transparent">
                      <span className="text-white/40 text-lg">✦</span>
                    </div>
                  </div>

                  {/* Question prompt */}
                  <p className="text-white/90 text-center mb-10 font-heading text-xl">
                    {language === 'fr'
                      ? "Quelle profondeur d'exploration souhaitez-vous ?"
                      : 'How deep would you like to explore?'}
                  </p>

                  {/* Depth Options */}
                  <div className={`grid gap-5 ${
                    depths.length <= 3
                      ? 'grid-cols-3 max-w-xl mx-auto'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                  }`}>
                    {depths.map((depth, index) => {
                      const isHovered = hoveredDepth === depth.cards;
                      const userCredits = user?.credits ?? 0;
                      const canAfford = userCredits >= depth.cost;

                      return (
                        <motion.button
                          key={depth.cards}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          onClick={() => handleDepthSelect(category, depth)}
                          onMouseEnter={() => setHoveredDepth(depth.cards)}
                          onMouseLeave={() => setHoveredDepth(null)}
                          disabled={!canAfford}
                          className={`
                            group relative p-6 rounded-2xl border-2 transition-all duration-300
                            ${isHovered && canAfford
                              ? 'border-white/70 bg-white/20'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                            }
                            ${!canAfford ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          whileHover={canAfford ? { scale: 1.05, y: -6 } : {}}
                          whileTap={canAfford ? { scale: 0.95 } : {}}
                          style={isHovered && canAfford ? {
                            boxShadow: `0 15px 50px ${category.colorTheme.glow}, 0 0 40px ${category.colorTheme.glow}`
                          } : undefined}
                        >
                          {/* Card visual */}
                          <div className="mb-5">
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
                          <p className="text-white font-medium text-center mb-4 text-sm leading-tight min-h-[2.5rem] flex items-center justify-center">
                            {getDepthLabel(depth)}
                          </p>

                          {/* Cost badge */}
                          <div className={`
                            flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-full
                            ${canAfford
                              ? 'text-amber-300 bg-amber-500/20 border border-amber-400/40'
                              : 'text-red-300 bg-red-500/20 border border-red-400/40'
                            }
                          `}>
                            <Coins className="w-4 h-4" />
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

                  {/* Credit balance display */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 text-center"
                  >
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border border-white/20">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <span className="text-white/70">
                        {language === 'fr' ? 'Votre solde:' : 'Your balance:'}
                      </span>
                      <span className="text-amber-300 font-bold text-lg">
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
                  className={`
                    group w-full relative overflow-hidden rounded-2xl border transition-all duration-500
                    bg-gradient-to-br ${category.colorTheme.gradient}
                  `}
                  style={{
                    borderColor: `${category.colorTheme.glow}40`,
                  }}
                  whileHover={{
                    scale: 1.03,
                    y: -8,
                    borderColor: `${category.colorTheme.glow}`,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={(e) => {
                    const el = e.target as HTMLElement;
                    el.style.boxShadow = `0 20px 60px rgba(0,0,0,0.4), 0 0 50px ${category.colorTheme.glow}`;
                  }}
                  onHoverEnd={(e) => {
                    const el = e.target as HTMLElement;
                    el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.3)`;
                  }}
                >
                  {/* Corner decorations */}
                  <CornerDecoration position="tl" className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CornerDecoration position="br" className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Hover glow background */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${category.colorTheme.glow} 0%, transparent 70%)`,
                    }}
                  />

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                  {/* Content */}
                  <div className="relative p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon/Symbol container */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/20 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300"
                        >
                          {/* Mystical symbol */}
                          <span className="text-2xl text-white/90 group-hover:text-white transition-colors">
                            {categorySymbols[category.id]}
                          </span>
                        </div>
                        {/* Glow effect */}
                        <div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-lg"
                          style={{ backgroundColor: category.colorTheme.glow }}
                        />
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="font-heading text-lg text-white group-hover:text-white transition-colors mb-1">
                          {getLabel(category)}
                        </h3>
                        <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors leading-relaxed line-clamp-2">
                          {getTagline(category)}
                        </p>
                      </div>
                    </div>

                    {/* Bottom action hint */}
                    <div className="flex items-center justify-end mt-4 pt-3 border-t border-white/10">
                      <motion.div
                        className="flex items-center gap-2 text-white/50 group-hover:text-amber-300 transition-colors"
                        initial={false}
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <span className="text-sm font-medium">
                          {language === 'fr' ? 'Explorer' : 'Explore'}
                        </span>
                        <span className="text-lg">→</span>
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
