import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BlogPost } from '../../../services/api';
import { ROUTES, buildRoute } from '../../../routes/routes';

interface BlogRelatedProps {
  relatedPosts: BlogPost[];
  language: 'en' | 'fr';
  t: (key: string, fallback: string) => string;
}

/**
 * BlogRelated Component
 *
 * Displays a grid of related blog posts with hover effects.
 */
export const BlogRelated: React.FC<BlogRelatedProps> = ({
  relatedPosts,
  language,
  t,
}) => {
  if (relatedPosts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="border-t border-purple-500/20 pt-12"
    >
      <h2 className="text-2xl font-heading text-purple-200 mb-6">
        {t('blog.BlogPost.related_articles', 'Related Articles')}
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {relatedPosts.map((related) => (
          <Link
            key={related.id}
            to={buildRoute(ROUTES.BLOG_POST, { slug: related.slug })}
            className="group cursor-pointer bg-slate-900/60 rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all block"
          >
            {related.coverImage && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={related.coverImage}
                  alt={language === 'en' ? related.titleEn : related.titleFr}
                  className="w-full h-full object-cover group-hover:scale-150 transition-transform duration-500"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-heading text-white group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                {language === 'en' ? related.titleEn : related.titleFr}
              </h3>
              <p className="text-slate-400 text-sm line-clamp-2">
                {language === 'en' ? related.excerptEn : related.excerptFr}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
};
