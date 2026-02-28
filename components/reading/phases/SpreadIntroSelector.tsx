// components/reading/phases/SpreadIntroSelector.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import {
  ChevronDown,
  Check,
  Sparkles,
  Heart,
  Briefcase,
  Scale,
  Leaf,
  Eye,
  Compass,
  Sprout,
  Users,
  Sun,
  Lightbulb,
  Layers,
  Coins,
  Settings,
} from 'lucide-react';
import { SpreadType, InterpretationStyle } from '../../../types';

// Import all layout constants
import {
  SINGLE_CARD_CATEGORIES,
  SINGLE_CARD_LAYOUTS,
  SINGLE_CARD_QUESTIONS,
  SINGLE_CARD_CUSTOM_QUESTION_HELPER,
  SingleCardCategory,
  SingleCardLayoutId,
} from '../../../constants/singleCardLayouts';

import {
  THREE_CARD_CATEGORIES,
  THREE_CARD_LAYOUTS,
  THREE_CARD_QUESTIONS,
  THREE_CARD_CUSTOM_QUESTION_HELPER,
  ThreeCardCategory,
  ThreeCardLayoutId,
} from '../../../constants/threeCardLayouts';

import {
  FIVE_CARD_CATEGORIES,
  FIVE_CARD_LAYOUTS,
  FIVE_CARD_QUESTIONS,
  FIVE_CARD_LAYOUT_QUESTIONS,
  FIVE_CARD_CUSTOM_QUESTION_HELPER,
  FiveCardCategory,
  FiveCardLayoutId,
} from '../../../constants/fiveCardLayouts';

import {
  HORSESHOE_CATEGORIES,
  HORSESHOE_LAYOUTS,
  HORSESHOE_LAYOUT_QUESTIONS,
  HORSESHOE_CUSTOM_QUESTION_HELPER,
  HorseshoeCategory,
  HorseshoeLayoutId,
} from '../../../constants/horseshoeLayouts';

import {
  CELTIC_CROSS_CATEGORIES,
  CELTIC_CROSS_LAYOUTS,
  CELTIC_CROSS_QUESTIONS,
  CELTIC_CROSS_CUSTOM_QUESTION_HELPER,
  CelticCrossCategory,
  CelticCrossLayoutId,
} from '../../../constants/celticCrossLayouts';

// Icon mapping
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  Heart,
  Briefcase,
  Scale,
  Leaf,
  Eye,
  Compass,
  Sprout,
  Users,
  Sun,
  Lightbulb,
  Coins,
};

// Luminous color classes for categories - using custom hex values
const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; bgHover: string }> = {
  // Love - Coral Pink
  amber: { bg: 'bg-[#D4A24C]/20', border: 'border-[#D4A24C]/40', text: 'text-[#E4B86C]', bgHover: 'hover:bg-[#D4A24C]/10' },
  rose: { bg: 'bg-[#E8607A]/20', border: 'border-[#E8607A]/40', text: 'text-[#F08A9D]', bgHover: 'hover:bg-[#E8607A]/10' },
  // Money - Emerald Green
  emerald: { bg: 'bg-[#50C878]/20', border: 'border-[#50C878]/40', text: 'text-[#70D898]', bgHover: 'hover:bg-[#50C878]/10' },
  // Life Path - Sky Blue
  indigo: { bg: 'bg-[#5BA8D9]/20', border: 'border-[#5BA8D9]/40', text: 'text-[#7BC8F9]', bgHover: 'hover:bg-[#5BA8D9]/10' },
  // Birth Cards - Lavender Purple
  violet: { bg: 'bg-[#B88ED6]/20', border: 'border-[#B88ED6]/40', text: 'text-[#D8AEF6]', bgHover: 'hover:bg-[#B88ED6]/10' },
  // Family - Teal
  cyan: { bg: 'bg-[#45B5AA]/20', border: 'border-[#45B5AA]/40', text: 'text-[#65D5CA]', bgHover: 'hover:bg-[#45B5AA]/10' },
  // Additional mappings
  blue: { bg: 'bg-[#5BA8D9]/20', border: 'border-[#5BA8D9]/40', text: 'text-[#7BC8F9]', bgHover: 'hover:bg-[#5BA8D9]/10' },
  purple: { bg: 'bg-[#B88ED6]/20', border: 'border-[#B88ED6]/40', text: 'text-[#D8AEF6]', bgHover: 'hover:bg-[#B88ED6]/10' },
  teal: { bg: 'bg-[#45B5AA]/20', border: 'border-[#45B5AA]/40', text: 'text-[#65D5CA]', bgHover: 'hover:bg-[#45B5AA]/10' },
};

