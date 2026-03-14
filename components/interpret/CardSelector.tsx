import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { MAJOR_ARCANA, MINOR_ARCANA, FULL_DECK } from '../../constants';
import { TarotCard } from '../../types';
import { useApp } from '../../context/AppContext';
import Card from '../Card';

interface SelectedCard {
  card: TarotCard;
  isReversed: boolean;
}

interface CardSelectorProps {
  /** Maximum number of cards the user can select */
  maxCards: number;
  /** Currently selected cards */
  selectedCards: SelectedCard[];
  /** Callback when cards change */
  onCardsChange: (cards: SelectedCard[]) => void;
  /** Position labels for selected cards */
  positionLabels?: string[];
}

type SuitFilter = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

const SUIT_FILTERS: { id: SuitFilter; labelEn: string; labelFr: string; count: number }[] = [
  { id: 'major', labelEn: 'Major Arcana', labelFr: 'Arcanes Majeurs', count: 22 },
  { id: 'wands', labelEn: 'Wands', labelFr: 'Bâtons', count: 14 },
  { id: 'cups', labelEn: 'Cups', labelFr: 'Coupes', count: 14 },
  { id: 'swords', labelEn: 'Swords', labelFr: 'Épées', count: 14 },
  { id: 'pentacles', labelEn: 'Pentacles', labelFr: 'Deniers', count: 14 },
];

