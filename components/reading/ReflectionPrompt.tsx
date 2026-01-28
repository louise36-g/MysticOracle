import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Info, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';
import Button from '../Button';

const MAX_REFLECTION_LENGTH = 1000;

interface ReflectionPromptProps {
  readingId: string | null;
  onSave: (reflection: string) => Promise<void>;
}

const ReflectionPrompt: React.FC<ReflectionPromptProps> = ({
  readingId,
  onSave,
}) => {
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [reflection, setReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const charCount = reflection.length;
  const charColor = charCount > MAX_REFLECTION_LENGTH * 0.9
    ? 'text-amber-400'
    : 'text-slate-500';

  const handleSave = useCallback(async () => {
    if (!reflection.trim() || !readingId) return;

    setIsSaving(true);
    try {
      await onSave(reflection.trim());
      setIsSaved(true);
      // Collapse after a brief moment to show the confirmation
      setTimeout(() => {
        setIsExpanded(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to save reflection:', error);
    } finally {
      setIsSaving(false);
    }
  }, [reflection, readingId, onSave]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_REFLECTION_LENGTH) {
      setReflection(value);
    }
  }, []);

  const toggleExpanded = useCallback(() => {
    if (!isSaved) {
      setIsExpanded(prev => !prev);
    }
  }, [isSaved]);

  // Don't render if skipped
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="mt-8 mb-4"
    >
      <div className="bg-slate-800/30 border border-purple-500/20 rounded-xl overflow-hidden">
        {/* Header - Always visible */}
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-purple-200 font-medium text-sm md:text-base">
              {t('reflection.header', 'Capture your thoughts')}
            </span>

            {/* Info tooltip */}
            <div
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info className="w-4 h-4 text-slate-500 hover:text-slate-400 transition-colors" />
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 top-full mt-2 z-10 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 whitespace-nowrap"
                  >
                    {t('reflection.tooltip', 'Private to your account — only you can see this')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Saved indicator */}
            {isSaved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-green-400 text-sm"
              >
                <Check className="w-4 h-4" />
                <span>{t('reflection.saved', 'Reflection saved')}</span>
              </motion.div>
            )}
          </div>

          <div className="text-slate-500">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </button>

        {/* Collapsible content */}
        <AnimatePresence>
          {isExpanded && !isSaved && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4">
                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={reflection}
                    onChange={handleChange}
                    placeholder={t('reflection.placeholder', 'What came up for you? Note what you noticed, felt, or understood — for later reflection...')}
                    maxLength={MAX_REFLECTION_LENGTH}
                    disabled={isSaving}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 resize-none min-h-[120px] text-sm disabled:opacity-50 transition-colors"
                  />

                  {/* Character count */}
                  <div className="absolute bottom-3 right-3">
                    <span className={`text-xs ${charColor}`}>
                      {charCount} / {MAX_REFLECTION_LENGTH} {t('reflection.characters', 'characters')}
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleSkip}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
                  >
                    {t('reflection.skip', 'Skip')}
                  </button>

                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !reflection.trim() || !readingId}
                    size="sm"
                    className="min-w-[140px]"
                    title={!readingId ? t('reflection.cannotSave', 'Cannot save - reading not synced') : undefined}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('reflection.saving', 'Saving...')}</span>
                      </span>
                    ) : (
                      t('reflection.save', 'Save Reflection')
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ReflectionPrompt;
