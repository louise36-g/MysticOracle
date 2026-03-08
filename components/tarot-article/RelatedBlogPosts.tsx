import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { fetchBlogPosts, BlogPost } from '../../services/api';
import { buildRoute, ROUTES } from '../../routes/routes';
import { optimizeCloudinaryUrl, IMAGE_SIZES } from '../../utils/cloudinaryUrl';

/**
 * Map tarot article cardType to blog category slugs for cross-linking.
 * Supports both short and full slug formats.
 */
const CARD_TYPE_TO_CATEGORY_SLUGS: Record<string, string[]> = {
  MAJOR_ARCANA: ['major-arcana'],
  SUIT_OF_WANDS: ['wands', 'suit-of-wands'],
  SUIT_OF_CUPS: ['cups', 'suit-of-cups'],
  SUIT_OF_SWORDS: ['swords', 'suit-of-swords'],
  SUIT_OF_PENTACLES: ['pentacles', 'suit-of-pentacles'],
};

interface RelatedBlogPostsProps {
  cardType: string;
  articleId?: string;
}

/**
 * Shows related blog posts on tarot article pages.
 * Fetches blog posts that share the same tarot category.
 */
export function RelatedBlogPosts({ cardType, articleId }: RelatedBlogPostsProps) {
  const { language, t } = useApp();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRelated() {
      const categorySlugs = CARD_TYPE_TO_CATEGORY_SLUGS[cardType];
      if (!categorySlugs || categorySlugs.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Try first slug, then fallback to second if no results
        for (const slug of categorySlugs) {
          const result = await fetchBlogPosts({ category: slug, limit: 3 });
          // Filter out the current article if it appears (same DB table)
          const filtered = result.posts.filter(p => p.id !== articleId && p.contentType !== 'TAROT_ARTICLE');
          if (filtered.length > 0) {
            setPosts(filtered.slice(0, 3));
            break;
          }
        }
      } catch (err) {
        console.error('Failed to load related blog posts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRelated();
  }, [cardType, articleId]);

  if (loading || posts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="border-t border-purple-500/20 pt-12"
    >
      <h2 className="text-2xl font-heading text-purple-200 mb-6 text-center">
        {t('tarot.TarotArticlePage.related_blog_posts', 'Related Articles')}
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={buildRoute(ROUTES.BLOG_POST, { slug: post.slug })}
            className="group cursor-pointer bg-slate-900/60 rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all block"
          >
            {post.coverImage && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={optimizeCloudinaryUrl(post.coverImage, IMAGE_SIZES.related)}
                  alt={language === 'en' ? post.titleEn : post.titleFr}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-heading text-white group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                {language === 'en' ? post.titleEn : post.titleFr}
              </h3>
              <p className="text-slate-400 text-sm line-clamp-2">
                {language === 'en' ? post.excerptEn : post.excerptFr}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
