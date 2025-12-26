import React from 'react';
import { useApp } from '../context/AppContext';
import { SPREADS } from '../constants';
import { SpreadType, SpreadConfig } from '../types';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface SpreadSelectorProps {
  onSelect: (spread: SpreadConfig) => void;
}

// Visual spread layouts
const SpreadVisual: React.FC<{ spreadId: SpreadType }> = ({ spreadId }) => {
  const cardClass = "w-4 h-6 rounded-sm bg-purple-900/60 border border-purple-500/40";

  switch (spreadId) {
    case SpreadType.SINGLE:
      return (
        <div className="flex justify-center items-center h-16">
          <div className={`${cardClass} w-5 h-7`} />
        </div>
      );

    case SpreadType.THREE_CARD:
      return (
        <div className="flex justify-center items-center gap-2 h-16">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cardClass} />
          ))}
        </div>
      );

    case SpreadType.LOVE:
    case SpreadType.CAREER:
      // 5 cards in a row
      return (
        <div className="flex justify-center items-center gap-1.5 h-16">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={cardClass} style={{ marginTop: i === 2 ? '-8px' : '0' }} />
          ))}
        </div>
      );

    case SpreadType.HORSESHOE:
      // Horseshoe/U shape - 7 cards
      return (
        <div className="relative h-16 w-full flex justify-center">
          <div className="relative w-28">
            {/* Left side going up */}
            <div className={`${cardClass} absolute bottom-0 left-0`} />
            <div className={`${cardClass} absolute bottom-3 left-2`} />
            <div className={`${cardClass} absolute bottom-6 left-4`} />
            {/* Top center */}
            <div className={`${cardClass} absolute top-0 left-1/2 -translate-x-1/2`} />
            {/* Right side going down */}
            <div className={`${cardClass} absolute bottom-6 right-4`} />
            <div className={`${cardClass} absolute bottom-3 right-2`} />
            <div className={`${cardClass} absolute bottom-0 right-0`} />
          </div>
        </div>
      );

    case SpreadType.CELTIC_CROSS:
      // Celtic Cross layout - cross on left, staff on right
      return (
        <div className="relative h-16 w-full flex justify-center">
          <div className="relative w-32">
            {/* Center cross */}
            <div className={`${cardClass} absolute top-1/2 left-6 -translate-y-1/2`} />
            <div className={`${cardClass} absolute top-1/2 left-6 -translate-y-1/2 rotate-90 scale-90`} />
            {/* Above */}
            <div className={`${cardClass} absolute top-0 left-6`} />
            {/* Below */}
            <div className={`${cardClass} absolute bottom-0 left-6`} />
            {/* Left */}
            <div className={`${cardClass} absolute top-1/2 left-0 -translate-y-1/2`} />
            {/* Right */}
            <div className={`${cardClass} absolute top-1/2 left-12 -translate-y-1/2`} />
            {/* Staff (right column) */}
            <div className={`${cardClass} absolute bottom-0 right-0`} />
            <div className={`${cardClass} absolute bottom-4 right-0`} />
            <div className={`${cardClass} absolute top-4 right-0`} />
            <div className={`${cardClass} absolute top-0 right-0`} />
          </div>
        </div>
      );

    default:
      return (
        <div className="flex gap-1.5 h-16 items-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cardClass} />
          ))}
        </div>
      );
  }
};

const SpreadSelector: React.FC<SpreadSelectorProps> = ({ onSelect }) => {
  const { language, user } = useApp();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h2 className="text-3xl md:text-4xl font-heading text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-purple-200 mb-2">
        {language === 'en' ? 'Choose Your Spread' : 'Choisissez Votre Tirage'}
      </h2>
      <p className="text-center text-slate-400 mb-12">
        {language === 'en'
          ? 'Select the path for your guidance today.'
          : 'Sélectionnez le chemin pour votre guidance aujourd\'hui.'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(SPREADS).map((spread) => {
          const hasEnoughCredits = user && user.credits >= spread.cost;

          return (
            <motion.div
              key={spread.id}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative bg-slate-800/50 border border-purple-500/20 rounded-xl overflow-hidden cursor-pointer group
                hover:border-amber-400/50 hover:bg-slate-800/80 transition-all duration-300
                ${!hasEnoughCredits ? 'opacity-75' : ''}
              `}
              onClick={() => onSelect(spread)}
            >
              {/* Card content */}
              <div className="p-5">
                <h3 className="text-xl font-heading text-purple-100 mb-1">
                  {language === 'en' ? spread.nameEn : spread.nameFr}
                </h3>

                <p className="text-xs uppercase tracking-wider text-slate-500 mb-4">
                  {language === 'en' ? `${spread.positions} Cards` : `${spread.positions} Cartes`}
                </p>

                {/* Visual spread representation */}
                <div className="mb-2">
                  <SpreadVisual spreadId={spread.id} />
                </div>
              </div>

              {/* Footer with credits */}
              <div className="px-5 py-3 bg-slate-900/50 border-t border-purple-500/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {language === 'en' ? 'Cost' : 'Coût'}
                </span>
                <div className={`flex items-center gap-1.5 ${!hasEnoughCredits ? 'text-red-400' : ''}`}>
                  <Coins className={`w-4 h-4 ${hasEnoughCredits ? 'text-amber-400' : 'text-red-400'}`} />
                  <span className={`font-bold ${hasEnoughCredits ? 'text-amber-400' : 'text-red-400'}`}>
                    {spread.cost}
                  </span>
                </div>
              </div>

              {/* Insufficient credits indicator */}
              {!hasEnoughCredits && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                  <span className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-full text-xs text-red-300">
                    {language === 'en' ? 'Insufficient Credits' : 'Crédits Insuffisants'}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SpreadSelector;
