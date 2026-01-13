import React from 'react';
import { Search, Filter, ArrowUpDown, X, Calendar } from 'lucide-react';
import { SpreadType } from '../../types';
import { SPREADS } from '../../constants';
import { useApp } from '../../context/AppContext';
import { type DateRangeOption } from '../../utils/dateFilters';

export type SortOption = 'newest' | 'oldest';
export type { DateRangeOption };

interface ReadingFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    spreadFilter: SpreadType | 'all';
    onSpreadFilterChange: (spread: SpreadType | 'all') => void;
    sortOrder: SortOption;
    onSortChange: (sort: SortOption) => void;
    dateRange: DateRangeOption;
    onDateRangeChange: (range: DateRangeOption) => void;
    resultCount: number;
    totalCount: number;
}

const ReadingFilters: React.FC<ReadingFiltersProps> = ({
    searchQuery,
    onSearchChange,
    spreadFilter,
    onSpreadFilterChange,
    sortOrder,
    onSortChange,
    dateRange,
    onDateRangeChange,
    resultCount,
    totalCount,
}) => {
    const { t, language } = useApp();
    const spreadOptions = Object.entries(SPREADS).map(([key, spread]) => ({
        value: key as SpreadType,
        label: language === 'en' ? spread.nameEn : spread.nameFr,
    }));

    const dateRangeOptions: { value: DateRangeOption; labelEn: string; labelFr: string }[] = [
        { value: 'all', labelEn: 'All Time', labelFr: 'Tout' },
        { value: 'today', labelEn: 'Today', labelFr: "Aujourd'hui" },
        { value: 'week', labelEn: 'This Week', labelFr: 'Cette semaine' },
        { value: 'month', labelEn: 'This Month', labelFr: 'Ce mois' },
    ];

    const hasActiveFilters = searchQuery || spreadFilter !== 'all' || dateRange !== 'all';

    const clearFilters = () => {
        onSearchChange('');
        onSpreadFilterChange('all');
        onDateRangeChange('all');
    };

    return (
        <div className="space-y-3">
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t('profile.ReadingFilters.search_by_question', 'Search by question...')}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg
                                   text-sm text-slate-200 placeholder-slate-500
                                   focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25
                                   transition-colors duration-200"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Spread Type Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <select
                        value={spreadFilter}
                        onChange={(e) => onSpreadFilterChange(e.target.value as SpreadType | 'all')}
                        className="appearance-none pl-10 pr-8 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg
                                   text-sm text-slate-200 cursor-pointer min-w-[160px]
                                   focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25
                                   transition-colors duration-200"
                    >
                        <option value="all">{t('profile.ReadingFilters.all_spreads', 'All Spreads')}</option>
                        {spreadOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Sort Order */}
                <button
                    onClick={() => onSortChange(sortOrder === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50
                               rounded-lg text-sm text-slate-300 hover:bg-slate-700/60 hover:border-slate-600/50
                               transition-colors duration-200 min-w-[120px]"
                >
                    <ArrowUpDown className="w-4 h-4" />
                    <span>{sortOrder === 'newest'
                        ? t('profile.ReadingFilters.newest', 'Newest')
                        : t('profile.ReadingFilters.oldest', 'Oldest')
                    }</span>
                </button>
            </div>

            {/* Date Range Quick Filters */}
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {t('profile.ReadingFilters.date_range', 'Date Range')}
                </p>
                <div className="flex flex-wrap gap-2">
                    {dateRangeOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onDateRangeChange(option.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                dateRange === option.value
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
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
                            {t('profile.ReadingFilters.showing_count', `Showing ${resultCount} of ${totalCount} readings`)}
                        </>
                    ) : (
                        <>
                            {totalCount} {t('profile.ReadingFilters.readings', 'readings')}
                        </>
                    )}
                </span>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                    >
                        <X className="w-3.5 h-3.5" />
                        {t('profile.ReadingFilters.clear_filters', 'Clear filters')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ReadingFilters;
