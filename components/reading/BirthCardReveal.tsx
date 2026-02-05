// components/reading/BirthCardReveal.tsx
// Displays the birth card reading results based on depth:
// - Depth 1: Personality Card only
// - Depth 2: Personality + Soul Card (or Unified if same)
// - Depth 3: Year Energy Reading
// Note: dangerouslySetInnerHTML is used with trusted static JSON content (not user input)

import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sun, Moon as MoonIcon, ChevronLeft, Sparkles, Calendar, Loader2, Share2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { SpreadType, BirthCardDepth } from '../../types';
import { calculateBirthCards, getZodiacSign, getMajorArcanaAssociation } from '../../constants/birthCardMeanings';
import { getCardImageUrl } from '../../constants/cardImages';
import {
  generateBirthCardSynthesis,
  getCurrentYearEnergy,
  generatePersonalYearReading,
  type YearEnergyResponse,
} from '../../services/api';
import ThemedBackground from './ThemedBackground';
import Button from '../Button';
import { ShareBirthCardModal } from '../share';

// Import extracted utilities and types
import {
  formatHtmlContent,
  calculatePersonalYearNumber,
  MAJOR_ARCANA_NAMES,
} from './birthCardUtils';
import type {
  LocationState,
  PersonalityCardData,
  SoulCardData,
  PairData,
  UnifiedCardData,
  YearEnergyData,
  TabId,
} from './birthCardTypes';

// Import JSON data files (trusted static content)
import personalityCards from '../../constants/birthCards/personalityCards.json';
import soulCards from '../../constants/birthCards/soulCards.json';
import birthCardPairs from '../../constants/birthCards/birthCardPairs.json';
import unifiedBirthCards from '../../constants/birthCards/unifiedBirthCards.json';
import yearEnergyCycle from '../../constants/birthCards/yearEnergyCycle.json';

