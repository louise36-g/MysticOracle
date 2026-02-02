# UserProfile History Sections - Rebuild Plan

## Overview

Complete replacement of the Reading History and Credit History sections. This is a clean wipe - no patching, no legacy code remaining.

---

## Target Design

### Reading History
- **Filter:** Single dropdown (All | Single | 3-Card | 5-Card | Horseshoe | Celtic Cross | Birth Cards)
- **Display:** Accordion with two sections:
  - "This Month" - current month's readings (newest first)
  - "All" - older readings grouped by month (January 2026, December 2025, etc.)

### Credit History
- **Filter:** Type buttons (All | Purchases | Bonuses | Readings)
- **Display:** Accordion with two sections:
  - "This Month" - current month's transactions (newest first)
  - "All" - older transactions grouped by month
- **Keep:** Summary stats (Purchased, Earned, Spent)

---

## Complete File Change Summary

### Files to DELETE (6 files)

| File | Reason |
|------|--------|
| `components/profile/ReadingFilters.tsx` | Replaced by ReadingTypeFilter |
| `components/profile/UnifiedHistoryAccordion.tsx` | Replaced by MonthlyReadingAccordion |
| `components/profile/TransactionHistoryAccordion.tsx` | Replaced by MonthlyTransactionAccordion |
| `components/profile/ReadingHistoryAccordion.tsx` | **LEGACY** - exported but never used |
| `components/profile/ReadingHistoryCard.tsx` | **LEGACY** - exported but never used |
| `utils/dateFilters.ts` | No longer needed |

### Files to CREATE (3 files)

| File | Purpose |
|------|---------|
| `components/profile/ReadingTypeFilter.tsx` | Single dropdown: All, Single, 3-Card, 5-Card, Horseshoe, Celtic Cross, Birth Cards |
| `components/profile/MonthlyReadingAccordion.tsx` | "This Month" + "All" grouped by month |
| `components/profile/MonthlyTransactionAccordion.tsx` | "This Month" + "All" grouped by month |

### Files to MODIFY (3 files)

| File | Changes |
|------|---------|
| `components/profile/TransactionFilters.tsx` | Remove date range filter, keep type filter only |
| `components/profile/index.ts` | Remove old exports, add new exports |
| `components/UserProfile.tsx` | Use new components, remove old state variables |

### Files to KEEP (6 files - unchanged)

| File | Reason |
|------|--------|
| `components/profile/UnifiedHistoryCard.tsx` | Displays individual readings - reused |
| `components/profile/TransactionItem.tsx` | Displays individual transactions - reused |
| `components/profile/AchievementCard.tsx` | Not related to history |
| `components/profile/EmptyState.tsx` | Reusable empty state component |
| `components/profile/ProfileHeader.tsx` | Not related to history |
| `components/profile/ReferralSection.tsx` | Not related to history |

---

## Implementation Phases

### Phase 1: Create New Components

#### 1.1 Create `ReadingTypeFilter.tsx`

```typescript
// components/profile/ReadingTypeFilter.tsx
import React from 'react';
import { Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ReadingFilterType =
  | 'all'
  | 'single'
  | 'three_card'
  | 'five_card'
  | 'horseshoe'
  | 'celtic_cross'
  | 'birth_cards';

interface ReadingTypeFilterProps {
  value: ReadingFilterType;
  onChange: (value: ReadingFilterType) => void;
}

const ReadingTypeFilter: React.FC<ReadingTypeFilterProps> = ({ value, onChange }) => {
  const { t, language } = useApp();

  const options: { value: ReadingFilterType; labelEn: string; labelFr: string }[] = [
    { value: 'all', labelEn: 'All Readings', labelFr: 'Toutes les lectures' },
    { value: 'single', labelEn: 'Single Card', labelFr: 'Carte unique' },
    { value: 'three_card', labelEn: '3-Card', labelFr: '3 cartes' },
    { value: 'five_card', labelEn: '5-Card', labelFr: '5 cartes' },
    { value: 'horseshoe', labelEn: 'Horseshoe', labelFr: 'Fer à cheval' },
    { value: 'celtic_cross', labelEn: 'Celtic Cross', labelFr: 'Croix celtique' },
    { value: 'birth_cards', labelEn: 'Birth Cards', labelFr: 'Cartes de naissance' },
  ];

  return (
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ReadingFilterType)}
        className="appearance-none pl-10 pr-8 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg
                   text-sm text-slate-200 cursor-pointer min-w-[180px]
                   focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25
                   transition-colors duration-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {language === 'en' ? option.labelEn : option.labelFr}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default ReadingTypeFilter;
```

