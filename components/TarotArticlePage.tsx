import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { fetchTarotArticle, previewTarotArticle, TarotArticle, fetchLinkRegistry, LinkRegistry } from '../services/apiService';
import { Calendar, Clock, User, ArrowLeft, Tag, Sparkles, ZoomIn } from 'lucide-react';
import { SmartLink } from './SmartLink';
import { useTranslation } from '../context/TranslationContext';
import { processShortcodes } from './internal-links';

interface TarotArticlePageProps {
  slug?: string;
  previewId?: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

// Loading skeleton
function ArticleSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 bg-slate-800 rounded w-3/4 mb-4" />
      <div className="h-4 bg-slate-800 rounded w-1/3 mb-8" />
      <div className="aspect-video bg-slate-800 rounded mb-8" />
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-slate-800 rounded" />
        ))}
      </div>
    </div>
  );
}

// Breadcrumb component
function Breadcrumbs({ category, title, onNavigate }: { category: string; title: string; onNavigate: (path: string) => void }) {
  const cardName = title.split(':')[0].trim();

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-400 mb-6">
      <ol className="flex items-center space-x-2">
        <li>
          <SmartLink href="/" onClick={() => onNavigate('/')}>
            <button className="hover:text-purple-400 transition-colors">
              Home
            </button>
          </SmartLink>
        </li>
        <li>/</li>
        <li>
          <SmartLink
            href={`/tarot/${category.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => onNavigate(`/tarot/${category.toLowerCase().replace(/\s+/g, '-')}`)}
          >
            <button className="hover:text-purple-400 transition-colors">
              {category}
            </button>
          </SmartLink>
        </li>
        <li>/</li>
        <li className="text-purple-200 font-medium">{cardName}</li>
      </ol>
    </nav>
  );
}

const TarotArticlePage: React.FC<TarotArticlePageProps> = ({ slug, previewId, onBack, onNavigate }) => {
  const { language } = useApp();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [article, setArticle] = useState<TarotArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [linkRegistry, setLinkRegistry] = useState<LinkRegistry | null>(null);

  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result: TarotArticle;
      if (previewId) {
        // Admin preview mode - fetch by ID with admin API
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication required');
        }
        result = await previewTarotArticle(token, previewId);
      } else if (slug) {
        // Public mode - fetch by slug
        result = await fetchTarotArticle(slug);
      } else {
        throw new Error('No slug or preview ID provided');
      }

      setArticle(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [slug, previewId, getToken]);

  useEffect(() => {
    loadArticle();
    // Fetch link registry for shortcode processing
    fetchLinkRegistry().then(setLinkRegistry).catch(console.error);
  }, [loadArticle]);

  // DOMPurify sanitization config
  const sanitizeConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'figure',
      'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
      'width', 'height', 'loading', 'data-width', 'data-align', 'data-link-type'
    ],
    ADD_ATTR: ['target', 'rel'],
    FORCE_BODY: true,
  };

  // Process shortcodes and sanitize content for safe rendering
  const sanitizedContent = useMemo(() => {
    if (!article?.content) return '';
    // Process internal link shortcodes first [[type:slug]] -> <a> tags
    const processedContent = processShortcodes(article.content, linkRegistry);
    return DOMPurify.sanitize(processedContent, sanitizeConfig);
  }, [article?.content, linkRegistry]);

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    onBack();
  };

  if (loading) {
    return <ArticleSkeleton />;
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-heading text-red-400 mb-4">
          {t('tarot.TarotArticlePage.not_found', 'Article Not Found')}
        </h2>
        <p className="text-slate-400 mb-8">{error || 'Article not found'}</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back', 'Back')}
        </button>
      </div>
    );
  }

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://mysticoracle.com';
  const canonicalUrl = `${siteUrl}/tarot/${article.slug}`;

  return (
    <>
      {/* SEO Head */}
      <Helmet>
        {/* Primary Meta */}
        <title>{article.seoMetaTitle} | MysticOracle</title>
        <meta name="description" content={article.seoMetaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="keywords" content={article.tags.join(', ')} />
        <meta name="author" content={article.author} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.seoMetaTitle} />
        <meta property="og:description" content={article.seoMetaDescription} />
        <meta property="og:image" content={article.featuredImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="article:published_time" content={article.datePublished} />
        <meta property="article:modified_time" content={article.dateModified} />
        <meta property="article:author" content={article.author} />
        {article.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.seoMetaTitle} />
        <meta name="twitter:description" content={article.seoMetaDescription} />
        <meta name="twitter:image" content={article.featuredImage} />

        {/* JSON-LD Schema - Pre-generated from backend */}
        <script type="application/ld+json">
          {JSON.stringify(article.schemaJson)}
        </script>
      </Helmet>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Enlarged view"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-purple-400 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back', 'Back')}
        </button>

        {/* Breadcrumbs */}
        <Breadcrumbs
          category={article.breadcrumbCategory}
          title={article.title}
          onNavigate={handleNavigate}
        />

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-purple-200 mb-4 text-center">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {article.author}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.readTime}
            </span>
            <span>•</span>
            <time
              dateTime={article.dateModified}
              className="flex items-center gap-1"
            >
              <Calendar className="w-4 h-4" />
              Updated{' '}
              {new Date(article.dateModified).toLocaleDateString(
                language === 'en' ? 'en-US' : 'fr-FR',
                {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }
              )}
            </time>
          </div>

          {/* Card metadata badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
              {article.cardType}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
              {article.astrologicalCorrespondence}
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
              {article.element}
            </span>
            {article.isCourtCard && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t('tarot.TarotArticlePage.court_card', 'Court Card')}
              </span>
            )}
          </div>
        </motion.header>

        {/* Featured Image */}
        {article.featuredImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12 group cursor-pointer relative rounded-xl overflow-hidden"
            onClick={() => setLightboxImage(article.featuredImage)}
          >
            <img
              src={article.featuredImage}
              alt={article.featuredImageAlt}
              className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        )}

        {/* Article body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert prose-purple max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          style={{
            lineHeight: '1.8',
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;

            // Handle image clicks for lightbox
            if (target.tagName === 'IMG') {
              setLightboxImage((target as HTMLImageElement).src);
              return;
            }

            // Handle anchor tag clicks for SPA navigation
            if (target.tagName === 'A') {
              const anchor = target as HTMLAnchorElement;
              const href = anchor.getAttribute('href');

              // Only intercept internal links (starting with /)
              if (href && href.startsWith('/')) {
                e.preventDefault();
                onNavigate(href);
              }
              // External links (http://, https://, etc.) will work normally
            }
          }}
        />

        {/* Tags */}
        {article.tags.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h3 className="text-lg text-slate-400 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {t('tarot.TarotArticlePage.related_topics', 'Related Topics')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Related Cards */}
        {article.relatedCards.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="border-t border-purple-500/20 pt-12"
          >
            <h2 className="text-2xl font-heading text-purple-200 mb-6">
              {t('tarot.TarotArticlePage.related_cards', 'Related Cards')}
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {article.relatedCards.map((card) => (
                <SmartLink
                  key={card}
                  href={`/tarot/articles/${card.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handleNavigate(`/tarot/${card.toLowerCase().replace(/\s+/g, '-')}`)}
                  className="px-4 py-3 bg-slate-900/60 border border-purple-500/20 rounded-lg
                    hover:border-purple-500/40 hover:bg-slate-800/60 transition-all
                    text-purple-300 hover:text-purple-200 font-medium block text-center"
                >
                  {card}
                </SmartLink>
              ))}
            </div>
          </motion.section>
        )}
      </article>
    </>
  );
};

export default TarotArticlePage;
