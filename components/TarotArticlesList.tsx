import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { BookOpen, Search, Filter } from 'lucide-react';

interface TarotArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  featuredImageAlt: string;
  cardType: string;
  cardNumber: string;
  datePublished: string;
  readTime: string;
  tags: string[];
  categories: string[];
}

interface TarotArticlesListProps {
  onArticleClick: (slug: string) => void;
}

const TarotArticlesList: React.FC<TarotArticlesListProps> = ({ onArticleClick }) => {
  const { language } = useApp();
  const [articles, setArticles] = useState<TarotArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCardType, setSelectedCardType] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tarot-articles`);
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching tarot articles:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredArticles = articles.filter((article) => {
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
          {language === 'en' ? 'Loading articles...' : 'Chargement des articles...'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 mb-4">
          {language === 'en' ? 'Tarot Card Meanings' : 'Significations des Cartes de Tarot'}
        </h1>
        <p className="text-lg text-purple-300/70 max-w-2xl mx-auto">
          {language === 'en'
            ? 'Explore the deep symbolism and meanings of each tarot card'
            : 'Explorez le symbolisme profond et les significations de chaque carte de tarot'}
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
            placeholder={language === 'en' ? 'Search articles...' : 'Rechercher des articles...'}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCardType(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCardType
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {language === 'en' ? 'All Cards' : 'Toutes les Cartes'}
          </button>
          {cardTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedCardType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCardType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cardTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {language === 'en' ? 'No articles found' : 'Aucun article trouvé'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onArticleClick(article.slug)}
              className="group cursor-pointer bg-slate-800/50 rounded-lg overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="aspect-video overflow-hidden bg-slate-900">
                <img
                  src={article.featuredImage}
                  alt={article.featuredImageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-card.png';
                  }}
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-purple-400 mb-2">
                  <span>{article.cardNumber}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
                <h3 className="text-lg font-heading text-purple-200 mb-2 group-hover:text-purple-100 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                  {article.excerpt}
                </p>
                <div className="flex flex-wrap gap-1">
                  {article.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TarotArticlesList;