const BirthCardReveal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useApp();
  const { getToken } = useAuth();
  const state = location.state as LocationState | null;

  const [activeTab, setActiveTab] = useState<TabId>('personality');
  const [isLoading, setIsLoading] = useState(true);

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

  // AI-generated synthesis interpretation state (for depth 2 Dynamic tab)
  const [synthesisInterpretation, setSynthesisInterpretation] = useState<string | null>(null);
  const [isGeneratingSynthesis, setIsGeneratingSynthesis] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);

  // Enlarged image modal state
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; alt: string } | null>(null);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

  // Get year energy data for current year (defaults to 2026, the current cycle start)
  const yearData = (yearEnergyCycle as YearEnergyData[]).find(y => y.year === currentYear)
    || (yearEnergyCycle as YearEnergyData[])[0]; // Fallback to 2026 if not found

  // Build image URLs
  const personalityImageUrl = getCardImageUrl(personalityCardId);
  const soulImageUrl = getCardImageUrl(soulCardId);
  const yearPrimaryImageUrl = depth >= 3 && yearData ? getCardImageUrl(yearData.primaryCardId) : '';
  const yearReducedImageUrl = depth >= 3 && yearData && !yearData.isUnified
    ? getCardImageUrl(yearData.reducedCardId)
    : '';

  // Handle image load error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, cardName: string) => {
    console.error(`[BirthCardReveal] Failed to load image for ${cardName}:`, e.currentTarget.src);
  };

  // Open enlarged image modal
  const openEnlargedImage = (url: string, alt: string) => {
    setEnlargedImage({ url, alt });
  };

  // Close enlarged image modal
  const closeEnlargedImage = () => {
    setEnlargedImage(null);
  };

  // Format birth date for display
  const formattedDate = `${birthDate.day}/${birthDate.month}/${birthDate.year}`;

  const handleBack = () => {
    navigate(`/reading/birth-cards/${depth}`);
  };

  // Function to fetch universal year energy from API
  const fetchYearEnergy = useCallback(async () => {
    if (depth < 3 || universalYearEnergy || isLoadingYearEnergy) return;

    setIsLoadingYearEnergy(true);
    try {
      const energy = await getCurrentYearEnergy(language);
      setUniversalYearEnergy(energy);
    } catch (error) {
      console.error('[BirthCardReveal] Error fetching year energy:', error);
      // Fall back to static data if API fails
    } finally {
      setIsLoadingYearEnergy(false);
    }
  }, [depth, universalYearEnergy, isLoadingYearEnergy, language]);

  // Function to generate AI year energy interpretation using new API
  const generateYearInterpretation = useCallback(async () => {
    if (depth < 3 || yearInterpretation || isGeneratingYear) return;

    setIsGeneratingYear(true);
    setYearError(null);

    try {
      const token = await getToken();
      if (!token) {
        setYearError(language === 'en' ? 'Please sign in to view your personalized year reading' : 'Veuillez vous connecter pour voir votre lecture annuelle personnalisée');
        return;
      }

      const currentYear = new Date().getFullYear();
      const birthDateISO = `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`;

      // Always call the generate endpoint - it handles caching internally
      // and properly checks if birth cards match before returning cached data
      const zodiacSign = getZodiacSign(month, day);
      const personalityAssociation = getMajorArcanaAssociation(personalityCardId);
      const soulAssociation = getMajorArcanaAssociation(soulCardId);

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
  }, [depth, yearInterpretation, isGeneratingYear, getToken, language, birthDate, month, day, personalityCardId, soulCardId, personalityData, soulData]);

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

  // Get zodiac sign and elemental associations for synthesis
  const zodiacSign = getZodiacSign(month, day);
  const personalityAssociation = getMajorArcanaAssociation(personalityCardId);
  const soulAssociation = getMajorArcanaAssociation(soulCardId);

  // Format birth date as ISO string for API
  const birthDateISO = `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`;

  // Function to generate AI birth card synthesis interpretation (for depth 2)
  const generateSynthesisInterpretation = useCallback(async () => {
    if (depth < 2 || isUnified || synthesisInterpretation || isGeneratingSynthesis) return;

    setIsGeneratingSynthesis(true);
    setSynthesisError(null);

    try {
      const token = await getToken();
      if (!token) {
        setSynthesisError(language === 'en' ? 'Please sign in to view your personalized reading' : 'Veuillez vous connecter pour voir votre lecture personnalisée');
        return;
      }

      // Always generate new synthesis (charges 2 credits)
      // Users can view past readings in their history instead of regenerating
      console.log('[BirthCardReveal] Generating birth card synthesis...');
      const response = await generateBirthCardSynthesis(token, {
        birthDate: birthDateISO,
        personalityCard: {
          cardId: personalityCardId,
          cardName: personalityData?.cardName || '',
          cardNameFr: personalityData?.cardNameFr || '',
          description: language === 'en'
            ? personalityData?.descriptionEn || ''
            : personalityData?.descriptionFr || '',
          element: personalityAssociation?.element || 'Spirit',
          elementFr: personalityAssociation?.elementFr || 'Esprit',
          planet: personalityAssociation?.planet || '',
          planetFr: personalityAssociation?.planetFr || '',
          keywords: language === 'en'
            ? personalityAssociation?.keywords || []
            : personalityAssociation?.keywordsFr || [],
        },
        soulCard: {
          cardId: soulCardId,
          cardName: soulData?.cardName || '',
          cardNameFr: soulData?.cardNameFr || '',
          description: language === 'en'
            ? soulData?.descriptionEn || ''
            : soulData?.descriptionFr || '',
          element: soulAssociation?.element || 'Spirit',
          elementFr: soulAssociation?.elementFr || 'Esprit',
          planet: soulAssociation?.planet || '',
          planetFr: soulAssociation?.planetFr || '',
          keywords: language === 'en'
            ? soulAssociation?.keywords || []
            : soulAssociation?.keywordsFr || [],
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
        language,
      });

      setSynthesisInterpretation(response.interpretation);
    } catch (error) {
      console.error('[BirthCardReveal] Error generating synthesis interpretation:', error);
      setSynthesisError(
        language === 'en'
          ? 'Unable to generate your personalized reading. Please try again.'
          : 'Impossible de générer votre lecture personnalisée. Veuillez réessayer.'
      );
    } finally {
      setIsGeneratingSynthesis(false);
    }
  }, [depth, isUnified, synthesisInterpretation, isGeneratingSynthesis, getToken, language, personalityCardId, soulCardId, personalityData, soulData, personalityAssociation, soulAssociation, zodiacSign, birthDateISO]);

  // Generate synthesis interpretation when dynamic tab is selected (depth 2 only, non-unified)
  useEffect(() => {
    if (activeTab === 'dynamic' && depth >= 2 && !isUnified && !synthesisInterpretation && !isGeneratingSynthesis) {
      generateSynthesisInterpretation();
    }
  }, [activeTab, depth, isUnified, synthesisInterpretation, isGeneratingSynthesis, generateSynthesisInterpretation]);

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
        <button
          onClick={() => openEnlargedImage(personalityImageUrl, personalityData?.cardName || 'Personality Card')}
          className="rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
          style={{ boxShadow: '0 0 40px rgba(251, 191, 36, 0.3)' }}
        >
          <img
            src={personalityImageUrl}
            alt={personalityData?.cardName || 'Personality Card'}
            className="w-48 h-72 md:w-56 md:h-84 object-contain bg-black/20"
            onError={(e) => handleImageError(e, personalityData?.cardName || 'Personality Card')}
          />
        </button>
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
            className="max-w-none text-white/90 leading-relaxed birth-card-content"
            dangerouslySetInnerHTML={{
              __html: formatHtmlContent(language === 'en' ? personalityData.descriptionEn : personalityData.descriptionFr),
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
          <button
            onClick={() => openEnlargedImage(soulImageUrl, soulData?.cardName || 'Soul Card')}
            className="rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
            style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}
          >
            <img
              src={soulImageUrl}
              alt={soulData?.cardName || 'Soul Card'}
              className="w-48 h-72 md:w-56 md:h-84 object-contain bg-black/20"
              onError={(e) => handleImageError(e, soulData?.cardName || 'Soul Card')}
            />
          </button>
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
              className="max-w-none text-white/90 leading-relaxed birth-card-content"
              dangerouslySetInnerHTML={{
                __html: formatHtmlContent(language === 'en' ? soulData.descriptionEn : soulData.descriptionFr),
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
        {/* Card(s) Display - Single large for unified, side by side for pair */}
        <div className="flex justify-center gap-4">
          {isUnified ? (
            // Unified: Single large card (same size as Personality/Soul tabs)
            <button
              onClick={() => openEnlargedImage(personalityImageUrl, unifiedData?.cardName || 'Unified Card')}
              className="rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
              style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}
            >
              <img
                src={personalityImageUrl}
                alt={unifiedData?.cardName || 'Unified Card'}
                className="w-48 h-72 md:w-56 md:h-84 object-contain bg-black/20"
                onError={(e) => handleImageError(e, unifiedData?.cardName || 'Unified Card')}
              />
            </button>
          ) : (
            // Pair: Two cards side by side
            <>
              <button
                onClick={() => openEnlargedImage(personalityImageUrl, personalityData?.cardName || 'Personality')}
                className="rounded-xl overflow-hidden shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                style={{ boxShadow: '0 0 25px rgba(251, 191, 36, 0.3)' }}
              >
                <img
                  src={personalityImageUrl}
                  alt={personalityData?.cardName || 'Personality'}
                  className="w-36 h-54 md:w-44 md:h-66 object-contain bg-black/20"
                  onError={(e) => handleImageError(e, personalityData?.cardName || 'Personality')}
                />
              </button>
              <button
                onClick={() => openEnlargedImage(soulImageUrl, soulData?.cardName || 'Soul')}
                className="rounded-xl overflow-hidden shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                style={{ boxShadow: '0 0 25px rgba(139, 92, 246, 0.3)' }}
              >
                <img
                  src={soulImageUrl}
                  alt={soulData?.cardName || 'Soul'}
                  className="w-36 h-54 md:w-44 md:h-66 object-contain bg-black/20"
                  onError={(e) => handleImageError(e, soulData?.cardName || 'Soul')}
                />
              </button>
            </>
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

        {/* Description - AI-generated for pairs, static for unified */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          {isUnified && unifiedData?.descriptionEn ? (
            <div
              className="max-w-none text-white/90 leading-relaxed birth-card-content"
              dangerouslySetInnerHTML={{
                __html: formatHtmlContent(language === 'en' ? unifiedData.descriptionEn : unifiedData.descriptionFr),
              }}
            />
          ) : !isUnified ? (
            // AI-Generated Synthesis for non-unified pairs
            <>
              {isGeneratingSynthesis ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="mb-4"
                  >
                    <Loader2 className="w-8 h-8 text-violet-400" />
                  </motion.div>
                  <p className="text-white/60 text-sm">
                    {language === 'en'
                      ? 'Weaving together your cards, zodiac, and elemental energies...'
                      : 'Tissage de vos cartes, zodiaque et énergies élémentaires...'}
                  </p>
                </div>
              ) : synthesisError ? (
                <div className="text-center py-4">
                  <p className="text-red-400 mb-4">{synthesisError}</p>
                  <button
                    onClick={() => {
                      setSynthesisError(null);
                      generateSynthesisInterpretation();
                    }}
                    className="px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg hover:bg-violet-500/30 transition-colors"
                  >
                    {language === 'en' ? 'Try Again' : 'Réessayer'}
                  </button>
                </div>
              ) : synthesisInterpretation ? (
                <div
                  className="max-w-none text-white/90 leading-relaxed birth-card-content"
                  dangerouslySetInnerHTML={{ __html: formatHtmlContent(synthesisInterpretation) }}
                />
              ) : (
                <p className="text-white/60 italic text-center">
                  {language === 'en'
                    ? 'Your personalized reading will appear here...'
                    : 'Votre lecture personnalisée apparaîtra ici...'}
                </p>
              )}
            </>
          ) : (
            <p className="text-white/60 italic text-center">
              {language === 'en' ? 'Content coming soon...' : 'Contenu à venir...'}
            </p>
          )}
        </div>

        {/* Zodiac & Elemental Info - Show for non-unified pairs */}
        {!isUnified && synthesisInterpretation && (
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {language === 'en' ? zodiacSign.name : zodiacSign.nameFr}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {language === 'en' ? `${personalityAssociation?.element || 'Spirit'} + ${soulAssociation?.element || 'Spirit'}` : `${personalityAssociation?.elementFr || 'Esprit'} + ${soulAssociation?.elementFr || 'Esprit'}`}
              </span>
              <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {language === 'en' ? zodiacSign.quality : zodiacSign.qualityFr}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Render Year Tab (for depth >= 3)
  const renderYearTab = () => {
    if (depth < 3) return null;

    // Use API data if available, fall back to static data
    const yearEnergy = universalYearEnergy;
    const displayYear = new Date().getFullYear();
    const yearCardImageUrl = yearEnergy ? getCardImageUrl(yearEnergy.yearCard.id) : yearPrimaryImageUrl;
    // Use calculated personal year immediately, or from state if set by API
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
                    onError={(e) => handleImageError(e, yearEnergy?.yearCard.name || 'Year Card')}
                  />
                </div>
                <p className="text-sky-300 font-heading text-lg mb-1">
                  {yearEnergy?.yearCard.name || (language === 'en' ? 'The Magician' : 'Le Bateleur')}
                </p>
                <p className="text-white/50 text-xs">
                  {language === 'en' ? 'Universal Year Card' : 'Carte Année Universelle'}
                </p>
              </div>

              {/* Personal Year Card - always show if we have the number */}
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
                      onError={(e) => handleImageError(e, 'Personal Year Card')}
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
                onClick={() => {
                  setYearError(null);
                  generateYearInterpretation();
                }}
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
            onClick={() => navigate('/reading')}
            variant="outline"
            className="text-white/70 border-white/20 hover:border-white/40"
          >
            {language === 'en' ? 'Start Another Reading' : 'Commencer une autre lecture'}
          </Button>
        </div>
      </div>

      {/* Enlarged Image Modal */}
      <AnimatePresence>
        {enlargedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={closeEnlargedImage}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-lg max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={enlargedImage.url}
                alt={enlargedImage.alt}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
              <button
                onClick={closeEnlargedImage}
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
              <p className="text-center text-white/80 mt-4 font-heading">
                {enlargedImage.alt}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            : synthesisInterpretation || undefined
        }
      />
    </div>
  );
};

export default BirthCardReveal;
