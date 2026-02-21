// components/reading/phases/CategoryIntroPhase.tsx
// Unified intro phase for category-first flow with collapsible layout picker

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Coins, ChevronDown, Check, Sparkles, Pencil } from 'lucide-react';
import {
  SpreadConfig,
  InterpretationStyle,
  ReadingCategory,
  ReadingDepth,
} from '../../../types';
import { getCategory, getDepthOption } from '../../../constants/categoryConfig';
import { TWO_CARD_LAYOUTS, TwoCardLayoutId, TwoCardLayout } from '../../../constants/twoCardLayouts';
import { THREE_CARD_LAYOUTS, ThreeCardLayoutId, ThreeCardLayout } from '../../../constants/threeCardLayouts';
import { FIVE_CARD_LAYOUTS, FiveCardLayoutId, FiveCardLayout } from '../../../constants/fiveCardLayouts';
import { HORSESHOE_LAYOUT_QUESTIONS } from '../../../constants/horseshoeLayouts';
import { CELTIC_CROSS_QUESTIONS } from '../../../constants/celticCrossLayouts';
import ThemedBackground from '../ThemedBackground';
import Button from '../../Button';

// Common layout interface for display purposes
interface DisplayLayout {
  id: string;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: string[];
    fr: string[];
  };
  shortPositions: {
    en: string[];
    fr: string[];
  };
}

