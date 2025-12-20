import React from 'react';
import { useApp } from '../context/AppContext';
import { SPREADS } from '../constants';
import { SpreadType, SpreadConfig } from '../types';
import { motion } from 'framer-motion';

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
            whileHover={{ y: -5 }}
            className={`
              relative bg-slate-800/50 border border-purple-500/20 rounded-xl p-6 cursor-pointer overflow-hidden group
              hover:border-amber-400/50 hover:bg-slate-800/80 transition-all duration-300
            `}
            onClick={() => onSelect(spread)}
          >
            <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-1 bg-slate-950/50 rounded-full px-3 py-1 border border-amber-500/30">
                  <span className="text-amber-400 font-bold">{spread.cost}</span>
                  <span className="text-xs text-amber-200/70">CREDITS</span>
               </div>
            </div>

            <h3 className="text-xl font-heading text-purple-100 mb-2">
              {language === 'en' ? spread.nameEn : spread.nameFr}
            </h3>
            
            <div className="mb-4 flex items-center gap-2">
               <span className="text-xs uppercase tracking-wider text-slate-500">
                 {language === 'en' ? `${spread.positions} Cards` : `${spread.positions} Cartes`}
               </span>
            </div>

            <div className="flex gap-1 mt-4">
               {/* Minimal visual representation of spread */}
               {Array.from({ length: Math.min(spread.positions, 5) }).map((_, i) => (
                  <div key={i} className={`w-6 h-8 rounded-sm bg-purple-900/40 border border-purple-500/20 ${i === 0 ? 'mt-0' : 'mt-2'}`}></div>
               ))}
               {spread.positions > 5 && <span className="text-slate-600 self-end">...</span>}
            </div>

            {user && user.credits < spread.cost && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm z-10">
                 <span className="text-red-400 font-medium">
                   {language === 'en' ? 'Insufficient Credits' : 'Crédits Insuffisants'}
                 </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SpreadSelector;
