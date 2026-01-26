import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Settings, Check, AlertCircle, ChevronDown, ArrowLeft } from 'lucide-react';
import { SpreadConfig, InterpretationStyle, SpreadType } from '../../../types';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import QuestionLengthModal from '../../QuestionLengthModal';
import { SPREAD_THEMES } from '../SpreadThemes';
import { QUESTION_LENGTH } from '../../../hooks';

interface QuestionIntroPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  question: string;
  questionError: boolean;
  validationMessage: string | null;
  isAdvanced: boolean;
  selectedStyles: InterpretationStyle[];
  extendedQuestionPaid: boolean;
  totalCost: number;
  credits: number;
  showLengthModal: boolean;
  isProcessingLength: boolean;
  onQuestionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onGeneralGuidance: () => void;
  onAdvancedToggle: () => void;
  onStyleToggle: (style: InterpretationStyle) => void;
  onStartShuffle: () => void;
  onShowLengthModal: (show: boolean) => void;
  onShortenManually: () => void;
  onAISummarize: () => Promise<void>;
  onUseFullQuestion: () => void;
  onCancel?: () => void;
}

const QuestionIntroPhase: React.FC<QuestionIntroPhaseProps> = ({
  spread,
  language,
  question,
  questionError,
  validationMessage,
  isAdvanced,
  selectedStyles,
  extendedQuestionPaid,
  totalCost,
  credits,
  showLengthModal,
  isProcessingLength,
  onQuestionChange,
  onGeneralGuidance,
  onAdvancedToggle,
  onStyleToggle,
  onStartShuffle,
  onShowLengthModal,
  onShortenManually,
  onAISummarize,
  onUseFullQuestion,
  onCancel,
}) => {
  const theme = SPREAD_THEMES[spread.id];
  const questionLength = question.length;
  const currentLimit = extendedQuestionPaid ? QUESTION_LENGTH.HARD_LIMIT : QUESTION_LENGTH.FREE_LIMIT;

  const questionLengthColor = React.useMemo(() => {
    if (questionLength <= currentLimit * 0.9) return 'text-slate-400';
    if (questionLength <= currentLimit) return 'text-green-400';
    return 'text-red-400';
  }, [questionLength, currentLimit]);

  return (
    <div className="flex flex-col items-center px-4 py-6 md:py-8 relative min-h-screen">
      {/* Themed Background */}
      <ThemedBackground spreadType={spread.id} />

      {/* Back button */}
      {onCancel && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onCancel}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-slate-400 hover:text-white hover:bg-black/40 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'en' ? 'Back' : 'Retour'}</span>
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Themed Spread Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 mb-3`}>
            <span className={theme.textAccent}>{theme.icon}</span>
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{theme.name}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading text-white mb-1">
            {language === 'en' ? spread.nameEn : spread.nameFr}
          </h2>
          <p className={`text-sm ${theme.textAccent} italic`}>
            {language === 'en' ? theme.taglineEn : theme.taglineFr}
          </p>
        </div>

        {/* Spread Info Bar */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs uppercase tracking-wider">
              {spread.positions} {language === 'en' ? 'cards' : 'cartes'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xl font-heading ${theme.textAccent}`}>{totalCost}</span>
            <span className="text-slate-500 text-xs">
              {language === 'en' ? 'credits' : 'crédits'}
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
          {/* Question Input Section */}
          <div className="p-4 md:p-5">
            <label className={`block text-sm font-medium mb-2 ${questionError ? 'text-red-400' : 'text-slate-300'}`}>
              {language === 'en' ? 'Your Question' : 'Votre Question'}
            </label>
            <textarea
              value={question}
              onChange={onQuestionChange}
              placeholder={language === 'en' ? 'What weighs on your heart?' : 'Qu\'est-ce qui pèse sur votre cœur?'}
              maxLength={QUESTION_LENGTH.HARD_LIMIT}
              rows={2}
              className={`w-full bg-slate-950/60 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 text-sm md:text-base resize-none transition-all ${
                questionError
                  ? 'border border-red-500 focus:ring-red-500/50'
                  : questionLength > currentLimit
                    ? 'border border-red-500 focus:ring-red-500/50'
                    : 'border border-slate-700 focus:border-amber-500 focus:ring-amber-500/30'
              }`}
            />
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={onGeneralGuidance}
                className="flex items-center gap-1.5 text-xs text-amber-500/80 hover:text-amber-400 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>{language === 'en' ? 'Use General Guidance' : 'Guidance Générale'}</span>
              </button>
              <span className={`text-xs ${questionLengthColor}`}>
                {questionLength}/{currentLimit}
              </span>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t border-slate-800">
            <button
              onClick={onAdvancedToggle}
              className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">
                  {language === 'en' ? 'Advanced Options' : 'Options Avancées'}
                </span>
                {isAdvanced && (
                  <span className="text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    +1
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
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {[
                      { id: InterpretationStyle.SPIRITUAL, labelEn: 'Spiritual', labelFr: 'Spirituel' },
                      { id: InterpretationStyle.PSYCHO_EMOTIONAL, labelEn: 'Psycho-Emotional', labelFr: 'Psycho-Émotionnel' },
                      { id: InterpretationStyle.NUMEROLOGY, labelEn: 'Numerology', labelFr: 'Numérologie' },
                      { id: InterpretationStyle.ELEMENTAL, labelEn: 'Elements', labelFr: 'Éléments' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => onStyleToggle(option.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedStyles.includes(option.id)
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800/50 text-slate-500 border border-transparent hover:bg-slate-800'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                          selectedStyles.includes(option.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
                        }`}>
                          {selectedStyles.includes(option.id) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        {language === 'en' ? option.labelEn : option.labelFr}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
            <Button onClick={onStartShuffle} size="lg" className="w-full">
              {language === 'en' ? 'Begin Reading' : 'Commencer la Lecture'}
            </Button>
            {(isAdvanced || extendedQuestionPaid) && (
              <p className="text-center text-xs text-slate-500 mt-2">
                {spread.cost} {isAdvanced && `+ 1`} {extendedQuestionPaid && `+ 1`} = {totalCost} {language === 'en' ? 'credits' : 'crédits'}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Question Length Modal */}
      <QuestionLengthModal
        isOpen={showLengthModal}
        onClose={() => onShowLengthModal(false)}
        question={question}
        language={language}
        credits={credits}
        onShortenManually={onShortenManually}
        onAISummarize={onAISummarize}
        onUseFullQuestion={onUseFullQuestion}
        isLoading={isProcessingLength}
      />
    </div>
  );
};

export default QuestionIntroPhase;
