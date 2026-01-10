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
import { Upload, Trash2, Copy, Check, Image as ImageIcon, FolderOpen, ChevronDown } from 'lucide-react';

// Folder configuration
const FOLDERS = [
  { id: 'all', label: 'All', labelFr: 'Tous' },
  { id: 'blog', label: 'Blog', labelFr: 'Blog' },
  { id: 'tarot', label: 'Tarot', labelFr: 'Tarot' },
];

interface TarotMediaManagerProps {
  onMediaChange?: () => void;
  defaultFolder?: string;
}

const TarotMediaManager: React.FC<TarotMediaManagerProps> = ({ onMediaChange, defaultFolder }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [uploadFolder, setUploadFolder] = useState<string>(defaultFolder || 'tarot');
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      // Pass folder filter (undefined for 'all' to get all media)
      const folderFilter = activeFolder === 'all' ? undefined : activeFolder;
      const result = await fetchAdminBlogMedia(token, folderFilter);
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, activeFolder]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFolderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const token = await getToken();
      if (!token) return;

      for (const file of Array.from(files as FileList)) {
        // Pass the selected upload folder
        await uploadBlogMedia(token, file, undefined, undefined, uploadFolder);
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

  const getFolderLabel = (folderId: string) => {
    const folder = FOLDERS.find(f => f.id === folderId);
    if (!folder) return folderId;
    return language === 'en' ? folder.label : folder.labelFr;
  };

  const getFolderBadgeColor = (folder: string) => {
    switch (folder) {
      case 'blog': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'tarot': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
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
      {/* Toolbar with folder tabs and upload controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Folder filter tabs */}
        <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-purple-500/20">
          {FOLDERS.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFolder === folder.id
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {language === 'en' ? folder.label : folder.labelFr}
            </button>
          ))}
        </div>

        {/* Upload controls */}
        <div className="flex items-center gap-3">
          {/* Folder selector dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-sm text-slate-300 hover:border-purple-500/50"
            >
              <FolderOpen className="w-4 h-4" />
              <span>{language === 'en' ? 'Upload to:' : 'Dossier:'}</span>
              <span className="text-white font-medium">{getFolderLabel(uploadFolder)}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFolderDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showFolderDropdown && (
              <div className="absolute right-0 mt-1 w-40 bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl z-10">
                {FOLDERS.filter(f => f.id !== 'all').map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setUploadFolder(folder.id);
                      setShowFolderDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-purple-600/20 first:rounded-t-lg last:rounded-b-lg ${
                      uploadFolder === folder.id ? 'text-purple-400 bg-purple-600/10' : 'text-slate-300'
                    }`}
                  >
                    {language === 'en' ? folder.label : folder.labelFr}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upload button */}
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
            {language === 'en' ? 'Upload Images' : 'Telecharger images'}
          </button>
        </div>
      </div>

      {/* Media grid */}
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
              {/* Folder badge */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded border ${getFolderBadgeColor(item.folder)}`}>
                  {getFolderLabel(item.folder)}
                </span>
              </div>
              {/* Original filename */}
              <p className="text-slate-400 text-xs truncate" title={item.originalName}>
                {item.originalName || item.altText || 'Image'}
              </p>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            {activeFolder === 'all'
              ? (language === 'en' ? 'No images uploaded yet' : 'Aucune image')
              : (language === 'en'
                  ? `No images in ${getFolderLabel(activeFolder)} folder`
                  : `Aucune image dans le dossier ${getFolderLabel(activeFolder)}`
                )
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default TarotMediaManager;
