import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROUTES, buildRoute } from '../routes/routes';
import { SPREADS } from '../constants';
import { SpreadType, SpreadConfig } from '../types';
import { motion } from 'framer-motion';
import { Coins, ShoppingCart, Eye, Clock, Sparkles, Compass, Layers } from 'lucide-react';
import CreditShop from './CreditShop';

interface SpreadSelectorProps {
  onSelect?: (spread: SpreadConfig) => void; // Optional - if not provided, uses Link navigation
}

// Spread theme configurations - each spread has a unique color identity
const SPREAD_THEMES: Partial<Record<SpreadType, {
  gradient: string;
  accent: string;
  icon: React.ReactNode;
  pattern: string;
  glowColor: string;
  borderAccent: string;
  taglineEn: string;
  taglineFr: string;
}>> = {
  [SpreadType.SINGLE]: {
    // Cyan/Indigo - The Oracle's Eye
    gradient: 'from-indigo-950 via-slate-900 to-indigo-950',
    accent: 'text-cyan-300',
    icon: <Eye className="w-5 h-5" />,
    pattern: 'radial-gradient(circle at 50% 30%, rgba(103, 232, 249, 0.15) 0%, transparent 50%)',
    glowColor: 'rgba(103, 232, 249, 0.3)',
    borderAccent: 'hover:border-cyan-400/50',
    taglineEn: 'Clarity in Focus',
    taglineFr: 'Clarté Concentrée',
  },
  [SpreadType.THREE_CARD]: {
    // Fuchsia/Magenta - River of Time (moved from horseshoe)
    gradient: 'from-fuchsia-950 via-purple-900 to-fuchsia-950',
    accent: 'text-fuchsia-300',
    icon: <Clock className="w-5 h-5" />,
    pattern: 'linear-gradient(90deg, rgba(232, 121, 249, 0.08) 0%, rgba(192, 38, 211, 0.12) 50%, rgba(232, 121, 249, 0.08) 100%)',
    glowColor: 'rgba(232, 121, 249, 0.3)',
    borderAccent: 'hover:border-fuchsia-400/50',
    taglineEn: 'Past • Present • Future',
    taglineFr: 'Passé • Présent • Futur',
  },
  [SpreadType.FIVE_CARD]: {
    // Purple/Violet - Deep Inner Work
    gradient: 'from-violet-950 via-purple-900 to-violet-950',
    accent: 'text-violet-300',
    icon: <Layers className="w-5 h-5" />,
    pattern: 'radial-gradient(ellipse at 50% 50%, rgba(167, 139, 250, 0.15) 0%, transparent 60%)',
    glowColor: 'rgba(167, 139, 250, 0.3)',
    borderAccent: 'hover:border-violet-400/50',
    taglineEn: 'Deep Inner Work',
    taglineFr: 'Travail Intérieur Profond',
  },
  [SpreadType.HORSESHOE]: {
    // Deep Blue/Sapphire - Fortune's Arc (new unique color)
    gradient: 'from-blue-950 via-indigo-900 to-blue-950',
    accent: 'text-blue-300',
    icon: <Sparkles className="w-5 h-5" />,
    pattern: 'radial-gradient(ellipse at 50% 70%, rgba(96, 165, 250, 0.12) 0%, transparent 50%)',
    glowColor: 'rgba(96, 165, 250, 0.3)',
    borderAccent: 'hover:border-blue-400/50',
    taglineEn: 'Fortune\'s Arc',
    taglineFr: 'L\'Arc de la Fortune',
  },
  [SpreadType.CELTIC_CROSS]: {
    // Emerald/Teal - Ancient Wisdom
    gradient: 'from-emerald-950 via-teal-900 to-emerald-950',
    accent: 'text-emerald-300',
    icon: <Compass className="w-5 h-5" />,
    pattern: 'radial-gradient(circle at 30% 30%, rgba(52, 211, 153, 0.08) 0%, transparent 40%)',
    glowColor: 'rgba(52, 211, 153, 0.25)',
    borderAccent: 'hover:border-emerald-400/50',
    taglineEn: 'Ancient Wisdom',
    taglineFr: 'Sagesse Ancestrale',
  },
};

