import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import LocalizedLink from '../LocalizedLink';
import { useApp } from '../../context/AppContext';
import { FAQItem, CTAItem } from '../../services/api';
import { ArrowLeft, Tag, AlertCircle, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBlogPost, useBlogContent, useBlogMeta } from '../../hooks/blog';
import { BlogHeader, BlogContent, BlogFAQ, BlogCTA, BlogRelated, RelatedTarotArticles } from './components';
import { Lightbox } from '../ui/Lightbox';
import { ScrollToTop } from '../tarot-article/ScrollToTop';
import ArticleNavigation from '../shared/ArticleNavigation';
import { ROUTES } from '../../routes/routes';
import { trackArticleView, trackScrollDepth } from '../../utils/analytics';
import { optimizeCloudinaryUrl, IMAGE_SIZES } from '../../utils/cloudinaryUrl';
import { formatDate } from '../../utils/dateFormatters';

interface BlogPostProps {
  previewId?: string;
}

const BlogPostView: React.FC<BlogPostProps> = ({ previewId }) => {
  const { language, t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Get slug from URL params
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = !!previewId;

  // Get category for back button — prefer URL param (survives refresh) over state
  const fromCategory = searchParams.get('from')
    || (location.state as { fromCategory?: string } | null)?.fromCategory
    || '';

  // Remove ?from= from the visible URL immediately after reading it.
  // The value is already captured above; keeping it in the URL would pollute
  // analytics, Sentry, and shared/copied links.
  useEffect(() => {
    if (searchParams.get('from')) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // SPA navigation handler for above-fold content (mirrors BlogContent.handleContentClick)
  const handleAboveFoldClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    if (anchor.getAttribute('target') === '_blank') return;
    if (href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    } else if (href.includes('celestiarcana.com')) {
      try {
        const url = new URL(href);
        e.preventDefault();
        navigate(url.pathname);
      } catch { /* let browser handle */ }
    }
  };

  // Local UI state
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  // Custom hooks handle all complex logic
  const { post, relatedPosts, prevPost, nextPost, linkRegistry, loading, error } = useBlogPost({ slug, previewId });
  const { contentBeforeFAQ, contentAfterFAQ, extractedFAQs, contentRef, aboveFoldHtml } = useBlogContent({ post, linkRegistry, language });
  useBlogMeta({ post, language, isPreview });

  // Scroll depth tracking
  const scrollMilestonesRef = useRef<Set<number>>(new Set());
  const articleContainerRef = useRef<HTMLElement>(null);

  // Redirect tarot articles from /blog/:slug to /tarot/:slug (SEO: prevent duplicate content)
  useEffect(() => {
    if (post && slug && !isPreview && post.contentType === 'TAROT_ARTICLE') {
      navigate(`/tarot/${slug}`, { replace: true });
    }
  }, [post, slug, isPreview, navigate]);

  // Track article view when post loads
  useEffect(() => {
    if (post && slug && !isPreview) {
      trackArticleView(slug, post.categories?.[0]?.nameEn || 'uncategorized');
      // Reset scroll milestones for new article
      scrollMilestonesRef.current = new Set();
    }
  }, [post, slug, isPreview]);

  // Track scroll depth
  useEffect(() => {
    if (!post || isPreview) return;

    const handleScroll = () => {
      const article = articleContainerRef.current;
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const articleHeight = rect.height;
      const scrollPosition = window.scrollY + window.innerHeight;
      const scrolledIntoArticle = scrollPosition - articleTop;
      const percentScrolled = Math.min(100, Math.max(0, (scrolledIntoArticle / articleHeight) * 100));

      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (percentScrolled >= milestone && !scrollMilestonesRef.current.has(milestone)) {
          scrollMilestonesRef.current.add(milestone);
          trackScrollDepth(milestone, 'blog', slug || '');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [post, slug, isPreview]);

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const shareTitle = post ? (language === 'en' ? post.titleEn : post.titleFr) : '';

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareTitle)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-heading text-red-400 mb-4">
          {t('blog.BlogPost.article_not_found', 'Article Not Found')}
        </h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <LocalizedLink to={fromCategory ? `/blog/category/${fromCategory}` : ROUTES.BLOG}>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            {t('blog.BlogPost.back_to_blog', 'Back to Blog')}
          </button>
        </LocalizedLink>
      </div>
    );
  }

  const title = language === 'en' ? post.titleEn : post.titleFr;

  // For the yes-or-no hub article: split overview above the fold (before cover image)
  // Only the suit-nav + overview blockquote go above; everything else stays below
  const isYesNoHub = slug === 'yes-or-no-tarot';
  let overviewHtml = '';
  let mainContentHtml = contentBeforeFAQ;
  if (isYesNoHub && contentBeforeFAQ) {
    const blockquoteEnd = contentBeforeFAQ.indexOf('</blockquote>');
    if (blockquoteEnd > 0) {
      const splitAt = blockquoteEnd + '</blockquote>'.length;
      overviewHtml = contentBeforeFAQ.substring(0, splitAt);
      mainContentHtml = contentBeforeFAQ.substring(splitAt);
    }
  }

  return (
    <article ref={articleContainerRef} className="max-w-4xl mx-auto px-4 py-12">
      {/* Preview Banner */}
      {isPreview && (
        <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-200 font-medium">
              {t('blog.BlogPost.preview_mode', 'Preview Mode')}
            </p>
            <p className="text-amber-200/70 text-sm">
              {t('blog.BlogPost.preview_description', 'This is a preview. The post is not published yet.')}
            </p>
          </div>
        </div>
      )}

      {/* Back Button */}
      <LocalizedLink to={fromCategory ? `/blog/category/${fromCategory}` : ROUTES.BLOG} className="flex items-center gap-2 text-slate-400 hover:text-purple-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t('blog.BlogPost.back_to_blog', 'Back to Blog')}
      </LocalizedLink>

      {/* Header */}
      <BlogHeader
        post={post}
        title={title}
        language={language}
        copied={copied}
        formatDate={(dateString: string) => formatDate(dateString, language)}
        handleShare={handleShare}
        t={t}
      />

      {/* Above-fold intro (content before <!-- fold --> marker) */}
      {aboveFoldHtml && !isYesNoHub && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-purple max-w-none mb-8 blog-content-images"
          dangerouslySetInnerHTML={{ __html: aboveFoldHtml }}
          style={{ lineHeight: '1.8' }}
          onClick={handleAboveFoldClick}
        />
      )}

      {/* Overview above the fold (yes-or-no hub article only) */}
      {isYesNoHub && overviewHtml && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="prose prose-invert prose-purple max-w-none mb-8 blog-content-images"
          dangerouslySetInnerHTML={{ __html: overviewHtml }}
          style={{ lineHeight: '1.8' }}
        />
      )}

      {/* Cover Image */}
      {post.coverImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10 rounded-2xl overflow-hidden border border-purple-500/20 group cursor-pointer"
          onClick={() => setLightboxImage(post.coverImage!)}
        >
          <div className="relative h-[55vh]">
            <img
              src={optimizeCloudinaryUrl(post.coverImage, IMAGE_SIZES.cover)}
              alt={post.coverImageAlt || title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <BlogContent
        contentBeforeFAQ={isYesNoHub ? mainContentHtml : contentBeforeFAQ}
        contentAfterFAQ={contentAfterFAQ}
        contentRef={contentRef}
        onImageClick={setLightboxImage}
      />

      {/* FAQ Section */}
      <BlogFAQ
        faqItems={
          extractedFAQs.length > 0
            ? extractedFAQs
            : (post.faq && post.faq.length > 0 ? (post.faq as FAQItem[]) : [])
        }
        openFAQIndex={openFAQIndex}
        onToggle={(index) => setOpenFAQIndex(openFAQIndex === index ? null : index)}
        t={t}
      />

      {/* CTA Banner */}
      {post.cta && <BlogCTA cta={post.cta as CTAItem} />}

      {/* Prev/Next Navigation */}
      <ArticleNavigation
        prev={prevPost ? { slug: prevPost.slug, title: prevPost.title, titleFr: prevPost.titleFr } : null}
        next={nextPost ? { slug: nextPost.slug, title: nextPost.title, titleFr: nextPost.titleFr } : null}
        basePath={post.contentType === 'TAROT_ARTICLE' ? '/tarot' : '/blog'}
      />

      {/* Tags */}
      {post.tags.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-t border-purple-500/20 pt-8 mb-12"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {t('blog.BlogPost.tags', 'Tags:')}
            </span>
            {post.tags.map((tag) => (
              <LocalizedLink
                key={tag.id}
                to={`${ROUTES.BLOG}?tag=${tag.slug}`}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm hover:bg-purple-600 hover:text-white transition-colors"
              >
                #{language === 'en' ? tag.nameEn : tag.nameFr}
              </LocalizedLink>
            ))}
          </div>
        </motion.section>
      )}

      {/* Related Posts */}
      <BlogRelated
        relatedPosts={relatedPosts}
        language={language}
        t={t}
      />

      {/* Related Tarot Cards (shown for tarot-related blog categories) */}
      <RelatedTarotArticles categories={post.categories} />

      {/* Lightbox Modal */}
      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />

      {/* Scroll to top button */}
      <ScrollToTop />
    </article>
  );
};

export default BlogPostView;
