// components/reading/phases/FiveCardLayoutSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  FiveCardCategory,
  FiveCardLayoutId,
  FIVE_CARD_LAYOUTS,
  getFiveCardCategory,
} from '../../../constants/fiveCardLayouts';

interface FiveCardLayoutSelectorProps {
  language: 'en' | 'fr';
  category: FiveCardCategory;
  selectedLayout: FiveCardLayoutId | null;
  onSelect: (layoutId: FiveCardLayoutId) => void;
}

const FiveCardLayoutSelector: React.FC<FiveCardLayoutSelectorProps> = ({
  language,
  category,
  selectedLayout,
  onSelect,
}) => {
  const categoryConfig = getFiveCardCategory(category);
  if (!categoryConfig) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4 pt-4 border-t border-slate-700/50"
    >
      <p className="text-sm text-slate-400 mb-3">
        {language === 'en' ? 'Choose your layout' : 'Choisissez votre disposition'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {categoryConfig.layouts.map((layoutId) => {
          const layout = FIVE_CARD_LAYOUTS[layoutId];
          const isSelected = selectedLayout === layoutId;

          return (
            <motion.button
              key={layoutId}
              onClick={() => onSelect(layoutId)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-3 rounded-lg border transition-all text-left
                ${isSelected
                  ? 'bg-purple-500/20 border-purple-500/40 ring-1 ring-purple-400/30'
                  : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${isSelected ? 'text-purple-200' : 'text-slate-300'}`}>
                  {language === 'en' ? layout.labelEn : layout.labelFr}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-purple-300" />}
              </div>
              <p className="text-xs text-slate-500">
                {language === 'en' ? layout.taglineEn : layout.taglineFr}
              </p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default FiveCardLayoutSelector;
