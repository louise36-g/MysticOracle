// components/reading/phases/ThreeCardQuestionSelector.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Heart, Briefcase, Scale, Leaf, PenLine } from 'lucide-react';
import {
  THREE_CARD_CATEGORIES,
  THREE_CARD_QUESTIONS,
  THREE_CARD_CUSTOM_QUESTION_HELPER,
  ThreeCardCategory,
  ThreeCardLayoutId,
  categoryHasMultipleLayouts,
  getThreeCardCategory,
} from '../../../constants/threeCardLayouts';
import LayoutSelector from '../LayoutSelector';

interface ThreeCardQuestionSelectorProps {
  language: 'en' | 'fr';
  selectedCategory: ThreeCardCategory | null;
  selectedLayout: ThreeCardLayoutId | null;
  selectedQuestionId: string | null;
  customQuestion: string;
  isWritingOwn: boolean;
  onCategorySelect: (category: ThreeCardCategory) => void;
  onLayoutSelect: (layoutId: ThreeCardLayoutId) => void;
  onQuestionSelect: (questionId: string, questionText: string) => void;
  onCustomQuestionChange: (text: string) => void;
  onWriteOwn: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Scale: <Scale className="w-4 h-4" />,
  Leaf: <Leaf className="w-4 h-4" />,
};

const ThreeCardQuestionSelector: React.FC<ThreeCardQuestionSelectorProps> = ({
  language,
  selectedCategory,
  selectedLayout,
  selectedQuestionId,
  customQuestion,
  isWritingOwn,
  onCategorySelect,
  onLayoutSelect,
  onQuestionSelect,
  onCustomQuestionChange,
  onWriteOwn,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const questions = selectedCategory ? THREE_CARD_QUESTIONS[selectedCategory] : [];
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  const categoryConfig = selectedCategory ? getThreeCardCategory(selectedCategory) : null;
  const hasMultipleLayouts = selectedCategory ? categoryHasMultipleLayouts(selectedCategory) : false;

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {language === 'en' ? 'Choose a Theme' : 'Choisissez un Thème'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THREE_CARD_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              <span className={selectedCategory === cat.id ? 'text-cyan-400' : 'text-slate-500'}>
                {ICON_MAP[cat.iconName]}
              </span>
              <span className="truncate">{language === 'en' ? cat.labelEn : cat.labelFr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout Selection - Only for categories with multiple layouts */}
      <AnimatePresence>
        {selectedCategory && hasMultipleLayouts && categoryConfig && selectedLayout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LayoutSelector
              language={language}
              layouts={categoryConfig.layouts}
              selectedLayout={selectedLayout}
              onLayoutSelect={onLayoutSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Selection - Show when category selected and not writing own */}
      <AnimatePresence>
        {selectedCategory && !isWritingOwn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'en' ? 'Select Your Question' : 'Sélectionnez Votre Question'}
            </label>

            {/* Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-950/60 border border-slate-700 rounded-lg text-left hover:border-cyan-500/50 transition-colors"
              >
                <span className={selectedQuestion ? 'text-white' : 'text-slate-500'}>
                  {selectedQuestion
                    ? (language === 'en' ? selectedQuestion.textEn : selectedQuestion.textFr)
                    : (language === 'en' ? 'Choose a question...' : 'Choisissez une question...')}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
                  >
                    {questions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          onQuestionSelect(q.id, language === 'en' ? q.textEn : q.textFr);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-800 transition-colors ${
                          selectedQuestionId === q.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300'
                        }`}
                      >
                        {language === 'en' ? q.textEn : q.textFr}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Write your own option */}
            <button
              onClick={onWriteOwn}
              className="mt-3 flex items-center gap-2 text-sm text-amber-500/80 hover:text-amber-400 transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Or write your own question' : 'Ou écrivez votre propre question'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Question Input */}
      <AnimatePresence>
        {selectedCategory && isWritingOwn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'en' ? 'Your Question' : 'Votre Question'}
            </label>
            <textarea
              value={customQuestion}
              onChange={(e) => onCustomQuestionChange(e.target.value)}
              placeholder={language === 'en' ? 'What would you like guidance on?' : 'Sur quoi aimeriez-vous recevoir des conseils?'}
              rows={2}
              maxLength={500}
              className="w-full bg-slate-950/60 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 border border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/30 text-sm resize-none"
            />
            <div className="mt-2 flex items-start justify-between gap-4">
              <p className="text-xs text-slate-500 flex-1">
                {language === 'en' ? THREE_CARD_CUSTOM_QUESTION_HELPER.en : THREE_CARD_CUSTOM_QUESTION_HELPER.fr}
              </p>
              <span className="text-xs text-slate-500">{customQuestion.length}/500</span>
            </div>

            {/* Back to dropdown */}
            <button
              onClick={onWriteOwn}
              className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5 rotate-90" />
              <span>{language === 'en' ? 'Back to suggested questions' : 'Retour aux questions suggérées'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreeCardQuestionSelector;
