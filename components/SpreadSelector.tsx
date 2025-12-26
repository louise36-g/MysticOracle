import React from 'react';
import { useApp } from '../context/AppContext';
import { SPREADS } from '../constants';
import { SpreadType, SpreadConfig } from '../types';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface SpreadSelectorProps {
  onSelect: (spread: SpreadConfig) => void;
}

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
        {Object.values(SPREADS).map((spread) => (
          <motion.div
            key={spread.id}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative bg-slate-800/50 border border-purple-500/20 rounded-xl overflow-hidden cursor-pointer group
              hover:border-amber-400/50 hover:bg-slate-800/80 transition-all duration-300
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

              {/* Visual card representation */}
              <div className="flex gap-1.5 mb-2">
                {Array.from({ length: Math.min(spread.positions, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-7 rounded-sm bg-purple-900/50 border border-purple-500/30"
                    style={{ marginTop: `${i * 2}px` }}
                  />
                ))}
                {spread.positions > 5 && (
                  <span className="text-slate-600 self-end text-sm ml-1">+{spread.positions - 5}</span>
                )}
              </div>
            </div>

            {/* Footer with credits */}
            <div className="px-5 py-3 bg-slate-900/50 border-t border-purple-500/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {language === 'en' ? 'Cost' : 'Coût'}
              </span>
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold">{spread.cost}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SpreadSelector;