const CardSelector: React.FC<CardSelectorProps> = ({
  maxCards,
  selectedCards,
  onCardsChange,
  positionLabels,
}) => {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSuit, setActiveSuit] = useState<SuitFilter | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when search mode opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Get cards for the active suit filter
  const filteredCards = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return FULL_DECK.filter(card => {
        const name = language === 'fr' ? card.nameFr : card.nameEn;
        return name.toLowerCase().includes(query);
      });
    }

    if (!activeSuit) return [];

    switch (activeSuit) {
      case 'major':
        return MAJOR_ARCANA;
      case 'wands':
        return MINOR_ARCANA.filter(c => c.nameEn.includes('Wands'));
      case 'cups':
        return MINOR_ARCANA.filter(c => c.nameEn.includes('Cups'));
      case 'swords':
        return MINOR_ARCANA.filter(c => c.nameEn.includes('Swords'));
      case 'pentacles':
        return MINOR_ARCANA.filter(c => c.nameEn.includes('Pentacles'));
    }
  }, [activeSuit, searchQuery, language]);

  const selectedCardIds = useMemo(
    () => new Set(selectedCards.map(sc => sc.card.id)),
    [selectedCards]
  );

  const handleSelectCard = useCallback((card: TarotCard) => {
    if (selectedCardIds.has(card.id)) {
      // Deselect
      onCardsChange(selectedCards.filter(sc => sc.card.id !== card.id));
    } else if (selectedCards.length < maxCards) {
      // Select upright by default
      onCardsChange([...selectedCards, { card, isReversed: false }]);
    }
  }, [selectedCardIds, selectedCards, maxCards, onCardsChange]);

  const handleToggleReversed = useCallback((index: number) => {
    const updated = [...selectedCards];
    updated[index] = { ...updated[index], isReversed: !updated[index].isReversed };
    onCardsChange(updated);
  }, [selectedCards, onCardsChange]);

  const handleRemoveCard = useCallback((index: number) => {
    onCardsChange(selectedCards.filter((_, i) => i !== index));
  }, [selectedCards, onCardsChange]);

  const handleSuitClick = useCallback((suit: SuitFilter) => {
    setActiveSuit(prev => prev === suit ? null : suit);
    setSearchQuery('');
    setShowSearch(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Selected Cards Display */}
      {selectedCards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            {language === 'fr' ? 'Cartes sélectionnées' : 'Selected Cards'}
            {' '}({selectedCards.length}/{maxCards})
          </h3>
          <div className="flex flex-wrap gap-3">
            {selectedCards.map((sc, index) => (
              <motion.div
                key={sc.card.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <div className={`
                  bg-slate-800/80 border rounded-xl p-3 flex items-center gap-3
                  ${sc.isReversed ? 'border-amber-500/40' : 'border-purple-500/40'}
                `}>
                  {/* Position label */}
                  {positionLabels && positionLabels[index] && (
                    <span className="text-xs text-purple-400 font-medium absolute -top-2.5 left-3 bg-slate-900 px-2">
                      {positionLabels[index]}
                    </span>
                  )}

                  {/* Card mini preview */}
                  <div className={`w-10 h-14 flex-shrink-0 ${sc.isReversed ? 'rotate-180' : ''}`}>
                    <Card card={sc.card} isRevealed width={40} height={56} hideOverlay />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {language === 'fr' ? sc.card.nameFr : sc.card.nameEn}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sc.isReversed
                        ? (language === 'fr' ? 'Renversée' : 'Reversed')
                        : (language === 'fr' ? 'À l\'endroit' : 'Upright')
                      }
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleReversed(index)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors"
                      title={language === 'fr' ? 'Retourner la carte' : 'Toggle reversed'}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveCard(index)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                      title={language === 'fr' ? 'Retirer' : 'Remove'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Card Selection - only show when more cards can be added */}
      {selectedCards.length < maxCards && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              {language === 'fr'
                ? `Choisissez ${maxCards - selectedCards.length} carte${maxCards - selectedCards.length > 1 ? 's' : ''}`
                : `Choose ${maxCards - selectedCards.length} card${maxCards - selectedCards.length > 1 ? 's' : ''}`
              }
            </h3>

            {/* Search toggle */}
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (!showSearch) {
                  setActiveSuit(null);
                } else {
                  setSearchQuery('');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showSearch
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{language === 'fr' ? 'Rechercher' : 'Search'}</span>
            </button>
          </div>

          {/* Search input */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'fr' ? 'Chercher une carte...' : 'Search for a card...'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suit filter buttons */}
          {!showSearch && (
            <div className="flex flex-wrap gap-2">
              {SUIT_FILTERS.map((suit) => (
                <button
                  key={suit.id}
                  onClick={() => handleSuitClick(suit.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${activeSuit === suit.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 ring-1 ring-purple-500/20'
                      : 'bg-slate-800/60 text-slate-400 border border-white/5 hover:border-white/15 hover:text-white'
                    }
                  `}
                >
                  <span>{language === 'fr' ? suit.labelFr : suit.labelEn}</span>
                  <span className="text-xs opacity-60">({suit.count})</span>
                  {activeSuit === suit.id && (
                    <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Card grid */}
          <AnimatePresence mode="wait">
            {(activeSuit || searchQuery.trim()) && (
              <motion.div
                key={activeSuit || 'search'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2"
              >
                {filteredCards.map((card) => {
                  const isSelected = selectedCardIds.has(card.id);
                  const isDisabled = !isSelected && selectedCards.length >= maxCards;

                  return (
                    <button
                      key={card.id}
                      onClick={() => !isDisabled && handleSelectCard(card)}
                      disabled={isDisabled}
                      className={`
                        relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-center
                        ${isSelected
                          ? 'bg-purple-500/20 border-2 border-purple-500/60 ring-2 ring-purple-500/20'
                          : isDisabled
                            ? 'opacity-30 cursor-not-allowed bg-slate-800/30'
                            : 'bg-slate-800/40 border border-white/5 hover:border-purple-500/30 hover:bg-slate-800/80 cursor-pointer'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center z-10">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="w-full aspect-[2/3] flex items-center justify-center overflow-hidden rounded-lg">
                        <Card card={card} isRevealed width={60} height={90} hideOverlay />
                      </div>
                      <span className="text-[10px] leading-tight text-slate-400 line-clamp-2">
                        {language === 'fr' ? card.nameFr : card.nameEn}
                      </span>
                    </button>
                  );
                })}

                {filteredCards.length === 0 && searchQuery.trim() && (
                  <div className="col-span-full py-8 text-center text-slate-500">
                    {language === 'fr' ? 'Aucune carte trouvée' : 'No cards found'}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompt to select a suit if none selected */}
          {!activeSuit && !showSearch && (
            <div className="py-6 text-center text-slate-500 text-sm">
              {language === 'fr'
                ? 'Sélectionnez un groupe ci-dessus pour parcourir les cartes, ou utilisez la recherche'
                : 'Select a group above to browse cards, or use search'
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CardSelector;
