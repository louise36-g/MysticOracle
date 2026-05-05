import React, { RefObject, useEffect } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { motion } from 'framer-motion';

function buildContentClickHandler(navigate: NavigateFunction, onImageClick: (src: string) => void) {
  return (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      onImageClick((target as HTMLImageElement).src);
      return;
    }
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    // External links — let browser handle (new tab when target="_blank" is set)
    if (!href.startsWith('/') && !href.includes('celestiarcana.com')) return;
    // CTA buttons — SPA navigate in same tab
    if (anchor.hasAttribute('data-cta')) {
      e.preventDefault();
      navigate(href.startsWith('/') ? href : (() => { try { return new URL(href).pathname; } catch { return href; } })());
      return;
    }
    // Internal article links — open in new tab so readers don't lose their place
    if (href.startsWith('/')) {
      e.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
    } else if (href.includes('celestiarcana.com')) {
      try {
        const url = new URL(href);
        e.preventDefault();
        window.open(url.pathname, '_blank', 'noopener,noreferrer');
      } catch { /* let browser handle */ }
    }
  };
}

interface BlogContentProps {
  contentBeforeFAQ: string;
  contentAfterFAQ: string;
  contentRef: RefObject<HTMLDivElement>;
  onImageClick: (src: string) => void;
}

/**
 * BlogContent Component
 *
 * Renders the sanitized blog post content (before and after FAQ section).
 * Content is pre-sanitized by ContentProcessor using DOMPurify.
 *
 * Handles:
 * - Image clicks for lightbox modal
 * - Internal link navigation with SPA routing
 * - Suit-nav pill smooth scrolling via data-scroll-to spans
 */
export const BlogContent: React.FC<BlogContentProps> = ({
  contentBeforeFAQ,
  contentAfterFAQ,
  contentRef,
  onImageClick,
}) => {
  const navigate = useNavigate();

  // Single native listener handles scroll-pill clicks, image clicks, and link navigation.
  // Native addEventListener fires reliably for content inside dangerouslySetInnerHTML,
  // avoiding the React synthetic event delegation issues that affected onClick on motion.div.
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = buildContentClickHandler(navigate, onImageClick);

    const handleScrollPill = (e: MouseEvent) => {
      const pill = (e.target as HTMLElement).closest('[data-scroll-to]') as HTMLElement | null;
      if (!pill) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const targetId = pill.getAttribute('data-scroll-to');
      if (!targetId) return;
      const el = document.getElementById(targetId)
        || document.querySelector(`[data-section-id="${targetId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    container.addEventListener('click', handleScrollPill);
    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('click', handleScrollPill);
      container.removeEventListener('click', handleClick);
    };
  }, [navigate, onImageClick, contentRef]);

  return (
    <div ref={contentRef}>
      {/* Content Part 1 - Before FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="prose prose-invert prose-purple max-w-none blog-content-images"
        dangerouslySetInnerHTML={{ __html: contentBeforeFAQ }}
        style={{ lineHeight: '1.8' }}
      />

      {/* Content Part 2 - After FAQ (if exists) */}
      {contentAfterFAQ && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="prose prose-invert prose-purple max-w-none mb-12 blog-content-images"
          dangerouslySetInnerHTML={{ __html: contentAfterFAQ }}
          style={{ lineHeight: '1.8' }}
        />
      )}
    </div>
  );
};
