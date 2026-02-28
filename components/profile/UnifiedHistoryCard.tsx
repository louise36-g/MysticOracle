import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, BookOpen, Sparkles, Calendar, Sun, Moon, Share2, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SpreadType } from '../../types';
import { SPREADS, FULL_DECK } from '../../constants';
import { UnifiedReadingData } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { formatRelativeDate } from '../../utils/dateFormatters';
import CardThumbnail from './CardThumbnail';
import { ShareBirthCardModal } from '../share';

// Major Arcana names for birth card display
const MAJOR_ARCANA: Record<number, { nameEn: string; nameFr: string }> = {
  0: { nameEn: 'The Fool', nameFr: 'Le Mat' },
  1: { nameEn: 'The Magician', nameFr: 'Le Bateleur' },
  2: { nameEn: 'The High Priestess', nameFr: 'La Papesse' },
  3: { nameEn: 'The Empress', nameFr: "L'Impératrice" },
  4: { nameEn: 'The Emperor', nameFr: "L'Empereur" },
  5: { nameEn: 'The Hierophant', nameFr: 'Le Pape' },
  6: { nameEn: 'The Lovers', nameFr: "L'Amoureux" },
  7: { nameEn: 'The Chariot', nameFr: 'Le Chariot' },
  8: { nameEn: 'Strength', nameFr: 'La Force' },
  9: { nameEn: 'The Hermit', nameFr: "L'Hermite" },
  10: { nameEn: 'Wheel of Fortune', nameFr: 'La Roue de Fortune' },
  11: { nameEn: 'Justice', nameFr: 'La Justice' },
  12: { nameEn: 'The Hanged Man', nameFr: 'Le Pendu' },
  13: { nameEn: 'Death', nameFr: "L'Arcane Sans Nom" },
  14: { nameEn: 'Temperance', nameFr: 'La Tempérance' },
  15: { nameEn: 'The Devil', nameFr: 'Le Diable' },
  16: { nameEn: 'The Tower', nameFr: 'La Maison Dieu' },
  17: { nameEn: 'The Star', nameFr: "L'Étoile" },
  18: { nameEn: 'The Moon', nameFr: 'La Lune' },
  19: { nameEn: 'The Sun', nameFr: 'Le Soleil' },
  20: { nameEn: 'Judgement', nameFr: 'Le Jugement' },
  21: { nameEn: 'The World', nameFr: 'Le Monde' },
};

const MAX_INTERPRETATION_HEIGHT_PX = 300;

interface UnifiedHistoryCardProps {
  reading: UnifiedReadingData;
  isExpanded: boolean;
  onToggle: () => void;
}

// Helper to safely get cards array
const getCardsArray = (cards: unknown): Array<{ cardId: string | number; position: number; isReversed?: boolean }> => {
  if (Array.isArray(cards)) return cards;
  if (typeof cards === 'string') {
    try { return JSON.parse(cards); } catch { return []; }
  }
  if (cards && typeof cards === 'object') return Object.values(cards);
  return [];
};

// Get reading type display info
const getReadingTypeInfo = (
  readingType: UnifiedReadingData['readingType'],
  language: 'en' | 'fr'
): { label: string; icon: React.ReactNode; colorClass: string } => {
  switch (readingType) {
    case 'birth_synthesis':
      return {
        label: language === 'en' ? 'Birth Cards' : 'Cartes de Naissance',
        icon: <Sparkles className="w-4 h-4" />,
        colorClass: 'bg-violet-900/50 text-violet-300',
      };
    case 'personal_year':
      return {
        label: language === 'en' ? 'Year Energy' : 'Énergie Annuelle',
        icon: <Calendar className="w-4 h-4" />,
        colorClass: 'bg-amber-900/50 text-amber-300',
      };
    case 'threshold':
      return {
        label: language === 'en' ? 'Year Threshold' : 'Seuil Annuel',
        icon: <Sun className="w-4 h-4" />,
        colorClass: 'bg-orange-900/50 text-orange-300',
      };
    default:
      return {
        label: language === 'en' ? 'Tarot Reading' : 'Lecture Tarot',
        icon: <Moon className="w-4 h-4" />,
        colorClass: 'bg-purple-900/50 text-purple-300',
      };
  }
};

