import React, { RefObject } from 'react';
import { motion } from 'framer-motion';

interface BlogContentProps {
  contentBeforeFAQ: string;
  contentAfterFAQ: string;
  contentRef: RefObject<HTMLDivElement>;
  onImageClick: (src: string) => void;
  onNavigate: (href: string) => void;
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
 */
export const BlogContent: React.FC<BlogContentProps> = ({
  contentBeforeFAQ,
  contentAfterFAQ,
  contentRef,
  onImageClick,
  onNavigate,
}) => {
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Handle image clicks for lightbox
    if (target.tagName === 'IMG') {
      onImageClick((target as HTMLImageElement).src);
      return;
    }

    // Handle internal link navigation
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (anchor) {
      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Skip external links (target="_blank")
      if (targetAttr === '_blank') return;

      // Navigate internal links with SPA routing
      if (href && href.startsWith('/')) {
        e.preventDefault();
        onNavigate(href);
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
