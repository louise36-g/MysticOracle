import React, { useState } from 'react';
import { Download, Upload, X, Check, AlertCircle, Scissors } from 'lucide-react';

interface TranslationData {
  title: string;
  excerpt: string;
  content: string;
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  seoFocusKeyword?: string;
  featuredImageAlt?: string;
}

const MAX_CHUNK_SIZE = 10000;

/**
 * Split HTML content into safe chunks for ChatGPT translation.
 * Splits by <h2> first, then by <h3> if a chunk exceeds MAX_CHUNK_SIZE.
 */
function splitContentIntoChunks(content: string): string[] {
  if (content.length <= MAX_CHUNK_SIZE) return [content];

  // Split by <h2> tags (keep the tag at the start of each chunk)
  const h2Parts = content.split(/(?=<h2[\s>])/i).filter(Boolean);

  const chunks: string[] = [];
  for (const part of h2Parts) {
    if (part.length <= MAX_CHUNK_SIZE) {
      chunks.push(part);
    } else {
      // Split further by <h3> tags
      const h3Parts = part.split(/(?=<h3[\s>])/i).filter(Boolean);
      for (const subPart of h3Parts) {
        chunks.push(subPart);
      }
    }
  }

  return chunks;
}

interface TranslationToolbarProps {
  /** Current edit language */
  editLanguage: string;
  /** UI language for labels */
  language: string;
  /** English content to export */
  englishData: TranslationData;
  /** Callback when French JSON is imported */
  onImportFrench: (data: TranslationData) => void;
  /** Filename prefix for download (e.g., "the-fool" or "blog-post-slug") */
  filenamePrefix: string;
}

/**
 * Translation toolbar that appears when editing in French mode.
 * Provides Export EN (download) and Import FR (paste modal) functionality.
 */
