import React from 'react';
import { useApp } from '../../context/AppContext';

export type ReadingFilterType =
  | 'all'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month';

interface ReadingTypeFilterProps {
  value: ReadingFilterType;
  onChange: (value: ReadingFilterType) => void;
}

const ReadingTypeFilter: React.FC<ReadingTypeFilterProps> = ({ value, onChange }) => {
  const { language } = useApp();

  const options: { value: ReadingFilterType; labelEn: string; labelFr: string }[] = [
    { value: 'all', labelEn: 'All Readings', labelFr: 'Toutes' },
    { value: 'this_week', labelEn: 'This Week', labelFr: 'Cette semaine' },
    { value: 'last_week', labelEn: 'Last Week', labelFr: 'Semaine dernière' },
    { value: 'this_month', labelEn: 'This Month', labelFr: 'Ce mois' },
    { value: 'last_month', labelEn: 'Last Month', labelFr: 'Mois dernier' },
  ];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ReadingFilterType)}
        className="appearance-none pl-3 pr-7 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-md
                   text-xs text-slate-200 cursor-pointer
                   focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25
                   transition-colors duration-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {language === 'en' ? option.labelEn : option.labelFr}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default ReadingTypeFilter;
