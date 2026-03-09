import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { fetchAdminBlogMedia, BlogMedia } from '../../services/api';

// Folder configuration for media library
const MEDIA_FOLDERS = [
  { id: 'all', label: 'All' },
  { id: 'blog', label: 'Blog' },
  { id: 'tarot', label: 'Tarot' },
];

interface UseMediaLibraryOptions {
  onMediaUpload?: (file: File) => Promise<string>;
  onMediaDelete?: (id: string) => Promise<void>;
}

interface UseMediaLibraryReturn {
  // State
  mediaItems: BlogMedia[];
  mediaLoading: boolean;
  activeFolder: string;
  uploading: boolean;
  deletingMedia: string | null;
  folders: typeof MEDIA_FOLDERS;

  // Actions
  setActiveFolder: (folder: string) => void;
  loadMedia: () => Promise<void>;
  uploadMedia: (file: File) => Promise<string | null>;
  deleteMedia: (id: string, e: React.MouseEvent) => Promise<void>;
  handleModalFileSelect: (
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
    setAlt: (alt: string) => void,
  ) => Promise<void>;
}

export function useMediaLibrary({
  onMediaUpload,
  onMediaDelete,
}: UseMediaLibraryOptions): UseMediaLibraryReturn {
  const { getToken } = useAuth();

  const [mediaItems, setMediaItems] = useState<BlogMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    try {
      setMediaLoading(true);
      const token = await getToken();
      if (!token) return;
      const folderFilter = activeFolder === 'all' ? undefined : activeFolder;
      const result = await fetchAdminBlogMedia(token, folderFilter);
      setMediaItems(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setMediaLoading(false);
    }
  }, [getToken, activeFolder]);

  // Reload media when folder changes
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const uploadMedia = useCallback(async (file: File): Promise<string | null> => {
    if (!onMediaUpload) return null;

    setUploading(true);
    try {
      const url = await onMediaUpload(file);
      // Reload media library after successful upload
      await loadMedia();
      return url;
    } catch (err) {
      console.error('Failed to upload image:', err);
      return null;
    } finally {
      setUploading(false);
    }
  }, [onMediaUpload, loadMedia]);

  const deleteMedia = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onMediaDelete) return;

    setDeletingMedia(id);
    try {
      await onMediaDelete(id);
      // Reload media library after deletion
      await loadMedia();
    } catch (err) {
      console.error('Failed to delete media:', err);
    } finally {
      setDeletingMedia(null);
    }
  }, [onMediaDelete, loadMedia]);

  const handleModalFileSelect = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
    setAlt: (alt: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file && onMediaUpload) {
      setUploading(true);
      try {
        const url = await onMediaUpload(file);
        setUrl(url);
        setAlt(file.name.replace(/\.[^/.]+$/, ''));
        // Reload media library after successful upload
        await loadMedia();
      } catch (err) {
        console.error('Failed to upload image:', err);
      } finally {
        setUploading(false);
      }
    }
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  }, [onMediaUpload, loadMedia]);

  return {
    mediaItems,
    mediaLoading,
    activeFolder,
    uploading,
    deletingMedia,
    folders: MEDIA_FOLDERS,
    setActiveFolder,
    loadMedia,
    uploadMedia,
    deleteMedia,
    handleModalFileSelect,
  };
}

export { MEDIA_FOLDERS };
export type { UseMediaLibraryReturn };