#### 1.2 Create `MonthlyReadingAccordion.tsx`

```typescript
// components/profile/MonthlyReadingAccordion.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, History } from 'lucide-react';
import { UnifiedReadingData } from '../../services/api';
import { useApp } from '../../context/AppContext';
import UnifiedHistoryCard from './UnifiedHistoryCard';

interface MonthlyReadingAccordionProps {
  readings: UnifiedReadingData[];
  expandedReading: string | null;
  onToggleReading: (id: string) => void;
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
}) => {
  const { t, language } = useApp();
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
      .map(([key, readings]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const label = date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
          month: 'long',
          year: 'numeric',
        });
        return { key, label, readings };
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
        language === 'en' ? 'This Month' : 'Ce mois-ci',
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
                  {language === 'en' ? 'All' : 'Tout'}
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
```

#### 1.3 Create `MonthlyTransactionAccordion.tsx`

```typescript
// components/profile/MonthlyTransactionAccordion.tsx
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
```

### Phase 2: Modify Existing Files

#### 2.1 Simplify `TransactionFilters.tsx`

Remove date range filter, keep only type filter buttons.

```typescript
// components/profile/TransactionFilters.tsx
import React from 'react';
import { Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type TransactionTypeFilter = 'all' | 'purchases' | 'bonuses' | 'readings';

interface TransactionFiltersProps {
  typeFilter: TransactionTypeFilter;
  onTypeFilterChange: (type: TransactionTypeFilter) => void;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  typeFilter,
  onTypeFilterChange,
}) => {
  const { t } = useApp();

  const typeOptions: { value: TransactionTypeFilter; labelKey: string; fallback: string }[] = [
    { value: 'all', labelKey: 'filter.all', fallback: 'All' },
    { value: 'purchases', labelKey: 'filter.purchases', fallback: 'Purchases' },
    { value: 'bonuses', labelKey: 'filter.bonuses', fallback: 'Bonuses' },
    { value: 'readings', labelKey: 'filter.readings', fallback: 'Readings' },
  ];

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5" />
        {t('filter.type', 'Type')}
      </p>
      <div className="flex flex-wrap gap-2">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onTypeFilterChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              typeFilter === option.value
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600/50'
            }`}
          >
            {t(option.labelKey, option.fallback)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransactionFilters;
```

#### 2.2 Update `index.ts`

```typescript
// components/profile/index.ts
export { default as ReadingTypeFilter } from './ReadingTypeFilter';
export type { ReadingFilterType } from './ReadingTypeFilter';
export { default as MonthlyReadingAccordion } from './MonthlyReadingAccordion';
export { default as MonthlyTransactionAccordion } from './MonthlyTransactionAccordion';
export { default as UnifiedHistoryCard } from './UnifiedHistoryCard';
export { default as AchievementCard } from './AchievementCard';
export { default as TransactionItem } from './TransactionItem';
export { default as TransactionFilters } from './TransactionFilters';
export type { TransactionTypeFilter } from './TransactionFilters';
export { default as EmptyState } from './EmptyState';
export { ProfileHeader } from './ProfileHeader';
export { ReferralSection } from './ReferralSection';
```

#### 2.3 Update `UserProfile.tsx`

**Remove these imports:**
```typescript
// REMOVE
import { filterByDateRange, type DateRangeOption } from '../utils/dateFilters';
```

**Update profile imports:**
```typescript
// CHANGE FROM
import { ReadingFilters, AchievementCard, TransactionFilters, TransactionHistoryAccordion, EmptyState, SortOption, TransactionTypeFilter, UnifiedHistoryAccordion } from './profile';

// CHANGE TO
import { ReadingTypeFilter, ReadingFilterType, AchievementCard, TransactionFilters, TransactionTypeFilter, MonthlyReadingAccordion, MonthlyTransactionAccordion, EmptyState } from './profile';
```

**Remove these state variables:**
```typescript
// REMOVE
const [searchQuery, setSearchQuery] = useState('');
const [sortOrder, setSortOrder] = useState<SortOption>('newest');
const [dateRange, setDateRange] = useState<DateRangeOption>('all');
const [transactionDateRange, setTransactionDateRange] = useState<DateRangeOption>('all');
```

**Change spread filter state:**
```typescript
// CHANGE FROM
const [spreadFilter, setSpreadFilter] = useState<SpreadType | 'all'>('all');

// CHANGE TO
const [readingTypeFilter, setReadingTypeFilter] = useState<ReadingFilterType>('all');
```

**Update filtering logic:**
```typescript
// REPLACE the entire filteredReadings useMemo with:
const filteredReadings = useMemo(() => {
  if (!backendReadings || backendReadings.length === 0) return [];

  if (readingTypeFilter === 'all') {
    return backendReadings;
  }

  if (readingTypeFilter === 'birth_cards') {
    return backendReadings.filter(r =>
      r.readingType === 'birth_synthesis' ||
      r.readingType === 'personal_year' ||
      r.readingType === 'threshold'
    );
  }

  // Filter to specific tarot spread type
  return backendReadings.filter(r =>
    r.readingType === 'tarot' &&
    r.spreadType?.toLowerCase() === readingTypeFilter
  );
}, [backendReadings, readingTypeFilter]);
```

**Simplify transaction filtering:**
```typescript
// REPLACE the entire filteredTransactions useMemo with:
const filteredTransactions = useMemo(() => {
  if (!transactions || transactions.length === 0) return [];

  if (transactionTypeFilter === 'all') return transactions;

  if (transactionTypeFilter === 'purchases') {
    return transactions.filter(t => t.type === 'PURCHASE');
  }
  if (transactionTypeFilter === 'bonuses') {
    return transactions.filter(t =>
      ['DAILY_BONUS', 'ACHIEVEMENT', 'REFERRAL_BONUS', 'REFUND'].includes(t.type)
    );
  }
  if (transactionTypeFilter === 'readings') {
    return transactions.filter(t => ['READING', 'QUESTION'].includes(t.type));
  }

  return transactions;
}, [transactions, transactionTypeFilter]);
```

**Remove helper functions:**
```typescript
// REMOVE these functions entirely
const searchMatchesReading = ...
const sortReadings = ...
```

**Update JSX - Reading History section:**
```tsx
{/* Reading History */}
<motion.section ...>
  <h2 className="text-lg font-heading text-purple-100 mb-5 flex items-center gap-2">
    <History className="w-5 h-5 text-purple-400" />
    {t('UserProfile.tsx.UserProfile.reading_history', 'Reading History')}
  </h2>

  {/* Filter */}
  <div className="mb-5">
    <ReadingTypeFilter
      value={readingTypeFilter}
      onChange={setReadingTypeFilter}
    />
  </div>

  {/* Reading List */}
  {isLoadingReadings ? (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      <span className="ml-3 text-slate-400">{t('UserProfile.tsx.UserProfile.loading', 'Loading...')}</span>
    </div>
  ) : readingsError ? (
    <p className="text-red-400 text-center py-12">{readingsError}</p>
  ) : filteredReadings.length === 0 ? (
    <EmptyState
      type={backendReadings.length === 0 ? 'readings' : 'filtered'}
      onAction={backendReadings.length === 0 ? undefined : () => setReadingTypeFilter('all')}
    />
  ) : (
    <div className="max-h-[700px] overflow-y-auto pr-1">
      <MonthlyReadingAccordion
        readings={filteredReadings}
        expandedReading={expandedReading}
        onToggleReading={(id) => setExpandedReading(expandedReading === id ? null : id)}
      />
    </div>
  )}
</motion.section>
```

**Update JSX - Credit History section:**
```tsx
{/* Credit History */}
<motion.section ...>
  <h2 className="text-lg font-heading text-purple-100 mb-5 flex items-center gap-2">
    <CreditCard className="w-5 h-5 text-green-400" />
    {t('UserProfile.tsx.UserProfile.credit_history', 'Credit History')}
  </h2>

  {/* Low Credits Warning - KEEP AS IS */}
  ...

  {/* Filters */}
  {transactions && transactions.length > 0 && (
    <div className="mb-5">
      <TransactionFilters
        typeFilter={transactionTypeFilter}
        onTypeFilterChange={setTransactionTypeFilter}
      />
    </div>
  )}

  {/* Summary - KEEP AS IS */}
  ...

  {/* Transaction List */}
  {isLoadingTransactions ? (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      <span className="ml-3 text-slate-400">{t('UserProfile.tsx.UserProfile.loading_2', 'Loading...')}</span>
    </div>
  ) : !transactions || transactions.length === 0 ? (
    <EmptyState type="transactions" />
  ) : filteredTransactions.length === 0 ? (
    <EmptyState
      type="filtered"
      onAction={() => setTransactionTypeFilter('all')}
    />
  ) : (
    <div className="max-h-[500px] overflow-y-auto pr-1">
      <MonthlyTransactionAccordion transactions={filteredTransactions} />
    </div>
  )}
</motion.section>
```

### Phase 3: Delete Old Files

After all modifications are complete and tested:

```bash
# Delete old components
rm components/profile/ReadingFilters.tsx
rm components/profile/UnifiedHistoryAccordion.tsx
rm components/profile/TransactionHistoryAccordion.tsx
rm components/profile/ReadingHistoryAccordion.tsx
rm components/profile/ReadingHistoryCard.tsx

# Delete old utility
rm utils/dateFilters.ts
```

---

## Testing Checklist

### Reading History
- [ ] Dropdown shows all 7 options (All, Single, 3-Card, 5-Card, Horseshoe, Celtic Cross, Birth Cards)
- [ ] "All Readings" shows all reading types
- [ ] "Single Card" filters correctly
- [ ] "3-Card" filters correctly
- [ ] "5-Card" filters correctly
- [ ] "Horseshoe" filters correctly
- [ ] "Celtic Cross" filters correctly
- [ ] "Birth Cards" shows birth_synthesis, personal_year, threshold readings
- [ ] "This Month" accordion shows current month's readings
- [ ] "All" accordion shows older readings grouped by month (e.g., "January 2026", "December 2025")
- [ ] Readings sorted newest first within each group
- [ ] Empty state when no readings
- [ ] Empty state when filter has no matches

### Credit History
- [ ] Type filter buttons work (All, Purchases, Bonuses, Readings)
- [ ] "This Month" accordion shows current month's transactions
- [ ] "All" accordion shows older transactions grouped by month
- [ ] Net credit badges show correct +/- amounts
- [ ] Summary stats (Purchased, Earned, Spent) display correctly
- [ ] Transactions sorted newest first
- [ ] Empty state when no transactions

### Edge Cases
- [ ] New user with no data - empty states display
- [ ] User with only current month data - "All" section hidden
- [ ] User with only old data - "This Month" section hidden
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No console errors in browser

---

## Implementation Order

1. Create `ReadingTypeFilter.tsx`
2. Create `MonthlyReadingAccordion.tsx`
3. Create `MonthlyTransactionAccordion.tsx`
4. Modify `TransactionFilters.tsx`
5. Update `components/profile/index.ts`
6. Update `UserProfile.tsx`
7. Test everything works
8. Delete old files
9. Final test
