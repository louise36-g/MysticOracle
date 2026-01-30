// components/reading/BirthCardReveal.tsx
// Displays the birth card reading results based on depth:
// - Depth 1: Personality Card only
// - Depth 2: Personality + Soul Card (or Unified if same)
// - Depth 3: Year Energy Reading
// Note: dangerouslySetInnerHTML is used with trusted static JSON content (not user input)

import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sun, Moon as MoonIcon, ChevronLeft, Sparkles, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { SpreadType, BirthCardDepth } from '../../types';
import { calculateBirthCards } from '../../constants/birthCardMeanings';
import { getCardImageUrl } from '../../constants/cardImages';
import { generateYearEnergyReading } from '../../services/apiService';
import ThemedBackground from './ThemedBackground';
import Button from '../Button';

// Import JSON data files (trusted static content)
import personalityCards from '../../constants/birthCards/personalityCards.json';
import soulCards from '../../constants/birthCards/soulCards.json';
import birthCardPairs from '../../constants/birthCards/birthCardPairs.json';
import unifiedBirthCards from '../../constants/birthCards/unifiedBirthCards.json';
import yearEnergyCycle from '../../constants/birthCards/yearEnergyCycle.json';

/**
 * Format HTML content by converting newlines to proper HTML structure
 * - Processes line-by-line to properly detect headers
 * - Detects plain text headers and wraps in h2
 * - Preserves existing HTML block elements
 * - Ensures h2/h3 tags have visible styling
 */
function formatHtmlContent(content: string): string {
  if (!content) return '';

  // Header style constants
  const h2Style = 'font-size: 1.5rem; font-weight: 600; color: #c4b5fd; text-align: center; margin: 1.5rem 0 0.75rem 0;';
  const h3Style = 'font-size: 1.25rem; font-weight: 600; color: #a78bfa; text-align: center; margin: 1.25rem 0 0.5rem 0;';

  // Exact header texts to detect (these appear on their own line)
  const exactHeaders = new Set([
    'what is a personality card?',
    'what is a soul card?',
    'how others experience you',
    'your visible gifts',
    'your growth edges',
    'working with your personality card',
    'working with your soul card',
    'daily awareness',
    'reflection questions',
    'your personality card in relationship',
    'your soul card in relationship',
  ]);

  // Check if line is a header
  const isHeaderLine = (line: string): boolean => {
    const trimmed = line.trim().toLowerCase();
    if (exactHeaders.has(trimmed)) return true;
    // Pattern: "The [Card Name]: Your Outer/Inner Expression" (card name can be 1-4 words)
    if (/^the [\w\s]+: your (outer |inner )?expression$/i.test(line.trim())) return true;
    // Pattern: "Embracing Your [Card] Expression/Energy"
    if (/^embracing your [\w\s]+ (expression|energy)$/i.test(line.trim())) return true;
    return false;
  };

  // Process line by line
  const lines = content.split('\n');
  const elements: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        if (/^<(h[1-6]|div|ul|ol|li|blockquote|p)/i.test(text)) {
          elements.push(text);
        } else {
          elements.push(`<p style="margin-bottom: 0.75em;">${text}</p>`);
        }
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line = paragraph break
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Check if this is a standalone header line
    if (isHeaderLine(trimmed)) {
      flushParagraph();
      elements.push(`<h2 style="${h2Style}">${trimmed}</h2>`);
      continue;
    }

    // Regular content - add to current paragraph
    currentParagraph.push(trimmed);
  }

  // Flush any remaining content
  flushParagraph();

  // Italicize the last element if it's a reflective question (starts with How/What and ends with ?)
  if (elements.length > 0) {
    const lastIdx = elements.length - 1;
    const last = elements[lastIdx];
    // Check if it's a paragraph containing a question that isn't already italicized
    if (
      last.startsWith('<p') &&
      !last.includes('<em>') &&
      /\b(How|What)\b.*\?/.test(last)
    ) {
      // Extract the content and wrap in em
      elements[lastIdx] = last.replace(
        /<p([^>]*)>(.*)<\/p>/,
        '<p$1><em>$2</em></p>'
      );
    }
  }

  // Join all elements
  let result = elements.join('');

  // Ensure any existing h2/h3 tags in original content have visible styling
  result = result.replace(/<h2[^>]*>/gi, `<h2 style="${h2Style}">`);
  result = result.replace(/<h3[^>]*>/gi, `<h3 style="${h3Style}">`);

  return result;
}

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

interface YearEnergyData {
  year: number;
  primaryCardId: number;
  primaryCardName: string;
  primaryCardNameFr: string;
  reducedCardId: number;
  reducedCardName: string;
  reducedCardNameFr: string;
  isUnified: boolean;
  descriptionEn: string;
  descriptionFr: string;
  keywordsEn: string[];
  keywordsFr: string[];
}

