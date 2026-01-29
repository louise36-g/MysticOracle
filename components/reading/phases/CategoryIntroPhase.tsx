// components/reading/phases/CategoryIntroPhase.tsx
// Unified intro phase for category-first flow with collapsible layout picker

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Coins, ChevronDown, Check, Sparkles } from 'lucide-react';
import {
  SpreadConfig,
  InterpretationStyle,
  ReadingCategory,
  ReadingDepth,
} from '../../../types';
import { getCategory, getDepthOption } from '../../../constants/categoryConfig';
import { THREE_CARD_LAYOUTS, ThreeCardLayoutId, ThreeCardLayout } from '../../../constants/threeCardLayouts';
import { FIVE_CARD_LAYOUTS, FiveCardLayoutId, FiveCardLayout } from '../../../constants/fiveCardLayouts';
import { HORSESHOE_LAYOUT_QUESTIONS } from '../../../constants/horseshoeLayouts';
import { CELTIC_CROSS_QUESTIONS } from '../../../constants/celticCrossLayouts';
import { SPREAD_THEMES } from '../SpreadThemes';
import ThemedBackground from '../ThemedBackground';
import Button from '../../Button';

// Common layout interface for display purposes
interface DisplayLayout {
  id: string;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
}

// Interpretation style definitions
const STYLE_OPTIONS: Array<{
  id: InterpretationStyle;
  labelEn: string;
  labelFr: string;
  descEn: string;
  descFr: string;
}> = [
  {
    id: InterpretationStyle.CLASSIC,
    labelEn: 'Classic',
    labelFr: 'Classique',
    descEn: 'Traditional tarot meanings',
    descFr: 'Significations traditionnelles',
  },
  {
    id: InterpretationStyle.SPIRITUAL,
    labelEn: 'Spiritual',
    labelFr: 'Spirituel',
    descEn: 'Soul growth perspective',
    descFr: 'Perspective de croissance de l\'ame',
  },
  {
    id: InterpretationStyle.PSYCHO_EMOTIONAL,
    labelEn: 'Emotional',
    labelFr: 'Emotionnel',
    descEn: 'Inner feelings focus',
    descFr: 'Focus sur les sentiments',
  },
  {
    id: InterpretationStyle.NUMEROLOGY,
    labelEn: 'Numerology',
    labelFr: 'Numerologie',
    descEn: 'Number symbolism',
    descFr: 'Symbolisme des nombres',
  },
  {
    id: InterpretationStyle.ELEMENTAL,
    labelEn: 'Elemental',
    labelFr: 'Elementaire',
    descEn: 'Fire, water, air, earth',
    descFr: 'Feu, eau, air, terre',
  },
];

interface CategoryIntroPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  category: ReadingCategory;
  depth: ReadingDepth;
  selectedLayout: ThreeCardLayoutId | FiveCardLayoutId | null;
  onLayoutSelect: (layoutId: ThreeCardLayoutId | FiveCardLayoutId) => void;
  customQuestion: string;
  onCustomQuestionChange: (text: string) => void;
  isAdvanced: boolean;
  selectedStyles: InterpretationStyle[];
  onAdvancedToggle: () => void;
  onStyleToggle: (style: InterpretationStyle) => void;
  validationMessage: string | null;
  totalCost: number;
  credits: number;
  onStartShuffle: () => void;
}

