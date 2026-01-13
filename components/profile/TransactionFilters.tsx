import React from 'react';
import { Filter, Calendar, X } from 'lucide-react';
import { type DateRangeOption } from '../../utils/dateFilters';
import { useApp } from '../../context/AppContext';

export type TransactionTypeFilter = 'all' | 'purchases' | 'bonuses' | 'readings';

interface TransactionFiltersProps {
    typeFilter: TransactionTypeFilter;
    onTypeFilterChange: (type: TransactionTypeFilter) => void;
    dateRange: DateRangeOption;
    onDateRangeChange: (range: DateRangeOption) => void;
    resultCount: number;
    totalCount: number;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
    typeFilter,
    onTypeFilterChange,
    dateRange,
    onDateRangeChange,
    resultCount,
    totalCount,
}) => {
    const { t } = useApp();

    const typeOptions: { value: TransactionTypeFilter; translationKey: string; fallback: string }[] = [
        { value: 'all', translationKey: 'filter.all', fallback: 'All' },
        { value: 'purchases', translationKey: 'filter.purchases', fallback: 'Purchases' },
        { value: 'bonuses', translationKey: 'filter.bonuses', fallback: 'Bonuses' },
        { value: 'readings', translationKey: 'filter.readings', fallback: 'Readings' },
    ];

    const dateRangeOptions: { value: DateRangeOption; translationKey: string; fallback: string }[] = [
        { value: 'all', translationKey: 'filter.all_time', fallback: 'All Time' },
        { value: 'today', translationKey: 'common.today', fallback: 'Today' },
        { value: 'week', translationKey: 'filter.this_week', fallback: 'This Week' },
        { value: 'month', translationKey: 'filter.this_month', fallback: 'This Month' },
    ];

    const hasActiveFilters = typeFilter !== 'all' || dateRange !== 'all';

    const clearFilters = () => {
        onTypeFilterChange('all');
        onDateRangeChange('all');
    };

    return (
        <div className="space-y-3">
            {/* Transaction Type Filter */}
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
                            {t(option.translationKey, option.fallback)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Range Quick Filters */}
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {t('filter.date_range', 'Date Range')}
                </p>
                <div className="flex flex-wrap gap-2">
                    {dateRangeOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onDateRangeChange(option.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                dateRange === option.value
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                                    : 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600/50'
                            }`}
                        >
                            {t(option.translationKey, option.fallback)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results & Clear Filters */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                    {hasActiveFilters ? (
                        t('filter.showing_count', `Showing ${resultCount} of ${totalCount} transactions`)
                            .replace('${resultCount}', resultCount.toString())
                            .replace('${totalCount}', totalCount.toString())
                    ) : (
                        `${totalCount} ${t('filter.transactions', 'transactions')}`
                    )}
                </span>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                    >
                        <X className="w-3.5 h-3.5" />
                        {t('filter.clear_filters', 'Clear filters')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TransactionFilters;
