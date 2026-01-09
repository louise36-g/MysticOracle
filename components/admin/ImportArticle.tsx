import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, AlertTriangle, X, Code, Upload, Eye, Loader } from 'lucide-react';
import { fetchAdminTarotArticle, updateTarotArticle } from '../../services/apiService';

interface ValidationStats {
  wordCount: number;
  faqCount: number;
  hasAnswerFirstOpening: boolean;
}

interface ImportResult {
  success: boolean;
  article?: {
    id: string;
    slug: string;
    title: string;
    status: string;
  };
  warnings?: string[];
  stats?: ValidationStats;
  errors?: string[];
  error?: string;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  stats?: ValidationStats;
  schemaPreview?: any;
}

interface ImportArticleProps {
  editingArticleId?: string | null;
  onCancelEdit?: () => void;
}

const ImportArticle: React.FC<ImportArticleProps> = ({ editingArticleId, onCancelEdit }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showWarnings, setShowWarnings] = useState(true);
  const [viewMode, setViewMode] = useState<'form' | 'json'>('json'); // Default to JSON for new imports

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingArticleTitle, setEditingArticleTitle] = useState<string>('');

  // Form data state (for form view)
  const [formData, setFormData] = useState<any>({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    readTime: '',
    featuredImage: '',
    featuredImageAlt: '',
    cardType: 'Major Arcana',
    cardNumber: '',
    astrologicalCorrespondence: '',
    element: 'FIRE',
    categories: [],
    tags: [],
    seoFocusKeyword: '',
    seoMetaTitle: '',
    seoMetaDescription: '',
    faq: [],
    breadcrumbCategory: '',
    breadcrumbCategoryUrl: '',
    relatedCards: [],
    isCourtCard: false,
    isChallengeCard: false,
    status: 'DRAFT',
  });

  // Load article when editingArticleId changes
  useEffect(() => {
    if (editingArticleId) {
      loadArticleForEditing(editingArticleId);
    } else {
      setIsEditMode(false);
      setEditingArticleTitle('');
      setJsonInput('');
      setResult(null);
      setValidationResult(null);
    }
  }, [editingArticleId]);

  // Convert enum to display format (e.g., MAJOR_ARCANA → "Major Arcana")
  function convertEnumToDisplay(value: string): string {
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Load article for editing
  async function loadArticleForEditing(id: string) {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setResult({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const article = await fetchAdminTarotArticle(token, id);
      setEditingArticleTitle(article.title);
      setIsEditMode(true);

      // Convert article data to JSON format for editing
      const editableData = {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        author: article.author,
        readTime: article.readTime,
        featuredImage: article.featuredImage,
        featuredImageAlt: article.featuredImageAlt,
        cardType: article.cardType,
        cardNumber: article.cardNumber,
        astrologicalCorrespondence: article.astrologicalCorrespondence,
        element: article.element,
        categories: article.categories,
        tags: article.tags,
        seoFocusKeyword: article.seoFocusKeyword,
        seoMetaTitle: article.seoMetaTitle,
        seoMetaDescription: article.seoMetaDescription,
        faq: article.faq,
        breadcrumbCategory: article.breadcrumbCategory,
        breadcrumbCategoryUrl: article.breadcrumbCategoryUrl,
        relatedCards: article.relatedCards,
        isCourtCard: article.isCourtCard,
        isChallengeCard: article.isChallengeCard,
        status: article.status,
      };

      setJsonInput(JSON.stringify(editableData, null, 2));
      setResult(null);
      setValidationResult(null);
      setShowWarnings(true); // Show warnings when loading article for editing
      setViewMode('form'); // Default to form view when editing
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to load article',
      });
    } finally {
      setLoading(false);
    }
  }

  // Validate without saving
  async function handleValidate() {
    if (!jsonInput.trim()) return;

    setValidating(true);
    setValidationResult(null);

    try {
      const parsed = JSON.parse(jsonInput);
      const token = await getToken();

      if (!token) {
        setValidationResult({
          valid: false,
          errors: ['Authentication required'],
        });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tarot-articles/admin/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });

      const data = await response.json();

      // Handle non-200 responses
      if (!response.ok) {
        setValidationResult({
          valid: false,
          errors: data.errors || [data.error || data.message || `Server error: ${response.status}`],
        });
        return;
      }

      // Map backend response format to frontend format
      setValidationResult({
        valid: data.success,
        errors: data.errors || [],
        warnings: data.warnings || [],
        stats: data.stats,
        schemaPreview: data.schema,
      });

      // Show warnings by default when validation completes
      if (data.warnings && data.warnings.length > 0) {
        setShowWarnings(true);
      }
    } catch (err) {
      setValidationResult({
        valid: false,
        errors: [err instanceof Error ? err.message : 'Invalid JSON'],
      });
    } finally {
      setValidating(false);
    }
  }

  // Import or update article
  async function handleImport() {
    if (!jsonInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const parsed = JSON.parse(jsonInput);
      const token = await getToken();

      if (!token) {
        setResult({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      let response;
      if (isEditMode && editingArticleId) {
        // Update existing article
        response = await fetch(`${import.meta.env.VITE_API_URL}/tarot-articles/admin/${editingArticleId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(parsed),
        });
      } else {
        // Import new article
        response = await fetch(`${import.meta.env.VITE_API_URL}/tarot-articles/admin/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(parsed),
        });
      }

      const data = await response.json();
      setResult(data);

      if (data.success) {
        if (isEditMode) {
          // Exit edit mode and return to list
          if (onCancelEdit) {
            onCancelEdit();
          }
        } else {
          // Clear form for new import
          setJsonInput('');
          setValidationResult(null);
        }
      }
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : (isEditMode ? 'Update failed' : 'Import failed'),
      });
    } finally {
      setLoading(false);
    }
  }

  // Format JSON
  function handleFormat() {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch {
      // Invalid JSON, leave as-is
    }
  }

  // Preview article
  function handlePreview() {
    try {
      const parsed = JSON.parse(jsonInput);
      setPreviewData(parsed);
      setShowPreview(true);
    } catch (err) {
      setResult({
        success: false,
        error: 'Invalid JSON - cannot preview',
      });
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Action Buttons */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading text-amber-400 mb-2 flex items-center gap-3">
            <Upload className="w-6 h-6" />
            {language === 'en' ? 'Import Tarot Article' : 'Importer un Article Tarot'}
          </h2>
          <p className="text-purple-300/70">
            {language === 'en'
              ? 'Paste the JSON output from the AI writer to import a new article.'
              : 'Collez la sortie JSON du rédacteur AI pour importer un nouvel article.'}
          </p>
        </div>

        {/* Action Buttons - Moved to upper right */}
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={handlePreview}
            disabled={!jsonInput.trim()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-500 text-slate-300
              rounded-lg hover:bg-slate-500/10 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all"
            title={language === 'en' ? 'Preview article' : 'Prévisualiser l\'article'}
          >
            <Eye className="w-4 h-4" />
            {language === 'en' ? 'Preview' : 'Aperçu'}
          </button>

          <button
            onClick={handleValidate}
            disabled={!jsonInput.trim() || validating}
            className="flex items-center gap-2 px-4 py-2 border border-purple-500 text-purple-300
              rounded-lg hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all"
          >
            {validating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {language === 'en' ? 'Validating...' : 'Validation...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {language === 'en' ? 'Validate' : 'Valider'}
              </>
            )}
          </button>

          <button
            onClick={handleImport}
            disabled={!jsonInput.trim() || loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg
              hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all shadow-lg shadow-purple-500/20"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {isEditMode
                  ? (language === 'en' ? 'Updating...' : 'Mise à jour...')
                  : (language === 'en' ? 'Importing...' : 'Importation...')}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {isEditMode
                  ? (language === 'en' ? 'Update Article' : 'Mettre à jour')
                  : (language === 'en' ? 'Import Article' : 'Importer')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="mb-6 space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <div>
                  <p className="text-amber-300 font-medium">
                    {language === 'en' ? 'Editing Article' : 'Édition d\'Article'}
                  </p>
                  <p className="text-sm text-amber-300/70">
                    {editingArticleTitle}
                  </p>
                </div>
              </div>
              {onCancelEdit && (
                <button
                  onClick={onCancelEdit}
                  className="text-sm text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
              )}
            </div>
          </div>

          {/* Editor Mode Info */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-300 font-medium mb-1">
                  {language === 'en' ? 'JSON Editor' : 'Éditeur JSON'}
                </p>
                <p className="text-sm text-purple-300/70">
                  {language === 'en'
                    ? 'Currently editing in JSON mode. A visual form editor for tarot articles is planned for a future update.'
                    : 'Édition en mode JSON. Un éditeur visuel pour les articles tarot est prévu pour une mise à jour future.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Panel - Full Width */}
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-purple-300">
              <Code className="w-4 h-4" />
              {language === 'en' ? 'Article JSON' : 'JSON de l\'Article'}
            </label>
            <button
              onClick={handleFormat}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              {language === 'en' ? 'Format JSON' : 'Formater JSON'}
            </button>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={language === 'en' ? 'Paste your article JSON here...' : 'Collez votre JSON d\'article ici...'}
            className="w-full h-[500px] font-mono text-sm p-4 bg-slate-900 border border-slate-700
              rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent
              resize-none text-slate-300 placeholder-slate-500"
          />
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {/* Validation Results */}
          <AnimatePresence mode="wait">
            {validationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-6 rounded-lg border ${
                  validationResult.valid
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <h3
                  className={`font-semibold mb-4 flex items-center gap-2 ${
                    validationResult.valid ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {validationResult.valid ? (
                    <>
                      <Check className="w-5 h-5" />
                      {language === 'en' ? 'Valid JSON' : 'JSON Valide'}
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5" />
                      {language === 'en' ? 'Validation Failed' : 'Validation Échouée'}
                    </>
                  )}
                </h3>

                {/* Stats */}
                {validationResult.stats && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="text-2xl font-bold text-purple-300">
                        {validationResult.stats.wordCount}
                      </div>
                      <div className="text-xs text-slate-400">
                        {language === 'en' ? 'Words' : 'Mots'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="text-2xl font-bold text-purple-300">
                        {validationResult.stats.faqCount}
                      </div>
                      <div className="text-xs text-slate-400">
                        {language === 'en' ? 'FAQs' : 'FAQs'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div
                        className={`text-2xl font-bold ${
                          validationResult.stats.hasAnswerFirstOpening
                            ? 'text-green-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {validationResult.stats.hasAnswerFirstOpening ? '✓' : '?'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {language === 'en' ? 'Answer-First' : 'Réponse Direct'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {language === 'en' ? 'Errors:' : 'Erreurs:'}
                    </h4>
                    <ul className="text-sm text-red-300 space-y-1">
                      {validationResult.errors.map((err: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings && validationResult.warnings.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {language === 'en' ? 'Warnings:' : 'Avertissements:'}
                        <span className="text-xs text-amber-300/70">({validationResult.warnings.length})</span>
                      </h4>
                      <button
                        onClick={() => setShowWarnings(!showWarnings)}
                        className="text-xs text-amber-300 hover:text-amber-200 transition-colors"
                      >
                        {showWarnings
                          ? (language === 'en' ? 'Hide' : 'Masquer')
                          : (language === 'en' ? 'Show' : 'Afficher')}
                      </button>
                    </div>
                    {showWarnings && (
                      <ul className="text-sm text-amber-300 space-y-1">
                        {validationResult.warnings.map((warn: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400">⚠</span>
                            <span>{warn}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Schema Preview */}
                {validationResult.schemaPreview && (
                  <details className="mt-4">
                    <summary className="text-sm font-medium text-purple-300 cursor-pointer hover:text-purple-200 transition-colors">
                      {language === 'en' ? 'Preview Generated Schema' : 'Aperçu du Schéma Généré'}
                    </summary>
                    <pre className="mt-2 p-4 bg-slate-900 rounded-lg text-xs overflow-auto max-h-64 border border-slate-700 text-slate-300">
                      {JSON.stringify(validationResult.schemaPreview, null, 2)}
                    </pre>
                  </details>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import Result */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-6 rounded-lg border ${
                  result.success
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                {result.success ? (
                  <>
                    <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      {language === 'en' ? 'Article Imported Successfully' : 'Article Importé avec Succès'}
                    </h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                      <p className="text-purple-200 font-medium">
                        {result.article?.title}
                      </p>
                      <p className="text-sm text-slate-400 mt-2">
                        ID: <span className="text-purple-300">{result.article?.id}</span>
                      </p>
                      <p className="text-sm text-slate-400">
                        {language === 'en' ? 'Status:' : 'Statut:'} <span className="text-purple-300">{result.article?.status}</span>
                      </p>
                      <div className="mt-4 flex gap-3">
                        <a
                          href={`/tarot/articles/${result.article?.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                        >
                          {language === 'en' ? 'Preview' : 'Aperçu'} →
                        </a>
                      </div>
                    </div>

                    {result.warnings && result.warnings.length > 0 && (
                      <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <h4 className="text-sm font-medium text-amber-400 mb-2">
                          {language === 'en' ? 'Imported with warnings:' : 'Importé avec avertissements:'}
                        </h4>
                        <ul className="text-sm text-amber-300 space-y-1">
                          {result.warnings.map((warn, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-400">⚠</span>
                              <span>{warn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <X className="w-5 h-5" />
                      {language === 'en' ? 'Import Failed' : 'Importation Échouée'}
                    </h3>
                    {result.error && (
                      <p className="text-red-300">{result.error}</p>
                    )}
                    {result.errors && (
                      <ul className="text-sm text-red-300 space-y-1 mt-2">
                        {result.errors.map((err, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            <span>{err}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 rounded-lg border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
                <h3 className="text-xl font-heading text-amber-400 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {language === 'en' ? 'Article Preview' : 'Aperçu de l\'Article'}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto p-6 space-y-6">
                {/* Title */}
                <div>
                  <h1 className="text-3xl font-heading text-amber-400 mb-2">
                    {previewData.title}
                  </h1>
                  <p className="text-purple-300/70">{previewData.excerpt}</p>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span>By {previewData.author}</span>
                  <span>•</span>
                  <span>{previewData.readTime}</span>
                  <span>•</span>
                  <span>{previewData.cardType}</span>
                  {previewData.element && (
                    <>
                      <span>•</span>
                      <span>{previewData.element}</span>
                    </>
                  )}
                </div>

                {/* Featured Image */}
                {previewData.featuredImage && (
                  <div className="rounded-lg overflow-hidden border border-purple-500/20">
                    <img
                      src={previewData.featuredImage}
                      alt={previewData.featuredImageAlt}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-card.png';
                      }}
                    />
                  </div>
                )}

                {/* Content Preview */}
                <div
                  className="prose prose-invert prose-purple max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewData.content?.substring(0, 1000) + '...' }}
                />

                {/* FAQ Preview */}
                {previewData.faq && previewData.faq.length > 0 && (
                  <div className="mt-8 p-6 bg-slate-800/50 rounded-lg border border-purple-500/20">
                    <h3 className="text-xl font-heading text-purple-300 mb-4">
                      {language === 'en' ? 'FAQ' : 'Questions Fréquentes'}
                    </h3>
                    <div className="space-y-4">
                      {previewData.faq.slice(0, 3).map((item: any, i: number) => (
                        <div key={i}>
                          <p className="text-purple-300 font-medium mb-1">{item.question}</p>
                          <p className="text-slate-300 text-sm">{item.answer}</p>
                        </div>
                      ))}
                      {previewData.faq.length > 3 && (
                        <p className="text-slate-400 text-sm italic">
                          {language === 'en'
                            ? `...and ${previewData.faq.length - 3} more`
                            : `...et ${previewData.faq.length - 3} de plus`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {previewData.tags && previewData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewData.tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-purple-500/20 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                >
                  {language === 'en' ? 'Close' : 'Fermer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImportArticle;
