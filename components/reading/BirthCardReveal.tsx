// components/reading/BirthCardReveal.tsx
// Displays the birth card reading results with soul, personality, and year cards
// Note: dangerouslySetInnerHTML is used with trusted static JSON content (not user input)

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sun, Moon as MoonIcon, ChevronLeft, Sparkles, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SpreadType, BirthCardDepth } from '../../types';
import {
  getBirthCardReading,
  getBirthCardMeaning,
  calculateYearCard,
  YEAR_CARD_2026,
} from '../../constants/birthCardMeanings';
import { getCardImageUrl } from '../../constants/cardImages';
import ThemedBackground from './ThemedBackground';
import Button from '../Button';

// Import JSON data for extended descriptions (trusted static content)
import birthCardSingles from '../../constants/birthCardSingles.json';
import birthCardPairs from '../../constants/birthCardPairs.json';
import yearEnergy from '../../constants/yearEnergy.json';

interface BirthDate {
  day: string;
  month: string;
  year: string;
}

interface LocationState {
  birthDate: BirthDate;
  depth: BirthCardDepth;
  question?: string;
}

interface SingleCardData {
  cardId: number;
  cardName: string;
  cardNameFr: string;
  image: string;
  descriptionEn: string;
  descriptionFr: string;
  keyThemesEn: string[];
  keyThemesFr: string[];
}

interface PairCardData {
  personalityCardId: number;
  soulCardId: number;
  personalityName: string;
  personalityNameFr: string;
  soulName: string;
  soulNameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  dynamicEn: string;
  dynamicFr: string;
}

interface YearEnergyData {
  cardId: number;
  cardName: string;
  cardNameFr: string;
  image: string;
  yearThemeEn: string;
  yearThemeFr: string;
  adviceEn: string;
  adviceFr: string;
  keywordsEn: string[];
  keywordsFr: string[];
}