const BirthCardReveal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useApp();
  const { getToken } = useAuth();
  const state = location.state as LocationState | null;

  type TabId = 'personality' | 'soul' | 'dynamic' | 'year';
  const [activeTab, setActiveTab] = useState<TabId>('personality');
  const [isLoading, setIsLoading] = useState(true);

  // AI-generated year energy interpretation state
  const [yearInterpretation, setYearInterpretation] = useState<string | null>(null);
  const [isGeneratingYear, setIsGeneratingYear] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);

  // Enlarged image modal state
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; alt: string } | null>(null);

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
  const currentYear = new Date().getFullYear();
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

  // Function to generate AI year energy interpretation
  const generateYearInterpretation = useCallback(async () => {
    if (!yearData || depth < 3 || yearInterpretation || isGeneratingYear) return;

    setIsGeneratingYear(true);
    setYearError(null);

    try {
      const token = await getToken();
      if (!token) {
        setYearError(language === 'en' ? 'Please sign in to view your personalized year reading' : 'Veuillez vous connecter pour voir votre lecture annuelle personnalisée');
        return;
      }

      const response = await generateYearEnergyReading(token, {
        year: yearData.year,
        yearEnergy: {
          primaryCardName: yearData.primaryCardName,
          primaryCardNameFr: yearData.primaryCardNameFr,
          reducedCardName: yearData.reducedCardName,
          reducedCardNameFr: yearData.reducedCardNameFr,
          isUnified: yearData.isUnified,
          description: language === 'en' ? yearData.descriptionEn : yearData.descriptionFr,
        },
        personalityCard: {
          cardName: personalityData?.cardName || '',
          cardNameFr: personalityData?.cardNameFr || '',
          description: language === 'en'
            ? personalityData?.descriptionEn || ''
            : personalityData?.descriptionFr || '',
        },
        soulCard: {
          cardName: soulData?.cardName || '',
          cardNameFr: soulData?.cardNameFr || '',
          description: language === 'en'
            ? soulData?.descriptionEn || ''
            : soulData?.descriptionFr || '',
        },
        isUnifiedBirthCard: isUnified,
        language,
      });

      setYearInterpretation(response.interpretation);
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
  }, [yearData, depth, yearInterpretation, isGeneratingYear, getToken, language, personalityData, soulData, isUnified]);

  // Generate year interpretation when year tab is selected
  useEffect(() => {
    if (activeTab === 'year' && depth >= 3 && !yearInterpretation && !isGeneratingYear) {
      generateYearInterpretation();
    }
  }, [activeTab, depth, yearInterpretation, isGeneratingYear, generateYearInterpretation]);

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
            className="prose prose-invert prose-amber max-w-none text-white/90 leading-relaxed birth-card-content"
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
              className="prose prose-invert prose-violet max-w-none text-white/90 leading-relaxed birth-card-content"
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

        {/* Description */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          {isUnified && unifiedData?.descriptionEn ? (
            <div
              className="prose prose-invert max-w-none text-white/90 leading-relaxed birth-card-content"
              dangerouslySetInnerHTML={{
                __html: formatHtmlContent(language === 'en' ? unifiedData.descriptionEn : unifiedData.descriptionFr),
              }}
            />
          ) : !isUnified && pairData?.dynamicEn ? (
            <div
              className="prose prose-invert max-w-none text-white/90 leading-relaxed birth-card-content"
              dangerouslySetInnerHTML={{
                __html: formatHtmlContent(language === 'en' ? pairData.dynamicEn : pairData.dynamicFr),
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
    if (depth < 3 || !yearData) return null;

    return (
      <motion.div
        key="year"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        {/* Year Card Image(s) - Show both for dual years, single for unified */}
        <div className="flex justify-center gap-4">
          {/* Primary Year Card */}
          <button
            onClick={() => openEnlargedImage(yearPrimaryImageUrl, yearData.primaryCardName)}
            className="rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
            style={{ boxShadow: '0 0 40px rgba(56, 189, 248, 0.3)' }}
          >
            <img
              src={yearPrimaryImageUrl}
              alt={yearData.primaryCardName}
              className={`${yearData.isUnified ? 'w-48 h-72 md:w-56 md:h-84' : 'w-36 h-54 md:w-44 md:h-66'} object-contain bg-black/20`}
              onError={(e) => handleImageError(e, yearData.primaryCardName)}
            />
          </button>
          {/* Reduced Year Card (only for dual years) */}
          {!yearData.isUnified && yearReducedImageUrl && (
            <button
              onClick={() => openEnlargedImage(yearReducedImageUrl, yearData.reducedCardName)}
              className="rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
              style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}
            >
              <img
                src={yearReducedImageUrl}
                alt={yearData.reducedCardName}
                className="w-36 h-54 md:w-44 md:h-66 object-contain bg-black/20"
                onError={(e) => handleImageError(e, yearData.reducedCardName)}
              />
            </button>
          )}
        </div>

        {/* Header */}
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-heading text-sky-300 mb-2">
            {language === 'en' ? `Year ${yearData.year} Energy` : `Énergie de l'Année ${yearData.year}`}
          </h3>
          <p className="text-white/70 text-sm mb-3">
            {yearData.isUnified ? (
              // Unified year - single card
              language === 'en' ? yearData.primaryCardName : yearData.primaryCardNameFr
            ) : (
              // Dual energy year
              <>
                {language === 'en' ? yearData.primaryCardName : yearData.primaryCardNameFr}
                {' → '}
                {language === 'en' ? yearData.reducedCardName : yearData.reducedCardNameFr}
              </>
            )}
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

        {/* Year Energy Description (Static) */}
        {yearData.descriptionEn && (
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-sky-500/20">
            <h4 className="text-sky-300 font-heading text-lg mb-3">
              {language === 'en' ? `The ${yearData.year} Energy` : `L'Énergie de ${yearData.year}`}
            </h4>
            <div
              className="prose prose-invert prose-sky max-w-none text-white/90 leading-relaxed birth-card-content"
              dangerouslySetInnerHTML={{
                __html: formatHtmlContent(language === 'en' ? yearData.descriptionEn : yearData.descriptionFr),
              }}
            />
          </div>
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
              className="prose prose-invert prose-sky max-w-none text-white/90 leading-relaxed birth-card-content"
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
        <div className="flex-1 px-4 pb-8 max-w-4xl mx-auto w-full">
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
    </div>
  );
};

export default BirthCardReveal;
