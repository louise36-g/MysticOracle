import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Flame, Droplets, Wind, Mountain } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TarotOverviewCard } from '../../services/api';
import TarotCardPreview from './TarotCardPreview';
import { buildRoute, ROUTES } from '../../routes/routes';

export type CategoryType = 'majorArcana' | 'wands' | 'cups' | 'swords' | 'pentacles';

interface CategoryConfig {
  id: CategoryType;
  nameEn: string;
  nameFr: string;
  icon: React.ReactNode;
  color: string;
  slug: string;
}

export const CATEGORY_CONFIG: Record<CategoryType, CategoryConfig> = {
  majorArcana: {
    id: 'majorArcana',
    nameEn: 'Major Arcana',
    nameFr: 'Arcanes Majeurs',
    icon: <Sparkles className="w-5 h-5" />,
    color: '#a78bfa',
    slug: 'major-arcana',
  },
  wands: {
    id: 'wands',
    nameEn: 'Suit of Wands',
    nameFr: 'Bâtons',
    icon: <Flame className="w-5 h-5" />,
    color: '#f97316',
    slug: 'wands',
  },
  cups: {
    id: 'cups',
    nameEn: 'Suit of Cups',
    nameFr: 'Coupes',
    icon: <Droplets className="w-5 h-5" />,
    color: '#06b6d4',
    slug: 'cups',
  },
  swords: {
    id: 'swords',
    nameEn: 'Suit of Swords',
    nameFr: 'Épées',
    icon: <Wind className="w-5 h-5" />,
    color: '#94a3b8',
    slug: 'swords',
  },
  pentacles: {
    id: 'pentacles',
    nameEn: 'Suit of Pentacles',
    nameFr: 'Pentacles',
    icon: <Mountain className="w-5 h-5" />,
    color: '#22c55e',
    slug: 'pentacles',
  },
};

interface TarotCategorySectionProps {
  category: CategoryType;
  cards: TarotOverviewCard[];
  count: number;
}

const TarotCategorySection: React.FC<TarotCategorySectionProps> = ({
  category,
  cards,
  count,
}) => {
  const { language } = useApp();
  const config = CATEGORY_CONFIG[category];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(20);

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      // Calculate scroll progress (0 to 1)
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      setScrollProgress(progress);

      // Calculate thumb width - keep it small and consistent
      const ratio = clientWidth / scrollWidth;
      setThumbWidth(Math.min(Math.max(ratio * 100, 8), 20)); // 8-20% width
    }
  };

  // Keep old function name for compatibility
  const updateScrollButtons = updateScrollState;

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons);
      return () => el.removeEventListener('scroll', updateScrollButtons);
    }
  }, [cards]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 240; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="mb-10 overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            {config.icon}
          </div>
          <div>
            <h2 className="font-heading text-xl text-white">
              {language === 'en' ? config.nameEn : config.nameFr}
            </h2>
            <div
              className="h-0.5 w-16 mt-1 rounded-full"
              style={{ backgroundColor: config.color }}
            />
          </div>
        </div>

        <Link
          to={buildRoute(ROUTES.TAROT_CARDS_CATEGORY, { category: config.slug })}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          {language === 'fr' ? `Voir les ${count}` : `View All ${count}`}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Scrollable Cards */}
      <div className="relative group">
        {/* Left fade - only show when scrolled */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0f0c29] via-[#0f0c29]/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Right fade - always visible when there's more content */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0f0c29] via-[#0f0c29]/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Scroll buttons (desktop) - always visible when scrollable */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-800/95 border border-purple-500/30 text-white shadow-lg shadow-black/30 transition-all hidden md:flex items-center justify-center hover:bg-purple-600 hover:border-purple-500"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-800/95 border border-purple-500/30 text-white shadow-lg shadow-black/30 transition-all hidden md:flex items-center justify-center hover:bg-purple-600 hover:border-purple-500"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Cards row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-0 pt-2 pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.2 }}
            >
              <TarotCardPreview
                card={card}
                elementColor={config.color}
              />
            </motion.div>
          ))}
        </div>

        {/* Scroll progress indicator - appears on hover */}
        <div className="flex justify-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative w-20 h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                backgroundColor: config.color,
                width: `${thumbWidth}%`,
              }}
              initial={false}
              animate={{
                left: `${scrollProgress * (100 - thumbWidth)}%`,
              }}
              transition={{ type: 'tween', duration: 0.1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Scroll hint for mobile - subtle indicator */}
        {canScrollRight && (
          <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="animate-pulse">
              <ChevronRight className="w-6 h-6 text-purple-400/60" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TarotCategorySection;
