import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { ArrowLeft } from 'lucide-react';

import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/TranslationContext';
import {
  fetchTarotArticle,
  previewTarotArticle,
  TarotArticle,
  fetchLinkRegistry,
  LinkRegistry,
} from '../../services/apiService';
import { ROUTES } from '../../routes/routes';

// Sub-components
import { ArticleSkeleton } from './ArticleSkeleton';
import { ReadingProgress } from './ReadingProgress';
import { ScrollToTop } from './ScrollToTop';
import { TableOfContents } from './TableOfContents';
import { Lightbox } from './Lightbox';
import { Breadcrumbs } from './Breadcrumbs';
import { ArticleHeader } from './ArticleHeader';
import { FeaturedImage } from './FeaturedImage';
import { ArticleTags } from './ArticleTags';
import { RelatedCards } from './RelatedCards';

// Hooks
import {
  useSectionNavigation,
  useContentProcessor,
  useContentInteractions,
} from './hooks';

interface TarotArticlePageProps {
  previewId?: string;
}

/**
 * TarotArticlePage - Main component for displaying tarot card articles
 *
 * Features:
 * - Dynamic content loading (public or admin preview)
 * - Section navigation with scroll tracking
 * - FAQ accordion interaction
 * - Image lightbox
 * - Internal link processing
 * - SEO meta tags and JSON-LD schema
 *
 * Security: Content is sanitized via DOMPurify in useContentProcessor hook
 */
export function TarotArticlePage({ previewId }: TarotArticlePageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useApp();
  const { t } = useTranslation();
  const { getToken } = useAuth();

  // State
  const [article, setArticle] = useState<TarotArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [linkRegistry, setLinkRegistry] = useState<LinkRegistry | null>(null);

  // Refs
  const contentRef = useRef<HTMLDivElement>(null);

  // Load article data
  const loadArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result: TarotArticle;
      if (previewId) {
        const token = await getToken();
        if (!token) throw new Error('Authentication required');
        result = await previewTarotArticle(token, previewId);
      } else if (slug) {
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

  // Initial load
  useEffect(() => {
    loadArticle();
    fetchLinkRegistry().then(setLinkRegistry).catch(console.error);
  }, [loadArticle]);

  // Process content with hooks - SANITIZED via DOMPurify
  const sanitizedContent = useContentProcessor({
    content: article?.content,
    linkRegistry,
  });

  const { sections, activeSection, scrollToSection } = useSectionNavigation({
    content: article?.content,
    contentRef: contentRef as React.RefObject<HTMLDivElement>,
  });

  // Set up content interactions
  useContentInteractions({
    contentRef: contentRef as React.RefObject<HTMLDivElement>,
    sanitizedContent,
    onNavigate: (path: string) => navigate(path),
    onImageClick: setLightboxImage,
  });

  // Loading state
  if (loading) {
    return <ArticleSkeleton />;
  }

  // Error state
  if (error || !article) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto px-6 py-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-3xl">🔮</span>
          </div>
          <h2 className="text-2xl font-heading text-red-400 mb-3">
            {t('tarot.TarotArticlePage.not_found', 'Article Not Found')}
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            {error || 'The mystical knowledge you seek has not been revealed.'}
          </p>
          <Link
            to={ROUTES.TAROT_CARDS}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl hover:from-purple-500 hover:to-fuchsia-500 transition-all inline-flex items-center gap-2 shadow-lg shadow-purple-500/20 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back', 'Back')}
          </Link>
        </motion.div>
      </div>
    );
  }

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://mysticoracle.com';
  const canonicalUrl = `${siteUrl}/tarot/articles/${article.slug}`;

  return (
    <div className="relative min-h-screen">
      {/* ===== SEO HEAD ===== */}
      <Helmet>
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

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.seoMetaTitle} />
        <meta name="twitter:description" content={article.seoMetaDescription} />
        <meta name="twitter:image" content={article.featuredImage} />

        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify(article.schemaJson)}
        </script>
      </Helmet>

      {/* ===== FIXED UI ELEMENTS ===== */}
      <ReadingProgress />
      <ScrollToTop />
      <TableOfContents
        sections={sections}
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />
      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 via-transparent to-transparent pointer-events-none" />

        {/* ===== ARTICLE CONTAINER ===== */}
        <article className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top spacing */}
          <div className="pt-8 sm:pt-12" />

          {/* ===== BACK NAVIGATION ===== */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to={ROUTES.TAROT_CARDS}
              className="mb-6 text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2 group text-sm"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {t('common.back', 'Back')}
            </Link>
          </motion.div>

          {/* ===== BREADCRUMBS ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Breadcrumbs
              category={article.breadcrumbCategory}
              title={article.title}
            />
          </motion.div>

          {/* ===== ARTICLE HEADER ===== */}
          <ArticleHeader
            title={article.title}
            author={article.author}
            readTime={article.readTime}
            dateModified={article.dateModified}
            cardType={article.cardType}
            astrologicalCorrespondence={article.astrologicalCorrespondence}
            element={article.element}
            isCourtCard={article.isCourtCard}
            sections={sections}
            onSectionClick={scrollToSection}
            language={language}
          />

          {/* ===== FEATURED IMAGE ===== */}
          {article.featuredImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FeaturedImage
                src={article.featuredImage}
                alt={article.featuredImageAlt}
                onClick={() => setLightboxImage(article.featuredImage)}
              />
            </motion.div>
          )}

          {/* ===== ARTICLE BODY ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="article-content-wrapper"
          >
            {/* Content container with prose styles - Sanitized via DOMPurify */}
            <div
              ref={contentRef}
              className="prose prose-invert prose-purple max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </motion.div>

          {/* ===== ARTICLE FOOTER ===== */}
          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 space-y-12"
          >
            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            {/* Tags Section */}
            <ArticleTags tags={article.tags} />

            {/* Related Cards Section */}
            <RelatedCards cards={article.relatedCards} />
          </motion.footer>

          {/* Bottom spacing */}
          <div className="pb-16 sm:pb-24" />
        </article>
      </div>
    </div>
  );
}

export default TarotArticlePage;
