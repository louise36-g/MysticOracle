import React from 'react';
import { TaxonomyItem, TaxonomySelectorProps } from './types';
import { Star } from 'lucide-react';

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
  const getKey = (item: { id: string; name?: string; nameEn?: string }) =>
    useNames ? (item.name || item.nameEn || '') : item.id;

  const isItemSelected = (item: { id: string; name?: string; nameEn?: string }) => {
    if (useNames) {
      const name = item.name || item.nameEn || '';
      return selectedNames.includes(name);
    }
    return selectedIds.includes(item.id);
  };

  const handleToggle = (item: { id: string; name?: string; nameEn?: string; nameFr?: string }) => {
    if (useNames && onChangeNames) {
      const name = item.name || item.nameEn || '';
      const isSelected = selectedNames.includes(name);
      if (isSelected) {
        // Deselect
        onChangeNames(selectedNames.filter((n) => n !== name));
      } else {
        // Add to end (preserving order)
        onChangeNames([...selectedNames, name]);
      }
    } else {
      const isSelected = selectedIds.includes(item.id);
      if (isSelected) {
        // Deselect
        onChange(selectedIds.filter((id) => id !== item.id));
      } else {
        // Add to end (preserving order)
        onChange([...selectedIds, item.id]);
      }
    }
  };

  const handleMakePrimary = (e: React.MouseEvent, item: { id: string; name?: string; nameEn?: string }) => {
    e.stopPropagation();
    const key = getKey(item);
    if (useNames && onChangeNames) {
      // Move to front
      const rest = selectedNames.filter((n) => n !== key);
      onChangeNames([key, ...rest]);
    } else {
      const rest = selectedIds.filter((id) => id !== item.id);
      onChange([item.id, ...rest]);
    }
  };

  const getDisplayName = (item: { name?: string; nameEn?: string; nameFr?: string }) => {
    if (item.name) return item.name;
    return language === 'en' ? item.nameEn : item.nameFr;
  };

  const isPrimary = (item: { id: string; name?: string; nameEn?: string }) => {
    if (useNames) {
      const name = item.name || item.nameEn || '';
      return selectedNames.length > 0 && selectedNames[0] === name;
    }
    return selectedIds.length > 0 && selectedIds[0] === item.id;
  };

  const selectedCount = useNames ? selectedNames.length : selectedIds.length;

  if (items.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        {emptyMessage || (language === 'en' ? 'None available' : 'Aucun disponible')}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item: TaxonomyItem) => {
        const selected = isItemSelected(item);
        const primary = selected && isPrimary(item);
        const canPromote = selected && !primary && selectedCount > 1;

        return (
          <button
            key={item.id}
            onClick={() => handleToggle(item)}
            className={`px-2 py-1 rounded text-xs transition-colors inline-flex items-center gap-1 ${
              primary
                ? 'bg-amber-600 text-white'
                : selected
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            } ${item.depth ? 'ml-3' : ''}`}
            title={
              primary
                ? (language === 'en' ? 'Primary category (used for navigation)' : 'Catégorie principale (utilisée pour la navigation)')
                : canPromote
                  ? (language === 'en' ? 'Click ★ to make primary' : 'Cliquez ★ pour rendre principale')
                  : undefined
            }
          >
            {primary && <Star className="w-3 h-3 fill-current" />}
            {item.depth ? '— ' : ''}{getDisplayName(item)}
            {canPromote && (
              <span
                onClick={(e) => handleMakePrimary(e, item)}
                className="ml-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                title={language === 'en' ? 'Make primary' : 'Rendre principale'}
              >
                <Star className="w-3 h-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TaxonomySelector;
