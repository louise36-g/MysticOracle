// components/reading/phases/FiveCardQuestionSelector.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, PenLine } from 'lucide-react';
import FiveCardCategorySelector from './FiveCardCategorySelector';
import FiveCardLayoutSelector from './FiveCardLayoutSelector';
import {
  FiveCardCategory,
  FiveCardLayoutId,
  FiveCardQuestion,
  getFiveCardQuestionsForSelection,
  FIVE_CARD_CUSTOM_QUESTION_HELPER,
} from '../../../constants/fiveCardLayouts';

interface FiveCardQuestionSelectorProps {
  language: 'en' | 'fr';
  selectedCategory: FiveCardCategory | null;
  selectedLayout: FiveCardLayoutId | null;
  selectedQuestionId: string | null;
  customQuestion: string;
  isWritingOwn: boolean;
  onCategorySelect: (category: FiveCardCategory) => void;
  onLayoutSelect: (layoutId: FiveCardLayoutId) => void;
  onQuestionSelect: (questionId: string, questionText: string) => void;
  onCustomQuestionChange: (text: string) => void;
  onWriteOwn: () => void;
}

const FiveCardQuestionSelector: React.FC<FiveCardQuestionSelectorProps> = ({
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
  // Get questions based on category and layout
  const questions: FiveCardQuestion[] = selectedCategory && selectedLayout
    ? getFiveCardQuestionsForSelection(selectedCategory, selectedLayout)
    : [];

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <FiveCardCategorySelector
        language={language}
        selectedCategory={selectedCategory}
        onSelect={onCategorySelect}
      />

      {/* Layout Selection (shows after category) */}
      <AnimatePresence>
        {selectedCategory && (
          <FiveCardLayoutSelector
            language={language}
            category={selectedCategory}
            selectedLayout={selectedLayout}
            onSelect={onLayoutSelect}
          />
        )}
      </AnimatePresence>

      {/* Question Selection (shows after layout) */}
      <AnimatePresence>
        {selectedCategory && selectedLayout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <p className="text-sm text-slate-400 mb-3">
              {language === 'en' ? 'Your question' : 'Votre question'}
            </p>

            {/* Curated Questions */}
            {!isWritingOwn && (
              <div className="space-y-2 mb-3">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => onQuestionSelect(q.id, language === 'en' ? q.textEn : q.textFr)}
                    className={`
                      w-full p-3 rounded-lg text-left text-sm transition-all
                      ${selectedQuestionId === q.id
                        ? 'bg-purple-500/20 border border-purple-500/40 text-purple-100'
                        : 'bg-slate-800/30 border border-slate-700/30 text-slate-300 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`
                        w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center
                        ${selectedQuestionId === q.id ? 'bg-purple-500 border-purple-500' : 'border-slate-600'}
                      `}>
                        {selectedQuestionId === q.id && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span>{language === 'en' ? q.textEn : q.textFr}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Write Your Own Toggle */}
            <button
              onClick={onWriteOwn}
              className={`
                w-full p-3 rounded-lg text-left text-sm transition-all flex items-center gap-2
                ${isWritingOwn
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-100'
                  : 'bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:border-slate-600'
                }
              `}
            >
              <PenLine className="w-4 h-4" />
              {language === 'en' ? 'Write your own question' : 'Ecrivez votre propre question'}
            </button>

            {/* Custom Question Input */}
            <AnimatePresence>
              {isWritingOwn && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <textarea
                    value={customQuestion}
                    onChange={(e) => onCustomQuestionChange(e.target.value)}
                    placeholder={language === 'en' ? 'Type your question here...' : 'Tapez votre question ici...'}
                    className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-purple-500/50"
                    rows={3}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {language === 'en'
                      ? FIVE_CARD_CUSTOM_QUESTION_HELPER.en
                      : FIVE_CARD_CUSTOM_QUESTION_HELPER.fr}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FiveCardQuestionSelector;
