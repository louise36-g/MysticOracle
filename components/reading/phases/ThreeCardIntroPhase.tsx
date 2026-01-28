// components/reading/phases/ThreeCardIntroPhase.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Coins } from 'lucide-react';
import { SpreadConfig, InterpretationStyle, SpreadType } from '../../../types';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import { SPREAD_THEMES } from '../SpreadThemes';
import SpreadIntroSelector from './SpreadIntroSelector';
import {
  ThreeCardCategory,
  ThreeCardLayoutId,
} from '../../../constants/threeCardLayouts';

interface ThreeCardIntroPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  // Category, layout & question selection
  selectedCategory: ThreeCardCategory | null;
  selectedLayout: ThreeCardLayoutId | null;
  customQuestion: string;
  onCategorySelect: (category: ThreeCardCategory) => void;
  onLayoutSelect: (layoutId: ThreeCardLayoutId) => void;
  onCustomQuestionChange: (text: string) => void;
  // Interpretation styles
  isAdvanced: boolean;
  selectedStyles: InterpretationStyle[];
  onAdvancedToggle: () => void;
  onStyleToggle: (style: InterpretationStyle) => void;
  // Validation & action
  validationMessage: string | null;
  totalCost: number;
  credits: number;
  onStartShuffle: () => void;
}

const ThreeCardIntroPhase: React.FC<ThreeCardIntroPhaseProps> = ({
  spread,
  language,
  selectedCategory,
  selectedLayout,
  customQuestion,
  onCategorySelect,
  onLayoutSelect,
  onCustomQuestionChange,
  isAdvanced,
  selectedStyles,
  onAdvancedToggle,
  onStyleToggle,
  validationMessage,
  totalCost,
  credits,
  onStartShuffle,
}) => {
  const theme = SPREAD_THEMES[spread.id];

  // Determine if we have a valid question to proceed
  const hasValidQuestion = customQuestion.trim().length > 0;
  const canProceed = selectedCategory !== null && selectedLayout !== null && hasValidQuestion && credits >= totalCost;

  // Dummy handler for question select (we use customQuestion directly now)
  const handleQuestionSelect = (_questionId: string, questionText: string) => {
    onCustomQuestionChange(questionText);
  };

  return (
    <div className="flex flex-col items-center px-4 py-6 md:py-8 relative min-h-screen">
      <ThemedBackground spreadType={spread.id} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 mb-3">
            <span className={theme.textAccent}>{theme.icon}</span>
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {language === 'en' ? 'Three Card Spread' : 'Tirage Trois Cartes'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? 'Deeper Insight' : 'Vision Approfondie'}
          </h2>
          <p className={`text-sm ${theme.textAccent} italic`}>
            {language === 'en' ? 'Three cards reveal the full picture' : 'Trois cartes révèlent le tableau complet'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-cyan-500/20 overflow-hidden">
          {/* Spread Intro Selector */}
          <div className="p-4 md:p-5">
            <SpreadIntroSelector
              spreadType={SpreadType.THREE_CARD}
              language={language}
              selectedCategory={selectedCategory}
              selectedLayout={selectedLayout}
              customQuestion={customQuestion}
              onCategorySelect={onCategorySelect}
              onLayoutSelect={onLayoutSelect}
              onCustomQuestionChange={onCustomQuestionChange}
              onQuestionSelect={handleQuestionSelect}
              isAdvanced={isAdvanced}
              selectedStyles={selectedStyles}
              onAdvancedToggle={onAdvancedToggle}
              onStyleToggle={onStyleToggle}
            />
          </div>

          {/* Validation Error */}
          {validationMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-4 mb-3 flex items-center gap-2 p-2.5 bg-red-500/15 border border-red-500/30 rounded-lg text-red-300 text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{validationMessage}</span>
            </motion.div>
          )}

          {/* CTA Button */}
          <div className="p-4 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                {language === 'en' ? 'Cost' : 'Coût'}
              </span>
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Coins className="w-4 h-4" />
                <span className="font-bold text-lg">{totalCost}</span>
                <span className="text-slate-500 text-xs">
                  {language === 'en' ? 'credits' : 'crédits'}
                </span>
              </div>
            </div>
            <Button
              onClick={onStartShuffle}
              size="lg"
              className="w-full"
              disabled={!canProceed}
            >
              {language === 'en' ? 'Shuffle the Deck' : 'Mélanger le Jeu'}
            </Button>
            {!canProceed && !validationMessage && (
              <p className="text-center text-xs text-slate-500 mt-2">
                {!selectedCategory
                  ? (language === 'en' ? 'Select a theme to continue' : 'Sélectionnez un thème pour continuer')
                  : !selectedLayout
                    ? (language === 'en' ? 'Select a layout to continue' : 'Sélectionnez une disposition pour continuer')
                    : !hasValidQuestion
                      ? (language === 'en' ? 'Enter your question' : 'Entrez votre question')
                      : (language === 'en' ? 'Insufficient credits' : 'Crédits insuffisants')}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ThreeCardIntroPhase;
