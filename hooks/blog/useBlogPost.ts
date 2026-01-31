import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchBlogPost,
  fetchBlogPostPreview,
  fetchLinkRegistry,
  BlogPost as BlogPostType,
  LinkRegistry
} from '../../services/api';

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
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);
  const [linkRegistry, setLinkRegistry] = useState<LinkRegistry | null>(null);
  const [loading, setLoading] = useState(true);
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
    loadPost();
    // Fetch link registry for shortcode processing
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