const CategoryIntroPhase: React.FC<CategoryIntroPhaseProps> = ({
  spread,
  language,
  category,
  depth,
  selectedLayout,
  onLayoutSelect,
  customQuestion,
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
  const [layoutPickerOpen, setLayoutPickerOpen] = useState(false);

  const theme = SPREAD_THEMES[spread.id];
  const categoryConfig = getCategory(category);
  const depthOption = getDepthOption(category, depth);

  // Get layouts based on depth with proper typing
  const getLayoutsForDepth = (): DisplayLayout[] => {
    if (depth === 3) {
      return Object.values(THREE_CARD_LAYOUTS).map((l: ThreeCardLayout) => ({
        id: l.id,
        labelEn: l.labelEn,
        labelFr: l.labelFr,
        taglineEn: l.taglineEn,
        taglineFr: l.taglineFr,
      }));
    }
    if (depth === 5) {
      return Object.values(FIVE_CARD_LAYOUTS).map((l: FiveCardLayout) => ({
        id: l.id,
        labelEn: l.labelEn,
        labelFr: l.labelFr,
        taglineEn: l.taglineEn,
        taglineFr: l.taglineFr,
      }));
    }
    return [];
  };

  const availableLayouts = getLayoutsForDepth();

  // Get selected layout details
  const selectedLayoutDetails = selectedLayout
    ? availableLayouts.find((l) => l.id === selectedLayout) || null
    : null;

  // Get suggested questions based on category and depth
  const getSuggestedQuestions = (): Array<{ id: string; textEn: string; textFr: string }> => {
    // For depth 7 (horseshoe), get questions from the first layout of the category
    if (depth === 7 && category !== 'birth_cards') {
      const categoryLayoutMap: Record<string, string> = {
        love: 'new_connection',
        career: 'career_crossroads',
        money: 'financial_stability',
        life_path: 'right_path',
        family: 'family_dynamics',
      };
      const layoutId = categoryLayoutMap[category];
      if (layoutId && HORSESHOE_LAYOUT_QUESTIONS[layoutId as keyof typeof HORSESHOE_LAYOUT_QUESTIONS]) {
        return HORSESHOE_LAYOUT_QUESTIONS[layoutId as keyof typeof HORSESHOE_LAYOUT_QUESTIONS];
      }
    }

    // For depth 10 (celtic cross), get questions from the category
    if (depth === 10 && category !== 'birth_cards') {
      const ccCategory = category as keyof typeof CELTIC_CROSS_QUESTIONS;
      if (CELTIC_CROSS_QUESTIONS[ccCategory]) {
        return CELTIC_CROSS_QUESTIONS[ccCategory];
      }
    }

    // Default fallback questions
    return [
      {
        id: 'default_1',
        textEn: 'What do I need to understand about this situation?',
        textFr: 'Que dois-je comprendre de cette situation?',
      },
      {
        id: 'default_2',
        textEn: 'What is being revealed to me at this time?',
        textFr: 'Qu\'est-ce qui m\'est revele en ce moment?',
      },
      {
        id: 'default_3',
        textEn: 'How can I move forward with clarity and purpose?',
        textFr: 'Comment puis-je avancer avec clarte et intention?',
      },
    ];
  };

  const suggestedQuestions = getSuggestedQuestions();

  // Determine if we can proceed
  const hasValidQuestion = customQuestion.trim().length > 0;
  const needsLayout = depth === 3 || depth === 5;
  const hasValidLayout = !needsLayout || selectedLayout !== null;
  const canProceed = hasValidQuestion && hasValidLayout && credits >= totalCost;

  // Handle suggested question click
  const handleSuggestedQuestionClick = (questionText: string) => {
    onCustomQuestionChange(questionText);
  };

  // Handle layout selection
  const handleLayoutSelect = (layoutId: ThreeCardLayoutId | FiveCardLayoutId) => {
    onLayoutSelect(layoutId);
    setLayoutPickerOpen(false);
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
          {/* Category Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 mb-3">
            <span className={theme.textAccent}>{categoryConfig?.icon}</span>
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {language === 'en' ? categoryConfig?.labelEn : categoryConfig?.labelFr}
            </span>
            <span className="text-white/30">|</span>
            <span className="text-xs text-white/50">
              {language === 'en' ? depthOption?.labelEn : depthOption?.labelFr}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? 'Set Your Intention' : 'Definissez Votre Intention'}
          </h2>

          {/* Tagline */}
          <p className={`text-sm ${theme.textAccent} italic`}>
            {language === 'en' ? categoryConfig?.taglineEn : categoryConfig?.taglineFr}
          </p>
        </div>

        {/* Main Card */}
        <div className={`bg-slate-900/70 backdrop-blur-sm rounded-2xl border ${theme.cardBorder} overflow-hidden`}>
          <div className="p-4 md:p-5 space-y-4">
            {/* Layout Picker (only for depth 3 or 5) */}
            {needsLayout && availableLayouts.length > 0 && (
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                  {language === 'en' ? 'Reading Layout' : 'Disposition de Tirage'}
                </label>

                {/* Collapsed state - shows selected layout */}
                <button
                  onClick={() => setLayoutPickerOpen(!layoutPickerOpen)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    layoutPickerOpen
                      ? 'bg-slate-800/50 border-white/20'
                      : 'bg-slate-800/30 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedLayoutDetails ? (
                      <>
                        <Check className={`w-4 h-4 ${theme.textAccent}`} />
                        <span className="text-white text-sm">
                          {language === 'en' ? selectedLayoutDetails.labelEn : selectedLayoutDetails.labelFr}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 text-sm">
                        {language === 'en' ? 'Select a layout...' : 'Selectionnez une disposition...'}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      layoutPickerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded state - shows all layouts */}
                <AnimatePresence>
                  {layoutPickerOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                        {availableLayouts.map((layout) => {
                          const isSelected = selectedLayout === layout.id;

                          return (
                            <button
                              key={layout.id}
                              onClick={() => handleLayoutSelect(layout.id as ThreeCardLayoutId | FiveCardLayoutId)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? 'bg-slate-700/50 border-white/30'
                                  : 'bg-slate-800/30 border-white/5 hover:border-white/15'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {isSelected && <Check className={`w-3.5 h-3.5 ${theme.textAccent}`} />}
                                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                  {language === 'en' ? layout.labelEn : layout.labelFr}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-2">
                                {language === 'en' ? layout.taglineEn : layout.taglineFr}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Question Section */}
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                {language === 'en' ? 'Your Question' : 'Votre Question'}
              </label>

              {/* Suggested Questions */}
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-2">
                  {language === 'en' ? 'Suggested questions:' : 'Questions suggerees:'}
                </p>
                <div className="space-y-1.5">
                  {suggestedQuestions.slice(0, 3).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleSuggestedQuestionClick(language === 'en' ? q.textEn : q.textFr)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/30 border border-white/5 hover:border-white/15 transition-colors"
                    >
                      <span className="text-xs text-slate-300 line-clamp-2">
                        {language === 'en' ? q.textEn : q.textFr}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Question Textarea */}
              <div className="relative">
                <textarea
                  value={customQuestion}
                  onChange={(e) => onCustomQuestionChange(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Or write your own question...'
                      : 'Ou ecrivez votre propre question...'
                  }
                  className="w-full h-24 px-3 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:border-white/30 focus:outline-none resize-none"
                  maxLength={300}
                />
                <span className="absolute bottom-2 right-2 text-xs text-slate-500">
                  {customQuestion.length}/300
                </span>
              </div>
            </div>

            {/* Advanced Styles Toggle */}
            <div>
              <button
                onClick={onAdvancedToggle}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {language === 'en' ? 'Interpretation Styles' : 'Styles d\'Interpretation'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${isAdvanced ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {STYLE_OPTIONS.map((style) => {
                        const isSelected = selectedStyles.includes(style.id);
                        return (
                          <button
                            key={style.id}
                            onClick={() => onStyleToggle(style.id)}
                            className={`p-2.5 rounded-lg border text-left transition-colors ${
                              isSelected
                                ? 'bg-slate-700/50 border-white/20'
                                : 'bg-slate-800/30 border-white/5 hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {isSelected && <Check className="w-3 h-3 text-green-400" />}
                              <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                {language === 'en' ? style.labelEn : style.labelFr}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {language === 'en' ? style.descEn : style.descFr}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

          {/* Footer - Cost & CTA */}
          <div className="p-4 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                {language === 'en' ? 'Cost' : 'Cout'}
              </span>
              <div className={`flex items-center gap-1.5 ${theme.textAccent}`}>
                <Coins className="w-4 h-4" />
                <span className="font-bold text-lg">{totalCost}</span>
                <span className="text-slate-500 text-xs">
                  {language === 'en' ? 'credits' : 'credits'}
                </span>
              </div>
            </div>

            <Button
              onClick={onStartShuffle}
              size="lg"
              className="w-full"
              disabled={!canProceed}
            >
              {language === 'en' ? 'Begin Reading' : 'Commencer la Lecture'}
            </Button>

            {/* Helper text when disabled */}
            {!canProceed && !validationMessage && (
              <p className="text-center text-xs text-slate-500 mt-2">
                {needsLayout && !selectedLayout
                  ? language === 'en'
                    ? 'Select a layout to continue'
                    : 'Selectionnez une disposition pour continuer'
                  : !hasValidQuestion
                  ? language === 'en'
                    ? 'Enter your question to continue'
                    : 'Entrez votre question pour continuer'
                  : credits < totalCost
                  ? language === 'en'
                    ? 'Insufficient credits'
                    : 'Credits insuffisants'
                  : null}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CategoryIntroPhase;
