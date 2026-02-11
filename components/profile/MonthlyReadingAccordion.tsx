import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, History } from 'lucide-react';
import { UnifiedReadingData } from '../../services/api';
import { useApp } from '../../context/AppContext';
import UnifiedHistoryCard from './UnifiedHistoryCard';
import { ReadingFilterType } from './ReadingTypeFilter';

// Labels for each filter type
const FILTER_LABELS: Record<ReadingFilterType, { en: string; fr: string }> = {
  all: { en: 'All Readings', fr: 'Toutes les lectures' },
  this_week: { en: 'This Week', fr: 'Cette semaine' },
  last_week: { en: 'Last Week', fr: 'Semaine dernière' },
  this_month: { en: 'This Month', fr: 'Ce mois-ci' },
  last_month: { en: 'Last Month', fr: 'Mois dernier' },
};

interface MonthlyReadingAccordionProps {
  readings: UnifiedReadingData[];
  expandedReading: string | null;
  onToggleReading: (id: string) => void;
  filterType?: ReadingFilterType;
}

interface MonthGroup {
  key: string;
  label: string;
  readings: UnifiedReadingData[];
}

const MonthlyReadingAccordion: React.FC<MonthlyReadingAccordionProps> = ({
  readings,
  expandedReading,
  onToggleReading,
  filterType = 'all',
}) => {
  const { t, language } = useApp();

  // Get the label for the current filter type
  const filterLabel = FILTER_LABELS[filterType]?.[language === 'en' ? 'en' : 'fr'] || FILTER_LABELS.all[language === 'en' ? 'en' : 'fr'];
  // Auto-expand "This Month" by default
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['this-month']));

  // Group readings: "This Month" vs "All" (grouped by month)
  const { thisMonth, olderByMonth } = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const thisMonthReadings: UnifiedReadingData[] = [];
    const olderReadings: Map<string, UnifiedReadingData[]> = new Map();

    // Sort all readings by date (newest first)
    const sorted = [...readings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sorted.forEach((reading) => {
      const date = new Date(reading.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthKey === currentMonthKey) {
        thisMonthReadings.push(reading);
      } else {
        if (!olderReadings.has(monthKey)) {
          olderReadings.set(monthKey, []);
        }
        olderReadings.get(monthKey)!.push(reading);
      }
    });

    // Convert older readings map to sorted array of groups
    const olderGroups: MonthGroup[] = Array.from(olderReadings.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // Sort by month key descending
      .map(([key, groupReadings]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const label = date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
          month: 'long',
          year: 'numeric',
        });
        return { key, label, readings: groupReadings };
      });

    return { thisMonth: thisMonthReadings, olderByMonth: olderGroups };
  }, [readings, language]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  if (!readings || readings.length === 0) {
    return null;
  }

  const renderAccordionSection = (
    id: string,
    label: string,
    icon: React.ReactNode,
    sectionReadings: UnifiedReadingData[]
  ) => {
    if (sectionReadings.length === 0) return null;

    const isExpanded = expandedSections.has(id);
    const count = sectionReadings.length;

    return (
      <div key={id} className="bg-slate-800/30 rounded-xl border border-slate-700/40 overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              {icon}
            </div>
            <div className="text-left">
              <h3 className="text-base font-medium text-white">{label}</h3>
              <p className="text-xs text-slate-500">
                {count} {count === 1
                  ? t('profile.history.reading', 'reading')
                  : t('profile.history.readings', 'readings')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-sm font-medium rounded-full">
              {count}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 pb-4 space-y-3 border-t border-slate-700/30 pt-3">
                {sectionReadings.map((reading) => (
                  <UnifiedHistoryCard
                    key={reading.id}
                    reading={reading}
                    isExpanded={expandedReading === reading.id}
                    onToggle={() => onToggleReading(reading.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* This Month Section */}
      {renderAccordionSection(
        'this-month',
        language === 'en' ? `This Month - ${filterLabel}` : `Ce mois-ci - ${filterLabel}`,
        <Calendar className="w-4 h-4" />,
        thisMonth
      )}

      {/* All (Older) Section - grouped by month */}
      {olderByMonth.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/40 overflow-hidden">
          <button
            onClick={() => toggleSection('all')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <History className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-medium text-white">
                  {filterLabel}
                </h3>
                <p className="text-xs text-slate-500">
                  {olderByMonth.reduce((sum, g) => sum + g.readings.length, 0)}{' '}
                  {t('profile.history.readings', 'readings')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-sm font-medium rounded-full">
                {olderByMonth.reduce((sum, g) => sum + g.readings.length, 0)}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  expandedSections.has('all') ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          <AnimatePresence>
            {expandedSections.has('all') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 pb-4 space-y-4 border-t border-slate-700/30 pt-3">
                  {olderByMonth.map((group) => (
                    <div key={group.key}>
                      <h4 className="text-sm font-medium text-slate-400 mb-2 capitalize">
                        {group.label}
                      </h4>
                      <div className="space-y-3">
                        {group.readings.map((reading) => (
                          <UnifiedHistoryCard
                            key={reading.id}
                            reading={reading}
                            isExpanded={expandedReading === reading.id}
                            onToggle={() => onToggleReading(reading.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MonthlyReadingAccordion;
