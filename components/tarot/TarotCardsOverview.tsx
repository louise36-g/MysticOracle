import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, AlertCircle, RefreshCw, Sparkles, Flame, Droplets, Wind, Mountain } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchTarotOverview, TarotOverviewData } from '../../services/api';
import TarotCategorySection, { CategoryType, CATEGORY_CONFIG } from './TarotCategorySection';
import TarotCardPreview from './TarotCardPreview';
import Button from '../Button';
import { buildRoute, ROUTES } from '../../routes/routes';

// Map URL slugs to CategoryType
const slugToCategory: Record<string, CategoryType> = {
  'major-arcana': 'majorArcana',
  'wands': 'wands',
  'cups': 'cups',
  'swords': 'swords',
  'pentacles': 'pentacles',
};

interface TarotCardsOverviewProps {
  // Props now optional - can use URL params instead
  selectedCategory?: CategoryType | null;
}

const TarotCardsOverview: React.FC<TarotCardsOverviewProps> = ({
  selectedCategory: propSelectedCategory,
}) => {
  const navigate = useNavigate();
  const { category: urlCategory } = useParams<{ category?: string }>();

  // Determine selected category from URL or props
  const selectedCategory = urlCategory
    ? slugToCategory[urlCategory] || null
    : propSelectedCategory ?? null;
  const { language } = useApp();
  const [data, setData] = useState<TarotOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category filter options
  const categoryFilters: { id: CategoryType | null; labelEn: string; labelFr: string; icon: React.ReactNode }[] = [
    { id: null, labelEn: 'All Cards', labelFr: 'Toutes', icon: <Layers className="w-4 h-4" /> },
    { id: 'majorArcana', labelEn: 'Major Arcana', labelFr: 'Arcanes Majeurs', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'wands', labelEn: 'Wands', labelFr: 'Bâtons', icon: <Flame className="w-4 h-4" /> },
    { id: 'cups', labelEn: 'Cups', labelFr: 'Coupes', icon: <Droplets className="w-4 h-4" /> },
    { id: 'swords', labelEn: 'Swords', labelFr: 'Épées', icon: <Wind className="w-4 h-4" /> },
    { id: 'pentacles', labelEn: 'Pentacles', labelFr: 'Pentacles', icon: <Mountain className="w-4 h-4" /> },
  ];

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      setError(null);
      const overview = await fetchTarotOverview();
      setData(overview);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tarot cards';
      setError(message);
      console.error('Error fetching tarot overview:', err);
    } finally {
      setLoading(false);
    }
  }

  // Skeleton loader
  if (loading) {
    return (
      <div className="pb-20">
        {/* Hero skeleton */}
        <div className="relative py-16 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-slate-800/50 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-800/50 rounded animate-pulse" />
          </div>
          <div className="h-12 w-72 bg-slate-800/50 rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="h-5 w-[500px] max-w-full bg-slate-800/50 rounded mx-auto mb-8 animate-pulse" />
          <div className="h-12 w-48 bg-purple-600/30 rounded-lg mx-auto animate-pulse" />
        </div>

        {/* Section skeletons */}
        <div className="max-w-7xl mx-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mb-10">
              {/* Section header */}
              <div className="flex items-center justify-between mb-4 px-4 md:px-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800/50 rounded-lg animate-pulse" />
                  <div>
                    <div className="h-5 w-28 bg-slate-800/50 rounded animate-pulse mb-1" />
                    <div className="h-0.5 w-16 bg-slate-700/50 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="h-4 w-20 bg-slate-800/50 rounded animate-pulse" />
              </div>
              {/* Cards row */}
              <div className="flex gap-4 overflow-hidden px-4 md:px-0 pt-2 pb-2">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="w-[220px] flex-shrink-0 bg-slate-800/50 rounded-lg overflow-hidden border border-purple-500/10">
                    <div className="aspect-[4/3] bg-slate-900/50 animate-pulse" />
                    <div className="p-3">
                      <div className="h-4 w-full bg-slate-700/50 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-3/4 bg-slate-700/50 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadOverview}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            {language === 'fr' ? 'Réessayer' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Calculate counts from arrays if counts object is missing (handles cached responses)
  const counts = data.counts ?? {
    majorArcana: data.majorArcana?.length ?? 0,
    wands: data.wands?.length ?? 0,
    cups: data.cups?.length ?? 0,
    swords: data.swords?.length ?? 0,
    pentacles: data.pentacles?.length ?? 0,
  };

  const totalCards =
    counts.majorArcana +
    counts.wands +
    counts.cups +
    counts.swords +
    counts.pentacles;

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <div className="relative py-16 px-4 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Layers className="w-6 h-6 text-purple-400" />
            <span className="text-purple-400 text-sm font-medium uppercase tracking-wider">
              {language === 'fr' ? 'Guide Complet' : 'Complete Guide'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 mb-4">
            {language === 'fr' ? 'Les Arcanes du Tarot' : 'The Tarot Deck'}
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            {language === 'fr'
              ? 'Explorez la sagesse ancienne des 78 cartes. Découvrez leurs significations, leur symbolisme et leurs conseils pour votre chemin.'
              : 'Explore the ancient wisdom of all 78 cards. Discover their meanings, symbolism, and guidance for your journey.'}
          </p>

        </motion.div>
      </div>

      {/* Category Filter Buttons */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          {categoryFilters.map((filter) => {
            const isActive = selectedCategory === filter.id;
            const targetPath = filter.id
              ? buildRoute(ROUTES.TAROT_CARDS_CATEGORY, { category: CATEGORY_CONFIG[filter.id].slug })
              : ROUTES.TAROT_CARDS;
            return (
              <Link
                key={filter.id ?? 'all'}
                to={targetPath}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {filter.icon}
                <span>{language === 'fr' ? filter.labelFr : filter.labelEn}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content: Either full grid for selected category or horizontal sections */}
      <div className="max-w-7xl mx-auto">
        {selectedCategory ? (
          // Full grid view for selected category
          <div className="px-4">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${CATEGORY_CONFIG[selectedCategory].color}20` }}
              >
                <span style={{ color: CATEGORY_CONFIG[selectedCategory].color }}>
                  {CATEGORY_CONFIG[selectedCategory].icon}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-heading text-white">
                  {language === 'fr'
                    ? CATEGORY_CONFIG[selectedCategory].nameFr
                    : CATEGORY_CONFIG[selectedCategory].nameEn}
                </h2>
                <div
                  className="h-0.5 w-12 rounded-full mt-1"
                  style={{ backgroundColor: CATEGORY_CONFIG[selectedCategory].color }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data[selectedCategory]?.map((card) => (
                <TarotCardPreview
                  key={card.id}
                  card={card}
                  elementColor={CATEGORY_CONFIG[selectedCategory].color}
                  fullWidth
                />
              ))}
            </div>
          </div>
        ) : (
          // Horizontal scroll sections for all categories
          <>
            <TarotCategorySection
              category="majorArcana"
              cards={data.majorArcana}
              count={counts.majorArcana}
            />

            <TarotCategorySection
              category="wands"
              cards={data.wands}
              count={counts.wands}
            />

            <TarotCategorySection
              category="cups"
              cards={data.cups}
              count={counts.cups}
            />

            <TarotCategorySection
              category="swords"
              cards={data.swords}
              count={counts.swords}
            />

            <TarotCategorySection
              category="pentacles"
              cards={data.pentacles}
              count={counts.pentacles}
            />
          </>
        )}
      </div>

      {/* Bottom CTA - only show when viewing all cards */}
      {!selectedCategory && (
        <div className="text-center py-12 px-4">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-heading text-white mb-4">
              {language === 'fr' ? 'Prêt pour une lecture ?' : 'Ready for a reading?'}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTES.READING}>
                <Button variant="primary" size="lg">
                  {language === 'fr' ? 'Tirer les cartes' : 'Get a Reading'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotCardsOverview;
