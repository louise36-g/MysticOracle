import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, History } from 'lucide-react';
import { Transaction } from '../../services/api';
import { useApp } from '../../context/AppContext';
import TransactionItem from './TransactionItem';

interface MonthlyTransactionAccordionProps {
  transactions: Transaction[];
}

interface MonthGroup {
  key: string;
  label: string;
  transactions: Transaction[];
  netCredits: number;
}

const MonthlyTransactionAccordion: React.FC<MonthlyTransactionAccordionProps> = ({
  transactions,
}) => {
  const { t, language } = useApp();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['this-month']));

  const { thisMonth, thisMonthNet, olderByMonth } = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const thisMonthTxns: Transaction[] = [];
    const olderTxns: Map<string, Transaction[]> = new Map();

    const sorted = [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sorted.forEach((txn) => {
      const date = new Date(txn.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthKey === currentMonthKey) {
        thisMonthTxns.push(txn);
      } else {
        if (!olderTxns.has(monthKey)) {
          olderTxns.set(monthKey, []);
        }
        olderTxns.get(monthKey)!.push(txn);
      }
    });

    const thisMonthNetCredits = thisMonthTxns.reduce((sum, t) => sum + t.amount, 0);

    const olderGroups: MonthGroup[] = Array.from(olderTxns.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, txns]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const label = date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
          month: 'long',
          year: 'numeric',
        });
        const netCredits = txns.reduce((sum, t) => sum + t.amount, 0);
        return { key, label, transactions: txns, netCredits };
      });

    return { thisMonth: thisMonthTxns, thisMonthNet: thisMonthNetCredits, olderByMonth: olderGroups };
  }, [transactions, language]);

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

  if (!transactions || transactions.length === 0) {
    return null;
  }

  const renderNetBadge = (netCredits: number) => (
    <span className={`px-2.5 py-1 text-sm font-medium rounded-full ${
      netCredits >= 0
        ? 'bg-green-500/20 text-green-300'
        : 'bg-red-500/20 text-red-300'
    }`}>
      {netCredits >= 0 ? '+' : ''}{netCredits}
    </span>
  );

  return (
    <div className="space-y-3">
      {/* This Month Section */}
      {thisMonth.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/40 overflow-hidden">
          <button
            onClick={() => toggleSection('this-month')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-medium text-white">
                  {language === 'en' ? 'This Month' : 'Ce mois-ci'}
                </h3>
                <p className="text-xs text-slate-500">
                  {thisMonth.length} {thisMonth.length === 1
                    ? t('profile.history.transaction', 'transaction')
                    : t('profile.history.transactions', 'transactions')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {renderNetBadge(thisMonthNet)}
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  expandedSections.has('this-month') ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          <AnimatePresence>
            {expandedSections.has('this-month') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 pb-4 space-y-2 border-t border-slate-700/30 pt-3">
                  {thisMonth.map((transaction) => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* All (Older) Section */}
      {olderByMonth.length > 0 && (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/40 overflow-hidden">
          <button
            onClick={() => toggleSection('all')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                <History className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-medium text-white">
                  {language === 'en' ? 'All' : 'Tout'}
                </h3>
                <p className="text-xs text-slate-500">
                  {olderByMonth.reduce((sum, g) => sum + g.transactions.length, 0)}{' '}
                  {t('profile.history.transactions', 'transactions')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {renderNetBadge(olderByMonth.reduce((sum, g) => sum + g.netCredits, 0))}
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
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-400 capitalize">
                          {group.label}
                        </h4>
                        {renderNetBadge(group.netCredits)}
                      </div>
                      <div className="space-y-2">
                        {group.transactions.map((transaction) => (
                          <TransactionItem key={transaction.id} transaction={transaction} />
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

export default MonthlyTransactionAccordion;
