import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Search, ImageOff, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchTarotArticles, TarotArticle } from '../services/api';
import { useTranslation } from '../context/TranslationContext';
import { buildRoute, ROUTES } from '../routes/routes';

interface TarotArticlesListProps {
  defaultCategory?: string; // Slug like 'major-arcana', 'wands', etc. (can also come from URL params)
}

// Map URL slugs to API card types
const categorySlugToType: Record<string, string> = {
  'major-arcana': 'MAJOR_ARCANA',
  'wands': 'SUIT_OF_WANDS',
  'cups': 'SUIT_OF_CUPS',
  'swords': 'SUIT_OF_SWORDS',
  'pentacles': 'SUIT_OF_PENTACLES',
};

// Map API card types back to URL slugs
const cardTypeToSlug: Record<string, string> = {
  'MAJOR_ARCANA': 'major-arcana',
  'SUIT_OF_WANDS': 'wands',
  'SUIT_OF_CUPS': 'cups',
  'SUIT_OF_SWORDS': 'swords',
  'SUIT_OF_PENTACLES': 'pentacles',
};

const TarotArticlesList: React.FC<TarotArticlesListProps> = ({ defaultCategory }) => {
  const { language } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { category: urlCategory } = useParams<{ category?: string }>();

  // Use URL category if available, otherwise use prop
  const initialCategory = urlCategory || defaultCategory;

  const [articles, setArticles] = useState<TarotArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCardType, setSelectedCardType] = useState<string | null>(
    initialCategory ? (categorySlugToType[initialCategory] || null) : null
  );

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setLoading(true);
      setError(null);
      // Fetch all articles (78 tarot cards total) with proper numeric sorting
      const data = await fetchTarotArticles({
        status: 'PUBLISHED',
        limit: 100,
      });
      setArticles(data.articles || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load articles';
      setError(message);
      console.error('Error fetching tarot articles:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredArticles = articles
    .filter((article) => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCardType = !selectedCardType || article.cardType === selectedCardType;
      return matchesSearch && matchesCardType;
    });

  const cardTypes = ['MAJOR_ARCANA', 'SUIT_OF_WANDS', 'SUIT_OF_CUPS', 'SUIT_OF_SWORDS', 'SUIT_OF_PENTACLES'];
  const cardTypeLabels: Record<string, string> = {
    'MAJOR_ARCANA': 'Major Arcana',
    'SUIT_OF_WANDS': 'Wands',
    'SUIT_OF_CUPS': 'Cups',
    'SUIT_OF_SWORDS': 'Swords',
    'SUIT_OF_PENTACLES': 'Pentacles',
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center text-purple-300">
          {t('tarot.TarotArticlesList.loading', 'Loading articles...')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadArticles}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            {t('tarot.TarotArticlesList.try_again', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 mb-4">
          {t('tarot.TarotArticlesList.title', 'Tarot Card Meanings')}
        </h1>
        <p className="text-lg text-purple-300/70 max-w-2xl mx-auto">
          {t('tarot.TarotArticlesList.subtitle', 'Explore the deep symbolism and meanings of each tarot card')}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('tarot.TarotArticlesList.search_placeholder', 'Search articles...')}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={ROUTES.TAROT_CARDS}
            onClick={() => setSelectedCardType(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCardType
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {t('tarot.TarotArticlesList.all_cards', 'All Cards')}
          </Link>
          {cardTypes.map((type) => {
            const slug = cardTypeToSlug[type];
            return (
              <Link
                key={type}
                to={slug ? buildRoute(ROUTES.TAROT_CARDS_CATEGORY, { category: slug }) : ROUTES.TAROT_CARDS}
                onClick={() => setSelectedCardType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCardType === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cardTypeLabels[type]}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {t('tarot.TarotArticlesList.no_articles', 'No articles found')}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredArticles.map((article, index) => (
            <Link
              key={article.id}
              to={buildRoute(ROUTES.TAROT_ARTICLE, { slug: article.slug })}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.2 }}
                whileHover={{ y: -6, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                whileTap={{ scale: 0.98 }}
                className="group cursor-pointer bg-slate-800/50 rounded-lg overflow-hidden border border-purple-500/20 hover:border-purple-500/40"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-900 relative">
                  {article.featuredImage ? (
                    <img
                      src={article.featuredImage}
                      alt={article.featuredImageAlt || article.title}
                      className="w-full h-full object-cover group-hover:scale-150 transition-transform duration-200"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.parentElement?.querySelector('.placeholder-fallback');
                        if (placeholder) placeholder.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`placeholder-fallback absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-slate-900 ${article.featuredImage ? 'hidden' : ''}`}>
                    <div className="text-center">
                      <ImageOff className="w-8 h-8 text-purple-400/50 mx-auto mb-1" />
                      <span className="text-xs text-purple-300/50">No Image</span>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  {/* Category label */}
                  <div className="text-xs text-slate-400 mb-1">
                    {cardTypeLabels[article.cardType] || article.cardType}
                  </div>
                  {/* Title with card number inline */}
                  <h3 className="font-heading text-sm text-purple-100 mb-1.5 line-clamp-2 group-hover:text-white transition-colors">
                    <span className="font-bold text-purple-400">
                      {article.cardNumber}
                    </span>
                    {article.cardNumber !== undefined && article.cardNumber !== null && ' - '}
                    {article.title}
                  </h3>
                  {/* Excerpt */}
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {article.excerpt}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TarotArticlesList;
