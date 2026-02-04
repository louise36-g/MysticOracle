// components/CategorySelector.tsx
// Category-first selection grid with inline depth expansion

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Coins, ArrowRight, Star } from 'lucide-react';
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
      // Clear the state so it doesn't persist on navigation
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
    // Check if user has enough credits
    const userCredits = user?.credits ?? 0;
    if (userCredits < depth.cost) {
      setShowCreditShop(true);
      return;
    }

    // Navigate to reading page
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

  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header with decorative elements */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/50" />
          <Star className="w-4 h-4 text-amber-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/50" />
        </div>
        <h2 className="text-2xl md:text-4xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-200 mb-3">
          {language === 'fr'
            ? "Qu'est-ce qui vous attire aujourd'hui?"
            : 'What draws you today?'}
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
          {language === 'fr'
            ? 'Choisissez un thème pour commencer votre voyage mystique'
            : 'Choose a theme to begin your mystical journey'}
        </p>
      </motion.div>

      {/* Expanded Category - Shows at top when selected */}
      <AnimatePresence>
        {expandedCategory && (() => {
          const category = CATEGORIES.find(c => c.id === expandedCategory);
          if (!category) return null;
          const depths = getDepthsForCategory(category.id);

          return (
            <motion.div
              key="expanded-category"
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-8"
            >
              <motion.div
                className={`
                  relative overflow-hidden rounded-3xl border-2 shadow-2xl
                  bg-gradient-to-br ${category.colorTheme.gradient} border-white/20
                `}
                style={{
                  boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${category.colorTheme.glow}`
                }}
              >
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                {/* Card Header */}
                <div className="relative p-6 md:p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Icon with enhanced styling */}
                      <div className="relative w-14 h-14 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/20">
                        <span className="text-white">{category.icon}</span>
                        <div className="absolute inset-0 rounded-xl bg-white/20 blur-md -z-10" />
                      </div>

                      {/* Text */}
                      <div>
                        <h3 className="font-heading text-xl md:text-2xl text-white">
                          {getLabel(category)}
                        </h3>
                        <p className="text-sm mt-1 text-white/80">
                          {getTagline(category)}
                        </p>
                      </div>
                    </div>

                    {/* Back button */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={handleClose}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all text-white text-sm font-medium"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{language === 'fr' ? 'Retour' : 'Back'}</span>
                    </motion.button>
                  </div>
                </div>

                {/* Expanded Content - Depth Selection */}
                <div className="relative px-6 md:px-8 pb-8">
                  {/* Divider with gradient */}
                  <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-8" />

                  {/* Question */}
                  <p className="text-white text-center mb-8 font-heading text-lg">
                    {language === 'fr'
                      ? 'Jusqu\'où voulez-vous plonger ?'
                      : 'How deep would you like to go?'}
                  </p>

                  {/* Depth Options Grid */}
                  <div className={`grid gap-4 ${
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleDepthSelect(category, depth)}
                          onMouseEnter={() => setHoveredDepth(depth.cards)}
                          onMouseLeave={() => setHoveredDepth(null)}
                          className={`
                            group relative p-5 rounded-2xl border-2 transition-all duration-300
                            ${isHovered
                              ? 'border-white/60 bg-white/25'
                              : 'border-white/20 bg-white/10 hover:bg-white/15'
                            }
                            ${!canAfford ? 'opacity-50' : ''}
                          `}
                          whileHover={{ scale: canAfford ? 1.05 : 1, y: canAfford ? -4 : 0 }}
                          whileTap={{ scale: canAfford ? 0.95 : 1 }}
                          style={isHovered && canAfford ? {
                            boxShadow: `0 10px 40px ${category.colorTheme.glow}, 0 0 30px ${category.colorTheme.glow}`
                          } : undefined}
                        >
                          {/* Visual */}
                          <div className="mb-4">
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
                          <p className="text-white text-sm font-medium text-center mb-3 line-clamp-2 h-10 flex items-center justify-center">
                            {getDepthLabel(depth)}
                          </p>

                          {/* Cost with pill styling */}
                          <div className={`
                            flex items-center justify-center gap-1.5 text-sm px-3 py-1.5 rounded-full
                            ${canAfford
                              ? 'text-amber-300 bg-amber-500/20 border border-amber-500/30'
                              : 'text-red-300 bg-red-500/20 border border-red-500/30'
                            }
                          `}>
                            <Coins className="w-4 h-4" />
                            <span className="font-bold">{depth.cost}</span>
                          </div>

                          {/* Not enough credits indicator */}
                          {!canAfford && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm">
                              <span className="text-xs text-white bg-black/70 px-3 py-1.5 rounded-full border border-white/10">
                                {language === 'fr' ? 'Crédits insuffisants' : 'Need credits'}
                              </span>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Credit balance hint with better styling */}
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-white/70 text-sm">
                        {language === 'fr' ? 'Votre solde:' : 'Your balance:'}
                      </span>
                      <span className="text-amber-300 font-bold">
                        {user?.credits ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Category Grid - Hidden when a category is expanded */}
      <AnimatePresence>
        {!expandedCategory && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                variants={cardVariants}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`
                    group w-full relative overflow-hidden rounded-2xl border-2 transition-all duration-500
                    bg-gradient-to-br ${category.colorTheme.gradient}
                    border-white/10 hover:border-white/30
                  `}
                  style={{
                    boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 40px rgba(0,0,0,0.4), 0 0 30px ${category.colorTheme.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.3)`;
                  }}
                >
                  {/* Background glow effect on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.colorTheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10`} />

                  {/* Floating particles */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-3 right-4 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: `${index * 0.2}s` }} />
                    <div className="absolute top-8 left-8 w-0.5 h-0.5 bg-white/15 rounded-full animate-pulse" style={{ animationDelay: `${index * 0.3}s` }} />
                    <div className="absolute bottom-6 right-6 w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: `${index * 0.4}s` }} />
                  </div>

                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                  <div className="relative p-6 text-left">
                    <div className="flex items-start gap-4">
                      {/* Icon with enhanced styling */}
                      <div
                        className={`
                          relative w-14 h-14 rounded-xl flex items-center justify-center
                          bg-white/20 backdrop-blur-sm border border-white/20
                          group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300
                        `}
                      >
                        <span className="text-white">{category.icon}</span>
                        {/* Icon glow */}
                        <div className="absolute inset-0 rounded-xl bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-lg text-white group-hover:text-white transition-colors">
                          {getLabel(category)}
                        </h3>
                        <p className="text-sm mt-1 text-white/70 group-hover:text-white/90 transition-colors line-clamp-2">
                          {getTagline(category)}
                        </p>
                      </div>
                    </div>

                    {/* Explore indicator - appears on hover */}
                    <div className="flex items-center justify-end gap-2 mt-4 text-white/60 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <span className="text-sm font-medium">
                        {language === 'fr' ? 'Explorer' : 'Explore'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
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
