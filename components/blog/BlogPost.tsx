import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchBlogPost, fetchBlogPostPreview, BlogPost as BlogPostType, BlogCategory, BlogTag } from '../../services/apiService';
import { Calendar, Clock, Eye, User, ArrowLeft, Tag, Share2, Twitter, Facebook, Linkedin, Link2, Check, AlertCircle, X, ZoomIn } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlogPostProps {
  slug?: string;
  previewId?: string;
  onBack: () => void;
  onNavigateToPost: (slug: string) => void;
  onCategoryClick: (slug: string) => void;
  onTagClick: (slug: string) => void;
}

const BlogPostView: React.FC<BlogPostProps> = ({ slug, previewId, onBack, onNavigateToPost, onCategoryClick, onTagClick }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const isPreview = !!previewId;
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (previewId) {
        // Admin preview mode - fetch by ID
        const token = await getToken();
        if (!token) {
          setError('Authentication required for preview');
          setLoading(false);
          return;
        }
        result = await fetchBlogPostPreview(token, previewId);
      } else if (slug) {
        // Normal mode - fetch by slug
        result = await fetchBlogPost(slug);
      } else {
        setError('No post specified');
        setLoading(false);
        return;
      }

      setPost(result.post);
      setRelatedPosts(result.relatedPosts || []);

      // Update page meta tags for SEO (skip for preview)
      if (!isPreview) {
        updateMetaTags(result.post);
      } else {
        document.title = `Preview: ${result.post.titleEn} | MysticOracle`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [slug, previewId, getToken, isPreview]);

  useEffect(() => {
    loadPost();

    // Cleanup meta tags when unmounting
    return () => {
      resetMetaTags();
    };
  }, [loadPost]);

  const updateMetaTags = (post: BlogPostType) => {
    const title = language === 'en'
      ? (post.metaTitleEn || post.titleEn)
      : (post.metaTitleFr || post.titleFr);
    const description = language === 'en'
      ? (post.metaDescEn || post.excerptEn)
      : (post.metaDescFr || post.excerptFr);
    const image = post.ogImage || post.coverImage;
    const url = window.location.href;

    // Update document title
    document.title = `${title} | MysticOracle`;

    // Update or create meta tags
    updateOrCreateMeta('description', description);
    updateOrCreateMeta('author', post.authorName);

    // Open Graph tags
    updateOrCreateMeta('og:title', title, 'property');
    updateOrCreateMeta('og:description', description, 'property');
    updateOrCreateMeta('og:type', 'article', 'property');
    updateOrCreateMeta('og:url', url, 'property');
    if (image) updateOrCreateMeta('og:image', image, 'property');
    updateOrCreateMeta('og:site_name', 'MysticOracle', 'property');
    updateOrCreateMeta('og:locale', language === 'en' ? 'en_US' : 'fr_FR', 'property');

    // Twitter Card tags
    updateOrCreateMeta('twitter:card', 'summary_large_image', 'name');
    updateOrCreateMeta('twitter:title', title, 'name');
    updateOrCreateMeta('twitter:description', description, 'name');
    if (image) updateOrCreateMeta('twitter:image', image, 'name');

    // Article specific meta
    if (post.publishedAt) {
      updateOrCreateMeta('article:published_time', post.publishedAt, 'property');
    }
    updateOrCreateMeta('article:author', post.authorName, 'property');

    // Add JSON-LD structured data
    addJsonLd(post, url, language);
  };

  const updateOrCreateMeta = (key: string, value: string, attribute: 'name' | 'property' = 'name') => {
    let meta = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, key);
      document.head.appendChild(meta);
    }
    meta.content = value;
  };

  const addJsonLd = (post: BlogPostType, url: string, lang: string) => {
    // Remove existing JSON-LD
    const existing = document.querySelector('script[type="application/ld+json"][data-blog]');
    if (existing) existing.remove();

    const title = lang === 'en' ? post.titleEn : post.titleFr;
    const description = lang === 'en' ? post.excerptEn : post.excerptFr;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': title,
      'description': description,
      'image': post.coverImage || '',
      'author': {
        '@type': 'Person',
        'name': post.authorName,
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'MysticOracle',
        'logo': {
          '@type': 'ImageObject',
          'url': `${window.location.origin}/logo.png`,
        },
      },
      'datePublished': post.publishedAt,
      'dateModified': post.updatedAt,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': url,
      },
      'keywords': post.tags.map((t: BlogTag) => lang === 'en' ? t.nameEn : t.nameFr).join(', '),
      'articleSection': post.categories.map((c: BlogCategory) => lang === 'en' ? c.nameEn : c.nameFr).join(', '),
      'wordCount': Math.round(
        ((lang === 'en' ? post.contentEn : post.contentFr) || '').split(/\s+/).length
      ),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-blog', 'true');
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  };

  const resetMetaTags = () => {
    document.title = 'MysticOracle - AI Tarot Readings';

    // Remove blog-specific meta tags
    const tagsToReset = [
      'og:type',
      'article:published_time',
      'article:author',
    ];
    tagsToReset.forEach((tag) => {
      const meta = document.querySelector(`meta[property="${tag}"]`);
      if (meta) meta.remove();
    });

    // Remove JSON-LD
    const jsonLd = document.querySelector('script[type="application/ld+json"][data-blog]');
    if (jsonLd) jsonLd.remove();
  };

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

  // Get content based on language (may be empty if post not loaded)
  const rawContent = post ? (language === 'en' ? post.contentEn : post.contentFr) : '';

  // Sanitize HTML content to prevent XSS attacks
  // This hook MUST be called before any early returns to satisfy React's Rules of Hooks
  const sanitizedContent = useMemo(() => {
    if (!rawContent) return '';
    return DOMPurify.sanitize(rawContent, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'figure',
        'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
        'width', 'height', 'loading'
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target', 'rel'],
      // Force all links to open in new tab with security attributes
      FORCE_BODY: true,
    });
  }, [rawContent]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-heading text-red-400 mb-4">
          {language === 'en' ? 'Article Not Found' : 'Article Non Trouve'}
        </h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 inline mr-2" />
          {language === 'en' ? 'Back to Blog' : 'Retour au Blog'}
        </button>
      </div>
    );
  }

  const title = language === 'en' ? post.titleEn : post.titleFr;
  const excerpt = language === 'en' ? post.excerptEn : post.excerptFr;

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Preview Banner */}
      {isPreview && (
        <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-200 font-medium">
              {language === 'en' ? 'Preview Mode' : 'Mode Apercu'}
            </p>
            <p className="text-amber-200/70 text-sm">
              {language === 'en'
                ? 'This is a preview. The post is not published yet.'
                : 'Ceci est un apercu. L\'article n\'est pas encore publie.'}
            </p>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-purple-300 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {language === 'en' ? 'Back to Blog' : 'Retour au Blog'}
      </button>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {post.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryClick(cat.slug)}
              className="px-3 py-1 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              {language === 'en' ? cat.nameEn : cat.nameFr}
            </button>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 mb-6 leading-tight">
          {title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap justify-center items-center gap-4 text-slate-400 text-sm mb-6">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {post.authorName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(post.publishedAt || post.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {post.readTimeMinutes} min {language === 'en' ? 'read' : 'lecture'}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.viewCount.toLocaleString()} {language === 'en' ? 'views' : 'vues'}
          </span>
        </div>

        {/* Share */}
        <div className="flex justify-center items-center gap-3">
          <span className="text-slate-500 flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            {language === 'en' ? 'Share:' : 'Partager:'}
          </span>
          <button
            onClick={() => handleShare('twitter')}
            className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors"
            aria-label="Share on Twitter"
          >
            <Twitter className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-[#4267B2] hover:bg-[#4267B2]/10 transition-colors"
            aria-label="Share on Facebook"
          >
            <Facebook className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-[#0077B5] hover:bg-[#0077B5]/10 transition-colors"
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleShare('copy')}
            className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            aria-label="Copy link"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
          </button>
        </div>
      </motion.header>

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
              className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Content - HTML is sanitized with DOMPurify to prevent XSS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="prose prose-invert prose-purple max-w-none mb-12 blog-content-images"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        style={{
          // Custom prose styling
          lineHeight: '1.8',
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'IMG') {
            setLightboxImage((target as HTMLImageElement).src);
          }
        }}
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
              {language === 'en' ? 'Tags:' : 'Tags:'}
            </span>
            {post.tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagClick(tag.slug)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm hover:bg-purple-600 hover:text-white transition-colors"
              >
                #{language === 'en' ? tag.nameEn : tag.nameFr}
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-t border-purple-500/20 pt-12"
        >
          <h2 className="text-2xl font-heading text-purple-200 mb-6">
            {language === 'en' ? 'Related Articles' : 'Articles Similaires'}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <article
                key={related.id}
                onClick={() => onNavigateToPost(related.slug)}
                className="group cursor-pointer bg-slate-900/60 rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all"
              >
                {related.coverImage && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={related.coverImage}
                      alt={language === 'en' ? related.titleEn : related.titleFr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
              </article>
            ))}
          </div>
        </motion.section>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size image"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
};

export default BlogPostView;