// Generic types for the selector
type CategoryId = SingleCardCategory | ThreeCardCategory | FiveCardCategory | HorseshoeCategory | CelticCrossCategory;
type LayoutId = SingleCardLayoutId | ThreeCardLayoutId | FiveCardLayoutId | HorseshoeLayoutId | CelticCrossLayoutId;

interface CategoryConfig {
  id: string;
  labelEn: string;
  labelFr: string;
  taglineEn?: string;
  taglineFr?: string;
  iconName: string;
  colorClass?: string;
  layouts: string[];
  defaultLayout: string;
}

interface LayoutConfig {
  id: string;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: string[];
    fr: string[];
  };
}

interface QuestionConfig {
  id: string;
  textEn: string;
  textFr: string;
}

interface SpreadIntroSelectorProps {
  spreadType: SpreadType;
  language: 'en' | 'fr';
  selectedCategory: CategoryId | null;
  selectedLayout: LayoutId | null;
  customQuestion: string;
  onCategorySelect: (category: CategoryId) => void;
  onLayoutSelect: (layoutId: LayoutId) => void;
  onCustomQuestionChange: (text: string) => void;
  onQuestionSelect: (questionId: string, questionText: string) => void;
  // Advanced options (Go Deeper)
  isAdvanced?: boolean;
  selectedStyles?: InterpretationStyle[];
  onAdvancedToggle?: () => void;
  onStyleToggle?: (style: InterpretationStyle) => void;
  // Question validation error state
  showQuestionError?: boolean;
}

