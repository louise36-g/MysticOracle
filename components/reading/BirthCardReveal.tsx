// components/reading/BirthCardReveal.tsx
// Displays the birth card reading results based on depth:
// - Depth 1: Personality Card only
// - Depth 2: Personality + Soul Card (or Unified if same)
// - Depth 3: Year Energy Reading
// Note: dangerouslySetInnerHTML is used with trusted static JSON content (not user input)

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sun, Moon as MoonIcon, ChevronLeft, Sparkles, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SpreadType, BirthCardDepth } from '../../types';
import { calculateBirthCards, calculateYearCard, YEAR_CARD_2026 } from '../../constants/birthCardMeanings';
import { getCardImageUrl } from '../../constants/cardImages';
import ThemedBackground from './ThemedBackground';
import Button from '../Button';

// Import JSON data files (trusted static content)
import personalityCards from '../../constants/birthCards/personalityCards.json';
import soulCards from '../../constants/birthCards/soulCards.json';
import birthCardPairs from '../../constants/birthCards/birthCardPairs.json';
import unifiedBirthCards from '../../constants/birthCards/unifiedBirthCards.json';
import yearEnergy2026 from '../../constants/birthCards/yearEnergy2026.json';

interface BirthDate {
  day: string;
  month: string;
  year: string;
}

interface LocationState {
  birthDate: BirthDate;
  depth: BirthCardDepth;
}

// Type definitions for JSON data
interface PersonalityCardData {
  cardId: number;
  cardName: string;
  cardNameFr: string;
  image: string;
  descriptionEn: string;
  descriptionFr: string;
  keyThemesEn: string[];
  keyThemesFr: string[];
}

interface SoulCardData {
  cardId: number;
  cardName: string;
  cardNameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  keyThemesEn: string[];
  keyThemesFr: string[];
}

interface PairData {
  pairId: number;
  personalityCardId: number;
  personalityName: string;
  personalityNameFr: string;
  soulCardId: number;
  soulName: string;
  soulNameFr: string;
  dynamicEn: string;
  dynamicFr: string;
}

interface UnifiedCardData {
  cardId: number;
  cardName: string;
  cardNameFr: string;
  image: string;
  descriptionEn: string;
  descriptionFr: string;
  keyThemesEn: string[];
  keyThemesFr: string[];
}

interface YearInteraction {
  soulCardId?: number;
  personalityCardId?: number;
  soulCardName?: string;
  personalityCardName?: string;
  interactionEn: string;
  interactionFr: string;
}

interface YearEnergyData {
  year: number;
  yearCardId: number;
  yearCardName: string;
  yearCardNameFr: string;
  reducedCardId: number;
  reducedCardName: string;
  reducedCardNameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  keywordsEn: string[];
  keywordsFr: string[];
  soulCardInteractions: YearInteraction[];
  personalityCardInteractions: YearInteraction[];
}

