// components/reading/BirthCardReveal.tsx
// Displays the birth card reading results based on depth:
// - Depth 1: Personality Card only
// - Depth 2: Personality + Soul Card (or Unified if same)
// - Depth 3: Year Energy Reading
// Note: dangerouslySetInnerHTML is used with trusted static JSON content (not user input)

import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sun, Moon as MoonIcon, ChevronLeft, Sparkles, Calendar, Share2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { SpreadType } from '../../types';
import { calculateBirthCards, getZodiacSign, getMajorArcanaAssociation } from '../../constants/birthCardMeanings';
import { getCardImageUrl } from '../../constants/cardImages';
import {
  getCurrentYearEnergy,
  generatePersonalYearReading,
  getCachedBirthCardSynthesis,
  generateBirthCardSynthesis,
  recordBirthCardDepth1,
  type YearEnergyResponse,
} from '../../services/api';
import ThemedBackground from './ThemedBackground';
import Button from '../Button';
import { ShareBirthCardModal } from '../share';
import { Lightbox } from '../ui/Lightbox';
import PersonalityTab from './tabs/PersonalityTab';
import SoulTab from './tabs/SoulTab';
import DynamicTab from './tabs/DynamicTab';
import YearTab from './tabs/YearTab';

// Import extracted utilities and types
import {
  calculatePersonalYearNumber,
} from './birthCardUtils';

// Minimum synthesis length to consider it a proper AI synthesis (not static fallback)
const MIN_AI_SYNTHESIS_LENGTH = 800;
import type {
  LocationState,
  PersonalityCardData,
  SoulCardData,
  PairData,
  UnifiedCardData,
  YearEnergyData,
  TabId,
} from './birthCardTypes';

// JSON data loaded dynamically to avoid bundling ~788 KB into the chunk
type BirthCardJsonData = {
  personalityCards: PersonalityCardData[];
  soulCards: SoulCardData[];
  birthCardPairs: PairData[];
  unifiedBirthCards: UnifiedCardData[];
  yearEnergyCycle: YearEnergyData[];
};

async function loadBirthCardData(): Promise<BirthCardJsonData> {
  const [personalityCards, soulCards, birthCardPairs, unifiedBirthCards, yearEnergyCycle] =
    await Promise.all([
      import('../../constants/birthCards/personalityCards.json').then(m => m.default),
      import('../../constants/birthCards/soulCards.json').then(m => m.default),
      import('../../constants/birthCards/birthCardPairs.json').then(m => m.default),
      import('../../constants/birthCards/unifiedBirthCards.json').then(m => m.default),
      import('../../constants/birthCards/yearEnergyCycle.json').then(m => m.default),
    ]);
  return { personalityCards, soulCards, birthCardPairs, unifiedBirthCards, yearEnergyCycle };
}

