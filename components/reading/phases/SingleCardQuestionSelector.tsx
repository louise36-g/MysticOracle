// components/reading/phases/SingleCardQuestionSelector.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Sparkles, Heart, Briefcase, Scale, Leaf, PenLine } from 'lucide-react';
import {
  SINGLE_CARD_CATEGORIES,
  SINGLE_CARD_QUESTIONS,
  CUSTOM_QUESTION_HELPER,
  QUESTION_GUIDE_LINK,
  SingleCardCategory,
} from '../../../constants/singleCardQuestions';

interface SingleCardQuestionSelectorProps {
  language: 'en' | 'fr';
  selectedCategory: SingleCardCategory | null;
  selectedQuestionId: string | null;
  customQuestion: string;
  onCategorySelect: (category: SingleCardCategory) => void;
  onQuestionSelect: (questionId: string, questionText: string) => void;
  onCustomQuestionChange: (text: string) => void;
  onWriteOwn: () => void;
  isWritingOwn: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Scale: <Scale className="w-4 h-4" />,
  Leaf: <Leaf className="w-4 h-4" />,
};

const SingleCardQuestionSelector: React.FC<SingleCardQuestionSelectorProps> = ({
  language,
  selectedCategory,
  selectedQuestionId,
  customQuestion,
  onCategorySelect,
  onQuestionSelect,
  onCustomQuestionChange,
  onWriteOwn,
  isWritingOwn,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const questions = selectedCategory ? SINGLE_CARD_QUESTIONS[selectedCategory] : [];
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {language === 'en' ? 'Choose a Theme' : 'Choisissez un Theme'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SINGLE_CARD_CATEGORIES.map((cat) => (
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

      {/* Question Selection - Only show when category selected */}
      <AnimatePresence>
        {selectedCategory && !isWritingOwn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'en' ? 'Select Your Question' : 'Selectionnez Votre Question'}
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
              <span>{language === 'en' ? 'Or write your own question' : 'Ou ecrivez votre propre question'}</span>
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
                {language === 'en' ? CUSTOM_QUESTION_HELPER.en : CUSTOM_QUESTION_HELPER.fr}
              </p>
              <span className="text-xs text-slate-500">{customQuestion.length}/500</span>
            </div>
            <a
              href={QUESTION_GUIDE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-500/70 hover:text-cyan-400 transition-colors"
            >
              {language === 'en' ? 'How to ask good questions' : 'Comment poser de bonnes questions'}
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Back to dropdown */}
            <button
              onClick={onWriteOwn}
              className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5 rotate-90" />
              <span>{language === 'en' ? 'Back to suggested questions' : 'Retour aux questions suggerees'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SingleCardQuestionSelector;
