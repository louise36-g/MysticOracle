import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { CoverImageSectionProps } from './types';

const CoverImageSection: React.FC<CoverImageSectionProps> = ({
  imageUrl,
  imageAlt,
  onImageChange,
  mediaLibrary,
  onMediaUpload,
  onMediaDelete,
  language,
  uploading: externalUploading,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUploading = externalUploading || uploading;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await onMediaUpload(file);
      const alt = file.name.replace(/\.[^/.]+$/, '');
      onImageChange(url, alt);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!onMediaDelete) return;
    setDeletingMediaId(id);
    try {
      await onMediaDelete(id);
    } finally {
      setDeletingMediaId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={imageAlt || 'Cover'}
          className="w-full h-32 object-cover rounded-lg"
        />
      )}

      {/* Upload Button */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {language === 'en' ? 'Uploading...' : 'Envoi...'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {language === 'en' ? 'Upload Image' : 'Télécharger image'}
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-slate-900 text-slate-500">
            {language === 'en' ? 'or use URL' : 'ou utiliser URL'}
          </span>
        </div>
      </div>

      {/* URL Input */}
      <input
        type="text"
        value={imageUrl || ''}
        onChange={(e) => onImageChange(e.target.value)}
        placeholder="https://..."
        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
      />

      {/* Media Library Selection */}
      {mediaLibrary.length > 0 && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            {language === 'en' ? 'Or select from library' : 'Ou choisir depuis bibliothèque'}
          </label>
          <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto">
            {mediaLibrary.slice(0, 12).map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => onImageChange(item.url, item.originalName)}
                  className={`aspect-square rounded overflow-hidden border-2 w-full ${
                    imageUrl === item.url ? 'border-purple-500' : 'border-transparent'
                  }`}
                >
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                </button>
                {onMediaDelete && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingMediaId === item.id}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Delete image"
                  >
                    {deletingMediaId === item.id ? (
                      <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <X className="w-2.5 h-2.5" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alt Text */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Alt text</label>
        <input
          type="text"
          value={imageAlt || ''}
          onChange={(e) => onImageChange(imageUrl || '', e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
        />
      </div>
    </div>
  );
};

export default CoverImageSection;