const BirthCardReveal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useApp();
  const state = location.state as LocationState | null;

  const [activeTab, setActiveTab] = useState<'soul' | 'personality' | 'year'>('soul');
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if no state
  useEffect(() => {
    if (!state?.birthDate) {
      navigate('/reading/birth-cards');
    } else {
      // Simulate loading for dramatic effect
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [state, navigate]);

  if (!state?.birthDate) {
    return null;
  }

  const { birthDate, depth, question } = state;
  const day = parseInt(birthDate.day, 10);
  const month = parseInt(birthDate.month, 10);
  const year = parseInt(birthDate.year, 10);

  // Calculate birth cards
  const reading = getBirthCardReading(day, month, year, depth);
  const soulCardId = reading.soulCard.id;
  const personalityCardId = reading.personalityCard?.id ?? soulCardId;
  const yearCardId = depth >= 3 ? calculateYearCard(day, month, YEAR_CARD_2026.year) : null;

  const isSingleCard = soulCardId === personalityCardId;

  // Get extended data from JSON files
  const singleCardData = birthCardSingles.find(
    (c: SingleCardData) => c.cardId === soulCardId
  ) as SingleCardData | undefined;

  const pairData = birthCardPairs.find(
    (p: PairCardData) => p.soulCardId === soulCardId && p.personalityCardId === personalityCardId
  ) as PairCardData | undefined;

  const yearEnergyData = yearCardId !== null
    ? (yearEnergy.find((y: YearEnergyData) => y.cardId === yearCardId) as YearEnergyData | undefined)
    : undefined;

  // Get basic meanings from birthCardMeanings.ts as fallback
  const soulMeaning = getBirthCardMeaning(soulCardId);
  const personalityMeaning = getBirthCardMeaning(personalityCardId);
  const yearMeaning = yearCardId !== null ? getBirthCardMeaning(yearCardId) : undefined;

  // Build image URLs
  const soulImageUrl = getCardImageUrl(soulCardId);
  const personalityImageUrl = getCardImageUrl(personalityCardId);
  const yearImageUrl = yearCardId !== null ? getCardImageUrl(yearCardId) : '';

  // Debug logging for image URLs
  if (import.meta.env.DEV) {
    console.log('[BirthCardReveal] Card IDs:', { soulCardId, personalityCardId, yearCardId });
    console.log('[BirthCardReveal] Image URLs:', { soulImageUrl, personalityImageUrl, yearImageUrl });
  }

  // Handle image load error - log and potentially show placeholder
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, cardName: string) => {
    console.error(`[BirthCardReveal] Failed to load image for ${cardName}:`, e.currentTarget.src);
  };

  // Format birth date for display
  const formattedDate = `${birthDate.day}/${birthDate.month}/${birthDate.year}`;

  const handleBack = () => {
    navigate(`/reading/birth-cards/${depth}`);
  };

  // Loading animation
  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <ThemedBackground spreadType={SpreadType.CELTIC_CROSS} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Sparkles className="w-full h-full text-violet-400" />
          </motion.div>
          <p className="text-violet-300 text-lg">
            {language === 'en' ? 'Calculating your destiny...' : 'Calcul de votre destinée...'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Tab content based on active selection
  const renderTabContent = () => {
    switch (activeTab) {
      case 'soul':
        return (
          <motion.div
            key="soul"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Card Image */}
            <div className="flex justify-center">
              <div
                className="rounded-xl overflow-hidden shadow-2xl"
                style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}
              >
                <img
                  src={soulImageUrl}
                  alt={soulMeaning?.nameEn || 'Soul Card'}
                  className="w-48 h-72 md:w-56 md:h-84 object-cover"
                  onError={(e) => handleImageError(e, soulMeaning?.nameEn || 'Soul Card')}
                />
              </div>
            </div>

            {/* Card Name & Keywords */}
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-heading text-white mb-2">
                {language === 'en' ? soulMeaning?.nameEn : soulMeaning?.nameFr}
              </h3>
              {singleCardData && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {(language === 'en' ? singleCardData.keyThemesEn : singleCardData.keyThemesFr).map(
                    (theme, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      >
                        {theme}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20">
              {singleCardData && singleCardData.descriptionEn ? (
                // Static trusted content from bundled JSON - safe to render as HTML
                <div
                  className="prose prose-invert prose-violet max-w-none text-white/90 leading-relaxed birth-card-content"
                  dangerouslySetInnerHTML={{
                    __html: language === 'en' ? singleCardData.descriptionEn : singleCardData.descriptionFr,
                  }}
                />
              ) : (
                <p className="text-white/80 leading-relaxed">
                  {language === 'en' ? soulMeaning?.soulMeaningEn : soulMeaning?.soulMeaningFr}
                </p>
              )}
            </div>
          </motion.div>
        );

      case 'personality':
        if (depth < 2) return null;

        return (
          <motion.div
            key="personality"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Show both cards for pairs */}
            {!isSingleCard ? (
              <div className="flex justify-center gap-4">
                <div
                  className="rounded-xl overflow-hidden shadow-2xl"
                  style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.3)' }}
                >
                  <img
                    src={personalityImageUrl}
                    alt={personalityMeaning?.nameEn || 'Personality Card'}
                    className="w-36 h-54 md:w-44 md:h-66 object-cover"
                    onError={(e) => handleImageError(e, personalityMeaning?.nameEn || 'Personality Card')}
                  />
                </div>
                <div
                  className="rounded-xl overflow-hidden shadow-2xl opacity-70"
                  style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' }}
                >
                  <img
                    src={soulImageUrl}
                    alt={soulMeaning?.nameEn || 'Soul Card'}
                    className="w-28 h-42 md:w-36 md:h-54 object-cover"
                    onError={(e) => handleImageError(e, soulMeaning?.nameEn || 'Soul Card')}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className="rounded-xl overflow-hidden shadow-2xl"
                  style={{ boxShadow: '0 0 40px rgba(251, 191, 36, 0.3)' }}
                >
                  <img
                    src={personalityImageUrl}
                    alt={personalityMeaning?.nameEn || 'Personality Card'}
                    className="w-48 h-72 md:w-56 md:h-84 object-cover"
                    onError={(e) => handleImageError(e, personalityMeaning?.nameEn || 'Personality Card')}
                  />
                </div>
              </div>
            )}

            {/* Card Names */}
            <div className="text-center">
              {!isSingleCard ? (
                <>
                  <h3 className="text-2xl md:text-3xl font-heading text-amber-300 mb-1">
                    {language === 'en' ? personalityMeaning?.nameEn : personalityMeaning?.nameFr}
                  </h3>
                  <p className="text-violet-300 text-sm">
                    {language === 'en' ? 'with Soul Card: ' : 'avec Carte de l\'Âme: '}
                    {language === 'en' ? soulMeaning?.nameEn : soulMeaning?.nameFr}
                  </p>
                </>
              ) : (
                <h3 className="text-2xl md:text-3xl font-heading text-amber-300">
                  {language === 'en' ? personalityMeaning?.nameEn : personalityMeaning?.nameFr}
                </h3>
              )}
            </div>

            {/* Description */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20">
              {!isSingleCard && pairData && pairData.descriptionEn ? (
                <>
                  {/* Static trusted content from bundled JSON - safe to render as HTML */}
                  <div
                    className="prose prose-invert prose-amber max-w-none text-white/90 leading-relaxed birth-card-content"
                    dangerouslySetInnerHTML={{
                      __html: language === 'en' ? pairData.descriptionEn : pairData.descriptionFr,
                    }}
                  />
                  {pairData.dynamicEn && (
                    <>
                      <h4 className="text-amber-300 font-heading text-lg mt-6 mb-3">
                        {language === 'en' ? 'The Dynamic' : 'La Dynamique'}
                      </h4>
                      <div
                        className="prose prose-invert prose-amber max-w-none text-white/80 leading-relaxed birth-card-content"
                        dangerouslySetInnerHTML={{
                          __html: language === 'en' ? pairData.dynamicEn : pairData.dynamicFr,
                        }}
                      />
                    </>
                  )}
                </>
              ) : (
                <p className="text-white/80 leading-relaxed">
                  {language === 'en'
                    ? personalityMeaning?.personalityMeaningEn
                    : personalityMeaning?.personalityMeaningFr}
                </p>
              )}
            </div>
          </motion.div>
        );

      case 'year':
        if (depth < 3 || yearCardId === null) return null;

        return (
          <motion.div
            key="year"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Card Image */}
            <div className="flex justify-center">
              <div
                className="rounded-xl overflow-hidden shadow-2xl"
                style={{ boxShadow: '0 0 40px rgba(56, 189, 248, 0.3)' }}
              >
                <img
                  src={yearImageUrl}
                  alt={yearMeaning?.nameEn || 'Year Card'}
                  className="w-48 h-72 md:w-56 md:h-84 object-cover"
                  onError={(e) => handleImageError(e, yearMeaning?.nameEn || 'Year Card')}
                />
              </div>
            </div>

            {/* Card Name & Year */}
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-heading text-sky-300 mb-2">
                {language === 'en' ? yearMeaning?.nameEn : yearMeaning?.nameFr}
              </h3>
              <p className="text-white/60 text-sm">
                {language === 'en' ? `Your Year Card for ${YEAR_CARD_2026.year}` : `Votre Carte de l'Année ${YEAR_CARD_2026.year}`}
              </p>
              {yearEnergyData && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {(language === 'en' ? yearEnergyData.keywordsEn : yearEnergyData.keywordsFr).map(
                    (keyword, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      >
                        {keyword}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-sky-500/20">
              {yearEnergyData && yearEnergyData.yearThemeEn ? (
                <>
                  <h4 className="text-sky-300 font-heading text-lg mb-3">
                    {language === 'en' ? 'Year Theme' : 'Thème de l\'Année'}
                  </h4>
                  <p className="text-white/80 leading-relaxed mb-4">
                    {language === 'en' ? yearEnergyData.yearThemeEn : yearEnergyData.yearThemeFr}
                  </p>
                  {yearEnergyData.adviceEn && (
                    <>
                      <h4 className="text-sky-300 font-heading text-lg mt-6 mb-3">
                        {language === 'en' ? 'Guidance' : 'Conseils'}
                      </h4>
                      <p className="text-white/80 leading-relaxed">
                        {language === 'en' ? yearEnergyData.adviceEn : yearEnergyData.adviceFr}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-white/80 leading-relaxed mb-4">
                    {language === 'en' ? yearMeaning?.soulMeaningEn : yearMeaning?.soulMeaningFr}
                  </p>
                  <div className="border-t border-sky-500/20 pt-4 mt-4">
                    <h4 className="text-sky-300 font-heading text-sm mb-2">
                      {language === 'en' ? `${YEAR_CARD_2026.year} Universal Energy` : `Énergie Universelle ${YEAR_CARD_2026.year}`}
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {language === 'en' ? YEAR_CARD_2026.meaningEn : YEAR_CARD_2026.meaningFr}
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Build tabs based on depth
  type TabId = 'soul' | 'personality' | 'year';
  const tabs: Array<{ id: TabId; icon: React.ReactNode; label: string }> = [
    { id: 'soul', icon: <Star className="w-5 h-5" />, label: language === 'en' ? 'Soul Card' : 'Carte de l\'Âme' },
  ];
  if (depth >= 2) {
    tabs.push({
      id: 'personality',
      icon: <Sun className="w-5 h-5" />,
      label: language === 'en' ? 'Personality' : 'Personnalité',
    });
  }
  if (depth >= 3) {
    tabs.push({
      id: 'year',
      icon: <MoonIcon className="w-5 h-5" />,
      label: language === 'en' ? `Year ${YEAR_CARD_2026.year}` : `Année ${YEAR_CARD_2026.year}`,
    });
  }

  return (
    <div className="min-h-screen relative">
      {/* Themed background */}
      <ThemedBackground spreadType={SpreadType.CELTIC_CROSS} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Back button */}
        <div className="p-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{t('common.back', 'Back')}</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 border border-violet-500/20 mb-4"
          >
            <Calendar className="w-4 h-4 text-violet-400" />
            <span className="text-white/70 text-sm">{formattedDate}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-heading text-white mb-2"
          >
            {language === 'en' ? 'Your Birth Cards' : 'Vos Cartes de Naissance'}
          </motion.h1>

          {question && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-violet-300/80 text-sm italic max-w-md mx-auto"
            >
              "{question}"
            </motion.p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-4 mb-6">
          <div className="flex justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                    : 'bg-black/30 text-white/60 hover:text-white hover:bg-black/50 border border-white/10'
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-4 pb-8 max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
        </div>

        {/* Footer action */}
        <div className="p-4 text-center">
          <Button
            onClick={() => navigate('/reading')}
            variant="outline"
            className="text-white/70 border-white/20 hover:border-white/40"
          >
            {language === 'en' ? 'Start Another Reading' : 'Commencer une autre lecture'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BirthCardReveal;
