import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Clock, CalendarDays, CalendarRange, History } from 'lucide-react';
import { Transaction } from '../../services/api';
import { useApp } from '../../context/AppContext';
import TransactionItem from './TransactionItem';

type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all';

interface TransactionHistoryAccordionProps {
  transactions: Transaction[];
}

interface GroupedTransactions {
  today: Transaction[];
  week: Transaction[];
  month: Transaction[];
  year: Transaction[];
  older: Transaction[];
}

const TransactionHistoryAccordion: React.FC<TransactionHistoryAccordionProps> = ({
  transactions,
}) => {
  const { t, language } = useApp();
  const [expandedSections, setExpandedSections] = useState<Set<TimePeriod>>(new Set());

  // Group transactions by time period
  const groupedTransactions = useMemo(() => {
    const groups: GroupedTransactions = {
      today: [],
      week: [],
      month: [],
      year: [],
      older: [],
    };

    if (!transactions || transactions.length === 0) {
      return groups;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    transactions.forEach((transaction) => {
      if (!transaction || !transaction.createdAt) {
        groups.older.push(transaction);
        return;
      }

      const transactionDate = new Date(transaction.createdAt);

      if (isNaN(transactionDate.getTime())) {
        groups.older.push(transaction);
        return;
      }

      if (transactionDate >= startOfToday) {
        groups.today.push(transaction);
      } else if (transactionDate >= startOfWeek) {
        groups.week.push(transaction);
      } else if (transactionDate >= startOfMonth) {
        groups.month.push(transaction);
      } else if (transactionDate >= startOfYear) {
        groups.year.push(transaction);
      } else {
        groups.older.push(transaction);
      }
    });

    return groups;
  }, [transactions]);

  const sections: {
    id: TimePeriod;
    labelEn: string;
    labelFr: string;
    icon: React.ReactNode;
    transactions: Transaction[];
  }[] = [
    {
      id: 'today',
      labelEn: 'Today',
      labelFr: "Aujourd'hui",
      icon: <Clock className="w-4 h-4" />,
      transactions: groupedTransactions.today,
    },
    {
      id: 'week',
      labelEn: 'This Week',
      labelFr: 'Cette semaine',
      icon: <Calendar className="w-4 h-4" />,
      transactions: groupedTransactions.week,
    },
    {
      id: 'month',
      labelEn: 'This Month',
      labelFr: 'Ce mois',
      icon: <CalendarDays className="w-4 h-4" />,
      transactions: groupedTransactions.month,
    },
    {
      id: 'year',
      labelEn: 'This Year',
      labelFr: 'Cette année',
      icon: <CalendarRange className="w-4 h-4" />,
      transactions: groupedTransactions.year,
    },
    {
      id: 'all',
      labelEn: 'All',
      labelFr: 'Tout',
      icon: <History className="w-4 h-4" />,
      transactions: groupedTransactions.older,
    },
  ];

  // Filter out empty sections
  const nonEmptySections = sections.filter((section) => section.transactions.length > 0);

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

  if (!transactions || transactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {nonEmptySections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const count = section.transactions.length;

        // Calculate net credits for this section
        const netCredits = section.transactions.reduce((sum, t) => sum + t.amount, 0);

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
                <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                  {section.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-base font-medium text-white">
                    {language === 'en' ? section.labelEn : section.labelFr}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {count} {count === 1
                      ? t('profile.TransactionHistoryAccordion.transaction', 'transaction')
                      : t('profile.TransactionHistoryAccordion.transactions', 'transactions')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Net credits badge */}
                <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${
                  netCredits >= 0
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {netCredits >= 0 ? '+' : ''}{netCredits}
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
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-700/30 pt-3">
                    {section.transactions.map((transaction) => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
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

export default TransactionHistoryAccordion;
