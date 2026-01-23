import { useMemo, useRef, useEffect } from 'react';
import { BlogPost as BlogPostType, LinkRegistry, FAQItem } from '../../services/apiService';
import { ContentProcessor, ImageLayoutManager } from '../../services/blog';

interface UseBlogContentParams {
  post: BlogPostType | null;
  linkRegistry: LinkRegistry | null;
  language: 'en' | 'fr';
}

interface UseBlogContentReturn {
  contentBeforeFAQ: string;
  contentAfterFAQ: string;
  extractedFAQs: FAQItem[];
  contentRef: React.RefObject<HTMLDivElement>;
}

/**
 * useBlogContent
 * Processes blog post content using ContentProcessor and ImageLayoutManager services
 */
export function useBlogContent({
  post,
  linkRegistry,
  language
}: UseBlogContentParams): UseBlogContentReturn {
  const contentRef = useRef<HTMLDivElement>(null);

  // Get raw content based on language
  const rawContent = post ? (language === 'en' ? post.contentEn : post.contentFr) : '';

  // Check if this is a Tarot Numerology category article
  const isTarotNumerology = post?.categories.some(cat => cat.slug === 'tarot-numerology') || false;

  // Get stored FAQs from database
  const storedFAQs = (post?.faq as FAQItem[]) || [];

  // Process content using ContentProcessor service
  const { contentBeforeFAQ, contentAfterFAQ, extractedFAQs } = useMemo(() => {
    const processor = new ContentProcessor();
    return processor.processContent(
      rawContent,
      linkRegistry,
      isTarotNumerology,
      storedFAQs
    );
  }, [rawContent, linkRegistry, isTarotNumerology, storedFAQs]);

  // Adjust portrait image sizes after they load (using ImageLayoutManager)
  useEffect(() => {
    if (!contentRef.current) return;

    const imageLayoutManager = new ImageLayoutManager();
    imageLayoutManager.adjustImageSizes(contentRef.current);
  }, [contentBeforeFAQ, contentAfterFAQ]);

  return {
    contentBeforeFAQ,
    contentAfterFAQ,
    extractedFAQs,
    contentRef
  };
}
