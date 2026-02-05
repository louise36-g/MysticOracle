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
  const [selectedSpread, setSelectedSpread] = useState<SpreadType | null>(null);

  const handleBuyCredits = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowCreditShop(true);
  };

  const handleSpreadClick = (spread: SpreadConfig) => {
    const hasEnoughCredits = user && user.credits >= spread.cost;
    if (!hasEnoughCredits) return;

    if (onSelect) {
      onSelect(spread);
    }
  };

  const spreadsArray = Object.values(SPREADS);

  return (
    <>
      <CreditShop isOpen={showCreditShop} onClose={() => setShowCreditShop(false)} />

      <div className="max-w-4xl mx-auto py-3 px-6 md:px-10 mb-8">
        {/* Minimal header */}
        <motion.div
          className="text-center mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xs font-medium text-slate-500 tracking-widest uppercase">
            {language === 'fr' ? 'Sélectionnez votre tirage' : 'Select your spread'}
          </h2>
        </motion.div>

        {/* Horizontal spread selector - floating cards */}
        <div className="relative">

          {/* Cards in horizontal scroll on mobile, centered flex on desktop */}
          <div className="flex gap-2 overflow-x-auto pb-2 px-2 md:overflow-visible md:flex-wrap md:justify-center scrollbar-hide">
            {spreadsArray.map((spread, index) => {
              const hasEnoughCredits = user && user.credits >= spread.cost;
              const theme = SPREAD_THEMES[spread.id];
              const isSelected = selectedSpread === spread.id;
              const totalCards = spreadsArray.length;

              // Fan angle calculation for hover effect
              const baseAngle = (index - (totalCards - 1) / 2) * 2;

              return (
                <motion.div
                  key={spread.id}
                  initial={{ opacity: 0, y: 20, rotateZ: baseAngle }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotateZ: isSelected ? 0 : baseAngle,
                    scale: isSelected ? 1.05 : 1,
                  }}
                  whileHover={{
                    y: -12,
                    rotateZ: 0,
                    scale: 1.05,
                    zIndex: 10,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                  }}
                  onClick={() => handleSpreadClick(spread)}
                  onHoverStart={() => setSelectedSpread(spread.id)}
                  onHoverEnd={() => setSelectedSpread(null)}
                  className={`
                    relative flex-shrink-0 w-[120px] rounded-lg overflow-hidden cursor-pointer
                    border backdrop-blur-md transition-all duration-300
                    ${isSelected ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5'}
                    ${!hasEnoughCredits ? 'opacity-60 cursor-not-allowed' : ''}
                    hover:border-white/30 hover:bg-white/10
                  `}
                  style={{
                    boxShadow: isSelected
                      ? `0 10px 25px -8px ${theme?.glowColor || 'rgba(139, 92, 246, 0.4)'}`
                      : '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Subtle themed tint */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme?.gradient || 'from-slate-900 to-slate-800'} opacity-40`} />

                  {/* Shimmer on hover */}
                  <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                  {/* Content */}
                  <div className="relative z-10 p-2">
                    {/* Icon and name */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`${theme?.accent || 'text-purple-300'} opacity-80 [&>svg]:w-4 [&>svg]:h-4`}>
                        {theme?.icon}
                      </span>
                      <h3 className="text-xs font-heading text-white/95 truncate">
                        {language === 'en' ? spread.nameEn : spread.nameFr}
                      </h3>
                    </div>

                    {/* Visual spread - compact */}
                    <div className="h-[50px] flex items-center justify-center mb-1 scale-[0.7] origin-center">
                      <SpreadVisual spreadId={spread.id} />
                    </div>

                    {/* Footer: cards count and cost */}
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-white/50">
                        {spread.positions} {language === 'en' ? 'cards' : 'cartes'}
                      </span>
                      <div className={`flex items-center gap-0.5 ${!hasEnoughCredits ? 'text-red-400' : theme?.accent || 'text-purple-300'}`}>
                        <Coins className="w-2.5 h-2.5" />
                        <span className="font-bold">{spread.cost}</span>
                      </div>
                    </div>
                  </div>

                  {/* Insufficient credits badge */}
                  {!hasEnoughCredits && (
                    <div
                      className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyCredits(e);
                      }}
                    >
                      <button
                        className="flex items-center gap-1 px-2 py-1 bg-amber-500/90 hover:bg-amber-400 rounded text-white text-[9px] font-semibold transition-all"
                      >
                        <ShoppingCart className="w-2.5 h-2.5" />
                        {t('SpreadSelector.tsx.SpreadSelector.buy_credits', 'Buy Credits')}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Selected spread tagline - shows when hovering */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedSpread ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-center mt-2 h-5"
        >
          {selectedSpread && SPREAD_THEMES[selectedSpread] && (
            <p className={`text-xs ${SPREAD_THEMES[selectedSpread]?.accent} opacity-70`}>
              {language === 'en'
                ? SPREAD_THEMES[selectedSpread]?.taglineEn
                : SPREAD_THEMES[selectedSpread]?.taglineFr}
            </p>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default SpreadSelector;
