import React from 'react';
import { TaxonomySelectorProps } from './types';

const TaxonomySelector: React.FC<TaxonomySelectorProps> = ({
  items,
  selectedIds = [],
  selectedNames = [],
  onChange,
  onChangeNames,
  useNames = false,
  language,
  emptyMessage,
}) => {
  const handleToggle = (item: { id: string; name?: string; nameEn?: string; nameFr?: string }) => {
    if (useNames && onChangeNames) {
      const name = item.name || item.nameEn || '';
      const isSelected = selectedNames.includes(name);
      const updated = isSelected
        ? selectedNames.filter((n) => n !== name)
        : [...selectedNames, name];
      onChangeNames(updated);
    } else {
      const isSelected = selectedIds.includes(item.id);
      const updated = isSelected
        ? selectedIds.filter((id) => id !== item.id)
        : [...selectedIds, item.id];
      onChange(updated);
    }
  };

  const isItemSelected = (item: { id: string; name?: string; nameEn?: string }) => {
    if (useNames) {
      const name = item.name || item.nameEn || '';
      return selectedNames.includes(name);
    }
    return selectedIds.includes(item.id);
  };

  const getDisplayName = (item: { name?: string; nameEn?: string; nameFr?: string }) => {
    if (item.name) return item.name;
    return language === 'en' ? item.nameEn : item.nameFr;
  };

  if (items.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        {emptyMessage || (language === 'en' ? 'None available' : 'Aucun disponible')}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleToggle(item)}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            isItemSelected(item)
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {getDisplayName(item)}
        </button>
      ))}
    </div>
  );
};

export default TaxonomySelector;
