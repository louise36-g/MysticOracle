import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Clock, CalendarDays, CalendarRange, History } from 'lucide-react';
import { ReadingData } from '../../services/api';
import { useApp } from '../../context/AppContext';
import ReadingHistoryCard from './ReadingHistoryCard';

type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all';

interface ReadingHistoryAccordionProps {
  readings: ReadingData[];
  expandedReading: string | null;
  onToggleReading: (id: string) => void;
}

interface GroupedReadings {
  today: ReadingData[];
  week: ReadingData[];
  month: ReadingData[];
  year: ReadingData[];
  older: ReadingData[];
}

const ReadingHistoryAccordion: React.FC<ReadingHistoryAccordionProps> = ({
  readings,
  expandedReading,
  onToggleReading,
}) => {
  const { t, language } = useApp();
  const [expandedSections, setExpandedSections] = useState<Set<TimePeriod>>(new Set(['today']));

  // Group readings by time period
  const groupedReadings = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const groups: GroupedReadings = {
      today: [],
      week: [],
      month: [],
      year: [],
      older: [],
    };

    readings.forEach((reading) => {
      const readingDate = new Date(reading.createdAt);

      if (readingDate >= startOfToday) {
        groups.today.push(reading);
      } else if (readingDate >= startOfWeek) {
        groups.week.push(reading);
      } else if (readingDate >= startOfMonth) {
        groups.month.push(reading);
      } else if (readingDate >= startOfYear) {
        groups.year.push(reading);
      } else {
        groups.older.push(reading);
      }
    });

    return groups;
  }, [readings]);

  const toggleSection = (section: TimePeriod) => {
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

  const sections: {
    id: TimePeriod;
    labelEn: string;
    labelFr: string;
    icon: React.ReactNode;
    readings: ReadingData[];
  }[] = [
    {
      id: 'today',
      labelEn: 'Today',
      labelFr: "Aujourd'hui",
      icon: <Clock className="w-4 h-4" />,
      readings: groupedReadings.today,
    },
    {
      id: 'week',
      labelEn: 'This Week',
      labelFr: 'Cette semaine',
      icon: <Calendar className="w-4 h-4" />,
      readings: groupedReadings.week,
    },
    {
      id: 'month',
      labelEn: 'This Month',
      labelFr: 'Ce mois',
      icon: <CalendarDays className="w-4 h-4" />,
      readings: groupedReadings.month,
    },
    {
      id: 'year',
      labelEn: 'This Year',
      labelFr: 'Cette ann\u00e9e',
      icon: <CalendarRange className="w-4 h-4" />,
      readings: groupedReadings.year,
    },
    {
      id: 'all',
      labelEn: 'Older',
      labelFr: 'Plus ancien',
      icon: <History className="w-4 h-4" />,
      readings: groupedReadings.older,
    },
  ];

  // Filter out empty sections
  const nonEmptySections = sections.filter((section) => section.readings.length > 0);

  if (readings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {nonEmptySections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const count = section.readings.length;

        return (
          <div
            key={section.id}
            className="bg-slate-800/30 rounded-xl border border-slate-700/40 overflow-hidden"
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                  {section.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-base font-medium text-white">
                    {language === 'en' ? section.labelEn : section.labelFr}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {count} {count === 1
                      ? t('profile.ReadingHistoryAccordion.reading', 'reading')
                      : t('profile.ReadingHistoryAccordion.readings', 'readings')}
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

            {/* Accordion Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-700/30 pt-3">
                    {section.readings.map((reading) => (
                      <ReadingHistoryCard
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
      })}
    </div>
  );
};

export default ReadingHistoryAccordion;