// Visual spread layouts with themed colors and proper tarot card ratio
// Rider-Waite ratio: 2.75" x 4.75" = 1:1.727
const SpreadVisual: React.FC<{ spreadId: SpreadType }> = ({ spreadId }) => {
  const baseClass = "rounded-sm border transition-all duration-300";
  const cardClass = `${baseClass} bg-gradient-to-br from-white/10 to-white/5 border-white/20 group-hover:border-white/40 group-hover:from-white/20 group-hover:to-white/10`;

  // Tarot card sizes (ratio 2.75:4.75 ≈ 1:1.727)
  // XL: w-7 (28px) h-12 (48px) - single card
  // Large: w-5 (20px) h-[35px] - 3-card, love, career
  // Medium: w-4 (16px) h-7 (28px) - horseshoe
  // Small: w-[14px] h-6 (24px) - celtic cross

  switch (spreadId) {
    case SpreadType.SINGLE:
      return (
        <div className="flex justify-center items-center relative">
          {/* Spotlight effect - cyan */}
          <div className="absolute w-20 h-20 bg-cyan-400/10 rounded-full blur-xl group-hover:bg-cyan-400/20 transition-all duration-500" />
          <motion.div
            className={`${cardClass} w-7 h-12 relative z-10 shadow-lg shadow-cyan-500/20`}
            whileHover={{ rotateY: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
        </div>
      );

    case SpreadType.THREE_CARD:
      return (
        <div className="flex justify-center items-center gap-2 relative">
          {/* Timeline glow - fuchsia */}
          <div className="absolute inset-x-6 top-1/2 h-0.5 bg-gradient-to-r from-fuchsia-500/20 via-purple-400/40 to-fuchsia-500/20 -translate-y-1/2 blur-sm" />
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${cardClass} w-5 h-[35px] relative z-10 shadow-md shadow-fuchsia-500/10`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.1 }}
            />
          ))}
        </div>
      );

    case SpreadType.FIVE_CARD:
      // Pentagon/star arrangement - violet theme
      return (
        <div className="flex justify-center items-center relative">
          {/* Violet glow */}
          <div className="absolute w-24 h-24 bg-violet-400/10 rounded-full blur-xl group-hover:bg-violet-400/20 transition-all duration-500" />
          {/* 5 cards in arc arrangement */}
          <div className="flex gap-1.5 relative z-10">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className={`${cardClass} w-5 h-[35px] shadow-md shadow-violet-500/10`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -5, scale: 1.08 }}
              />
            ))}
          </div>
        </div>
      );

    case SpreadType.HORSESHOE:
      // Tight horseshoe arc - deep blue/sapphire theme
      return (
        <div className="relative w-full flex justify-center items-center">
          {/* Arc glow - blue */}
          <div className="absolute top-0 w-32 h-14 rounded-t-full bg-blue-500/10 blur-lg group-hover:bg-blue-500/15 transition-all" />
          <div className="relative flex items-end gap-0.5 h-[60px]">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              // Tighter U-shape: steeper sides, flatter top
              const arcHeight = [0, 14, 22, 26, 22, 14, 0][i];
              // Tighter rotation angles for horseshoe shape
              const rotation = [25, 15, 6, 0, -6, -15, -25][i];

              return (
                <motion.div
                  key={i}
                  className={`${cardClass} w-4 h-7 shadow-md shadow-blue-500/10`}
                  style={{
                    marginBottom: `${arcHeight}px`,
                    transform: `rotate(${rotation}deg)`,
                  }}
                  whileHover={{ scale: 1.15, rotate: 0, y: -4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                />
              );
            })}
          </div>
        </div>
      );

    case SpreadType.CELTIC_CROSS:
      // Celtic cross - emerald/teal theme, subtle pattern
      return (
        <div className="relative w-full flex justify-center items-center">
          {/* Subtle glow instead of pattern */}
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
          <div className="relative flex items-center gap-3">
            {/* Cross formation */}
            <div className="relative w-[52px] h-[66px]">
              {/* Center vertical card - tarot ratio */}
              <motion.div
                className={`${cardClass} w-4 h-7 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 shadow-md shadow-emerald-500/10`}
                whileHover={{ scale: 1.15 }}
              />
              {/* Crossing horizontal card - same dimensions, rotated */}
              <motion.div
                className={`${cardClass} w-4 h-7 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 opacity-80 shadow-md shadow-emerald-500/10`}
                whileHover={{ scale: 1.15 }}
              />
              {/* Cross arms - tarot ratio */}
              <motion.div className={`${cardClass} w-[14px] h-6 absolute -top-0.5 left-1/2 -translate-x-1/2`} whileHover={{ scale: 1.1 }} />
              <motion.div className={`${cardClass} w-[14px] h-6 absolute -bottom-0.5 left-1/2 -translate-x-1/2`} whileHover={{ scale: 1.1 }} />
              <motion.div className={`${cardClass} w-[14px] h-6 absolute top-1/2 -left-0.5 -translate-y-1/2`} whileHover={{ scale: 1.1 }} />
              <motion.div className={`${cardClass} w-[14px] h-6 absolute top-1/2 -right-0.5 -translate-y-1/2`} whileHover={{ scale: 1.1 }} />
            </div>
            {/* Staff - vertical column of 4 cards */}
            <div className="flex flex-col gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className={`${cardClass} w-[14px] h-[15px]`}
                  whileHover={{ scale: 1.15, x: 2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                />
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex gap-2 h-20 items-center justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${cardClass} w-5 h-8`} />
          ))}
        </div>
      );
  }
};

