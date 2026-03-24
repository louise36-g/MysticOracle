import React, { RefObject, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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

  // Handle suit-nav pill clicks (span[data-scroll-to] elements)
  // Uses vanilla DOM listener because these are injected via dangerouslySetInnerHTML
  useEffect(() => {
    const container = contentRef.current;
    console.log('[SuitNav] useEffect running, container:', !!container);
    if (!container) return;

    const pills = container.querySelectorAll('[data-scroll-to]');
    console.log('[SuitNav] Found', pills.length, 'pills with data-scroll-to');

    const targets = container.querySelectorAll('[data-section-id]');
    console.log('[SuitNav] Found', targets.length, 'headings with data-section-id');

    const handleClick = (e: MouseEvent) => {
      console.log('[SuitNav] Click detected on:', (e.target as HTMLElement).tagName, (e.target as HTMLElement).textContent?.slice(0, 20));
      const pill = (e.target as HTMLElement).closest('[data-scroll-to]') as HTMLElement | null;
      if (!pill) {
        console.log('[SuitNav] No data-scroll-to found on clicked element');
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const targetId = pill.getAttribute('data-scroll-to');
      console.log('[SuitNav] Scrolling to:', targetId);

      const el = document.getElementById(targetId!)
        || document.querySelector(`[data-section-id="${targetId}"]`);
      console.log('[SuitNav] Target element found:', !!el);

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [contentBeforeFAQ, contentAfterFAQ, contentRef]);

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Handle image clicks for lightbox
    if (target.tagName === 'IMG') {
      onImageClick((target as HTMLImageElement).src);
      return;
    }

    // Handle link clicks
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (anchor) {
      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Skip external links (target="_blank")
      if (targetAttr === '_blank') return;

      // Navigate internal links with SPA routing
      if (href && href.startsWith('/')) {
        e.preventDefault();
        navigate(href);
      }
    }
  };

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
        onClick={handleContentClick}
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
          onClick={handleContentClick}
        />
      )}
    </div>
  );
};
