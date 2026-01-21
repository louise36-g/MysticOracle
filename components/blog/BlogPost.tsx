import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { fetchBlogPost, fetchBlogPostPreview, BlogPost as BlogPostType, BlogCategory, BlogTag, fetchLinkRegistry, LinkRegistry, FAQItem, CTAItem } from '../../services/apiService';
import { Calendar, Clock, Eye, User, ArrowLeft, Tag, Share2, Twitter, Facebook, Linkedin, Link2, Check, AlertCircle, X, ZoomIn, ChevronDown, ArrowRight } from 'lucide-react';
import { processShortcodes } from '../internal-links';
import { motion } from 'framer-motion';
import { SmartLink } from '../SmartLink';
import { useTranslation } from '../../context/TranslationContext';

interface BlogPostProps {
  slug?: string;
  previewId?: string;
  onBack: () => void;
  onNavigateToPost: (slug: string) => void;
  onCategoryClick: (slug: string) => void;
  onTagClick: (slug: string) => void;
  onNavigate: (path: string) => void;
}

const BlogPostView: React.FC<BlogPostProps> = ({ slug, previewId, onBack, onNavigateToPost, onCategoryClick, onTagClick, onNavigate }) => {
  const { language } = useApp();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const isPreview = !!previewId;
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [linkRegistry, setLinkRegistry] = useState<LinkRegistry | null>(null);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  // Ref for content container to handle image sizing
  const contentRef = useRef<HTMLDivElement>(null);

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
    // Fetch link registry for shortcode processing
    fetchLinkRegistry().then(setLinkRegistry).catch(console.error);

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

  // Check if this is a Tarot Numerology category article
  const isTarotNumerology = post?.categories.some(cat => cat.slug === 'tarot-numerology') || false;

  // Process shortcodes and sanitize HTML content
  // This hook MUST be called before any early returns to satisfy React's Rules of Hooks
  const { contentBeforeFAQ, contentAfterFAQ } = useMemo(() => {
    if (!rawContent) return { contentBeforeFAQ: '', contentAfterFAQ: '' };
    // Process internal link shortcodes first [[type:slug]] -> <a> tags
    const processedContent = processShortcodes(rawContent, linkRegistry);
    const sanitized = DOMPurify.sanitize(processedContent, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'figure',
        'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
        'width', 'height', 'loading', 'data-link-type'
      ],
      ALLOW_DATA_ATTR: true,
      ADD_ATTR: ['target', 'rel'],
      FORCE_BODY: true,
    });

    // Make all links open in new tab
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, 'text/html');
    doc.querySelectorAll('a').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    // Remove ALL static FAQ sections from content (we render FAQs dynamically as accordions)
    // 1. Remove elements with faq-related classes
    const faqSelectors = [
      '.article-faq',
      '.faq',
      '.faq-section',
      '.faqs',
      '[class*="faq"]'
    ];
    faqSelectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => {
        // Also remove any FAQ heading before it
        const prevElement = el.previousElementSibling;
        if (prevElement && prevElement.tagName.match(/^H[23]$/i) &&
            prevElement.textContent?.toLowerCase().includes('faq')) {
          prevElement.remove();
        }
        el.remove();
      });
    });

    // 2. Remove FAQ headings and their following content (dl, ul, or div with Q&A)
    doc.querySelectorAll('h2, h3').forEach(heading => {
      const text = heading.textContent?.toLowerCase() || '';
      if (text.includes('frequently asked') || text.includes('faq')) {
        // Remove the heading
        let nextEl = heading.nextElementSibling;
        heading.remove();

        // Remove following FAQ content (dl list, div with Q&A, etc.)
        while (nextEl) {
          const tagName = nextEl.tagName.toLowerCase();
          // Stop if we hit another heading
          if (tagName.match(/^h[1-6]$/)) break;

          // Check if this looks like FAQ content
          const isFaqContent =
            tagName === 'dl' || // Definition list (common FAQ format)
            nextEl.classList.contains('faq') ||
            nextEl.querySelector('dt, dd') || // Has definition terms
            (nextEl.textContent?.includes('?') && nextEl.querySelectorAll('p, div').length > 1);

          if (isFaqContent) {
            const toRemove = nextEl;
            nextEl = nextEl.nextElementSibling;
            toRemove.remove();
          } else {
            break;
          }
        }
      }
    });

    // 3. Remove h3/h4 headings that match stored FAQ questions (and their answer paragraphs)
    const storedFaqs = (post?.faq as FAQItem[]) || [];
    if (storedFaqs.length > 0) {
      const faqQuestions = new Set(
        storedFaqs.map(f => f.question.toLowerCase().trim())
      );

      doc.querySelectorAll('h3, h4').forEach(heading => {
        const headingText = heading.textContent?.trim().toLowerCase() || '';
        if (faqQuestions.has(headingText)) {
          // This heading matches a stored FAQ question - remove it and its answer
          const nextEl = heading.nextElementSibling;
          heading.remove();

          // Remove the following paragraph (the answer)
          if (nextEl && nextEl.tagName.toLowerCase() === 'p') {
            nextEl.remove();
          }
        }
      });
    }

    // Remove static CTA banner from content (we render it dynamically)
    const staticCta = doc.querySelector('.cta-banner');
    if (staticCta) {
      staticCta.remove();
    }

    // Special processing for Tarot Numerology category - section breaks only
    if (isTarotNumerology) {
      // Add section breaks before h2 headings
      const h2Elements = doc.querySelectorAll('h2');
      h2Elements.forEach((h2, index) => {
        // Skip the first h2 (no break needed before it)
        if (index > 0) {
          const sectionBreak = doc.createElement('div');
          sectionBreak.className = 'numerology-section-break';
          // Build section break content safely using DOM methods
          const line1 = doc.createElement('div');
          line1.className = 'section-break-line';
          const symbol = doc.createElement('div');
          symbol.className = 'section-break-symbol';
          symbol.textContent = '✦';
          const line2 = doc.createElement('div');
          line2.className = 'section-break-line';
          sectionBreak.appendChild(line1);
          sectionBreak.appendChild(symbol);
          sectionBreak.appendChild(line2);
          h2.parentNode?.insertBefore(sectionBreak, h2);
        }
      });
    }

    // Process images with alignment classes (align-left, align-right)
    // Images with these classes get flex layout with following paragraph
    const images = doc.querySelectorAll('img');
    images.forEach((img) => {
      // Check for alignment class on image or parent figure
      const imgClasses = img.className || '';
      const parent = img.parentElement;
      const parentClasses = parent?.className || '';
      const allClasses = `${imgClasses} ${parentClasses}`.toLowerCase();

      // Determine alignment from classes
      let alignment: 'left' | 'right' | 'center' | null = null;
      if (allClasses.includes('align-left') || allClasses.includes('float-left')) {
        alignment = 'left';
      } else if (allClasses.includes('align-right') || allClasses.includes('float-right')) {
        alignment = 'right';
      } else if (allClasses.includes('align-center')) {
        alignment = 'center';
      }

      // Only create flex layout for left/right aligned images
      if (alignment === 'left' || alignment === 'right') {
        // Find the element containing the image (could be p, figure, or direct)
        let imageContainer: Element | null = img;
        if (parent) {
          if (parent.tagName === 'FIGURE') {
            imageContainer = parent;
          } else if (parent.tagName === 'P' && parent.children.length === 1) {
            imageContainer = parent;
          }
        }

        // Find the next paragraph sibling after the image container
        let nextParagraph: Element | null = null;
        let sibling = imageContainer?.nextElementSibling;
        while (sibling) {
          if (sibling.tagName === 'P' && sibling.textContent?.trim()) {
            nextParagraph = sibling;
            break;
          }
          // Stop if we hit a heading, section break, or another image
          if (sibling.tagName.match(/^H[1-6]$/) ||
              sibling.className?.includes('section-break') ||
              sibling.querySelector('img')) {
            break;
          }
          sibling = sibling.nextElementSibling;
        }

        // Create flex container wrapping both image and paragraph
        const flexContainer = doc.createElement('div');
        flexContainer.className = `blog-image-text blog-image-${alignment}`;

        // Create image wrapper
        const imageWrapper = doc.createElement('div');
        imageWrapper.className = 'blog-image-wrapper';

        // Create text wrapper
        const textWrapper = doc.createElement('div');
        textWrapper.className = 'blog-text-wrapper';

        // Insert flex container before image container
        imageContainer?.parentNode?.insertBefore(flexContainer, imageContainer);

        // Move image container into image wrapper
        if (imageContainer) {
          imageWrapper.appendChild(imageContainer);
        }

        // Move paragraph into text wrapper if found
        if (nextParagraph) {
          textWrapper.appendChild(nextParagraph);
        }

        // Add wrappers to flex container (order depends on direction)
        if (alignment === 'left') {
          flexContainer.appendChild(imageWrapper);
          flexContainer.appendChild(textWrapper);
        } else {
          flexContainer.appendChild(textWrapper);
          flexContainer.appendChild(imageWrapper);
        }
      }
    });

    const fullContent = doc.body.innerHTML;

    // Split content at "Embracing" heading to insert FAQ before it
    // Find position of h2 containing "Embracing" using simple string search
    const lowerContent = fullContent.toLowerCase();
    const embracingIndex = lowerContent.indexOf('embracing');

    if (embracingIndex !== -1) {
      // Find the start of the h2 tag before "Embracing"
      const beforeEmbracing = fullContent.substring(0, embracingIndex);
      const h2Start = beforeEmbracing.lastIndexOf('<h2');

      if (h2Start !== -1) {
        return {
          contentBeforeFAQ: fullContent.substring(0, h2Start),
          contentAfterFAQ: fullContent.substring(h2Start),
        };
      }
    }

    // If no "Embracing" section found, put all content before FAQ
    return { contentBeforeFAQ: fullContent, contentAfterFAQ: '' };
  }, [rawContent, linkRegistry, isTarotNumerology, post?.faq]);

  // Apply aspect ratio-based widths to images after content renders
  useEffect(() => {
    if (!contentRef.current) return;

    const applyImageSizing = (img: HTMLImageElement) => {
      // Skip if already processed
      if (img.dataset.aspectProcessed) return;

      const applySize = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        if (width === 0 || height === 0) return;

        const aspectRatio = width / height;

        // 9:16 portrait format (ratio ~0.5625) -> 250px wide
        // 16:9 landscape format (ratio ~1.778) -> 450px wide
        // Use thresholds to determine format
        if (aspectRatio < 1) {
          // Portrait image (taller than wide)
          img.style.maxWidth = '250px';
          img.classList.add('aspect-portrait');
        } else if (aspectRatio > 1.3) {
          // Landscape image (wider than tall)
          img.style.maxWidth = '450px';
          img.classList.add('aspect-landscape');
        }
        // Square or near-square images keep default styling

        img.dataset.aspectProcessed = 'true';
      };

      if (img.complete && img.naturalWidth > 0) {
        applySize();
      } else {
        img.addEventListener('load', applySize, { once: true });
      }
    };

    // Process all images in content
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => applyImageSizing(img as HTMLImageElement));
  }, [contentBeforeFAQ, contentAfterFAQ]);

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
          {t('blog.BlogPost.article_not_found', 'Article Not Found')}
        </h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <SmartLink href="/blog" onClick={onBack}>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            {t('blog.BlogPost.back_to_blog', 'Back to Blog')}
          </button>
        </SmartLink>
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
              {t('blog.BlogPost.preview_mode', 'Preview Mode')}
            </p>
            <p className="text-amber-200/70 text-sm">
              {t('blog.BlogPost.preview_description', 'This is a preview. The post is not published yet.')}
            </p>
          </div>
        </div>
      )}

      {/* Back Button */}
      <SmartLink href="/blog" onClick={onBack}>
        <button className="flex items-center gap-2 text-slate-400 hover:text-purple-300 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('blog.BlogPost.back_to_blog', 'Back to Blog')}
        </button>
      </SmartLink>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {post.categories.map((cat) => (
            <SmartLink
              key={cat.id}
              href={`/blog/category/${cat.slug}`}
              onClick={() => onCategoryClick(cat.slug)}
              className="px-3 py-1 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              {language === 'en' ? cat.nameEn : cat.nameFr}
            </SmartLink>
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
            {post.readTimeMinutes} min {t('blog.BlogPost.read', 'read')}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.viewCount.toLocaleString()} {t('blog.BlogPost.views', 'views')}
          </span>
        </div>

        {/* Share */}
        <div className="flex justify-center items-center gap-3">
          <span className="text-slate-500 flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            {t('blog.BlogPost.share', 'Share:')}
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

      {/* Content wrapper with ref for image sizing */}
      <div ref={contentRef}>
        {/* Content Part 1 - Before FAQ - HTML sanitized with DOMPurify above */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert prose-purple max-w-none blog-content-images"
          dangerouslySetInnerHTML={{ __html: contentBeforeFAQ }}
          style={{ lineHeight: '1.8' }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
              setLightboxImage((target as HTMLImageElement).src);
              return;
            }
            const anchor = target.closest('a') as HTMLAnchorElement | null;
            if (anchor) {
              const href = anchor.getAttribute('href');
              const targetAttr = anchor.getAttribute('target');
              if (targetAttr === '_blank') return;
              if (href && href.startsWith('/')) {
                e.preventDefault();
                onNavigate(href);
              }
            }
          }}
        />

        {/* FAQ Section - inserted between content sections */}
        {post.faq && post.faq.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="my-12"
          >
            <h2 className="text-2xl font-heading text-purple-200 mb-6">
              {t('blog.BlogPost.faq_title', 'Frequently Asked Questions')}
            </h2>
            <div className="space-y-3">
              {(post.faq as FAQItem[]).map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFAQIndex(openFAQIndex === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-500/5 transition-colors"
                  >
                    <span className="text-white font-medium pr-4">{item.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-purple-400 flex-shrink-0 transition-transform duration-200 ${
                        openFAQIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFAQIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-slate-300 leading-relaxed">{item.answer}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Content Part 2 - After FAQ - HTML sanitized with DOMPurify above */}
        {contentAfterFAQ && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-invert prose-purple max-w-none mb-12 blog-content-images"
            dangerouslySetInnerHTML={{ __html: contentAfterFAQ }}
            style={{ lineHeight: '1.8' }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === 'IMG') {
                setLightboxImage((target as HTMLImageElement).src);
                return;
              }
              const anchor = target.closest('a') as HTMLAnchorElement | null;
              if (anchor) {
                const href = anchor.getAttribute('href');
                const targetAttr = anchor.getAttribute('target');
                if (targetAttr === '_blank') return;
                if (href && href.startsWith('/')) {
                  e.preventDefault();
                  onNavigate(href);
                }
              }
            }}
          />
        )}
      </div>

      {/* CTA Banner */}
      {post.cta && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mb-12"
        >
          <div className="cta-banner p-8 rounded-2xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 text-center">
            <h3 className="text-2xl font-heading text-white mb-3">
              {(post.cta as CTAItem).heading}
            </h3>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              {(post.cta as CTAItem).text}
            </p>
            <SmartLink
              href={(post.cta as CTAItem).buttonUrl}
              onClick={() => onNavigate((post.cta as CTAItem).buttonUrl)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors font-medium"
            >
              {(post.cta as CTAItem).buttonText}
              <ArrowRight className="w-4 h-4" />
            </SmartLink>
          </div>
        </motion.section>
      )}

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
              <SmartLink
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                onClick={() => onTagClick(tag.slug)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm hover:bg-purple-600 hover:text-white transition-colors"
              >
                #{language === 'en' ? tag.nameEn : tag.nameFr}
              </SmartLink>
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
            {t('blog.BlogPost.related_articles', 'Related Articles')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <SmartLink
                key={related.id}
                href={`/blog/${related.slug}`}
                onClick={() => onNavigateToPost(related.slug)}
                className="group cursor-pointer bg-slate-900/60 rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-all block"
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
              </SmartLink>
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
