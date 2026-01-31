import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../../context/AppContext';
import { importBlogArticles } from '../../../services/api';
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ImportResult } from './types';

interface BlogImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string | null) => void;
}

const BlogImportModal: React.FC<BlogImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const { language } = useApp();
  const { getToken } = useAuth();

  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const jsonTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen && jsonTextareaRef.current) {
      setTimeout(() => {
        jsonTextareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);

    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      onError('Please provide JSON data to import');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      // Parse JSON
      let articles;
      try {
        const parsed = JSON.parse(importJson);
        // Support both single article and array
        articles = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        onError('Invalid JSON format');
        return;
      }

      const token = await getToken();
      if (!token) return;

      const result = await importBlogArticles(token, articles, {
        skipDuplicates: true,
        createMissingTaxonomies: true,
      });

      // If all successful with no errors, close modal automatically
      if (result.results.errors.length === 0 && result.results.imported > 0) {
        onSuccess();
        handleClose();
        return;
      }

      // Otherwise show results
      setImportResult(result);

      if (result.results.imported > 0) {
        onSuccess();
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setImportJson('');
    setImportResult(null);
    onError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={e => {
          if (e.target === e.currentTarget) handleClose();
        }}
        onKeyDown={e => {
          if (e.key === 'Escape') handleClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading text-purple-200">
              {language === 'en' ? 'Import Articles from JSON' : 'Importer articles depuis JSON'}
            </h3>
            <button onClick={handleClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Import Result */}
          {importResult && (
            <div
              className={`mb-4 p-4 rounded-lg border ${
                importResult.results.errors.length > 0
                  ? 'bg-amber-900/20 border-amber-500/30'
                  : 'bg-green-900/20 border-green-500/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {importResult.results.errors.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                <span className="font-medium text-slate-200">
                  {language === 'en' ? 'Import Complete' : 'Import terminé'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div className="text-center p-2 bg-slate-800/50 rounded">
                  <div className="text-2xl font-bold text-green-400">
                    {importResult.results.imported}
                  </div>
                  <div className="text-slate-400">
                    {language === 'en' ? 'Imported' : 'Importés'}
                  </div>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded">
                  <div className="text-2xl font-bold text-amber-400">
                    {importResult.results.skipped}
                  </div>
                  <div className="text-slate-400">{language === 'en' ? 'Skipped' : 'Ignorés'}</div>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded">
                  <div className="text-2xl font-bold text-red-400">
                    {importResult.results.errors.length}
                  </div>
                  <div className="text-slate-400">{language === 'en' ? 'Errors' : 'Erreurs'}</div>
                </div>
              </div>
              {importResult.results.skippedSlugs && importResult.results.skippedSlugs.length > 0 && (
                <p className="text-sm text-amber-400 mb-2">
                  {language === 'en' ? 'Skipped (already exist):' : 'Ignorés (existent déjà):'}{' '}
                  <span className="text-slate-300">
                    {importResult.results.skippedSlugs.join(', ')}
                  </span>
                </p>
              )}
              {importResult.results.createdCategories.length > 0 && (
                <p className="text-sm text-slate-400">
                  {language === 'en' ? 'Created categories:' : 'Catégories créées:'}{' '}
                  <span className="text-purple-400">
                    {importResult.results.createdCategories.join(', ')}
                  </span>
                </p>
              )}
              {importResult.results.createdTags.length > 0 && (
                <p className="text-sm text-slate-400 mt-1">
                  {language === 'en' ? 'Created tags:' : 'Tags créés:'}{' '}
                  <span className="text-purple-400">
                    {importResult.results.createdTags.join(', ')}
                  </span>
                </p>
              )}
              {importResult.results.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-red-400 font-medium mb-1">
                    {language === 'en' ? 'Errors:' : 'Erreurs:'}
                  </p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    {importResult.results.errors.map((err, i) => (
                      <li key={i}>
                        <span className="text-slate-500">{err.slug}:</span> {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!importResult && (
            <>
              {/* File upload */}
              <div className="mb-4">
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  onClick={() => jsonInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-purple-500/30 rounded-lg text-slate-400 hover:text-purple-300 hover:border-purple-500/50 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  {language === 'en' ? 'Upload JSON file' : 'Télécharger fichier JSON'}
                </button>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900 text-slate-500">
                    {language === 'en' ? 'or paste JSON' : 'ou coller JSON'}
                  </span>
                </div>
              </div>

              {/* JSON input */}
              <div className="mb-4">
                <textarea
                  ref={jsonTextareaRef}
                  value={importJson}
                  onChange={e => setImportJson(e.target.value)}
                  placeholder={`{
  "title": "Article Title",
  "slug": "article-slug",
  "excerpt": "Short description",
  "content": "<p>HTML content...</p>",
  "author": "Author Name",
  "read_time": "5 min",
  "categories": ["Category Name"],
  "tags": ["Tag1", "Tag2"],
  "seo_meta": {
    "meta_title": "SEO Title",
    "meta_description": "SEO Description"
  }
}`}
                  rows={12}
                  className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 font-mono text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <p className="text-xs text-slate-500 mb-4">
                {language === 'en'
                  ? "Import single article or array of articles. Posts will be created as drafts. Missing categories/tags will be auto-created."
                  : "Importez un article ou un tableau d'articles. Les articles seront créés comme brouillons. Les catégories/tags manquants seront créés automatiquement."}
              </p>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
            >
              {importResult
                ? language === 'en'
                  ? 'Close'
                  : 'Fermer'
                : language === 'en'
                  ? 'Cancel'
                  : 'Annuler'}
            </button>
            {!importResult && (
              <button
                onClick={handleImport}
                disabled={importing || !importJson.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {language === 'en' ? 'Importing...' : 'Import en cours...'}
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    {language === 'en' ? 'Import' : 'Importer'}
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BlogImportModal;
