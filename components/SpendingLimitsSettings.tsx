import React, { useState, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Download, AlertTriangle, Info, Coffee, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useSpendingLimits, SpendingLimits } from '../context/SpendingLimitsContext';
import { useApp } from '../context/AppContext';
import Button from './Button';

interface SpendingLimitsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_LIMITS = {
  daily: [5, 10, 20, 50],
  weekly: [20, 50, 100, 200],
  monthly: [50, 100, 200, 500],
};

const SpendingLimitsSettings: React.FC<SpendingLimitsSettingsProps> = ({ isOpen, onClose }) => {
  const { language, t } = useApp();

  const SELF_EXCLUSION_OPTIONS = useMemo(() => [
    { days: 1, label: t('spending.24_hours', '24 hours') },
    { days: 7, label: t('spending.1_week', '1 week') },
    { days: 30, label: t('spending.1_month', '1 month') },
    { days: 90, label: t('spending.3_months', '3 months') },
  ], [t]);
  const {
    limits,
    selfExclusion,
    spentToday,
    spentThisWeek,
    spentThisMonth,
    getLimitStatus,
    setLimit,
    enableSelfExclusion,
    disableSelfExclusion,
    exportSpendingHistory,
    getProblemGamblingResources,
  } = useSpendingLimits();

  const [expandedSection, setExpandedSection] = useState<string | null>('limits');
  const [customValues, setCustomValues] = useState<{ daily: string; weekly: string; monthly: string }>({
    daily: '',
    weekly: '',
    monthly: '',
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'warning'; message: string } | null>(null);
  const [selfExclusionDays, setSelfExclusionDays] = useState<number>(7);
  const [showExclusionConfirm, setShowExclusionConfirm] = useState(false);

  const status = getLimitStatus();
  const resources = getProblemGamblingResources();

  const showFeedback = useCallback((type: 'success' | 'info' | 'warning', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  const handleSetLimit = useCallback((field: keyof SpendingLimits, value: number | null) => {
    const result = setLimit(field, value);
    showFeedback('success', result.message);
    setCustomValues(prev => ({ ...prev, [field]: '' }));
  }, [setLimit, showFeedback]);

  const handleCustomLimit = useCallback((field: keyof SpendingLimits) => {
    const value = parseFloat(customValues[field]);
    if (isNaN(value) || value <= 0) {
      showFeedback('warning', 'Please enter a valid amount greater than 0');
      return;
    }
    handleSetLimit(field, value);
  }, [customValues, handleSetLimit, showFeedback]);

  const handleSelfExclusion = useCallback(() => {
    enableSelfExclusion(selfExclusionDays);
    setShowExclusionConfirm(false);
    showFeedback('success', `Self-exclusion enabled for ${selfExclusionDays} days. Take care of yourself.`);
  }, [selfExclusionDays, enableSelfExclusion, showFeedback]);

  const handleExport = useCallback(() => {
    const data = exportSpendingHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `celestiarcana-spending-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('success', 'Spending history exported successfully');
  }, [exportSpendingHistory, showFeedback]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const renderLimitRow = (field: keyof SpendingLimits, label: string, spent: number, presets: number[]) => {
    const currentStatus = status[field];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">{label}</span>
          <span className="text-sm text-slate-400">
            {t('spending.spent', 'Spent')}: €{spent.toFixed(2)}
            {currentStatus.limit && ` / €${currentStatus.limit}`}
          </span>
        </div>

        {/* Progress bar */}
        {currentStatus.limit && (
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full transition-colors ${
                currentStatus.warning === 'hard' ? 'bg-red-500' :
                currentStatus.warning === 'soft' ? 'bg-amber-500' : 'bg-green-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, currentStatus.percentage)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2">
          {presets.map(value => (
            <button
              key={value}
              onClick={() => handleSetLimit(field, value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                currentStatus.limit === value
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              €{value}
            </button>
          ))}
          <button
            onClick={() => handleSetLimit(field, null)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              currentStatus.limit === null
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {t('spending.no_limit', 'No limit')}
          </button>
        </div>

        {/* Custom value */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder={t('spending.custom_amount', 'Custom amount')}
            value={customValues[field]}
            onChange={e => setCustomValues(prev => ({ ...prev, [field]: e.target.value }))}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
            min="1"
            step="1"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleCustomLimit(field)}
            disabled={!customValues[field]}
          >
            {t('spending.set', 'Set')}
          </Button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900 border-b border-purple-500/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-white">
                  {t('spending.responsible_play', 'Responsible Play')}
                </h2>
                <p className="text-sm text-slate-400">
                  {t('spending.manage_limits', 'Manage your spending limits')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback banner */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  feedback.type === 'success' ? 'bg-green-900/50 text-green-300' :
                  feedback.type === 'warning' ? 'bg-amber-900/50 text-amber-300' :
                  'bg-blue-900/50 text-blue-300'
                }`}
              >
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{feedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Self-exclusion active banner */}
          {selfExclusion.enabled && (
            <div className="mx-4 mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-300">
                    {t('spending.self_exclusion_active', 'Self-Exclusion Active')}
                  </h3>
                  <p className="text-sm text-red-200/80 mt-1">
                    {selfExclusion.endDate
                      ? `${t('spending.paused_until', 'Purchases paused until')} ${new Date(selfExclusion.endDate).toLocaleDateString()}`
                      : t('spending.paused_indefinitely', 'Purchases paused indefinitely')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Spending Limits Section */}
            <div className="border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('limits')}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <span className="font-medium text-white">
                  {t('spending.spending_limits', 'Spending Limits')}
                </span>
                {expandedSection === 'limits' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              <AnimatePresence>
                {expandedSection === 'limits' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-6 border-t border-slate-700">
                      <p className="text-sm text-slate-400">
                        {t('spending.set_limits_desc', 'Set limits to help manage your spending. All changes take effect immediately.')}
                      </p>

                      {renderLimitRow('daily', t('spending.daily_limit', 'Daily Limit'), spentToday, PRESET_LIMITS.daily)}
                      <div className="border-t border-slate-700 pt-4">
                        {renderLimitRow('weekly', t('spending.weekly_limit', 'Weekly Limit'), spentThisWeek, PRESET_LIMITS.weekly)}
                      </div>
                      <div className="border-t border-slate-700 pt-4">
                        {renderLimitRow('monthly', t('spending.monthly_limit', 'Monthly Limit'), spentThisMonth, PRESET_LIMITS.monthly)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Take a Break Section */}
            <div className="border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('break')}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <span className="font-medium text-white flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  {t('spending.take_a_break', 'Take a Break')}
                </span>
                {expandedSection === 'break' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              <AnimatePresence>
                {expandedSection === 'break' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-4 border-t border-slate-700">
                      <p className="text-sm text-slate-400">
                        {t('spending.break_desc', 'Need a break? Temporarily pause all purchases. This cannot be undone early - choose carefully.')}
                      </p>

                      {!selfExclusion.enabled ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {SELF_EXCLUSION_OPTIONS.map(option => (
                              <button
                                key={option.days}
                                onClick={() => setSelfExclusionDays(option.days)}
                                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                                  selfExclusionDays === option.days
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>

                          {showExclusionConfirm ? (
                            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4 space-y-3">
                              <p className="text-sm text-amber-200">
                                {t('spending.exclusion_confirm', `Are you sure? You won't be able to make purchases for ${selfExclusionDays} days and this cannot be cancelled early.`)}
                              </p>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setShowExclusionConfirm(false)}>
                                  {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button variant="primary" size="sm" onClick={handleSelfExclusion}>
                                  {t('spending.yes_take_break', 'Yes, take a break')}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="secondary"
                              onClick={() => setShowExclusionConfirm(true)}
                              className="w-full"
                            >
                              {t('spending.enable_break', 'Enable Break')}
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-amber-300">
                            {t('spending.break_active', 'Break is active.')}
                          </p>
                          {selfExclusion.endDate && (
                            <p className="text-sm text-slate-400 mt-2">
                              {t('spending.ends', 'Ends')}: {new Date(selfExclusion.endDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export & Resources Section */}
            <div className="border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('resources')}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <span className="font-medium text-white">
                  {t('spending.history_resources', 'History & Resources')}
                </span>
                {expandedSection === 'resources' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              <AnimatePresence>
                {expandedSection === 'resources' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-4 border-t border-slate-700">
                      {/* Export button */}
                      <Button
                        variant="outline"
                        onClick={handleExport}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t('spending.export_history', 'Export Spending History')}
                      </Button>

                      {/* Resources */}
                      <div className="pt-4 border-t border-slate-700">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">
                          {t('spending.support_resources', 'Support Resources')}
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">
                          {t('spending.resources_desc', 'If you feel your spending is becoming a problem, these organizations can help.')}
                        </p>
                        <ul className="space-y-2">
                          {resources.map(resource => (
                            <li key={resource.name}>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {resource.name}
                                {resource.phone && <span className="text-slate-500">({resource.phone})</span>}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-900 border-t border-purple-500/20 p-4">
            <Button variant="primary" onClick={onClose} className="w-full">
              {t('spending.done', 'Done')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default memo(SpendingLimitsSettings);
