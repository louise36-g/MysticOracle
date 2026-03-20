import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchBlogPost,
  fetchBlogPostPreview,
  fetchLinkRegistry,
  BlogPost as BlogPostType,
  LinkRegistry
} from '../../services/api';

/**
 * Read pre-rendered blog post data embedded in the HTML by the prerender script.
 * This eliminates the API round-trip on initial page load.
 */
function getEmbeddedBlogData(slug: string | undefined): { post: BlogPostType; relatedPosts: BlogPostType[] } | null {
  if (typeof document === 'undefined' || !slug) return null;
  const el = document.getElementById('__BLOG_POST_DATA__');
  if (!el?.textContent) return null;
  try {
    const data = JSON.parse(el.textContent) as { post: BlogPostType; relatedPosts: BlogPostType[] };
    if (data.post?.slug === slug) return data;
    return null;
  } catch {
    return null;
  }
}

interface UseBlogPostParams {
  slug?: string;
  previewId?: string;
}

interface UseBlogPostReturn {
  post: BlogPostType | null;
  relatedPosts: BlogPostType[];
  linkRegistry: LinkRegistry | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * useBlogPost
 * Handles loading blog post data, related posts, and link registry
 */
export function useBlogPost({ slug, previewId }: UseBlogPostParams): UseBlogPostReturn {
  const { getToken } = useAuth();

  // SSR-lite: read embedded data once to skip API fetch on pre-rendered pages
  const embeddedRef = useRef(previewId ? null : getEmbeddedBlogData(slug));
  const hasEmbeddedData = useRef(!!embeddedRef.current);
  const [post, setPost] = useState<BlogPostType | null>(
    () => embeddedRef.current?.post || null
  );
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>(
    () => embeddedRef.current?.relatedPosts || []
  );
  const [linkRegistry, setLinkRegistry] = useState<LinkRegistry | null>(null);
  const [loading, setLoading] = useState(!hasEmbeddedData.current);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [slug, previewId, getToken]);

  useEffect(() => {
    if (!hasEmbeddedData.current) {
      loadPost();
    }
    // Fetch link registry for shortcode processing (always needed)
    fetchLinkRegistry().then(setLinkRegistry).catch(console.error);
  }, [loadPost]);

  return {
    post,
    relatedPosts,
    linkRegistry,
    loading,
    error,
    reload: loadPost
  };
}
