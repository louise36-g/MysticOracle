// components/reading/LayoutSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  THREE_CARD_LAYOUTS,
  ThreeCardLayoutId,
} from '../../constants/threeCardLayouts';

interface LayoutSelectorProps {
  language: 'en' | 'fr';
  layouts: ThreeCardLayoutId[];
  selectedLayout: ThreeCardLayoutId;
  onLayoutSelect: (layoutId: ThreeCardLayoutId) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  language,
  layouts,
  selectedLayout,
  onLayoutSelect,
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        {language === 'en' ? 'Choose Your Layout' : 'Choisissez Votre Disposition'}
      </label>
      <div className="space-y-2">
        {layouts.map((layoutId) => {
          const layout = THREE_CARD_LAYOUTS[layoutId];
          const isSelected = selectedLayout === layoutId;
          const positions = layout.positions[language];

          return (
            <button
              key={layoutId}
              onClick={() => onLayoutSelect(layoutId)}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500/40'
                  : 'bg-slate-800/50 border-transparent hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Radio indicator + Label */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-cyan-400' : 'border-slate-600'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-cyan-400"
                    />
                  )}
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {language === 'en' ? layout.labelEn : layout.labelFr}
                </span>
              </div>

              {/* Visual card positions */}
              <div className="flex items-center justify-center gap-2 ml-7">
                {positions.map((position, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      className={`flex flex-col items-center ${
                        isSelected ? 'text-cyan-300' : 'text-slate-500'
                      }`}
                    >
                      <div
                        className={`w-8 h-12 rounded border-2 ${
                          isSelected
                            ? 'border-cyan-500/60 bg-cyan-500/10'
                            : 'border-slate-600 bg-slate-800/50'
                        }`}
                      />
                      <span className="text-[10px] mt-1 text-center max-w-[50px] leading-tight">
                        {position}
                      </span>
                    </div>
                    {idx < positions.length - 1 && (
                      <span className={`text-xs ${isSelected ? 'text-cyan-500/60' : 'text-slate-600'}`}>
                        →
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LayoutSelector;
