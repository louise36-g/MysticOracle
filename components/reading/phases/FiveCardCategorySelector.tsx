// components/reading/phases/FiveCardCategorySelector.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, Compass, Sprout, Users, Check } from 'lucide-react';
import {
  FiveCardCategory,
  FIVE_CARD_CATEGORIES,
} from '../../../constants/fiveCardLayouts';

interface FiveCardCategorySelectorProps {
  language: 'en' | 'fr';
  selectedCategory: FiveCardCategory | null;
  onSelect: (category: FiveCardCategory) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Eye,
  Heart,
  Compass,
  Sprout,
  Users,
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string }> = {
  indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-300' },
  rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-300' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300' },
  violet: { bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-300' },
};

const FiveCardCategorySelector: React.FC<FiveCardCategorySelectorProps> = ({
  language,
  selectedCategory,
  onSelect,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 text-center mb-4">
        {language === 'en' ? 'Choose your focus' : 'Choisissez votre thème'}
      </p>
      <div className="grid grid-cols-1 gap-2">
        {FIVE_CARD_CATEGORIES.map((category) => {
          const Icon = ICON_MAP[category.iconName] || Eye;
          const colors = COLOR_CLASSES[category.colorClass] || COLOR_CLASSES.indigo;
          const isSelected = selectedCategory === category.id;

          return (
            <motion.button
              key={category.id}
              onClick={() => onSelect(category.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full p-4 rounded-xl border transition-all text-left
                ${isSelected
                  ? `${colors.bg} ${colors.border} ring-1 ring-white/20`
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected ? colors.bg : 'bg-slate-700/50'}
                `}>
                  <Icon className={`w-5 h-5 ${isSelected ? colors.text : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${isSelected ? colors.text : 'text-slate-200'}`}>
                      {language === 'en' ? category.labelEn : category.labelFr}
                    </h3>
                    {isSelected && (
                      <Check className={`w-4 h-4 ${colors.text}`} />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'en' ? category.taglineEn : category.taglineFr}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default FiveCardCategorySelector;
