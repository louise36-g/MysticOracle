import React from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { TarotOverviewCard } from '../../services/apiService';

interface TarotCardPreviewProps {
  card: TarotOverviewCard;
  onClick: (slug: string) => void;
  showCategory?: boolean;
  categoryLabel?: string;
  elementColor?: string;
}

const TarotCardPreview: React.FC<TarotCardPreviewProps> = ({
  card,
  onClick,
  showCategory = false,
  categoryLabel,
  elementColor = '#a78bfa',
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={() => onClick(card.slug)}
      className="group cursor-pointer flex-shrink-0 w-[220px] bg-slate-800/50 rounded-lg overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all"
      style={{
        boxShadow: `0 0 0 0 ${elementColor}00`,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-slate-900 relative">
        {card.featuredImage ? (
          <img
            src={card.featuredImage}
            alt={card.featuredImageAlt || card.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.parentElement?.querySelector('.placeholder-fallback');
              if (placeholder) placeholder.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`placeholder-fallback absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-slate-900 ${
            card.featuredImage ? 'hidden' : ''
          }`}
        >
          <div className="text-center">
            <ImageOff className="w-8 h-8 text-purple-400/50 mx-auto mb-1" />
            <span className="text-xs text-purple-300/50">No Image</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Category label (if shown) */}
        {showCategory && categoryLabel && (
          <div className="text-xs text-slate-400 mb-1">
            {categoryLabel}
          </div>
        )}

        {/* Title with card number inline */}
        <h3 className="font-heading text-sm text-purple-100 mb-1.5 line-clamp-2 group-hover:text-white transition-colors">
          <span className="font-bold" style={{ color: elementColor }}>
            {card.cardNumber}
          </span>
          {card.cardNumber !== undefined && card.cardNumber !== null && ' · '}
          {card.title}
        </h3>

        {/* Excerpt */}
        <p className="text-xs text-slate-400 line-clamp-2">{card.excerpt}</p>
      </div>
    </motion.div>
  );
};

export default TarotCardPreview;