// Paid interpretation style upgrades (Classic is the free default)
const STYLE_OPTIONS: Array<{
  id: InterpretationStyle;
  labelEn: string;
  labelFr: string;
  descEn: string;
  descFr: string;
}> = [
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
  selectedLayout: TwoCardLayoutId | ThreeCardLayoutId | FiveCardLayoutId | null;
  onLayoutSelect: (layoutId: TwoCardLayoutId | ThreeCardLayoutId | FiveCardLayoutId) => void;
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
  onChangeCategory?: () => void;
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
  onChangeCategory,
}) => {
  const [layoutPickerOpen, setLayoutPickerOpen] = useState(false);
  const [shakeQuestion, setShakeQuestion] = useState(false);
  const questionRef = useRef<HTMLTextAreaElement>(null);

  // Shake and focus the question input when validation fails for question
  useEffect(() => {
    if (validationMessage && (
      validationMessage.toLowerCase().includes('question') ||
      validationMessage.toLowerCase().includes('votre question')
    )) {
      setShakeQuestion(true);
      // Focus the question input
      questionRef.current?.focus();
      // Reset shake after animation completes
      const timer = setTimeout(() => setShakeQuestion(false), 600);
      return () => clearTimeout(timer);
    }
  }, [validationMessage]);

  const categoryConfig = getCategory(category);
  // Use category color theme for consistent theming (not spread theme)
  const categoryTheme = categoryConfig?.colorTheme;
  const depthOption = getDepthOption(category, depth);

  // Get layouts filtered by category's available layouts
  const getLayoutsForDepth = (): DisplayLayout[] => {
    if (depth === 2) {
      const availableIds = categoryConfig?.availableLayouts?.[2];
      if (availableIds) {
        return availableIds
          .map((id) => TWO_CARD_LAYOUTS[id as TwoCardLayoutId])
          .filter(Boolean)
          .map((l: TwoCardLayout) => ({
            id: l.id,
            labelEn: l.labelEn,
            labelFr: l.labelFr,
            taglineEn: l.taglineEn,
            taglineFr: l.taglineFr,
            positions: l.positions,
            shortPositions: l.shortPositions,
          }));
      }
    }
    if (depth === 3) {
      const availableIds = categoryConfig?.availableLayouts?.[3];
      if (availableIds) {
        return availableIds
          .map((id) => THREE_CARD_LAYOUTS[id as ThreeCardLayoutId])
          .filter(Boolean)
          .map((l: ThreeCardLayout) => ({
            id: l.id,
            labelEn: l.labelEn,
            labelFr: l.labelFr,
            taglineEn: l.taglineEn,
            taglineFr: l.taglineFr,
            positions: l.positions,
            shortPositions: l.shortPositions,
          }));
      }
    }
    if (depth === 5) {
      const availableIds = categoryConfig?.availableLayouts?.[5];
      if (availableIds) {
        return availableIds
          .map((id) => FIVE_CARD_LAYOUTS[id as FiveCardLayoutId])
          .filter(Boolean)
          .map((l: FiveCardLayout) => ({
            id: l.id,
            labelEn: l.labelEn,
            labelFr: l.labelFr,
            taglineEn: l.taglineEn,
            taglineFr: l.taglineFr,
            positions: l.positions,
            shortPositions: l.shortPositions,
          }));
      }
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
        general: 'whats_ahead',
        love: 'new_connection',
        career: 'career_crossroads',
        life_path: 'right_path',
        growth: 'personal_patterns',
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
        textEn: 'What gentle truth is waiting for me today?',
        textFr: 'Quelle douce vérité m\'attend aujourd\'hui ?',
      },
      {
        id: 'default_2',
        textEn: 'What does my heart most need to hear right now?',
        textFr: 'Qu\'est-ce que mon cœur a le plus besoin d\'entendre en ce moment ?',
      },
      {
        id: 'default_3',
        textEn: 'Where is love quietly trying to reach me?',
        textFr: 'Où l\'amour essaie-t-il doucement de me rejoindre ?',
      },
    ];
  };

  const suggestedQuestions = getSuggestedQuestions();

  // Check if this is birth cards category (no question needed upfront)
  const isBirthCards = category === 'birth_cards';

  // Determine if we can proceed
  const hasValidQuestion = isBirthCards || customQuestion.trim().length > 0;
  const needsLayout = depth === 2 || depth === 3 || depth === 5;
  const hasValidLayout = !needsLayout || selectedLayout !== null;
  const canProceed = hasValidQuestion && hasValidLayout && credits >= totalCost;

  // Handle suggested question click
  const handleSuggestedQuestionClick = (questionText: string) => {
    onCustomQuestionChange(questionText);
  };

  // Handle layout selection
  const handleLayoutSelect = (layoutId: TwoCardLayoutId | ThreeCardLayoutId | FiveCardLayoutId) => {
    onLayoutSelect(layoutId);
    setLayoutPickerOpen(false);
  };

  // Handle button click - show error if question is missing
  const handleStartClick = () => {
    // If everything is ready except the question, show the shake error
    if (hasValidLayout && credits >= totalCost && !hasValidQuestion) {
      setShakeQuestion(true);
      questionRef.current?.focus();
      setTimeout(() => setShakeQuestion(false), 2000);
      return;
    }
    // Otherwise proceed normally
    if (canProceed) {
      onStartShuffle();
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-6 md:py-8 relative min-h-screen">
      <ThemedBackground
        spreadType={spread.id}
        categoryTheme={categoryTheme ? {
          gradient: categoryTheme.gradient,
          glow: categoryTheme.glow,
        } : undefined}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          {/* Category Badge with Change Button */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 mb-3">
            <span className={`text-${categoryTheme?.accent}`}>{categoryConfig?.icon}</span>
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {language === 'en' ? categoryConfig?.labelEn : categoryConfig?.labelFr}
            </span>
            <span className="text-white/30">|</span>
            <span className="text-xs text-white/50">
              {language === 'en' ? depthOption?.labelEn : depthOption?.labelFr}
            </span>
            {onChangeCategory && (
              <button
                onClick={onChangeCategory}
                className="ml-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all flex items-center gap-1"
                title={language === 'en' ? 'Change category' : 'Changer de catégorie'}
              >
                <Pencil className="w-3.5 h-3.5 text-white/70" />
                <span className="text-xs text-white/70">{language === 'en' ? 'Change' : 'Modifier'}</span>
              </button>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? 'Set Your Intention' : 'Definissez Votre Intention'}
          </h2>

          {/* Tagline */}
          <p className={`text-sm text-${categoryTheme?.accent} italic`}>
            {language === 'en' ? categoryConfig?.taglineEn : categoryConfig?.taglineFr}
          </p>
        </div>

        {/* Main Card */}
        <div className={`bg-black/30 backdrop-blur-xl rounded-2xl border ${categoryTheme?.border} overflow-hidden`}>
          <div className="p-4 md:p-5 space-y-4">
            {/* Layout Picker (only for depth 3 or 5) */}
            {needsLayout && availableLayouts.length > 0 && (
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                  {language === 'en' ? 'Choose Your Reading Layout' : 'Choisissez Votre Disposition'}
                </label>

                {/* Collapsed state - shows selected layout name only */}
                <button
                  onClick={() => setLayoutPickerOpen(!layoutPickerOpen)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border backdrop-blur-sm transition-colors ${
                    layoutPickerOpen
                      ? 'bg-white/15 border-white/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedLayoutDetails ? (
                      <>
                        <Check className={`w-4 h-4 text-${categoryTheme?.accent}`} />
                        <span className="text-white text-sm font-medium">
                          {language === 'en' ? selectedLayoutDetails.labelEn : selectedLayoutDetails.labelFr}
                        </span>
                        {/* Show change indicator when multiple layouts available */}
                        {availableLayouts.length > 1 && !layoutPickerOpen && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 border border-white/20 flex items-center gap-1">
                            <Pencil className="w-3 h-3 text-white/60" />
                            <span className="text-xs text-white/60">{language === 'en' ? 'Change' : 'Modifier'}</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 text-sm">
                        {language === 'en' ? 'Tap to choose...' : 'Appuyez pour choisir...'}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      layoutPickerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded state - shows available layouts with positions */}
                <AnimatePresence>
                  {layoutPickerOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3">
                        {availableLayouts.map((layout) => {
                          const isSelected = selectedLayout === layout.id;
                          const shortPositions = language === 'en' ? layout.shortPositions.en : layout.shortPositions.fr;

                          return (
                            <button
                              key={layout.id}
                              onClick={() => handleLayoutSelect(layout.id as TwoCardLayoutId | ThreeCardLayoutId | FiveCardLayoutId)}
                              className={`w-full text-left p-4 rounded-xl border-2 backdrop-blur-sm transition-all ${
                                isSelected
                                  ? `bg-white/15 ${categoryTheme?.border}`
                                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                              }`}
                            >
                              {/* Layout Name */}
                              <div className="flex items-center gap-2 mb-2">
                                {isSelected && <Check className={`w-4 h-4 text-${categoryTheme?.accent}`} />}
                                <span className={`text-base font-medium ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                  {language === 'en' ? layout.labelEn : layout.labelFr}
                                </span>
                              </div>

                              {/* Card Positions - Visual display with short names */}
                              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                {shortPositions.map((position, idx) => (
                                  <div key={idx} className="flex items-center">
                                    <div className={`px-2.5 py-1 rounded text-sm font-medium ${
                                      isSelected
                                        ? `bg-${categoryTheme?.accent}/20 text-${categoryTheme?.accent}`
                                        : 'bg-white/10 text-slate-300'
                                    }`}>
                                      {position}
                                    </div>
                                    {idx < shortPositions.length - 1 && (
                                      <span className="text-slate-500 mx-1">→</span>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Description */}
                              <p className="text-sm text-slate-400 leading-relaxed">
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

            {/* Question Section - hidden for birth cards (questions come after interpretation) */}
            {!isBirthCards && (
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                  {language === 'en' ? 'Your Question' : 'Votre Question'}
                </label>

                {/* Custom Question Textarea - First */}
                <motion.div
                  className="relative mb-3"
                  animate={shakeQuestion ? {
                    x: [0, -10, 10, -10, 10, -5, 5, 0],
                    transition: { duration: 0.5 }
                  } : {}}
                >
                  <textarea
                    ref={questionRef}
                    value={customQuestion}
                    onChange={(e) => onCustomQuestionChange(e.target.value)}
                    placeholder={
                      language === 'en'
                        ? 'Enter your question here...'
                        : 'Entrez votre question ici...'
                    }
                    className={`w-full h-24 px-3 py-2.5 rounded-lg bg-black/30 backdrop-blur-sm border text-white text-base placeholder:text-slate-400 placeholder:text-base focus:border-purple-500/50 focus:outline-none resize-none transition-all ${
                      shakeQuestion
                        ? 'border-red-500/70 ring-2 ring-red-500/30'
                        : 'border-white/20'
                    }`}
                    maxLength={300}
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-slate-500">
                    {customQuestion.length}/300
                  </span>
                </motion.div>

                {/* Suggested Questions - After */}
                <div>
                  <p className="text-xs text-slate-500 mb-2">
                    {language === 'en' ? 'Or try a suggested question:' : 'Ou essayez une question suggeree:'}
                  </p>
                  <div className="space-y-1.5">
                    {suggestedQuestions.slice(0, 3).map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleSuggestedQuestionClick(language === 'en' ? q.textEn : q.textFr)}
                        className="w-full text-left px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
                      >
                        <span className="text-sm text-slate-300 line-clamp-2">
                          {language === 'en' ? q.textEn : q.textFr}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Styles Toggle - paid upgrade (+1 credit) */}
            <div>
              <button
                onClick={onAdvancedToggle}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {language === 'en' ? 'Upgrade Style (+1 credit)' : 'Style Avance (+1 credit)'}
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
                            className={`p-3 rounded-lg border text-left backdrop-blur-sm transition-colors ${
                              isSelected
                                ? 'bg-white/15 border-white/30'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {isSelected && <Check className="w-3.5 h-3.5 text-green-400" />}
                              <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                {language === 'en' ? style.labelEn : style.labelFr}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-1">
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
          <div className="p-4 bg-black/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                {language === 'en' ? 'Cost' : 'Cout'}
              </span>
              <div className={`flex items-center gap-1.5 text-${categoryTheme?.accent}`}>
                <Coins className="w-4 h-4" />
                <span className="font-bold text-lg">{totalCost}</span>
                <span className="text-slate-500 text-xs">
                  {language === 'en' ? 'credits' : 'credits'}
                </span>
              </div>
            </div>

            <Button
              onClick={handleStartClick}
              size="lg"
              className="w-full"
              disabled={!hasValidLayout || credits < totalCost}
            >
              {isBirthCards
                ? (depth === 1
                    ? (language === 'en' ? 'Reveal Your Card' : 'Révéler Votre Carte')
                    : (language === 'en' ? 'Reveal Your Cards' : 'Révéler Vos Cartes'))
                : (language === 'en' ? 'Begin Reading' : 'Commencer la Lecture')}
            </Button>

            {/* Helper text when disabled */}
            {!canProceed && !validationMessage && (
              <p className={`text-center text-xs mt-2 ${shakeQuestion ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                {needsLayout && !selectedLayout
                  ? language === 'en'
                    ? 'Select a layout to continue'
                    : 'Selectionnez une disposition pour continuer'
                  : !isBirthCards && !customQuestion.trim()
                  ? language === 'en'
                    ? 'Please enter your question to continue'
                    : 'Veuillez entrer votre question pour continuer'
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
