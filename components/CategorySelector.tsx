// components/CategorySelector.tsx
// Category-first selection grid with inline depth expansion

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins } from 'lucide-react';
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

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-heading text-white mb-2">
          {language === 'fr'
            ? "Qu'est-ce qui vous attire aujourd'hui?"
            : 'What draws you today?'}
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          {language === 'fr'
            ? 'Choisissez un theme pour commencer votre voyage mystique'
            : 'Choose a theme to begin your mystical journey'}
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const isOtherExpanded = expandedCategory !== null && !isExpanded;
          const depths = getDepthsForCategory(category.id);

          return (
            <motion.div
              key={category.id}
              layout
              className={`${isExpanded ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}`}
              transition={{ layout: { duration: 0.3, ease: 'easeInOut' } }}
            >
              <motion.div
                layout
                className={`
                  relative overflow-hidden rounded-2xl border transition-all duration-300
                  ${isExpanded
                    ? `bg-gradient-to-br ${category.colorTheme.gradient} ${category.colorTheme.border} shadow-lg`
                    : `bg-slate-900/80 border-slate-700/50 hover:${category.colorTheme.border}`
                  }
                  ${isOtherExpanded ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
                `}
                animate={{
                  opacity: isOtherExpanded ? 0.4 : 1,
                  scale: isOtherExpanded ? 0.95 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Card Header (always visible) */}
                <motion.button
                  layout="position"
                  onClick={() => handleCategoryClick(category.id)}
                  disabled={isOtherExpanded}
                  className={`
                    w-full p-6 text-left transition-all
                    ${!isExpanded ? 'hover:bg-white/5' : ''}
                    ${isOtherExpanded ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  whileHover={!isExpanded && !isOtherExpanded ? { scale: 1.02 } : {}}
                  whileTap={!isOtherExpanded ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className={`
                          w-12 h-12 rounded-xl flex items-center justify-center
                          ${isExpanded
                            ? 'bg-white/20'
                            : `bg-gradient-to-br ${category.colorTheme.gradient}`
                          }
                        `}
                        style={!isExpanded ? {
                          boxShadow: `0 0 20px ${category.colorTheme.glow}`
                        } : undefined}
                      >
                        <span className="text-white">{category.icon}</span>
                      </div>

                      {/* Text */}
                      <div>
                        <h3 className={`
                          font-heading text-lg
                          ${isExpanded ? 'text-white' : 'text-white'}
                        `}>
                          {getLabel(category)}
                        </h3>
                        <p className={`
                          text-sm mt-1
                          ${isExpanded ? 'text-white/80' : 'text-slate-400'}
                        `}>
                          {getTagline(category)}
                        </p>
                      </div>
                    </div>

                    {/* Close button when expanded */}
                    {isExpanded && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClose();
                        }}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </motion.button>
                    )}
                  </div>
                </motion.button>

                {/* Expanded Content - Depth Selection */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        {/* Divider */}
                        <div className="h-px bg-white/20 mb-6" />

                        {/* Question */}
                        <p className="text-white/90 text-center mb-6 font-medium">
                          {language === 'fr'
                            ? 'Jusqu\'ou souhaitez-vous aller?'
                            : 'How deep would you like to go?'}
                        </p>

                        {/* Depth Options Grid - center items when fewer than 5 (like birth cards with 3) */}
                        <div className={`grid gap-3 ${
                          depths.length <= 3
                            ? 'grid-cols-3 max-w-md mx-auto'
                            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                        }`}>
                          {depths.map((depth) => {
                            const isHovered = hoveredDepth === depth.cards;
                            const userCredits = user?.credits ?? 0;
                            const canAfford = userCredits >= depth.cost;

                            return (
                              <motion.button
                                key={depth.cards}
                                onClick={() => handleDepthSelect(category, depth)}
                                onMouseEnter={() => setHoveredDepth(depth.cards)}
                                onMouseLeave={() => setHoveredDepth(null)}
                                className={`
                                  relative p-4 rounded-xl border-2 transition-all
                                  ${isHovered
                                    ? 'border-white/60 bg-white/20'
                                    : 'border-white/20 bg-white/10'
                                  }
                                  ${!canAfford ? 'opacity-60' : ''}
                                `}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={isHovered ? {
                                  boxShadow: `0 0 30px ${category.colorTheme.glow}`
                                } : undefined}
                              >
                                {/* Visual */}
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
                                <p className="text-white text-sm font-medium text-center mb-2 line-clamp-2 h-10 flex items-center justify-center">
                                  {getDepthLabel(depth)}
                                </p>

                                {/* Cost */}
                                <div className={`
                                  flex items-center justify-center gap-1.5 text-sm
                                  ${canAfford ? 'text-amber-300' : 'text-red-300'}
                                `}>
                                  <Coins className="w-4 h-4" />
                                  <span className="font-bold">{depth.cost}</span>
                                </div>

                                {/* Not enough credits indicator */}
                                {!canAfford && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                                    <span className="text-xs text-white/80 bg-black/60 px-2 py-1 rounded">
                                      {language === 'fr' ? 'Credits insuffisants' : 'Need credits'}
                                    </span>
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* Credit balance hint */}
                        <div className="mt-4 text-center">
                          <p className="text-white/60 text-sm">
                            {language === 'fr' ? 'Votre solde: ' : 'Your balance: '}
                            <span className="text-amber-300 font-bold">
                              {user?.credits ?? 0}
                            </span>
                            {' '}
                            {language === 'fr' ? 'credits' : 'credits'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Credit Shop Modal */}
      <CreditShop
        isOpen={showCreditShop}
        onClose={() => setShowCreditShop(false)}
      />
    </div>
  );
};

export default CategorySelector;