const BirthCardReveal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useApp();
  const state = location.state as LocationState | null;

  type TabId = 'personality' | 'soul' | 'dynamic' | 'year';
  const [activeTab, setActiveTab] = useState<TabId>('personality');
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if no state
  useEffect(() => {
    if (!state?.birthDate) {
      navigate('/reading/birth-cards');
    } else {
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [state, navigate]);

  if (!state?.birthDate) {
    return null;
  }

  const { birthDate, depth } = state;
  const day = parseInt(birthDate.day, 10);
  const month = parseInt(birthDate.month, 10);
  const year = parseInt(birthDate.year, 10);

  // Calculate birth cards using corrected logic
  const { soulCard: soulCardId, personalityCard: personalityCardId } = calculateBirthCards(day, month, year);
  const yearCardId = depth >= 3 ? calculateYearCard(day, month, YEAR_CARD_2026.year) : null;

  const isUnified = soulCardId === personalityCardId;

  // Get data from JSON files
  const personalityData = personalityCards.find(
    (c: PersonalityCardData) => c.cardId === personalityCardId
  ) as PersonalityCardData | undefined;

  const soulData = soulCards.find(
    (c: SoulCardData) => c.cardId === soulCardId
  ) as SoulCardData | undefined;

  const pairData = !isUnified
    ? (birthCardPairs.find(
        (p: PairData) => p.personalityCardId === personalityCardId && p.soulCardId === soulCardId
      ) as PairData | undefined)
    : undefined;

  const unifiedData = isUnified
    ? (unifiedBirthCards.find((u: UnifiedCardData) => u.cardId === soulCardId) as UnifiedCardData | undefined)
    : undefined;

  const yearData = yearEnergy2026 as YearEnergyData;

  // Build image URLs
  const personalityImageUrl = getCardImageUrl(personalityCardId);
  const soulImageUrl = getCardImageUrl(soulCardId);
  const yearImageUrl = yearCardId !== null ? getCardImageUrl(yearCardId) : '';

  // Handle image load error
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

  // Render Personality Tab
  const renderPersonalityTab = () => (
    <motion.div
      key="personality"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Card Image */}
      <div className="flex justify-center">
        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 0 40px rgba(251, 191, 36, 0.3)' }}
        >
          <img
            src={personalityImageUrl}
            alt={personalityData?.cardName || 'Personality Card'}
            className="w-48 h-72 md:w-56 md:h-84 object-cover"
            onError={(e) => handleImageError(e, personalityData?.cardName || 'Personality Card')}
          />
        </div>
      </div>

      {/* Card Name & Keywords */}
      <div className="text-center">
        <h3 className="text-2xl md:text-3xl font-heading text-amber-300 mb-2">
          {language === 'en' ? personalityData?.cardName : personalityData?.cardNameFr}
        </h3>
        <p className="text-white/60 text-sm mb-3">
          {language === 'en' ? 'Your Personality Card' : 'Votre Carte de Personnalité'}
        </p>
        {personalityData && (
          <div className="flex flex-wrap justify-center gap-2">
            {(language === 'en' ? personalityData.keyThemesEn : personalityData.keyThemesFr).map(
              (theme, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30"
                >
                  {theme}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20">
        {personalityData?.descriptionEn ? (
          <div
            className="prose prose-invert prose-amber max-w-none text-white/90 leading-relaxed birth-card-content"
            dangerouslySetInnerHTML={{
              __html: language === 'en' ? personalityData.descriptionEn : personalityData.descriptionFr,
            }}
          />
        ) : (
          <p className="text-white/60 italic text-center">
            {language === 'en'
              ? 'Content coming soon...'
              : 'Contenu à venir...'}
          </p>
        )}
      </div>
    </motion.div>
  );

  // Render Soul Tab (for depth >= 2)
  const renderSoulTab = () => {
    if (depth < 2) return null;

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
              alt={soulData?.cardName || 'Soul Card'}
              className="w-48 h-72 md:w-56 md:h-84 object-cover"
              onError={(e) => handleImageError(e, soulData?.cardName || 'Soul Card')}
            />
          </div>
        </div>

        {/* Card Name & Keywords */}
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-heading text-violet-300 mb-2">
            {language === 'en' ? soulData?.cardName : soulData?.cardNameFr}
          </h3>
          <p className="text-white/60 text-sm mb-3">
            {language === 'en' ? 'Your Soul Card' : 'Votre Carte de l\'Âme'}
          </p>
          {soulData && (
            <div className="flex flex-wrap justify-center gap-2">
              {(language === 'en' ? soulData.keyThemesEn : soulData.keyThemesFr).map((theme, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-xs rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20">
          {soulData?.descriptionEn ? (
            <div
              className="prose prose-invert prose-violet max-w-none text-white/90 leading-relaxed birth-card-content"
              dangerouslySetInnerHTML={{
                __html: language === 'en' ? soulData.descriptionEn : soulData.descriptionFr,
              }}
            />
          ) : (
            <p className="text-white/60 italic text-center">
              {language === 'en' ? 'Content coming soon...' : 'Contenu à venir...'}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  // Render Dynamic/Unified Tab (for depth >= 2)
  const renderDynamicTab = () => {
    if (depth < 2) return null;

    return (
      <motion.div
        key="dynamic"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        {/* Both Cards Side by Side */}
        <div className="flex justify-center gap-4">
          <div
            className="rounded-xl overflow-hidden shadow-xl"
            style={{ boxShadow: '0 0 25px rgba(251, 191, 36, 0.3)' }}
          >
            <img
              src={personalityImageUrl}
              alt={personalityData?.cardName || 'Personality'}
              className="w-32 h-48 md:w-40 md:h-60 object-cover"
              onError={(e) => handleImageError(e, personalityData?.cardName || 'Personality')}
            />
          </div>
          {!isUnified && (
            <div
              className="rounded-xl overflow-hidden shadow-xl"
              style={{ boxShadow: '0 0 25px rgba(139, 92, 246, 0.3)' }}
            >
              <img
                src={soulImageUrl}
                alt={soulData?.cardName || 'Soul'}
                className="w-32 h-48 md:w-40 md:h-60 object-cover"
                onError={(e) => handleImageError(e, soulData?.cardName || 'Soul')}
              />
            </div>
          )}
        </div>

        {/* Header */}
        <div className="text-center">
          {isUnified ? (
            <>
              <h3 className="text-2xl md:text-3xl font-heading text-white mb-2">
                {language === 'en' ? 'Unified Energy' : 'Énergie Unifiée'}
              </h3>
              <p className="text-violet-300 text-sm">
                {language === 'en'
                  ? `${unifiedData?.cardName} as both Personality and Soul`
                  : `${unifiedData?.cardNameFr} comme Personnalité et Âme`}
              </p>
            </>
          ) : (
            <>
              <h3 className="text-2xl md:text-3xl font-heading text-white mb-2">
                {language === 'en' ? 'The Dynamic' : 'La Dynamique'}
              </h3>
              <p className="text-white/70 text-sm">
                <span className="text-amber-300">{language === 'en' ? pairData?.personalityName : pairData?.personalityNameFr}</span>
                {' + '}
                <span className="text-violet-300">{language === 'en' ? pairData?.soulName : pairData?.soulNameFr}</span>
              </p>
            </>
          )}
        </div>

        {/* Description */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          {isUnified && unifiedData?.descriptionEn ? (
            <div
              className="prose prose-invert max-w-none text-white/90 leading-relaxed birth-card-content"
              dangerouslySetInnerHTML={{
                __html: language === 'en' ? unifiedData.descriptionEn : unifiedData.descriptionFr,
              }}
            />
          ) : !isUnified && pairData?.dynamicEn ? (
            <div
              className="prose prose-invert max-w-none text-white/90 leading-relaxed birth-card-content"
              dangerouslySetInnerHTML={{
                __html: language === 'en' ? pairData.dynamicEn : pairData.dynamicFr,
              }}
            />
          ) : (
            <p className="text-white/60 italic text-center">
              {language === 'en' ? 'Content coming soon...' : 'Contenu à venir...'}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  // Render Year Tab (for depth >= 3)
  const renderYearTab = () => {
    if (depth < 3 || yearCardId === null) return null;

    // Find interactions
    const soulInteraction = yearData.soulCardInteractions.find(
      (i) => i.soulCardId === soulCardId
    );
    const personalityInteraction = yearData.personalityCardInteractions.find(
      (i) => i.personalityCardId === personalityCardId
    );

    return (
      <motion.div
        key="year"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        {/* Year Card Image */}
        <div className="flex justify-center">
          <div
            className="rounded-xl overflow-hidden shadow-2xl"
            style={{ boxShadow: '0 0 40px rgba(56, 189, 248, 0.3)' }}
          >
            <img
              src={yearImageUrl}
              alt={yearData.yearCardName}
              className="w-48 h-72 md:w-56 md:h-84 object-cover"
              onError={(e) => handleImageError(e, yearData.yearCardName)}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-heading text-sky-300 mb-2">
            {language === 'en' ? `Year ${yearData.year} Energy` : `Énergie de l'Année ${yearData.year}`}
          </h3>
          <p className="text-white/70 text-sm mb-3">
            {language === 'en' ? yearData.yearCardName : yearData.yearCardNameFr}
            {' → '}
            {language === 'en' ? yearData.reducedCardName : yearData.reducedCardNameFr}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(language === 'en' ? yearData.keywordsEn : yearData.keywordsFr).map((keyword, i) => (
              <span
                key={i}
                className="px-3 py-1 text-xs rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Year Theme */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-sky-500/20">
          <h4 className="text-sky-300 font-heading text-lg mb-3">
            {language === 'en' ? '2026 Year Energy' : 'Énergie de l\'Année 2026'}
          </h4>
          {yearData.descriptionEn ? (
            <div
              className="prose prose-invert prose-sky max-w-none text-white/90 leading-relaxed birth-card-content"
              dangerouslySetInnerHTML={{
                __html: language === 'en' ? yearData.descriptionEn : yearData.descriptionFr,
              }}
            />
          ) : (
            <p className="text-white/60 italic">
              {language === 'en' ? 'Content coming soon...' : 'Contenu à venir...'}
            </p>
          )}
        </div>

        {/* How Year Interacts with Your Cards */}
        {(personalityInteraction?.interactionEn || soulInteraction?.interactionEn) && (
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-sky-500/20">
            <h4 className="text-sky-300 font-heading text-lg mb-3">
              {language === 'en' ? 'Your 2026 Journey' : 'Votre Parcours 2026'}
            </h4>
            {personalityInteraction?.interactionEn && (
              <div className="mb-4">
                <p className="text-amber-300 text-sm font-medium mb-2">
                  {language === 'en'
                    ? `With ${personalityInteraction.personalityCardName} Personality:`
                    : `Avec Personnalité ${personalityData?.cardNameFr}:`}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {language === 'en' ? personalityInteraction.interactionEn : personalityInteraction.interactionFr}
                </p>
              </div>
            )}
            {!isUnified && soulInteraction?.interactionEn && (
              <div>
                <p className="text-violet-300 text-sm font-medium mb-2">
                  {language === 'en'
                    ? `With ${soulInteraction.soulCardName} Soul:`
                    : `Avec Âme ${soulData?.cardNameFr}:`}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {language === 'en' ? soulInteraction.interactionEn : soulInteraction.interactionFr}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  // Tab content based on active selection
  const renderTabContent = () => {
    switch (activeTab) {
      case 'personality':
        return renderPersonalityTab();
      case 'soul':
        return renderSoulTab();
      case 'dynamic':
        return renderDynamicTab();
      case 'year':
        return renderYearTab();
      default:
        return null;
    }
  };

  // Build tabs based on depth
  const tabs: Array<{ id: TabId; icon: React.ReactNode; label: string }> = [
    {
      id: 'personality',
      icon: <Sun className="w-5 h-5" />,
      label: language === 'en' ? 'Personality' : 'Personnalité',
    },
  ];

  if (depth >= 2) {
    tabs.push({
      id: 'soul',
      icon: <Star className="w-5 h-5" />,
      label: language === 'en' ? 'Soul' : 'Âme',
    });
    tabs.push({
      id: 'dynamic',
      icon: <Sparkles className="w-5 h-5" />,
      label: isUnified
        ? language === 'en'
          ? 'Unified'
          : 'Unifié'
        : language === 'en'
        ? 'Dynamic'
        : 'Dynamique',
    });
  }

  if (depth >= 3) {
    tabs.push({
      id: 'year',
      icon: <MoonIcon className="w-5 h-5" />,
      label: language === 'en' ? `${YEAR_CARD_2026.year}` : `${YEAR_CARD_2026.year}`,
    });
  }

  return (
    <div className="min-h-screen relative">
      <ThemedBackground spreadType={SpreadType.CELTIC_CROSS} />

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

          {isUnified && depth >= 2 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-violet-300/80 text-sm"
            >
              {language === 'en'
                ? 'You have unified energy - your Personality and Soul are one!'
                : 'Vous avez une énergie unifiée - votre Personnalité et votre Âme ne font qu\'un!'}
            </motion.p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-4 mb-6">
          <div className="flex justify-center gap-2 flex-wrap">
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
