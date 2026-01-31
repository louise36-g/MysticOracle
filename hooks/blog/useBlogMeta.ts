import { useEffect, useRef } from 'react';
import { BlogPost as BlogPostType } from '../../services/api';
import { SEOManager } from '../../services/blog';

interface UseBlogMetaParams {
  post: BlogPostType | null;
  language: 'en' | 'fr';
  isPreview: boolean;
}

/**
 * useBlogMeta
 * Updates document head with SEO tags using SEOManager service
 * Handles cleanup on unmount
 */
export function useBlogMeta({ post, language, isPreview }: UseBlogMetaParams): void {
  const seoManagerRef = useRef<SEOManager>(new SEOManager());

  useEffect(() => {
    if (!post) return;

    if (!isPreview) {
      // Update SEO meta tags for normal viewing
      seoManagerRef.current.updatePageMeta(post, language);
    } else {
      // Simple title for preview mode
      document.title = `Preview: ${post.titleEn} | MysticOracle`;
    }

    // Cleanup meta tags when unmounting
    return () => {
      seoManagerRef.current.resetPageMeta();
    };
  }, [post, language, isPreview]);
}
