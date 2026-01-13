import React from 'react';
import { Filter, Calendar, X } from 'lucide-react';
import { type DateRangeOption } from '../../utils/dateFilters';

export type TransactionTypeFilter = 'all' | 'purchases' | 'bonuses' | 'readings';

interface TransactionFiltersProps {
    typeFilter: TransactionTypeFilter;
    onTypeFilterChange: (type: TransactionTypeFilter) => void;
    dateRange: DateRangeOption;
    onDateRangeChange: (range: DateRangeOption) => void;
    language: 'en' | 'fr';
    resultCount: number;
    totalCount: number;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
    typeFilter,
    onTypeFilterChange,
    dateRange,
    onDateRangeChange,
    language,
    resultCount,
    totalCount,
}) => {
    const typeOptions: { value: TransactionTypeFilter; labelEn: string; labelFr: string }[] = [
        { value: 'all', labelEn: 'All', labelFr: 'Tout' },
        { value: 'purchases', labelEn: 'Purchases', labelFr: 'Achats' },
        { value: 'bonuses', labelEn: 'Bonuses', labelFr: 'Bonus' },
        { value: 'readings', labelEn: 'Readings', labelFr: 'Lectures' },
    ];

    const dateRangeOptions: { value: DateRangeOption; labelEn: string; labelFr: string }[] = [
        { value: 'all', labelEn: 'All Time', labelFr: 'Tout' },
        { value: 'today', labelEn: 'Today', labelFr: "Aujourd'hui" },
        { value: 'week', labelEn: 'This Week', labelFr: 'Cette semaine' },
        { value: 'month', labelEn: 'This Month', labelFr: 'Ce mois' },
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
                    {language === 'en' ? 'Type' : 'Type'}
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
                            {language === 'en' ? option.labelEn : option.labelFr}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Range Quick Filters */}
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {language === 'en' ? 'Date Range' : 'Période'}
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
                            {language === 'en' ? option.labelEn : option.labelFr}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results & Clear Filters */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                    {hasActiveFilters ? (
                        <>
                            {language === 'en'
                                ? `Showing ${resultCount} of ${totalCount} transactions`
                                : `Affichage de ${resultCount} sur ${totalCount} transactions`
                            }
                        </>
                    ) : (
                        <>
                            {totalCount} {language === 'en' ? 'transactions' : 'transactions'}
                        </>
                    )}
                </span>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                    >
                        <X className="w-3.5 h-3.5" />
                        {language === 'en' ? 'Clear filters' : 'Effacer les filtres'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TransactionFilters;
