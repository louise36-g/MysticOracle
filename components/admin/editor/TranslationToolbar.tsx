import React, { useState } from 'react';
import { Download, Upload, X, Check, AlertCircle } from 'lucide-react';

interface TranslationData {
  title: string;
  excerpt: string;
  content: string;
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  seoFocusKeyword?: string;
  featuredImageAlt?: string;
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

      // Validate required fields
      if (!parsed.title || !parsed.excerpt || !parsed.content) {
        setImportError(
          language === 'en'
            ? 'JSON must contain title, excerpt, and content fields'
            : 'Le JSON doit contenir les champs title, excerpt et content'
        );
        return;
      }

      // Call the import callback
      onImportFrench({
        title: parsed.title,
        excerpt: parsed.excerpt,
        content: parsed.content,
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
          onClick={handleImportFR}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          {language === 'en' ? 'Import FR' : 'Importer FR'}
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
    </>
  );
};

export default TranslationToolbar;
