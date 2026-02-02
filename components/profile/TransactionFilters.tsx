import React from 'react';
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
    <div className="flex flex-wrap gap-1.5">
      {typeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onTypeFilterChange(option.value)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
            typeFilter === option.value
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700/60 hover:text-slate-300'
          }`}
        >
          {t(option.labelKey, option.fallback)}
        </button>
      ))}
    </div>
  );
};

export default TransactionFilters;
