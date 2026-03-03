import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  BlogMedia,
} from '../../../../services/api';

interface UseEditorMediaOptions {
  /** Upload folder name (e.g. 'tarot'). Defaults to the API default ('blog'). */
  folder?: string;
}

/**
 * Shared media-library state and handlers for both editors.
 *
 * Manages loading, uploading, and deleting media items.
 * The caller can also pass `setMedia` into its own sidebar-data
 * loader so the initial fetch runs in parallel with other data.
 */
export function useEditorMedia(options: UseEditorMediaOptions = {}) {
  const { getToken } = useAuth();
  const [media, setMedia] = useState<BlogMedia[]>([]);

  const loadMedia = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await fetchAdminBlogMedia(token);
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    }
  };

  const handleMediaUpload = async (file: File): Promise<string> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    const result = await uploadBlogMedia(token, file, undefined, undefined, options.folder);
    await loadMedia();
    return result.media.url;
  };

  const handleMediaDelete = async (id: string): Promise<void> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    await deleteBlogMedia(token, id);
    await loadMedia();
  };

  return { media, setMedia, loadMedia, handleMediaUpload, handleMediaDelete };
}
