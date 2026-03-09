import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TarotOverviewCard } from '../../services/api';
import { buildRoute, ROUTES } from '../../routes/routes';
import { useApp } from '../../context/AppContext';
import FallbackImage from '../ui/FallbackImage';

interface TarotCardPreviewProps {
  card: TarotOverviewCard;
  showCategory?: boolean;
  categoryLabel?: string;
  elementColor?: string;
  fullWidth?: boolean;
}

const TarotCardPreview: React.FC<TarotCardPreviewProps> = ({
  card,
  showCategory = false,
  categoryLabel,
  elementColor = '#a78bfa',
  fullWidth = false,
}) => {
  const { language } = useApp();

  // Get localized content - use French if available, fallback to English
  const title = language === 'fr' && card.titleFr ? card.titleFr : card.title;
  const excerpt = language === 'fr' && card.excerptFr ? card.excerptFr : card.excerpt;
  const imageAlt = language === 'fr' && card.featuredImageAltFr ? card.featuredImageAltFr : card.featuredImageAlt;
  return (
    <Link
      to={buildRoute(ROUTES.TAROT_ARTICLE, { slug: card.slug })}
      className={`block ${fullWidth ? 'w-full' : 'flex-shrink-0 w-[220px]'}`}
    >
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="group cursor-pointer bg-slate-800/50 rounded-lg overflow-hidden border border-purple-500/20 hover:border-purple-500/40"
        whileTap={{ scale: 0.98 }}
      >
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-slate-900 relative">
          <FallbackImage
            src={card.featuredImage || undefined}
            alt={imageAlt || title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
            language={language}
          />
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
            {card.cardNumber !== undefined && card.cardNumber !== null && ' - '}
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs text-slate-400 line-clamp-2">{excerpt}</p>
        </div>
      </motion.div>
    </Link>
  );
};

export default TarotCardPreview;
