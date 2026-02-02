import React from 'react';
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
  const { language } = useApp();

  const options: { value: ReadingFilterType; labelEn: string; labelFr: string }[] = [
    { value: 'single', labelEn: 'Single Card', labelFr: 'Carte unique' },
    { value: 'three_card', labelEn: '3-Card', labelFr: '3 cartes' },
    { value: 'five_card', labelEn: '5-Card', labelFr: '5 cartes' },
    { value: 'horseshoe', labelEn: 'Horseshoe', labelFr: 'Fer à cheval' },
    { value: 'celtic_cross', labelEn: 'Celtic Cross', labelFr: 'Croix celtique' },
    { value: 'birth_cards', labelEn: 'Birth Cards', labelFr: 'Cartes de naissance' },
    { value: 'all', labelEn: 'All Readings', labelFr: 'Toutes les lectures' },
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
