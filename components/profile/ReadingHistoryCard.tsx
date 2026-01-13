import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, BookOpen, Pencil } from 'lucide-react';
import { SpreadType } from '../../types';
import { SPREADS, FULL_DECK } from '../../constants';
import { ReadingData } from '../../services/apiService';
import { useApp } from '../../context/AppContext';
import { formatRelativeDate } from '../../utils/dateFormatters';

// Constants
const MAX_INTERPRETATION_HEIGHT_PX = 300;

interface ReadingHistoryCardProps {
    reading: ReadingData;
    isExpanded: boolean;
    onToggle: () => void;
}

// Helper to safely get cards array (handles JSON string or array)
const getCardsArray = (cards: any): any[] => {
    if (Array.isArray(cards)) return cards;
    if (typeof cards === 'string') {
        try { return JSON.parse(cards); } catch { return []; }
    }
    if (cards && typeof cards === 'object') return Object.values(cards);
    return [];
};

const ReadingHistoryCard: React.FC<ReadingHistoryCardProps> = ({
    reading,
    isExpanded,
    onToggle,
}) => {
    const { t, language } = useApp();
    const spread = SPREADS[reading.spreadType as SpreadType];
    const cards = getCardsArray(reading.cards);

    const cardDetails = cards.map((c: any) => {
        const cardId = typeof c.cardId === 'string' ? parseInt(c.cardId, 10) : c.cardId;
        const card = FULL_DECK.find(fc => fc.id === cardId);
        return { ...card, isReversed: c.isReversed, position: c.position };
    }).filter(c => c.id !== undefined);

    const spreadName = spread
        ? (language === 'en' ? spread.nameEn : spread.nameFr)
        : reading.spreadType;

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
                                {spreadName}
                            </h3>
                            <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">
                                {cardDetails.length} {t('profile.ReadingHistoryCard.cards', 'cards')}
                            </span>
                            {reading.followUps && reading.followUps.length > 0 && (
                                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    {reading.followUps.length}
                                </span>
                            )}
                        </div>

                        {/* Question Preview */}
                        {reading.question && (
                            <p className="text-sm text-slate-400 italic truncate">
                                "{reading.question}"
                            </p>
                        )}
                    </div>

                    {/* Date & Expand */}
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm text-slate-400">
                            {formatRelativeDate(reading.createdAt, t, language)}
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
                            {/* Cards Drawn */}
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                                    {t('profile.ReadingHistoryCard.cards_drawn', 'Cards Drawn')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {cardDetails.map((card: any, i: number) => (
                                        <span
                                            key={i}
                                            className="text-sm bg-slate-700/50 text-amber-200/90 px-3 py-1.5 rounded-lg
                                                       border border-slate-600/30"
                                        >
                                            {language === 'en' ? card?.nameEn : card?.nameFr}
                                            {card?.isReversed && (
                                                <span className="text-red-400/80 ml-1.5">(R)</span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Position Meanings */}
                            {spread && cardDetails.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                                        {t('profile.ReadingHistoryCard.positions', 'Positions')}
                                    </p>
                                    <div className="grid gap-2">
                                        {cardDetails.map((card: any, i: number) => {
                                            const positionMeaning = language === 'en'
                                                ? spread.positionMeaningsEn[i]
                                                : spread.positionMeaningsFr[i];
                                            return (
                                                <div key={i} className="flex items-baseline gap-3 text-sm">
                                                    <span className="text-slate-500 min-w-[100px] shrink-0">
                                                        {positionMeaning}:
                                                    </span>
                                                    <span className="text-purple-200">
                                                        {language === 'en' ? card?.nameEn : card?.nameFr}
                                                        {card?.isReversed && (
                                                            <span className="text-red-400/80 ml-1.5">(R)</span>
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* AI Interpretation */}
                            {reading.interpretation && (
                                <div className="pt-4 border-t border-slate-700/30">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        {t('profile.ReadingHistoryCard.interpretation', 'Interpretation')}
                                    </p>
                                    <div className="bg-slate-900/50 rounded-lg p-4 overflow-y-auto" style={{ maxHeight: `${MAX_INTERPRETATION_HEIGHT_PX}px` }}>
                                        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {reading.interpretation.split('\n').map((line, i) => {
                                                if (line.startsWith('**')) {
                                                    return (
                                                        <p key={i} className="font-semibold text-amber-200/90 mt-4 mb-2">
                                                            {line.replace(/\*\*/g, '')}
                                                        </p>
                                                    );
                                                }
                                                if (line.startsWith('#')) {
                                                    return (
                                                        <p key={i} className="font-bold text-purple-200 mt-4 mb-2">
                                                            {line.replace(/#/g, '')}
                                                        </p>
                                                    );
                                                }
                                                return line.trim() ? (
                                                    <p key={i} className="mb-2">{line.replace(/\*\*/g, '')}</p>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Follow-up Questions */}
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

                            {/* User Reflection */}
                            {reading.userReflection && (
                                <div className="pt-4 border-t border-slate-700/30">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Pencil className="w-4 h-4" />
                                        {t('profile.ReadingHistoryCard.your_reflection', 'Your Reflection')}
                                    </p>
                                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4">
                                        <p className="text-sm text-purple-100 italic">
                                            "{reading.userReflection}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReadingHistoryCard;