const SpreadIntroSelector: React.FC<SpreadIntroSelectorProps> = ({
  spreadType,
  language,
  selectedCategory,
  selectedLayout,
  customQuestion,
  onCategorySelect,
  onLayoutSelect,
  onCustomQuestionChange,
  onQuestionSelect,
  isAdvanced = false,
  selectedStyles = [],
  onAdvancedToggle,
  onStyleToggle,
  showQuestionError = false,
}) => {
  const { t } = useApp();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<string | null>(null);

  // Get data based on spread type
  const { categories, layouts, questions, customHelper } = useMemo(() => {
    switch (spreadType) {
      case SpreadType.SINGLE:
        return {
          categories: SINGLE_CARD_CATEGORIES as CategoryConfig[],
          layouts: SINGLE_CARD_LAYOUTS as Record<string, LayoutConfig>,
          questions: SINGLE_CARD_QUESTIONS as Record<string, QuestionConfig[]>,
          customHelper: SINGLE_CARD_CUSTOM_QUESTION_HELPER,
        };
      case SpreadType.THREE_CARD:
        return {
          categories: THREE_CARD_CATEGORIES as CategoryConfig[],
          layouts: THREE_CARD_LAYOUTS as Record<string, LayoutConfig>,
          questions: THREE_CARD_QUESTIONS as Record<string, QuestionConfig[]>,
          customHelper: THREE_CARD_CUSTOM_QUESTION_HELPER,
        };
      case SpreadType.FIVE_CARD:
        return {
          categories: FIVE_CARD_CATEGORIES as CategoryConfig[],
          layouts: FIVE_CARD_LAYOUTS as Record<string, LayoutConfig>,
          questions: FIVE_CARD_QUESTIONS as Record<string, QuestionConfig[]>,
          customHelper: FIVE_CARD_CUSTOM_QUESTION_HELPER,
        };
      case SpreadType.HORSESHOE:
        return {
          categories: HORSESHOE_CATEGORIES as CategoryConfig[],
          layouts: HORSESHOE_LAYOUTS as Record<string, LayoutConfig>,
          questions: HORSESHOE_LAYOUT_QUESTIONS as Record<string, QuestionConfig[]>,
          customHelper: HORSESHOE_CUSTOM_QUESTION_HELPER,
        };
      case SpreadType.CELTIC_CROSS:
        return {
          categories: CELTIC_CROSS_CATEGORIES as CategoryConfig[],
          layouts: CELTIC_CROSS_LAYOUTS as Record<string, LayoutConfig>,
          questions: CELTIC_CROSS_QUESTIONS as Record<string, QuestionConfig[]>,
          customHelper: CELTIC_CROSS_CUSTOM_QUESTION_HELPER,
        };
      default:
        return {
          categories: [] as CategoryConfig[],
          layouts: {} as Record<string, LayoutConfig>,
          questions: {} as Record<string, QuestionConfig[]>,
          customHelper: { en: '', fr: '' },
        };
    }
  }, [spreadType]);

  // Get questions for current selection (handle 5-card layout-specific questions)
  const currentQuestions = useMemo(() => {
    if (!selectedCategory) return [];

    // For 5-card relationships_career, use layout-specific questions
    if (spreadType === SpreadType.FIVE_CARD && selectedCategory === 'relationships_career' && selectedLayout) {
      const layoutQuestions = FIVE_CARD_LAYOUT_QUESTIONS[selectedLayout as 'love_relationships' | 'career_purpose'];
      if (layoutQuestions) return layoutQuestions;
    }

    // For horseshoe, ALL questions are layout-specific
    if (spreadType === SpreadType.HORSESHOE && selectedLayout) {
      return HORSESHOE_LAYOUT_QUESTIONS[selectedLayout as HorseshoeLayoutId] || [];
    }

    return questions[selectedCategory as string] || [];
  }, [spreadType, selectedCategory, selectedLayout, questions]);

  // Handle category click - expand/collapse and select
  const handleCategoryClick = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      // Already expanded - collapse it
      setExpandedCategory(null);
    } else {
      // Expand this category
      setExpandedCategory(categoryId);
      // If category has only one layout, auto-select it
      const category = categories.find(c => c.id === categoryId);
      if (category && category.layouts.length === 1) {
        onCategorySelect(categoryId as CategoryId);
        onLayoutSelect(category.layouts[0] as LayoutId);
      }
    }
  };

  // Handle layout selection
  const handleLayoutSelect = (categoryId: string, layoutId: string) => {
    onCategorySelect(categoryId as CategoryId);
    onLayoutSelect(layoutId as LayoutId);
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Category & Layout Selection (Accordion) */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          {language === 'en' ? 'Choose Your Focus' : 'Choisissez Votre Thème'}
        </label>

        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = ICON_MAP[category.iconName] || Sparkles;
            const colors = COLOR_CLASSES[category.colorClass || 'cyan'];
            const isExpanded = expandedCategory === category.id;
            const isSelected = selectedCategory === category.id;
            const categoryLayouts = category.layouts.map(id => layouts[id]).filter(Boolean);

            return (
              <div key={category.id} className="rounded-xl overflow-hidden border border-white/10 backdrop-blur-md">
                {/* Category Header */}
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full px-4 py-3 flex items-center justify-between transition-all ${
                    isSelected
                      ? `${colors.bg} border-l-2 ${colors.border}`
                      : `bg-white/5 hover:bg-white/10`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm ${
                      isSelected ? colors.bg : 'bg-white/10'
                    }`}>
                      <Icon className={`w-4 h-4 ${isSelected ? colors.text : 'text-slate-400'}`} />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-medium text-sm ${isSelected ? colors.text : 'text-slate-200'}`}>
                        {language === 'en' ? category.labelEn : category.labelFr}
                      </h3>
                      {category.taglineEn && (
                        <p className="text-xs text-slate-500">
                          {language === 'en' ? category.taglineEn : category.taglineFr}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && <Check className={`w-4 h-4 ${colors.text}`} />}
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded Layouts */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 space-y-2">
                        {categoryLayouts.map((layout) => {
                          const isLayoutSelected = selectedLayout === layout.id;

                          return (
                            <div key={layout.id}>
                              <button
                                onClick={() => handleLayoutSelect(category.id, layout.id)}
                                className={`w-full p-3 rounded-lg text-left transition-all backdrop-blur-sm ${
                                  isLayoutSelected
                                    ? `${colors.bg} ${colors.border} border`
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                                }`}
                              >
                                {/* Layout Name & Tagline */}
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`font-medium text-sm ${isLayoutSelected ? colors.text : 'text-slate-300'}`}>
                                    {language === 'en' ? layout.labelEn : layout.labelFr}
                                  </span>
                                  {isLayoutSelected && <Check className={`w-3.5 h-3.5 ${colors.text}`} />}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {language === 'en' ? layout.taglineEn : layout.taglineFr}
                                </p>

                              </button>

                              {/* Card Positions Accordion - Only show for layouts with more than 3 positions */}
                              {layout.positions.en.length > 3 && (
                                <div className="mt-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedPositions(expandedPositions === layout.id ? null : layout.id);
                                    }}
                                    className={`w-full px-3 py-2 flex items-center justify-between text-xs rounded-lg transition-colors ${
                                      isLayoutSelected
                                        ? 'bg-white/10 hover:bg-white/15'
                                        : 'bg-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Layers className={`w-3.5 h-3.5 ${isLayoutSelected ? colors.text : 'text-slate-500'}`} />
                                      <span className={isLayoutSelected ? 'text-slate-300' : 'text-slate-500'}>
                                        {language === 'en' ? 'The cards in this layout' : 'Les cartes de ce tirage'}
                                      </span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${expandedPositions === layout.id ? 'rotate-180' : ''}`} />
                                  </button>
                                  <AnimatePresence>
                                    {expandedPositions === layout.id && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pt-2 pl-2 space-y-1">
                                          {(language === 'en' ? layout.positions.en : layout.positions.fr).map((position, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                              <span className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-medium ${
                                                isLayoutSelected ? `${colors.bg} ${colors.text}` : 'bg-slate-800 text-slate-500'
                                              }`}>
                                                {idx + 1}
                                              </span>
                                              <span className={`text-xs leading-5 ${isLayoutSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                {position}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              {/* Question Input - Directly under THIS selected layout */}
                              <AnimatePresence>
                                {isLayoutSelected && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-3 pt-3 border-t border-slate-700/50"
                                  >
                                    {/* Custom Question Input */}
                                    <div className="mb-4">
                                      <label className={`block text-sm font-medium mb-2 ${showQuestionError && !customQuestion.trim() ? 'text-red-400' : 'text-slate-300'}`}>
                                        {language === 'en' ? 'Your Question' : 'Votre Question'}
                                        {showQuestionError && !customQuestion.trim() && (
                                          <span className="ml-2 text-red-400 font-normal">
                                            ({language === 'en' ? 'required' : 'obligatoire'})
                                          </span>
                                        )}
                                      </label>
                                      <motion.div
                                        animate={showQuestionError && !customQuestion.trim() ? {
                                          x: [0, -10, 10, -10, 10, 0],
                                          transition: { duration: 0.5 }
                                        } : {}}
                                      >
                                        <textarea
                                          value={customQuestion}
                                          onChange={(e) => onCustomQuestionChange(e.target.value)}
                                          placeholder={language === 'en'
                                            ? 'What would you like guidance on?'
                                            : 'Sur quoi aimeriez-vous recevoir des conseils?'}
                                          rows={3}
                                          maxLength={500}
                                          className={`w-full bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-sm resize-none transition-colors ${
                                            showQuestionError && !customQuestion.trim()
                                              ? 'border-2 border-red-500 focus:border-red-500 focus:ring-red-500/30'
                                              : 'border border-white/20 focus:border-purple-500 focus:ring-purple-500/30'
                                          }`}
                                        />
                                      </motion.div>
                                      <div className="mt-1.5 flex items-start justify-between gap-4">
                                        <p className={`text-xs flex-1 ${showQuestionError && !customQuestion.trim() ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                                          {showQuestionError && !customQuestion.trim()
                                            ? (language === 'en' ? 'Please enter your question to continue' : 'Veuillez entrer votre question pour continuer')
                                            : (language === 'en' ? customHelper.en : customHelper.fr)}
                                        </p>
                                        <span className="text-xs text-slate-500">{customQuestion.length}/500</span>
                                      </div>
                                    </div>

                                    {/* Suggested Questions - Backup */}
                                    {currentQuestions.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Lightbulb className="w-3.5 h-3.5 text-amber-500/70" />
                                          <span className="text-xs text-slate-500">
                                            {language === 'en' ? 'Need inspiration?' : "Besoin d'inspiration?"}
                                          </span>
                                        </div>
                                        <div className="space-y-1.5">
                                          {currentQuestions.map((q) => (
                                            <button
                                              key={q.id}
                                              onClick={() => {
                                                const text = language === 'en' ? q.textEn : q.textFr;
                                                onCustomQuestionChange(text);
                                                onQuestionSelect(q.id, text);
                                              }}
                                              className="w-full px-3 py-2 text-left text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-slate-400 hover:text-slate-300 transition-all"
                                            >
                                              {language === 'en' ? q.textEn : q.textFr}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Go Deeper - Advanced Options */}
                                    {onAdvancedToggle && onStyleToggle && (
                                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                                        <button
                                          onClick={onAdvancedToggle}
                                          className="w-full flex items-center justify-between text-sm hover:bg-white/10 rounded-lg px-2 py-2 -mx-2 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-slate-500" />
                                            <span className="text-slate-400">
                                              {t('reading.go_deeper', 'Go Deeper')}
                                            </span>
                                            {isAdvanced && selectedStyles.length > 0 && (
                                              <span className="text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Coins className="w-3 h-3" />+1
                                              </span>
                                            )}
                                          </div>
                                          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isAdvanced ? 'rotate-180' : ''}`} />
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
                                              <div className="pt-3">
                                                <p className="text-xs text-slate-500 mb-3">
                                                  {t('reading.extra_perspectives', 'Add extra perspectives to your reading (+1 credit for any selection)')}
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                  {[
                                                    { id: InterpretationStyle.SPIRITUAL, label: t('reading.style_spiritual', 'Spiritual') },
                                                    { id: InterpretationStyle.PSYCHO_EMOTIONAL, label: t('reading.style_psycho_emotional', 'Psycho-Emotional') },
                                                    { id: InterpretationStyle.NUMEROLOGY, label: t('reading.style_numerology', 'Numerology') },
                                                    { id: InterpretationStyle.ELEMENTAL, label: t('reading.style_elements', 'Elements') }
                                                  ].map((option) => (
                                                    <button
                                                      key={option.id}
                                                      onClick={() => onStyleToggle(option.id)}
                                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                                        selectedStyles.includes(option.id)
                                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                          : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10'
                                                      }`}
                                                    >
                                                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                                                        selectedStyles.includes(option.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
                                                      }`}>
                                                        {selectedStyles.includes(option.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                                      </div>
                                                      {option.label}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpreadIntroSelector;