const SpreadSelector: React.FC<SpreadSelectorProps> = ({ onSelect }) => {
  const { language, user, t } = useApp();
  const [showCreditShop, setShowCreditShop] = useState(false);
  const [hoveredSpread, setHoveredSpread] = useState<SpreadType | null>(null);

  const handleBuyCredits = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowCreditShop(true);
  };

  // Convert spread id to URL-friendly slug (e.g., 'three-card' from SpreadType.THREE_CARD)
  const getSpreadSlug = (spreadId: SpreadType): string => {
    const slugMap: Partial<Record<SpreadType, string>> = {
      [SpreadType.SINGLE]: 'single',
      [SpreadType.THREE_CARD]: 'three-card',
      [SpreadType.FIVE_CARD]: 'five-card',
      [SpreadType.HORSESHOE]: 'horseshoe',
      [SpreadType.CELTIC_CROSS]: 'celtic-cross',
    };
    return slugMap[spreadId] || spreadId;
  };

  return (
    <>
    <CreditShop isOpen={showCreditShop} onClose={() => setShowCreditShop(false)} />
    <div className="max-w-5xl mx-auto py-12 px-4">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-amber-200 mb-3">
          {t('SpreadSelector.tsx.SpreadSelector.choose_your_spread', 'Choose Your Spread')}
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          {language === 'en'
            ? 'Each spread reveals different facets of your journey. Select the path that calls to you.'
            : 'Chaque tirage révèle différentes facettes de votre voyage. Sélectionnez le chemin qui vous appelle.'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.values(SPREADS).map((spread, index) => {
          const hasEnoughCredits = user && user.credits >= spread.cost;
          const theme = SPREAD_THEMES[spread.id];
          const isHovered = hoveredSpread === spread.id;

          // Build the spread URL for linking
          const spreadUrl = buildRoute(ROUTES.READING_SPREAD, { spreadType: getSpreadSlug(spread.id) });

          // Card content (shared between Link and callback modes)
          const cardContent = (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredSpread(spread.id)}
              onHoverEnd={() => setHoveredSpread(null)}
              className={`
                relative rounded-2xl overflow-hidden cursor-pointer group
                border border-white/10 ${theme.borderAccent}
                transition-all duration-500
                ${!hasEnoughCredits ? 'opacity-80' : ''}
              `}
              style={{
                boxShadow: isHovered ? `0 20px 40px -15px ${theme.glowColor}` : 'none',
              }}
            >
              {/* Themed background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
              <div className="absolute inset-0" style={{ background: theme.pattern }} />

              {/* Animated glow on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${theme.glowColor} 0%, transparent 70%)`,
                }}
              />

              {/* Card content */}
              <div className="relative z-10 p-6">
                {/* Header with icon and title */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${theme.accent} opacity-80`}>{theme.icon}</span>
                      <h3 className="text-xl font-heading text-white/95">
                        {language === 'en' ? spread.nameEn : spread.nameFr}
                      </h3>
                    </div>
                    <p className={`text-xs ${theme.accent} opacity-70 font-medium tracking-wide`}>
                      {language === 'en' ? theme.taglineEn : theme.taglineFr}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-white/40">
                      {t('SpreadSelector.tsx.SpreadSelector.cards', 'Cards')}
                    </span>
                    <p className="text-lg font-bold text-white/80">{spread.positions}</p>
                  </div>
                </div>

                {/* Visual spread representation - fixed height for alignment */}
                <div className="h-[88px] flex items-center justify-center my-4">
                  <SpreadVisual spreadId={spread.id} />
                </div>

                {/* Footer with credits */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-white/40 uppercase tracking-wider">
                    {t('SpreadSelector.tsx.SpreadSelector.cost', 'Cost')}
                  </span>
                  <div className={`flex items-center gap-1.5 ${!hasEnoughCredits ? 'text-red-400' : theme.accent}`}>
                    <Coins className="w-4 h-4" />
                    <span className="font-bold text-lg">{spread.cost}</span>
                  </div>
                </div>
              </div>

              {/* Insufficient credits overlay */}
              {!hasEnoughCredits && (
                <motion.div
                  className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-full text-sm text-red-300 font-medium">
                    {t('SpreadSelector.tsx.SpreadSelector.insufficient_credits', 'Insufficient Credits')}
                  </span>
                  <button
                    onClick={handleBuyCredits}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-sm font-semibold hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {t('SpreadSelector.tsx.SpreadSelector.buy_credits', 'Buy Credits')}
                  </button>
                </motion.div>
              )}
            </motion.div>
          );

          // If callback provided (legacy), use onClick; otherwise use Link
          if (onSelect) {
            return (
              <div key={spread.id} onClick={() => onSelect(spread)}>
                {cardContent}
              </div>
            );
          }

          // Use Link for proper navigation (can be opened in new tab)
          return (
            <Link key={spread.id} to={spreadUrl} className="block">
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
    </>
  );
};

export default SpreadSelector;
