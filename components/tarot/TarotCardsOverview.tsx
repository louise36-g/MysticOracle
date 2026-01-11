import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchTarotOverview, TarotOverviewData } from '../../services/apiService';
import TarotCategorySection, { CategoryType } from './TarotCategorySection';
import Button from '../Button';

interface TarotCardsOverviewProps {
  onCardClick: (slug: string) => void;
  onViewAllCards: () => void;
  onViewCategory: (category: CategoryType) => void;
}

const TarotCardsOverview: React.FC<TarotCardsOverviewProps> = ({
  onCardClick,
  onViewAllCards,
  onViewCategory,
}) => {
  const { language } = useApp();
  const [data, setData] = useState<TarotOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            {language === 'en' ? 'Try Again' : 'Réessayer'}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalCards =
    data.counts.majorArcana +
    data.counts.wands +
    data.counts.cups +
    data.counts.swords +
    data.counts.pentacles;

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
              {language === 'en' ? 'Complete Guide' : 'Guide Complet'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 mb-4">
            {language === 'en' ? 'The Tarot Deck' : 'Le Tarot'}
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            {language === 'en'
              ? 'Explore the ancient wisdom of all 78 cards. Discover their meanings, symbolism, and guidance for your journey.'
              : 'Explorez la sagesse ancienne des 78 cartes. Découvrez leurs significations, leur symbolisme et leurs conseils pour votre voyage.'}
          </p>

          <Button variant="primary" size="lg" onClick={onViewAllCards}>
            {language === 'en'
              ? `Browse All ${totalCards} Cards`
              : `Parcourir les ${totalCards} Cartes`}
          </Button>
        </motion.div>
      </div>

      {/* Category Sections */}
      <div className="max-w-7xl mx-auto">
        <TarotCategorySection
          category="majorArcana"
          cards={data.majorArcana}
          count={data.counts.majorArcana}
          onCardClick={onCardClick}
          onViewAll={onViewCategory}
        />

        <TarotCategorySection
          category="wands"
          cards={data.wands}
          count={data.counts.wands}
          onCardClick={onCardClick}
          onViewAll={onViewCategory}
        />

        <TarotCategorySection
          category="cups"
          cards={data.cups}
          count={data.counts.cups}
          onCardClick={onCardClick}
          onViewAll={onViewCategory}
        />

        <TarotCategorySection
          category="swords"
          cards={data.swords}
          count={data.counts.swords}
          onCardClick={onCardClick}
          onViewAll={onViewCategory}
        />

        <TarotCategorySection
          category="pentacles"
          cards={data.pentacles}
          count={data.counts.pentacles}
          onCardClick={onCardClick}
          onViewAll={onViewCategory}
        />
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-12 px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-heading text-white mb-4">
            {language === 'en' ? 'Ready to explore the full deck?' : 'Prêt à explorer le jeu complet ?'}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg" onClick={onViewAllCards}>
              {language === 'en' ? 'Browse All Cards' : 'Parcourir Toutes les Cartes'}
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/tarot'}>
              {language === 'en' ? 'Get a Reading' : 'Faire un Tirage'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarotCardsOverview;
