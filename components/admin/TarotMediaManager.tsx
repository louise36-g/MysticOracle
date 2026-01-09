import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  // Use shared blog media system for consistency across all content types
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  BlogMedia,
} from '../../services/apiService';
import { Upload, Trash2, Copy, Check, Image as ImageIcon } from 'lucide-react';

interface TarotMediaManagerProps {
  onMediaChange?: () => void;
}

const TarotMediaManager: React.FC<TarotMediaManagerProps> = ({ onMediaChange }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const result = await fetchAdminBlogMedia(token);
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const token = await getToken();
      if (!token) return;

      for (const file of Array.from(files as FileList)) {
        await uploadBlogMedia(token, file);
      }

      loadMedia();
      onMediaChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this image?' : 'Supprimer cette image?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteBlogMedia(token, id);
      loadMedia();
      onMediaChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {language === 'en' ? 'Upload Images' : 'Télécharger images'}
        </button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {media.map((item) => (
          <div
            key={item.id}
            className="group relative bg-slate-900/60 rounded-lg border border-purple-500/20 overflow-hidden"
          >
            <img
              src={item.url}
              alt={item.altText || 'Media'}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => copyToClipboard(item.url)}
                className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30"
                title={language === 'en' ? 'Copy URL' : 'Copier URL'}
              >
                {copiedUrl === item.url ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 bg-red-500/50 rounded-lg text-white hover:bg-red-500/70"
                title={language === 'en' ? 'Delete' : 'Supprimer'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <p className="text-slate-400 text-xs truncate">{item.altText || 'Image'}</p>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            {language === 'en' ? 'No images uploaded yet' : 'Aucune image'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TarotMediaManager;
