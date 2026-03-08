import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { formatHtmlContent } from '../birthCardUtils';
import type { PersonalityCardData, SoulCardData, PairData, UnifiedCardData } from '../birthCardTypes';

interface ZodiacInfo {
  name: string;
  nameFr: string;
  quality: string;
  qualityFr: string;
}

interface ElementAssociation {
  element?: string;
  elementFr?: string;
}

interface DynamicTabProps {
  depth: number;
  isUnified: boolean;
  language: string;
  personalityData: PersonalityCardData | undefined;
  soulData: SoulCardData | undefined;
  pairData: PairData | undefined;
  unifiedData: UnifiedCardData | undefined;
  personalityImageUrl: string;
  soulImageUrl: string;
  zodiacSign: ZodiacInfo;
  personalityAssociation: ElementAssociation | undefined;
  soulAssociation: ElementAssociation | undefined;
  synthesisInterpretation: string | null;
  isGeneratingSynthesis: boolean;
  synthesisError: string | null;
  onRetrySynthesis: () => void;
  onEnlargeImage: (url: string, alt: string) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, cardName: string) => void;
}

const DynamicTab: React.FC<DynamicTabProps> = ({
  depth,
  isUnified,
  language,
  personalityData,
  soulData,
  pairData,
  unifiedData,
  personalityImageUrl,
  soulImageUrl,
  zodiacSign,
  personalityAssociation,
  soulAssociation,
  synthesisInterpretation,
  isGeneratingSynthesis,
  synthesisError,
  onRetrySynthesis,
  onEnlargeImage,
  onImageError,
}) => {
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
          <button
            onClick={() => onEnlargeImage(personalityImageUrl, unifiedData?.cardName || 'Unified Card')}
            className="rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
            style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}
          >
            <img
              src={personalityImageUrl}
              alt={unifiedData?.cardName || 'Unified Card'}
              className="w-48 h-72 md:w-56 md:h-84 object-contain bg-black/20"
              onError={(e) => onImageError(e, unifiedData?.cardName || 'Unified Card')}
            />
          </button>
        ) : (
          <>
            <button
              onClick={() => onEnlargeImage(personalityImageUrl, personalityData?.cardName || 'Personality')}
              className="rounded-xl overflow-hidden shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300"
              style={{ boxShadow: '0 0 25px rgba(251, 191, 36, 0.3)' }}
            >
              <img
                src={personalityImageUrl}
                alt={personalityData?.cardName || 'Personality'}
                className="w-36 h-54 md:w-44 md:h-66 object-contain bg-black/20"
                onError={(e) => onImageError(e, personalityData?.cardName || 'Personality')}
              />
            </button>
            <button
              onClick={() => onEnlargeImage(soulImageUrl, soulData?.cardName || 'Soul')}
              className="rounded-xl overflow-hidden shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300"
              style={{ boxShadow: '0 0 25px rgba(139, 92, 246, 0.3)' }}
            >
              <img
                src={soulImageUrl}
                alt={soulData?.cardName || 'Soul'}
                className="w-36 h-54 md:w-44 md:h-66 object-contain bg-black/20"
                onError={(e) => onImageError(e, soulData?.cardName || 'Soul')}
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
                  onClick={onRetrySynthesis}
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

export default DynamicTab;
