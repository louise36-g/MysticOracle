import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';
import { useApp } from '../../context/AppContext';
import { fetchTarotArticles, TarotArticle } from '../../services/api';
import { buildRoute, ROUTES } from '../../routes/routes';

interface RelatedCardsProps {
  cards: string[];
}

// Cache articles to avoid repeated fetches
let articlesCache: TarotArticle[] | null = null;

/**
 * Related cards section - shows links to related tarot card articles with images
 */
export function RelatedCards({ cards }: RelatedCardsProps) {
  const { t } = useTranslation();
  const { language } = useApp();
  const [articles, setArticles] = useState<TarotArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      if (articlesCache) {
        setArticles(articlesCache);
        setLoading(false);
        return;
      }

      try {
        const data = await fetchTarotArticles({
          status: 'PUBLISHED',
          limit: 100,
        });
        articlesCache = data.articles || [];
        setArticles(articlesCache);
      } catch (err) {
        console.error('Failed to load related articles:', err);
      } finally {
        setLoading(false);
      }
    }

    if (cards.length > 0) {
      loadArticles();
    } else {
      setLoading(false);
    }
  }, [cards]);

  if (cards.length === 0) return null;

  // Match related card names to full article data
  const relatedArticles = cards
    .map((cardName) => {
      const normalizedName = cardName.toLowerCase().trim();
      // Generate possible slug variations (some have "the-" prefix, some don't)
      const slugBase = normalizedName.replace(/\s+/g, '-');
      const slugWithoutThe = slugBase.replace(/^the-/, '');

      return articles.find((article) => {
        const articleSlug = article.slug.toLowerCase();

        // Match by slug variations
        if (
          articleSlug === slugBase + '-tarot-card-meaning' ||
          articleSlug === slugWithoutThe + '-tarot-card-meaning' ||
          articleSlug === slugBase ||
          articleSlug === slugWithoutThe
        ) {
          return true;
        }

        // Match by title prefix (before the colon subtitle)
        const titlePrefix = article.title.split(':')[0].trim().toLowerCase();
        if (titlePrefix === normalizedName) {
          return true;
        }

        // Match by checking if slug contains the card name parts
        const cardNameSlug = normalizedName.replace(/\s+/g, '-');
        if (articleSlug.includes(cardNameSlug) || articleSlug.includes(slugWithoutThe)) {
          return true;
        }

        return false;
      });
    })
    .filter((article): article is TarotArticle => article !== undefined);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="border-t border-purple-500/20 pt-12"
    >
      <h2 className="text-2xl font-heading text-purple-200 mb-6 text-center">
        {t('tarot.TarotArticlePage.related_cards', 'Related Cards')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {loading ? (
          // Loading skeletons
          cards.map((card, index) => (
            <div
              key={card}
              className="bg-slate-800/50 rounded-lg overflow-hidden border border-purple-500/20 animate-pulse"
            >
              <div className="aspect-[3/4] bg-slate-700/50" />
              <div className="p-3">
                <div className="h-4 bg-slate-700/50 rounded w-3/4 mx-auto" />
              </div>
            </div>
          ))
        ) : relatedArticles.length > 0 ? (
          // Articles with images
          relatedArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <Link
                to={buildRoute(ROUTES.TAROT_ARTICLE, { slug: article.slug })}
                className="block"
              >
                <motion.div
                  whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer bg-slate-800/50 rounded-lg overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-slate-900 relative">
                    {article.featuredImage ? (
                      <img
                        src={article.featuredImage}
                        alt={language === 'fr' && article.featuredImageAltFr ? article.featuredImageAltFr : (article.featuredImageAlt || article.title)}
                        width={200}
                        height={267}
                        className="w-full h-full object-cover group-hover:scale-150 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.parentElement?.querySelector('.placeholder-fallback');
                          if (placeholder) placeholder.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`placeholder-fallback absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-slate-900 ${article.featuredImage ? 'hidden' : ''}`}
                    >
                      <div className="text-center">
                        <ImageOff className="w-8 h-8 text-purple-400/50 mx-auto mb-1" />
                        <span className="text-xs text-purple-300/50">No Image</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-heading text-sm text-purple-100 text-center line-clamp-2 group-hover:text-white transition-colors">
                      {(language === 'fr' && article.titleFr ? article.titleFr : article.title).split(':')[0].trim()}
                    </h3>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))
        ) : (
          // Fallback to text links if no matching articles found
          cards.map((card, index) => {
            // Generate slug with -tarot-card-meaning suffix
            const baseSlug = card.toLowerCase().replace(/\s+/g, '-');
            const slug = baseSlug + '-tarot-card-meaning';
            return (
              <motion.div
                key={card}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                <Link
                  to={buildRoute(ROUTES.TAROT_ARTICLE, { slug })}
                  className="group block px-5 py-4 bg-slate-900/60 border border-purple-500/20 rounded-xl
                    hover:border-purple-500/50 hover:bg-slate-800/60 transition-all duration-300
                    text-purple-300 hover:text-purple-200 font-medium text-center
                    hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <span className="relative">
                    {card}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-purple-500 to-fuchsia-500 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.section>
  );
}