const BirthCardReveal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useApp();
  const { getToken } = useAuth();
  const state = location.state as LocationState | null;

  const [activeTab, setActiveTab] = useState<TabId>('personality');
  const [isLoading, setIsLoading] = useState(true);
  const [jsonData, setJsonData] = useState<BirthCardJsonData | null>(null);

  const currentYear = new Date().getFullYear();
  const calculatedPersonalYear = state?.birthDate
    ? calculatePersonalYearNumber(
        parseInt(state.birthDate.month, 10),
        parseInt(state.birthDate.day, 10),
        currentYear
      )
    : null;

  // Year energy state (from new API)
  const [universalYearEnergy, setUniversalYearEnergy] = useState<YearEnergyResponse | null>(null);
  const [isLoadingYearEnergy, setIsLoadingYearEnergy] = useState(false);
  const [yearInterpretation, setYearInterpretation] = useState<string | null>(null);
  const [isGeneratingYear, setIsGeneratingYear] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);
  const [personalYearNumber, setPersonalYearNumber] = useState<number | null>(calculatedPersonalYear);

  // Birth card synthesis state (depth 2)
  const [synthesisText, setSynthesisText] = useState<string | null>(null);
  const [isSynthesisLoading, setIsSynthesisLoading] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const synthesisFetchedRef = React.useRef(false);
  const depth1RecordedRef = React.useRef(false);

  // Enlarged image modal state
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; alt: string } | null>(null);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Redirect if no state, load JSON data during loading animation
  useEffect(() => {
    if (!state?.birthDate) {
      const prefix = language === 'fr' ? '/fr' : '';
      navigate(`${prefix}/tarot-card-reading`);
      return;
    }

    let cancelled = false;
    const minDelay = new Promise<void>(resolve => setTimeout(resolve, 1500));

    Promise.all([minDelay, loadBirthCardData()]).then(([, data]) => {
      if (!cancelled) {
        setJsonData(data);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [state, navigate]);

  // Derive data from state and JSON (safe defaults when not yet loaded)
  const birthDate = state?.birthDate;
  const depth = state?.depth ?? 1;
  const day = birthDate ? parseInt(birthDate.day, 10) : 0;
  const month = birthDate ? parseInt(birthDate.month, 10) : 0;
  const year = birthDate ? parseInt(birthDate.year, 10) : 0;

  const { soulCard: soulCardId, personalityCard: personalityCardId } = day && month && year
    ? calculateBirthCards(day, month, year)
    : { soulCard: 0, personalityCard: 0 };

  const isUnified = soulCardId === personalityCardId;

  const personalityData = jsonData?.personalityCards.find(
    (c: PersonalityCardData) => c.cardId === personalityCardId
  ) as PersonalityCardData | undefined;

  // Fall back to personalityCards data if soulCards doesn't have this ID
  // (soulCards.json only covers IDs 1-9, but soulCardId can be 10-21)
  const soulData = (jsonData?.soulCards.find(
    (c: SoulCardData) => c.cardId === soulCardId
  ) || jsonData?.personalityCards.find(
    (c: PersonalityCardData) => c.cardId === soulCardId
  )) as SoulCardData | undefined;

  const pairData = !isUnified && jsonData
    ? (jsonData.birthCardPairs.find(
        (p: PairData) => p.personalityCardId === personalityCardId && p.soulCardId === soulCardId
      ) as PairData | undefined)
    : undefined;

  const unifiedData = isUnified && jsonData
    ? (jsonData.unifiedBirthCards.find((u: UnifiedCardData) => u.cardId === soulCardId) as UnifiedCardData | undefined)
    : undefined;

  const yearData = jsonData
    ? ((jsonData.yearEnergyCycle as YearEnergyData[]).find(y => y.year === currentYear)
      || (jsonData.yearEnergyCycle as YearEnergyData[])[0])
    : undefined;

  const personalityImageUrl = personalityCardId ? getCardImageUrl(personalityCardId) : '';
  const soulImageUrl = soulCardId ? getCardImageUrl(soulCardId) : '';
  const yearPrimaryImageUrl = depth >= 3 && yearData ? getCardImageUrl(yearData.primaryCardId) : '';

  // Get zodiac sign and elemental associations
  const zodiacSign = day && month ? getZodiacSign(month, day) : getZodiacSign(1, 1);
  const personalityAssociation = personalityCardId ? getMajorArcanaAssociation(personalityCardId) : undefined;
  const soulAssociation = soulCardId ? getMajorArcanaAssociation(soulCardId) : undefined;

  const birthDateISO = birthDate
    ? `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`
    : '';

  // Function to fetch universal year energy from API
  const fetchYearEnergy = useCallback(async () => {
    if (depth < 3 || universalYearEnergy || isLoadingYearEnergy) return;

    setIsLoadingYearEnergy(true);
    try {
      const energy = await getCurrentYearEnergy(language);
      setUniversalYearEnergy(energy);
    } catch (error) {
      console.error('[BirthCardReveal] Error fetching year energy:', error);
    } finally {
      setIsLoadingYearEnergy(false);
    }
  }, [depth, universalYearEnergy, isLoadingYearEnergy, language]);

  // Function to generate AI year energy interpretation using new API
  const generateYearInterpretation = useCallback(async () => {
    if (depth < 3 || yearInterpretation || isGeneratingYear || !birthDate) return;

    setIsGeneratingYear(true);
    setYearError(null);

    try {
      const token = await getToken();
      if (!token) {
        setYearError(language === 'en' ? 'Please sign in to view your personalized year reading' : 'Veuillez vous connecter pour voir votre lecture annuelle personnalisée');
        return;
      }

      const response = await generatePersonalYearReading(token, {
        personalityCard: {
          cardId: personalityCardId,
          cardName: personalityData?.cardName || '',
          cardNameFr: personalityData?.cardNameFr || '',
          element: personalityAssociation?.element || 'Spirit',
          elementFr: personalityAssociation?.elementFr || 'Esprit',
        },
        soulCard: {
          cardId: soulCardId,
          cardName: soulData?.cardName || '',
          cardNameFr: soulData?.cardNameFr || '',
          element: soulAssociation?.element || 'Spirit',
          elementFr: soulAssociation?.elementFr || 'Esprit',
        },
        zodiac: {
          name: zodiacSign.name,
          nameFr: zodiacSign.nameFr,
          element: zodiacSign.element,
          elementFr: zodiacSign.elementFr,
        },
        birthDate: birthDateISO,
        language,
        year: currentYear,
      });

      setYearInterpretation(response.synthesis);
      setPersonalYearNumber(response.personalYearNumber);
    } catch (error) {
      console.error('[BirthCardReveal] Error generating year interpretation:', error);
      setYearError(
        language === 'en'
          ? 'Unable to generate your personalized year reading. Please try again.'
          : 'Impossible de générer votre lecture annuelle personnalisée. Veuillez réessayer.'
      );
    } finally {
      setIsGeneratingYear(false);
    }
  }, [depth, yearInterpretation, isGeneratingYear, getToken, language, birthDate, birthDateISO, personalityCardId, soulCardId, personalityData, soulData, personalityAssociation, soulAssociation, zodiacSign, currentYear]);

  // Fetch year energy and generate interpretation when year tab is selected
  useEffect(() => {
    if (activeTab === 'year' && depth >= 3) {
      if (!universalYearEnergy && !isLoadingYearEnergy) {
        fetchYearEnergy();
      }
      if (!yearInterpretation && !isGeneratingYear) {
        generateYearInterpretation();
      }
    }
  }, [activeTab, depth, universalYearEnergy, isLoadingYearEnergy, fetchYearEnergy, yearInterpretation, isGeneratingYear, generateYearInterpretation]);

  // Depth 1: record the reading in history once (after JSON loads)
  useEffect(() => {
    if (isLoading || !jsonData || depth !== 1 || !personalityData || !birthDate || depth1RecordedRef.current) return;
    depth1RecordedRef.current = true;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await recordBirthCardDepth1(token, {
          birthDate: birthDateISO,
          personalityCard: {
            cardId: personalityData.cardId,
            cardName: personalityData.cardName,
            cardNameFr: personalityData.cardNameFr,
            descriptionEn: personalityData.descriptionEn,
            descriptionFr: personalityData.descriptionFr,
            element: personalityAssociation?.element || 'Spirit',
            elementFr: personalityAssociation?.elementFr || 'Esprit',
          },
          zodiacSign: zodiacSign.name,
        });
      } catch (err) {
        console.error('[BirthCardReveal] Failed to record depth-1 reading:', err);
      }
    })();
  }, [isLoading, jsonData, depth, personalityData, birthDate, birthDateISO, zodiacSign, personalityAssociation, getToken]);

  // Depth 2: load synthesis when dynamic tab is activated
  useEffect(() => {
    if (activeTab !== 'dynamic' || depth < 2 || isLoading || !jsonData) return;
    if (synthesisFetchedRef.current || synthesisText || isSynthesisLoading) return;
    if (!personalityData || !soulData) return;
    synthesisFetchedRef.current = true;

    (async () => {
      setIsSynthesisLoading(true);
      setSynthesisError(null);
      try {
        const token = await getToken();
        if (!token) {
          setSynthesisError(language === 'en' ? 'Please sign in to view your synthesis' : 'Veuillez vous connecter pour voir votre synthèse');
          return;
        }

        // Check cache first
        const cached = await getCachedBirthCardSynthesis(token, language as 'en' | 'fr');
        if (cached.cached && cached.cached.interpretation.length >= MIN_AI_SYNTHESIS_LENGTH) {
          setSynthesisText(cached.cached.interpretation);
          return;
        }

        // Generate fresh AI synthesis
        const result = await generateBirthCardSynthesis(token, {
          birthDate: birthDateISO,
          personalityCard: {
            cardId: personalityData.cardId,
            cardName: personalityData.cardName,
            cardNameFr: personalityData.cardNameFr,
            description: language === 'en' ? personalityData.descriptionEn : personalityData.descriptionFr,
            element: personalityAssociation?.element || 'Spirit',
            elementFr: personalityAssociation?.elementFr || 'Esprit',
            planet: personalityAssociation?.planet || 'Unknown',
            planetFr: personalityAssociation?.planetFr || 'Inconnu',
            keywords: personalityAssociation?.keywords || personalityData.keyThemesEn,
          },
          soulCard: {
            cardId: soulCardId,
            cardName: soulData.cardName,
            cardNameFr: soulData.cardNameFr,
            description: language === 'en' ? soulData.descriptionEn : soulData.descriptionFr,
            element: soulAssociation?.element || 'Spirit',
            elementFr: soulAssociation?.elementFr || 'Esprit',
            planet: soulAssociation?.planet || 'Unknown',
            planetFr: soulAssociation?.planetFr || 'Inconnu',
            keywords: soulAssociation?.keywords || soulData.keyThemesEn,
          },
          zodiac: {
            name: zodiacSign.name,
            nameFr: zodiacSign.nameFr,
            element: zodiacSign.element,
            elementFr: zodiacSign.elementFr,
            quality: zodiacSign.quality,
            qualityFr: zodiacSign.qualityFr,
            rulingPlanet: zodiacSign.rulingPlanet,
            rulingPlanetFr: zodiacSign.rulingPlanetFr,
          },
          isUnified,
          language: language as 'en' | 'fr',
        });
        setSynthesisText(result.interpretation);
      } catch (err) {
        console.error('[BirthCardReveal] Synthesis error:', err);
        setSynthesisError(
          language === 'en'
            ? 'Unable to generate your synthesis. Please try again.'
            : 'Impossible de générer votre synthèse. Veuillez réessayer.'
        );
      } finally {
        setIsSynthesisLoading(false);
      }
    })();
  }, [activeTab, depth, isLoading, jsonData, synthesisText, isSynthesisLoading, personalityData, soulData, soulCardId, birthDateISO, language, isUnified, zodiacSign, personalityAssociation, soulAssociation, getToken]);

  // Early returns AFTER all hooks
  if (!state?.birthDate || !jsonData) {
    return null;
  }

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

  const formattedDate = `${birthDate.day}/${birthDate.month}/${birthDate.year}`;

  const handleBack = () => {
    navigate(`/reading/birth-cards/${depth}`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, cardName: string) => {
    console.error(`[BirthCardReveal] Failed to load image for ${cardName}:`, e.currentTarget.src);
  };

  const openEnlargedImage = (url: string, alt: string) => {
    setEnlargedImage({ url, alt });
  };

  const closeEnlargedImage = () => {
    setEnlargedImage(null);
  };

  // Render Personality Tab
  const renderPersonalityTab = () => (
    <PersonalityTab
      personalityData={personalityData}
      personalityImageUrl={personalityImageUrl}
      language={language}
      onEnlargeImage={openEnlargedImage}
      onImageError={handleImageError}
    />
  );

  // Render Soul Tab (for depth >= 2)
  const renderSoulTab = () => (
    <SoulTab
      depth={depth}
      soulData={soulData}
      soulImageUrl={soulImageUrl}
      language={language}
      onEnlargeImage={openEnlargedImage}
      onImageError={handleImageError}
    />
  );

  // Render Dynamic/Unified Tab (for depth >= 2)
  const handleRetrySynthesis = () => {
    synthesisFetchedRef.current = false;
    setSynthesisError(null);
    setSynthesisText(null);
  };

  const renderDynamicTab = () => (
    <DynamicTab
      depth={depth}
      isUnified={isUnified}
      language={language}
      personalityData={personalityData}
      soulData={soulData}
      pairData={pairData}
      unifiedData={unifiedData}
      personalityImageUrl={personalityImageUrl}
      soulImageUrl={soulImageUrl}
      zodiacSign={zodiacSign}
      personalityAssociation={personalityAssociation}
      soulAssociation={soulAssociation}
      synthesisText={synthesisText}
      isSynthesisLoading={isSynthesisLoading}
      synthesisError={synthesisError}
      onRetrySynthesis={handleRetrySynthesis}
      onEnlargeImage={openEnlargedImage}
      onImageError={handleImageError}
    />
  );

  // Render Year Tab (for depth >= 3)
  const handleRetryYear = () => {
    setYearError(null);
    generateYearInterpretation();
  };

  const renderYearTab = () => (
    <YearTab
      depth={depth}
      language={language}
      currentYear={currentYear}
      calculatedPersonalYear={calculatedPersonalYear}
      personalYearNumber={personalYearNumber}
      yearData={yearData}
      universalYearEnergy={universalYearEnergy}
      isLoadingYearEnergy={isLoadingYearEnergy}
      yearPrimaryImageUrl={yearPrimaryImageUrl}
      yearInterpretation={yearInterpretation}
      isGeneratingYear={isGeneratingYear}
      yearError={yearError}
      onRetryYear={handleRetryYear}
      onImageError={handleImageError}
    />
  );

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

  if (depth >= 3 && yearData) {
    tabs.push({
      id: 'year',
      icon: <MoonIcon className="w-5 h-5" />,
      label: `${yearData.year}`,
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
            {depth === 1
              ? (language === 'en' ? 'Your Birth Card' : 'Votre Carte de Naissance')
              : (language === 'en' ? 'Your Birth Cards' : 'Vos Cartes de Naissance')
            }
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
        <div className="flex-1 px-4 pb-8 max-w-4xl mx-auto w-full">
          <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Share button - visible for depth >= 2 */}
          {depth >= 2 && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg shadow-lg shadow-violet-500/30 transition-all hover:scale-105"
            >
              <Share2 className="w-4 h-4" />
              <span className="font-medium">
                {language === 'en' ? 'Share Your Birth Cards' : 'Partagez vos Cartes'}
              </span>
            </button>
          )}
          <Button
            onClick={() => navigate(`${language === 'fr' ? '/fr' : ''}/tarot-card-reading`)}
            variant="outline"
            className="text-white/70 border-white/20 hover:border-white/40"
          >
            {language === 'en' ? 'Start Another Reading' : 'Commencer une autre lecture'}
          </Button>
        </div>
      </div>

      {/* Enlarged Image Modal */}
      <Lightbox image={enlargedImage} onClose={closeEnlargedImage} optimizeImage={false} showCaption backdropBlur />

      {/* Share Birth Cards Modal */}
      <ShareBirthCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        personalityCardId={personalityCardId}
        soulCardId={soulCardId}
        zodiacSign={language === 'en' ? zodiacSign.name : zodiacSign.nameFr}
        readingText={
          isUnified
            ? (language === 'en' ? unifiedData?.descriptionEn : unifiedData?.descriptionFr)
            : (language === 'en' ? pairData?.dynamicEn : pairData?.dynamicFr) || undefined
        }
      />
    </div>
  );
};

export default BirthCardReveal;
