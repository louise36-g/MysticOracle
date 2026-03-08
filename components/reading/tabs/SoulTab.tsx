import React from 'react';
import { motion } from 'framer-motion';
import { formatHtmlContent } from '../birthCardUtils';
import type { SoulCardData } from '../birthCardTypes';

interface SoulTabProps {
  depth: number;
  soulData: SoulCardData | undefined;
  soulImageUrl: string;
  language: string;
  onEnlargeImage: (url: string, alt: string) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>, cardName: string) => void;
}

const SoulTab: React.FC<SoulTabProps> = ({
  depth,
  soulData,
  soulImageUrl,
  language,
  onEnlargeImage,
  onImageError,
}) => {
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
          onClick={() => onEnlargeImage(soulImageUrl, soulData?.cardName || 'Soul Card')}
          className="rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
          style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}
        >
          <img
            src={soulImageUrl}
            alt={soulData?.cardName || 'Soul Card'}
            className="w-48 h-72 md:w-56 md:h-84 object-contain bg-black/20"
            onError={(e) => onImageError(e, soulData?.cardName || 'Soul Card')}
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

export default SoulTab;
