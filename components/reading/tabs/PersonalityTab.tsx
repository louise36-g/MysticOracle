import React from 'react';
import { motion } from 'framer-motion';
import { formatHtmlContent } from '../birthCardUtils';
import type { PersonalityCardData } from '../birthCardTypes';

interface PersonalityTabProps {
  personalityData: PersonalityCardData | undefined;
  personalityImageUrl: string;
  language: string;
  onEnlargeImage: (url: string, alt: string) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, cardName: string) => void;
}

const PersonalityTab: React.FC<PersonalityTabProps> = ({
  personalityData,
  personalityImageUrl,
  language,
  onEnlargeImage,
  onImageError,
}) => (
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
        onClick={() => onEnlargeImage(personalityImageUrl, personalityData?.cardName || 'Personality Card')}
        className="rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
        style={{ boxShadow: '0 0 40px rgba(251, 191, 36, 0.3)' }}
      >
        <img
          src={personalityImageUrl}
          alt={personalityData?.cardName || 'Personality Card'}
          className="w-48 h-72 md:w-56 md:h-84 object-contain bg-black/20"
          loading="lazy"
          onError={(e) => onImageError(e, personalityData?.cardName || 'Personality Card')}
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

export default PersonalityTab;
