import React from 'react';
import { motion } from 'framer-motion';
import { Star, Sun, Moon as MoonIcon, Loader2 } from 'lucide-react';
import { getCardImageUrl } from '../../../constants/cardImages';
import { formatHtmlContent, MAJOR_ARCANA_NAMES } from '../birthCardUtils';
import type { YearEnergyData } from '../birthCardTypes';
import type { YearEnergyResponse } from '../../../services/api';

interface YearTabProps {
  depth: number;
  language: string;
  currentYear: number;
  calculatedPersonalYear: number | null;
  personalYearNumber: number | null;
  yearData: YearEnergyData | undefined;
  universalYearEnergy: YearEnergyResponse | null;
  isLoadingYearEnergy: boolean;
  yearPrimaryImageUrl: string;
  yearInterpretation: string | null;
  isGeneratingYear: boolean;
  yearError: string | null;
  onRetryYear: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, cardName: string) => void;
}

const YearTab: React.FC<YearTabProps> = ({
  depth,
  language,
  currentYear,
  calculatedPersonalYear,
  personalYearNumber,
  yearData,
  universalYearEnergy,
  isLoadingYearEnergy,
  yearPrimaryImageUrl,
  yearInterpretation,
  isGeneratingYear,
  yearError,
  onRetryYear,
  onImageError,
}) => {
  if (depth < 3) return null;

  const yearEnergy = universalYearEnergy;
  const yearCardImageUrl = yearEnergy ? getCardImageUrl(yearEnergy.yearCard.id) : yearPrimaryImageUrl;
  const displayPersonalYear = personalYearNumber || calculatedPersonalYear;
  const personalYearCardImageUrl = displayPersonalYear ? getCardImageUrl(displayPersonalYear) : null;
  const personalYearCardName = displayPersonalYear ? MAJOR_ARCANA_NAMES[displayPersonalYear] : null;

  return (
    <motion.div
      key="year"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Loading state for year energy */}
      {isLoadingYearEnergy && !yearEnergy ? (
        <div className="flex flex-col items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mb-4"
          >
            <Loader2 className="w-8 h-8 text-sky-400" />
          </motion.div>
          <p className="text-white/60 text-sm">
            {language === 'en' ? 'Loading year energy...' : 'Chargement de l\'énergie de l\'année...'}
          </p>
        </div>
      ) : (
        <>
          {/* Year Card Images - Universal and Personal Year */}
          <div className="flex justify-center gap-8 mb-6">
            {/* Universal Year Card */}
            <div className="text-center">
              <div
                className="rounded-xl overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-300 mb-3"
                style={{ boxShadow: '0 0 40px rgba(56, 189, 248, 0.3)' }}
              >
                <img
                  src={yearCardImageUrl}
                  alt={yearEnergy?.yearCard.name || 'Year Card'}
                  className="w-40 h-60 md:w-48 md:h-72 object-contain bg-black/20"
                  loading="lazy"
                  onError={(e) => onImageError(e, yearEnergy?.yearCard.name || 'Year Card')}
                />
              </div>
              <p className="text-sky-300 font-heading text-lg mb-1">
                {yearEnergy?.yearCard.name || (language === 'en' ? 'The Magician' : 'Le Bateleur')}
              </p>
              <p className="text-white/50 text-xs">
                {language === 'en' ? 'Universal Year Card' : 'Carte Année Universelle'}
              </p>
            </div>

            {/* Personal Year Card */}
            {displayPersonalYear && personalYearCardImageUrl && (
              <div className="text-center">
                <div
                  className="rounded-xl overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-300 mb-3"
                  style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)' }}
                >
                  <img
                    src={personalYearCardImageUrl}
                    alt={personalYearCardName?.en || 'Personal Year Card'}
                    className="w-40 h-60 md:w-48 md:h-72 object-contain bg-black/20"
                    loading="lazy"
                    onError={(e) => onImageError(e, 'Personal Year Card')}
                  />
                </div>
                <p className="text-violet-300 font-heading text-lg mb-1">
                  {language === 'en' ? personalYearCardName?.en : personalYearCardName?.fr}
                </p>
                <p className="text-white/50 text-xs">
                  {language === 'en' ? 'Your Personal Year Card' : 'Votre Carte Année Personnelle'}
                </p>
              </div>
            )}
          </div>

          {/* Header */}
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-heading text-sky-300 mb-2">
              {language === 'en' ? `Year ${currentYear} Energy` : `Énergie de l'Année ${currentYear}`}
            </h3>
            <p className="text-white/70 text-sm mb-3">
              {yearEnergy?.yearCard.name || (yearData ? (language === 'en' ? yearData.primaryCardName : yearData.primaryCardNameFr) : '')}
              {yearEnergy && ` (${yearEnergy.yearCard.element})`}
            </p>
            {yearEnergy && (
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 text-xs rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {language === 'en' ? `Universal Year ${yearEnergy.yearNumber}` : `Année Universelle ${yearEnergy.yearNumber}`}
                </span>
                <span className="px-3 py-1 text-xs rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {language === 'en' ? `Cycle ${yearEnergy.cyclePosition}/9` : `Cycle ${yearEnergy.cyclePosition}/9`}
                </span>
                {personalYearNumber && (
                  <span className="px-3 py-1 text-xs rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {language === 'en' ? `Personal Year ${personalYearNumber}` : `Année Personnelle ${personalYearNumber}`}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Universal Year Energy Sections */}
          {yearEnergy && (
            <div className="space-y-4">
              {/* Themes */}
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-sky-500/20">
                <h4 className="text-sky-300 font-heading text-lg mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {language === 'en' ? 'Universal Themes' : 'Thèmes Universels'}
                </h4>
                <div
                  className="max-w-none text-white/90 leading-relaxed birth-card-content"
                  dangerouslySetInnerHTML={{ __html: formatHtmlContent(yearEnergy.themes) }}
                />
              </div>

              {/* Challenges */}
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20">
                <h4 className="text-amber-300 font-heading text-lg mb-3 flex items-center gap-2">
                  <MoonIcon className="w-5 h-5" />
                  {language === 'en' ? 'Challenges' : 'Défis'}
                </h4>
                <div
                  className="max-w-none text-white/90 leading-relaxed birth-card-content"
                  dangerouslySetInnerHTML={{ __html: formatHtmlContent(yearEnergy.challenges) }}
                />
              </div>

              {/* Opportunities */}
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/20">
                <h4 className="text-emerald-300 font-heading text-lg mb-3 flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  {language === 'en' ? 'Opportunities' : 'Opportunités'}
                </h4>
                <div
                  className="max-w-none text-white/90 leading-relaxed birth-card-content"
                  dangerouslySetInnerHTML={{ __html: formatHtmlContent(yearEnergy.opportunities) }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* AI-Generated Personalized Year Reading */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-sky-500/20">
        <h4 className="text-sky-300 font-heading text-lg mb-3">
          {language === 'en' ? 'Your Personal Year Journey' : 'Votre Parcours Annuel Personnel'}
        </h4>

        {isGeneratingYear ? (
          <div className="flex flex-col items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mb-4"
            >
              <Loader2 className="w-8 h-8 text-sky-400" />
            </motion.div>
            <p className="text-white/60 text-sm">
              {language === 'en'
                ? 'Weaving the year energy with your birth cards...'
                : 'Tissage de l\'énergie de l\'année avec vos cartes de naissance...'}
            </p>
          </div>
        ) : yearError ? (
          <div className="text-center py-4">
            <p className="text-red-400 mb-4">{yearError}</p>
            <button
              onClick={onRetryYear}
              className="px-4 py-2 bg-sky-500/20 text-sky-300 rounded-lg hover:bg-sky-500/30 transition-colors"
            >
              {language === 'en' ? 'Try Again' : 'Réessayer'}
            </button>
          </div>
        ) : yearInterpretation ? (
          <div
            className="max-w-none text-white/90 leading-relaxed birth-card-content"
            dangerouslySetInnerHTML={{ __html: formatHtmlContent(yearInterpretation) }}
          />
        ) : (
          <p className="text-white/60 italic text-center">
            {language === 'en'
              ? 'Your personalized year reading will appear here...'
              : 'Votre lecture annuelle personnalisée apparaîtra ici...'}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default YearTab;
