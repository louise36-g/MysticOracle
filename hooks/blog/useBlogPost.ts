import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchBlogPost,
  fetchBlogPostPreview,
  fetchLinkRegistry,
  BlogPost as BlogPostType,
  LinkRegistry
} from '../../services/api';

export interface AdjacentPost {
  slug: string;
  title: string;
  titleFr: string;
  coverImage: string | null;
  contentType: string;
}

interface UseBlogPostParams {
  slug?: string;
  previewId?: string;
}

interface UseBlogPostReturn {
  post: BlogPostType | null;
  relatedPosts: BlogPostType[];
  prevPost: AdjacentPost | null;
  nextPost: AdjacentPost | null;
  linkRegistry: LinkRegistry | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * useBlogPost
 * Handles loading blog post data, related posts, and link registry.
 * Always fetches from the API — no embedded static data — so admin edits
 * are visible within the cache TTL (~2 min) without a redeployment.
 */
export function useBlogPost({ slug, previewId }: UseBlogPostParams): UseBlogPostReturn {
  const { getToken } = useAuth();

  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);
  const [prevPost, setPrevPost] = useState<AdjacentPost | null>(null);
  const [nextPost, setNextPost] = useState<AdjacentPost | null>(null);
  const [linkRegistry, setLinkRegistry] = useState<LinkRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (previewId) {
        const token = await getToken();
        if (!token) {
          setError('Authentication required for preview');
          setLoading(false);
          return;
        }
        result = await fetchBlogPostPreview(token, previewId);
      } else if (slug) {
        result = await fetchBlogPost(slug);
      } else {
        setError('No post specified');
        setLoading(false);
        return;
      }

      setPost(result.post);
      setRelatedPosts(result.relatedPosts || []);
      setPrevPost(result.prevPost || null);
      setNextPost(result.nextPost || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [slug, previewId, getToken]);

  useEffect(() => {
    loadPost();
    fetchLinkRegistry().then(setLinkRegistry).catch(console.error);
  }, [loadPost]);

  return {
    post,
    relatedPosts,
    prevPost,
    nextPost,
    linkRegistry,
    loading,
    error,
    reload: loadPost
  };
}
