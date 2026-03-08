import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { fetchTarotArticles, TarotArticle, BlogCategory } from '../../../services/api';
import { buildRoute, ROUTES } from '../../../routes/routes';
import { optimizeCloudinaryUrl, IMAGE_SIZES } from '../../../utils/cloudinaryUrl';

/**
 * Map blog category slugs to tarot article cardType for cross-linking.
 */
const CATEGORY_SLUG_TO_CARD_TYPE: Record<string, string> = {
  'major-arcana': 'MAJOR_ARCANA',
  'wands': 'SUIT_OF_WANDS',
  'suit-of-wands': 'SUIT_OF_WANDS',
  'cups': 'SUIT_OF_CUPS',
  'suit-of-cups': 'SUIT_OF_CUPS',
  'swords': 'SUIT_OF_SWORDS',
  'suit-of-swords': 'SUIT_OF_SWORDS',
  'pentacles': 'SUIT_OF_PENTACLES',
  'suit-of-pentacles': 'SUIT_OF_PENTACLES',
};

interface RelatedTarotArticlesProps {
  categories: BlogCategory[];
}

/**
 * Shows related tarot card articles on blog post pages.
 * Only renders when the blog post has tarot-related categories.
 */
export function RelatedTarotArticles({ categories }: RelatedTarotArticlesProps) {
  const { language, t } = useApp();
  const [articles, setArticles] = useState<TarotArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Find the first tarot-related category
  const matchedCardType = categories
    .map(cat => CATEGORY_SLUG_TO_CARD_TYPE[cat.slug])
    .find(Boolean);

  useEffect(() => {
    if (!matchedCardType) {
      setLoading(false);
      return;
    }

    async function loadRelated() {
      try {
        const result = await fetchTarotArticles({
          cardType: matchedCardType,
          limit: 4,
          status: 'PUBLISHED',
        });
        setArticles(result.articles || []);
      } catch (err) {
        console.error('Failed to load related tarot articles:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRelated();
  }, [matchedCardType]);

  if (loading || articles.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="border-t border-purple-500/20 pt-12"
    >
      <h2 className="text-2xl font-heading text-purple-200 mb-6">
        {t('blog.BlogPost.related_tarot_cards', 'Explore the Cards')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {articles.map((article, index) => (
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
                      src={optimizeCloudinaryUrl(article.featuredImage, IMAGE_SIZES.related)}
                      alt={language === 'fr' && article.featuredImageAltFr ? article.featuredImageAltFr : (article.featuredImageAlt || article.title)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-slate-900">
                      <ImageOff className="w-8 h-8 text-purple-400/50" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-heading text-sm text-purple-100 text-center line-clamp-2 group-hover:text-white transition-colors">
                    {(language === 'fr' && article.titleFr ? article.titleFr : article.title).split(':')[0].trim()}
                  </h3>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
