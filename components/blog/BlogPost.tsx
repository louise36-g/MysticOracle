import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { FAQItem, CTAItem } from '../../services/api';
import { ArrowLeft, Tag, AlertCircle, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../context/TranslationContext';
import { useBlogPost, useBlogContent, useBlogMeta } from '../../hooks/blog';
import { BlogHeader, BlogContent, BlogFAQ, BlogCTA, BlogRelated, BlogLightbox } from './components';
import { ROUTES } from '../../routes/routes';
import { trackArticleView, trackScrollDepth } from '../../utils/analytics';

interface BlogPostProps {
  previewId?: string;
}

const BlogPostView: React.FC<BlogPostProps> = ({ previewId }) => {
  const { language } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Get slug from URL params
  const { slug } = useParams<{ slug: string }>();
  const isPreview = !!previewId;

  // Get category from navigation state (for back button)
  const fromCategory = (location.state as { fromCategory?: string } | null)?.fromCategory || '';

  // Local UI state
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  // Custom hooks handle all complex logic
  const { post, relatedPosts, linkRegistry, loading, error } = useBlogPost({ slug, previewId });
  const { contentBeforeFAQ, contentAfterFAQ, extractedFAQs, contentRef } = useBlogContent({ post, linkRegistry, language });
  useBlogMeta({ post, language, isPreview });

  // Scroll depth tracking
  const scrollMilestonesRef = useRef<Set<number>>(new Set());
  const articleContainerRef = useRef<HTMLElement>(null);

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

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
        <Link to={fromCategory ? `${ROUTES.BLOG}?category=${fromCategory}` : ROUTES.BLOG}>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            {t('blog.BlogPost.back_to_blog', 'Back to Blog')}
          </button>
        </Link>
      </div>
    );
  }

  const title = language === 'en' ? post.titleEn : post.titleFr;

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
      <Link to={fromCategory ? `${ROUTES.BLOG}?category=${fromCategory}` : ROUTES.BLOG} className="flex items-center gap-2 text-slate-400 hover:text-purple-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t('blog.BlogPost.back_to_blog', 'Back to Blog')}
      </Link>

      {/* Header */}
      <BlogHeader
        post={post}
        title={title}
        language={language}
        copied={copied}
        formatDate={formatDate}
        handleShare={handleShare}
        t={t}
      />

      {/* Cover Image */}
      {post.coverImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10 rounded-2xl overflow-hidden border border-purple-500/20 group cursor-pointer"
          onClick={() => setLightboxImage(post.coverImage!)}
        >
          <div className="relative">
            <img
              src={post.coverImage}
              alt={post.coverImageAlt || title}
              className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-150"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <BlogContent
        contentBeforeFAQ={contentBeforeFAQ}
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
              <Link
                key={tag.id}
                to={`${ROUTES.BLOG}?tag=${tag.slug}`}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm hover:bg-purple-600 hover:text-white transition-colors"
              >
                #{language === 'en' ? tag.nameEn : tag.nameFr}
              </Link>
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

      {/* Lightbox Modal */}
      {lightboxImage && <BlogLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </article>
  );
};

export default BlogPostView;
