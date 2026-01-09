import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchTarotMedia,
  uploadTarotMedia,
  deleteTarotMedia,
  restoreTarotMedia,
  permanentlyDeleteTarotMedia,
  TarotMedia,
} from '../../services/apiService';
import { Upload, Trash2, Copy, Check, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface TarotMediaManagerProps {
  showTrash?: boolean;
  onMediaChange?: () => void;
}

const TarotMediaManager: React.FC<TarotMediaManagerProps> = ({ showTrash = false, onMediaChange }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [media, setMedia] = useState<TarotMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const result = await fetchTarotMedia(token, { deleted: showTrash });
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, showTrash]);

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
        await uploadTarotMedia(token, file);
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
    if (!confirm(language === 'en' ? 'Move to trash?' : 'Mettre à la corbeille?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteTarotMedia(token, id);
      loadMedia();
      onMediaChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await restoreTarotMedia(token, id);
      loadMedia();
      onMediaChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Permanently delete?' : 'Supprimer définitivement?')) return;
    try {
      const token = await getToken();
      if (!token) return;
      await permanentlyDeleteTarotMedia(token, id);
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
      {!showTrash && (
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
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        {media.map((item) => (
          <div
            key={item.id}
            className="group relative bg-slate-900/60 rounded-lg border border-purple-500/20 overflow-hidden"
          >
            <img
              src={item.url}
              alt={item.altText || item.originalName}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {showTrash ? (
                <>
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="p-2 bg-green-500/50 rounded-lg text-white hover:bg-green-500/70"
                    title={language === 'en' ? 'Restore' : 'Restaurer'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(item.id)}
                    className="p-2 bg-red-500/50 rounded-lg text-white hover:bg-red-500/70"
                    title={language === 'en' ? 'Delete permanently' : 'Supprimer définitivement'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
            <div className="p-2">
              <p className="text-slate-400 text-xs truncate">{item.originalName}</p>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            {showTrash
              ? (language === 'en' ? 'Trash is empty' : 'Corbeille vide')
              : (language === 'en' ? 'No images uploaded yet' : 'Aucune image')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TarotMediaManager;