const UnifiedHistoryCard: React.FC<UnifiedHistoryCardProps> = ({
  reading,
  isExpanded,
  onToggle,
}) => {
  const { t, language } = useApp();
  const lang = language as 'en' | 'fr';
  const typeInfo = getReadingTypeInfo(reading.readingType, lang);

  // Share modal state for birth card readings
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Get the interpretation text based on reading type
  const interpretationContent = useMemo(() => {
    if (reading.readingType === 'tarot') {
      return reading.interpretation || '';
    }
    return lang === 'en' ? (reading.synthesisEn || '') : (reading.synthesisFr || '');
  }, [reading, lang]);

  // Render title based on reading type
  const renderTitle = () => {
    switch (reading.readingType) {
      case 'birth_synthesis': {
        const personalityCard = MAJOR_ARCANA[reading.personalityCardId || 0];
        const soulCard = MAJOR_ARCANA[reading.soulCardId || 0];
        const isUnified = reading.personalityCardId === reading.soulCardId;

        if (isUnified) {
          return lang === 'en'
            ? `Unified Birth Card: ${personalityCard?.nameEn}`
            : `Carte de Naissance Unifiée: ${personalityCard?.nameFr}`;
        }
        return lang === 'en'
          ? `${personalityCard?.nameEn} + ${soulCard?.nameEn}`
          : `${personalityCard?.nameFr} + ${soulCard?.nameFr}`;
      }
      case 'personal_year': {
        const yearCard = MAJOR_ARCANA[reading.personalYearCardId || 0];
        return lang === 'en'
          ? `${reading.year} - Personal Year ${reading.personalYearNumber}: ${yearCard?.nameEn}`
          : `${reading.year} - Année Personnelle ${reading.personalYearNumber}: ${yearCard?.nameFr}`;
      }
      case 'threshold': {
        return lang === 'en'
          ? `Year Transition ${(reading.transitionYear || 0) - 1} → ${reading.transitionYear}`
          : `Transition Annuelle ${(reading.transitionYear || 0) - 1} → ${reading.transitionYear}`;
      }
      default: {
        const spread = SPREADS[reading.spreadType as SpreadType];
        return spread
          ? (lang === 'en' ? spread.nameEn : spread.nameFr)
          : reading.spreadType || t('profile.UnifiedHistoryCard.reading', 'Reading');
      }
    }
  };

  // Render subtitle based on reading type
  const renderSubtitle = () => {
    switch (reading.readingType) {
      case 'birth_synthesis':
        return reading.zodiacSign
          ? (lang === 'en' ? `Zodiac: ${reading.zodiacSign}` : `Zodiaque: ${reading.zodiacSign}`)
          : null;
      case 'personal_year':
      case 'threshold':
        return reading.zodiacSign
          ? (lang === 'en' ? `${reading.zodiacSign}` : `${reading.zodiacSign}`)
          : null;
      default:
        return reading.question ? `"${reading.question}"` : null;
    }
  };

  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 overflow-hidden
                    hover:border-slate-600/50 transition-colors duration-200">
      {/* Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-slate-700/20 transition-colors duration-200"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="text-base font-medium text-purple-100">
                {renderTitle()}
              </h3>
              {/* Reading type badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${typeInfo.colorClass}`}>
                {typeInfo.icon}
                {typeInfo.label}
              </span>
              {/* Cards count for tarot */}
              {reading.readingType === 'tarot' && reading.cards && (
                <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">
                  {getCardsArray(reading.cards).length} {t('profile.ReadingHistoryCard.cards', 'cards')}
                </span>
              )}
              {/* Follow-ups badge */}
              {reading.followUps && reading.followUps.length > 0 && (
                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {reading.followUps.length}
                </span>
              )}
            </div>

            {/* Subtitle/Question */}
            {renderSubtitle() && (
              <p className="text-sm text-slate-400 italic truncate">
                {renderSubtitle()}
              </p>
            )}
          </div>

          {/* Date & Expand */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-slate-400">
              {formatRelativeDate(reading.createdAt, t, lang)}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-slate-500 transition-transform duration-200
                         ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-700/40"
          >
            <div className="p-4 space-y-5">
              {/* Tarot-specific: Cards Drawn */}
              {reading.readingType === 'tarot' && reading.cards && (
                <>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                      {t('profile.ReadingHistoryCard.cards_drawn', 'Cards Drawn')}
                    </p>
                    <div className="flex flex-wrap gap-3 items-start">
                      {getCardsArray(reading.cards).map((c, i) => {
                        const cardId = typeof c.cardId === 'string' ? parseInt(c.cardId, 10) : c.cardId;
                        return (
                          <CardThumbnail
                            key={i}
                            cardId={cardId}
                            isReversed={c.isReversed}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Position Meanings */}
                  {reading.spreadType && SPREADS[reading.spreadType as SpreadType] && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        {t('profile.ReadingHistoryCard.positions', 'Positions')}
                      </p>
                      <div className="grid gap-2">
                        {getCardsArray(reading.cards).map((c, i) => {
                          const cardId = typeof c.cardId === 'string' ? parseInt(c.cardId, 10) : c.cardId;
                          const card = FULL_DECK.find(fc => fc.id === cardId);
                          const spread = SPREADS[reading.spreadType as SpreadType];
                          const positionMeaning = lang === 'en'
                            ? spread.positionMeaningsEn[i]
                            : spread.positionMeaningsFr[i];
                          return (
                            <div key={i} className="flex items-baseline gap-3 text-sm">
                              <span className="text-slate-500 min-w-[100px] shrink-0">
                                {positionMeaning}:
                              </span>
                              <span className="text-purple-200">
                                {lang === 'en' ? card?.nameEn : card?.nameFr}
                                {c.isReversed && (
                                  <span className="text-red-400/80 ml-1.5">(R)</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Birth Card-specific: Card Details */}
              {(reading.readingType === 'birth_synthesis' || reading.readingType === 'personal_year' || reading.readingType === 'threshold') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {lang === 'en' ? 'Birth Cards' : 'Cartes de Naissance'}
                    </p>
                    {/* Share button - only for birth_synthesis readings with valid card IDs */}
                    {reading.readingType === 'birth_synthesis' &&
                      reading.personalityCardId !== undefined &&
                      reading.soulCardId !== undefined && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsShareModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 rounded-full border border-violet-500/30 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{lang === 'en' ? 'Share' : 'Partager'}</span>
                        </button>
                      )}
                  </div>
                  <div className="flex flex-wrap gap-4 items-start">
                    {reading.personalityCardId !== undefined && (
                      <div className="flex flex-col items-center gap-2">
                        <CardThumbnail cardId={reading.personalityCardId} />
                        <span className="text-xs text-violet-300 font-medium">
                          {lang === 'en' ? 'Personality' : 'Personnalité'}
                        </span>
                      </div>
                    )}
                    {reading.soulCardId !== undefined && reading.soulCardId !== reading.personalityCardId && (
                      <div className="flex flex-col items-center gap-2">
                        <CardThumbnail cardId={reading.soulCardId} />
                        <span className="text-xs text-indigo-300 font-medium">
                          {lang === 'en' ? 'Soul' : 'Âme'}
                        </span>
                      </div>
                    )}
                    {reading.readingType === 'personal_year' && reading.personalYearCardId !== undefined && (
                      <div className="flex flex-col items-center gap-2">
                        <CardThumbnail cardId={reading.personalYearCardId} />
                        <span className="text-xs text-amber-300 font-medium">
                          {lang === 'en' ? `Year ${reading.personalYearNumber}` : `Année ${reading.personalYearNumber}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Threshold-specific: Year Cards */}
              {reading.readingType === 'threshold' && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    {lang === 'en' ? 'Year Transition' : 'Transition Annuelle'}
                  </p>
                  <div className="flex flex-wrap gap-4 items-start">
                    {reading.outgoingYearCardId !== undefined && (
                      <div className="flex flex-col items-center gap-2">
                        <CardThumbnail cardId={reading.outgoingYearCardId} />
                        <span className="text-xs text-slate-400 font-medium">
                          {(reading.transitionYear || 0) - 1}
                        </span>
                      </div>
                    )}
                    {reading.incomingYearCardId !== undefined && (
                      <div className="flex flex-col items-center gap-2">
                        <CardThumbnail cardId={reading.incomingYearCardId} />
                        <span className="text-xs text-amber-300 font-medium">
                          {reading.transitionYear}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interpretation/Synthesis - Rendered as Markdown */}
              {interpretationContent && (
                <div className="pt-4 border-t border-slate-700/30">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {reading.readingType === 'tarot'
                      ? t('profile.ReadingHistoryCard.interpretation', 'Interpretation')
                      : (lang === 'en' ? 'Synthesis' : 'Synthèse')}
                  </p>
                  <div
                    className="bg-slate-900/50 rounded-lg p-4 overflow-y-auto prose prose-sm prose-invert max-w-none"
                    style={{ maxHeight: `${MAX_INTERPRETATION_HEIGHT_PX}px` }}
                  >
                    <ReactMarkdown>{interpretationContent}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Clarification Cards (Tarot only) */}
              {reading.hasClarification && (reading.clarificationCard || reading.clarificationCard2) && (
                <div className="pt-4 border-t border-slate-700/30">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    {lang === 'fr' ? 'Cartes de clarification' : 'Clarification Cards'}
                  </p>
                  <div className="space-y-3">
                    {[reading.clarificationCard, reading.clarificationCard2]
                      .filter(Boolean)
                      .map((card, i) => (
                        <div key={i} className="bg-slate-900/50 rounded-lg p-4 flex gap-4">
                          <div className="flex-shrink-0">
                            <CardThumbnail cardId={card!.cardId} isReversed={card!.isReversed} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-300 mb-1">
                              {lang === 'fr' ? card!.cardNameFr : card!.cardNameEn}
                              {card!.isReversed && (
                                <span className="text-purple-400 ml-1">
                                  ({lang === 'fr' ? 'Renversée' : 'Reversed'})
                                </span>
                              )}
                            </p>
                            <div className="text-sm text-slate-400 prose prose-sm prose-invert max-w-none">
                              <ReactMarkdown>{card!.interpretation}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Follow-up Questions (Tarot only) */}
              {reading.followUps && reading.followUps.length > 0 && (
                <div className="pt-4 border-t border-slate-700/30">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {t('profile.ReadingHistoryCard.followup_questions', 'Follow-up Questions')}
                  </p>
                  <div className="space-y-3">
                    {reading.followUps.map((followUp, i) => (
                      <div key={followUp.id} className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-sm text-purple-200 font-medium mb-2">
                          <span className="text-purple-400 mr-2">Q{i + 1}:</span>
                          {followUp.question}
                        </p>
                        <p className="text-sm text-slate-400 whitespace-pre-wrap">
                          {followUp.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Reflection (Tarot only) */}
              {reading.userReflection && (
                <div className="pt-4 border-t border-slate-700/30">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    {t('profile.ReadingHistoryCard.your_reflection', 'Your Reflection')}
                  </p>
                  <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-sm text-purple-100 italic">
                      &quot;{reading.userReflection}&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal for Birth Card readings */}
      {reading.readingType === 'birth_synthesis' &&
        reading.personalityCardId !== undefined &&
        reading.soulCardId !== undefined && (
          <ShareBirthCardModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            personalityCardId={reading.personalityCardId}
            soulCardId={reading.soulCardId}
            zodiacSign={reading.zodiacSign}
            readingText={interpretationContent}
          />
        )}
    </div>
  );
};

export default UnifiedHistoryCard;
