import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Sparkles, ArrowRight, Loader2, Coins } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from './Button';

interface QuestionLengthModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  language: 'en' | 'fr';
  credits: number;
  onShortenManually: () => void;
  onAISummarize: () => Promise<void>;
  onUseFullQuestion: () => void;
  isLoading?: boolean;
}

const QuestionLengthModal: React.FC<QuestionLengthModalProps> = ({
  isOpen,
  onClose,
  question,
  language,
  credits,
  onShortenManually,
  onAISummarize,
  onUseFullQuestion,
  isLoading = false
}) => {
  const { t } = useApp();
  const [summarizing, setSummarizing] = useState(false);

  const handleAISummarize = async () => {
    setSummarizing(true);
    try {
      await onAISummarize();
    } finally {
      setSummarizing(false);
    }
  };

  const charCount = question.length;
  const isExtended = charCount >= 500 && charCount <= 2000;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-900/50 to-purple-900/50 px-6 py-4 flex items-center justify-between border-b border-white/10">
              <h2 className="text-xl font-heading text-amber-100">
                {t('question.long_question_detected', 'Long Question Detected')}
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Question Preview */}
              <div>
                <p className="text-sm text-slate-400 mb-2">
                  {t('question.your_question', 'Your question:')}
                </p>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5 max-h-32 overflow-y-auto">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {question.length > 300 ? question.slice(0, 300) + '...' : question}
                  </p>
                </div>
                <p className="text-xs text-amber-400 mt-2">
                  {charCount} {t('question.characters', 'characters')}
                  {charCount > 500 && (
                    <span className="text-slate-500">
                      {' '}— {t('question.limit_500_free', 'limit is 500 for free')}
                    </span>
                  )}
                </p>
              </div>

              {/* Credit Balance */}
              <div className="flex items-center gap-2 bg-slate-800/30 rounded-lg px-4 py-2 border border-white/5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300">
                  {t('question.your_balance', 'Your balance:')}
                </span>
                <span className="font-bold text-amber-400">{credits}</span>
                <span className="text-sm text-slate-500">
                  {t('question.credits', 'credits')}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <p className="text-sm text-slate-400 mb-3">
                  {t('question.choose_how', 'Choose how to proceed:')}
                </p>

                {/* Option 1: Shorten manually */}
                <button
                  onClick={onShortenManually}
                  disabled={isLoading || summarizing}
                  className="w-full flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all group disabled:opacity-50"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <Edit3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">
                      {t('question.shorten_it', "I'll shorten it")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('question.edit_manually', 'Edit your question manually')}
                    </p>
                  </div>
                  <span className="text-xs text-green-400 font-medium">
                    {t('question.free', 'Free')}
                  </span>
                </button>

                {/* Option 2: AI Rewrite */}
                <button
                  onClick={handleAISummarize}
                  disabled={isLoading || summarizing || credits < 1}
                  className="w-full flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-amber-500/30 rounded-xl transition-all group disabled:opacity-50"
                >
                  <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                    {summarizing ? (
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">
                      {t('question.ai_rewrite', 'AI rewrite')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('question.summarize_essence', 'Summarize while keeping the essence')}
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 font-medium">
                    1 {t('question.credit', 'credit')}
                  </span>
                </button>

                {/* Option 3: Use full question */}
                {isExtended && (
                  <button
                    onClick={onUseFullQuestion}
                    disabled={isLoading || summarizing || credits < 1}
                    className="w-full flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all group disabled:opacity-50"
                  >
                    <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                      <ArrowRight className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">
                        {t('question.use_full_question', 'Use full question')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t('question.proceed_extended', 'Proceed with your extended question')}
                      </p>
                    </div>
                    <span className="text-xs text-cyan-400 font-medium">
                      1 {t('question.credit', 'credit')}
                    </span>
                  </button>
                )}
              </div>

              {credits < 1 && (
                <p className="text-xs text-red-400 text-center">
                  {t('question.need_credit', 'You need at least 1 credit for paid options')}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuestionLengthModal;