const TranslationToolbar: React.FC<TranslationToolbarProps> = ({
  editLanguage,
  language,
  englishData,
  onImportFrench,
  filenamePrefix,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Multi-chunk import state
  const [showChunkModal, setShowChunkModal] = useState(false);
  const [chunkText, setChunkText] = useState('');
  const [collectedChunks, setCollectedChunks] = useState<string[]>([]);
  const [chunkTitle, setChunkTitle] = useState('');
  const [chunkExcerpt, setChunkExcerpt] = useState('');
  const [chunkSeoTitle, setChunkSeoTitle] = useState('');
  const [chunkSeoDesc, setChunkSeoDesc] = useState('');
  const [chunkImageAlt, setChunkImageAlt] = useState('');

  // Only show when in French mode
  if (editLanguage !== 'fr') {
    return null;
  }

  const handleExportEN = () => {
    const dataToExport: TranslationData = {
      title: englishData.title || '',
      excerpt: englishData.excerpt || '',
      content: englishData.content || '',
    };

    // Only include optional fields if they have values
    if (englishData.seoMetaTitle) {
      dataToExport.seoMetaTitle = englishData.seoMetaTitle;
    }
    if (englishData.seoMetaDescription) {
      dataToExport.seoMetaDescription = englishData.seoMetaDescription;
    }
    if (englishData.seoFocusKeyword) {
      dataToExport.seoFocusKeyword = englishData.seoFocusKeyword;
    }
    if (englishData.featuredImageAlt) {
      dataToExport.featuredImageAlt = englishData.featuredImageAlt;
    }

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}-en.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportChunked = () => {
    const contentParts = splitContentIntoChunks(englishData.content || '');

    const dataToExport: Record<string, unknown> = {
      title: englishData.title || '',
      excerpt: englishData.excerpt || '',
      content_parts: contentParts,
      _chunk_info: `${contentParts.length} chunks (rejoin content_parts into "content" after translation)`,
    };

    if (englishData.seoMetaTitle) dataToExport.seoMetaTitle = englishData.seoMetaTitle;
    if (englishData.seoMetaDescription) dataToExport.seoMetaDescription = englishData.seoMetaDescription;
    if (englishData.seoFocusKeyword) dataToExport.seoFocusKeyword = englishData.seoFocusKeyword;
    if (englishData.featuredImageAlt) dataToExport.featuredImageAlt = englishData.featuredImageAlt;

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}-en-chunked.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Multi-chunk import ---
  const handleOpenChunkImport = () => {
    setChunkText('');
    setCollectedChunks([]);
    setChunkTitle('');
    setChunkExcerpt('');
    setChunkSeoTitle('');
    setChunkSeoDesc('');
    setChunkImageAlt('');
    setImportError(null);
    setImportSuccess(false);
    setShowChunkModal(true);
  };

  const handleAddChunk = () => {
    if (!chunkText.trim()) return;
    setCollectedChunks(prev => [...prev, chunkText.trim()]);
    setChunkText('');
  };

  const handleRemoveLastChunk = () => {
    setCollectedChunks(prev => prev.slice(0, -1));
  };

  const handleFinaliseChunks = () => {
    if (collectedChunks.length === 0) {
      setImportError('Add at least one content chunk');
      return;
    }
    if (!chunkTitle.trim() || !chunkExcerpt.trim()) {
      setImportError('Title and excerpt are required');
      return;
    }

    onImportFrench({
      title: chunkTitle.trim(),
      excerpt: chunkExcerpt.trim(),
      content: collectedChunks.join(''),
      seoMetaTitle: chunkSeoTitle || '',
      seoMetaDescription: chunkSeoDesc || '',
      featuredImageAlt: chunkImageAlt || '',
    });

    setImportSuccess(true);
    setTimeout(() => {
      setShowChunkModal(false);
      setImportSuccess(false);
    }, 1500);
  };

  const handleImportFR = () => {
    setImportText('');
    setImportError(null);
    setImportSuccess(false);
    setShowImportModal(true);
  };

  const handleParseAndImport = () => {
    try {
      setImportError(null);

      if (!importText.trim()) {
        setImportError(language === 'en' ? 'Please paste the translated JSON' : 'Veuillez coller le JSON traduit');
        return;
      }

      const parsed = JSON.parse(importText);

      // Support both "content" (single) and "content_parts" (chunked) formats
      const content = parsed.content_parts
        ? (parsed.content_parts as string[]).join('')
        : parsed.content;

      // Validate required fields
      if (!parsed.title || !parsed.excerpt || !content) {
        setImportError(
          language === 'en'
            ? 'JSON must contain title, excerpt, and content (or content_parts) fields'
            : 'Le JSON doit contenir les champs title, excerpt et content (ou content_parts)'
        );
        return;
      }

      // Call the import callback
      onImportFrench({
        title: parsed.title,
        excerpt: parsed.excerpt,
        content,
        seoMetaTitle: parsed.seoMetaTitle || '',
        seoMetaDescription: parsed.seoMetaDescription || '',
        seoFocusKeyword: parsed.seoFocusKeyword || '',
        featuredImageAlt: parsed.featuredImageAlt || '',
      });

      setImportSuccess(true);
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccess(false);
      }, 1500);

    } catch (err) {
      setImportError(
        language === 'en'
          ? 'Invalid JSON format. Please check your input.'
          : 'Format JSON invalide. Veuillez vérifier votre saisie.'
      );
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-blue-300 text-sm">
          <span className="text-lg">🇫🇷</span>
          <span className="font-medium">
            {language === 'en' ? 'French Translation Mode' : 'Mode traduction française'}
          </span>
        </div>

        <div className="flex-1" />

        <button
          onClick={handleExportEN}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          {language === 'en' ? 'Export EN' : 'Exporter EN'}
        </button>

        <button
          onClick={handleExportChunked}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-700 hover:bg-amber-600 text-white rounded-lg transition-colors"
          title="Split content into smaller chunks for ChatGPT translation"
        >
          <Scissors className="w-4 h-4" />
          {language === 'en' ? 'Chunked' : 'Découpé'}
        </button>

        <button
          onClick={handleImportFR}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          {language === 'en' ? 'Import FR' : 'Importer FR'}
        </button>

        <button
          onClick={handleOpenChunkImport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors"
          title="Paste translated chunks one at a time"
        >
          <Upload className="w-4 h-4" />
          {language === 'en' ? 'Chunk Import' : 'Import par morceaux'}
        </button>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-heading text-white">
                {language === 'en' ? 'Import French Translation' : 'Importer la traduction française'}
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-auto">
              <p className="text-slate-400 text-sm mb-3">
                {language === 'en'
                  ? 'Paste the translated JSON below. The structure should match the exported file.'
                  : 'Collez le JSON traduit ci-dessous. La structure doit correspondre au fichier exporté.'}
              </p>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-64 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder={`{
  "title": "Le titre en français",
  "excerpt": "L'extrait en français...",
  "content": "<p>Le contenu en français...</p>",
  "seoMetaTitle": "Meta titre",
  "seoMetaDescription": "Meta description",
  "featuredImageAlt": "Description de l'image"
}`}
              />

              {importError && (
                <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-center gap-2 mt-3 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  <span>{language === 'en' ? 'Import successful!' : 'Import réussi !'}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                {language === 'en' ? 'Cancel' : 'Annuler'}
              </button>
              <button
                onClick={handleParseAndImport}
                disabled={importSuccess}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {language === 'en' ? 'Import' : 'Importer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chunk Import Modal */}
      {showChunkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-heading text-white">
                Import by Chunks — Paste one chunk at a time
              </h3>
              <button
                onClick={() => setShowChunkModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto space-y-4">
              {/* Title & Excerpt (first time only) */}
              {collectedChunks.length === 0 && (
                <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-amber-300 text-sm font-medium">Step 1: Enter title & excerpt first</p>
                  <input
                    type="text"
                    value={chunkTitle}
                    onChange={(e) => setChunkTitle(e.target.value)}
                    placeholder="Translated title..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  />
                  <input
                    type="text"
                    value={chunkExcerpt}
                    onChange={(e) => setChunkExcerpt(e.target.value)}
                    placeholder="Translated excerpt..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  />
                  <input
                    type="text"
                    value={chunkSeoTitle}
                    onChange={(e) => setChunkSeoTitle(e.target.value)}
                    placeholder="SEO meta title (optional)..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  />
                  <input
                    type="text"
                    value={chunkSeoDesc}
                    onChange={(e) => setChunkSeoDesc(e.target.value)}
                    placeholder="SEO meta description (optional)..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  />
                  <input
                    type="text"
                    value={chunkImageAlt}
                    onChange={(e) => setChunkImageAlt(e.target.value)}
                    placeholder="Featured image alt text (optional)..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  />
                </div>
              )}

              {/* Collected chunks indicator */}
              {collectedChunks.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400 font-medium">
                    {collectedChunks.length} chunk{collectedChunks.length > 1 ? 's' : ''} added
                  </span>
                  <span className="text-slate-500">
                    ({collectedChunks.reduce((sum, c) => sum + c.length, 0).toLocaleString()} chars total)
                  </span>
                  <button
                    onClick={handleRemoveLastChunk}
                    className="text-red-400 hover:text-red-300 text-xs ml-2"
                  >
                    Undo last
                  </button>
                </div>
              )}

              {/* Paste area for next chunk */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  {collectedChunks.length === 0
                    ? 'Step 2: Paste translated content chunk 1'
                    : `Paste chunk ${collectedChunks.length + 1} (or click Finish if done)`}
                </label>
                <textarea
                  value={chunkText}
                  onChange={(e) => setChunkText(e.target.value)}
                  className="w-full h-48 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="Paste the translated HTML content chunk here..."
                />
              </div>

              {importError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  <span>Import successful!</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowChunkModal(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChunk}
                disabled={!chunkText.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                + Add Chunk
              </button>
              <button
                onClick={handleFinaliseChunks}
                disabled={collectedChunks.length === 0 || importSuccess}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Finish ({collectedChunks.length} chunks)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TranslationToolbar;
