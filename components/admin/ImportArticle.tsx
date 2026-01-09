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

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingArticleTitle, setEditingArticleTitle] = useState<string>('');

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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/tarot-articles/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });

      const data = await response.json();
      setValidationResult(data);
    } catch (err) {
      setValidationResult({
        valid: false,
        errors: [err instanceof Error ? err.message : 'Invalid JSON'],
      });
    } finally {
      setValidating(false);
    }
  }

  // Import article
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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/tarot-articles/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setJsonInput('');
        setValidationResult(null);
      }
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Import failed',
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
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

            <div className="flex gap-3 mt-4">
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
                    <Eye className="w-4 h-4" />
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
                    {language === 'en' ? 'Importing...' : 'Importation...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {language === 'en' ? 'Import Article' : 'Importer'}
                  </>
                )}
              </button>
            </div>
          </div>
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
                    <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {language === 'en' ? 'Warnings:' : 'Avertissements:'}
                    </h4>
                    <ul className="text-sm text-amber-300 space-y-1">
                      {validationResult.warnings.map((warn: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400">⚠</span>
                          <span>{warn}</span>
                        </li>
                      ))}
                    </ul>
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

          {/* Help */}
          <div className="p-6 bg-slate-800/50 rounded-lg border border-purple-500/20">
            <h3 className="font-semibold text-purple-300 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {language === 'en' ? 'Import Workflow' : 'Flux d\'Importation'}
            </h3>
            <ol className="text-sm text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-medium">1.</span>
                <span>
                  {language === 'en'
                    ? 'Use the meta-prompt with a card name (e.g., "The Fool")'
                    : 'Utilisez le méta-prompt avec un nom de carte (ex: "Le Mat")'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-medium">2.</span>
                <span>
                  {language === 'en'
                    ? 'Feed the generated prompt to your AI writer'
                    : 'Donnez le prompt généré à votre rédacteur AI'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-medium">3.</span>
                <span>
                  {language === 'en'
                    ? 'Copy the JSON output from the AI writer'
                    : 'Copiez la sortie JSON du rédacteur AI'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-medium">4.</span>
                <span>
                  {language === 'en'
                    ? 'Paste it here and click "Validate" first'
                    : 'Collez-le ici et cliquez sur "Valider" d\'abord'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-medium">5.</span>
                <span>
                  {language === 'en'
                    ? 'Fix any errors, then click "Import Article"'
                    : 'Corrigez les erreurs, puis cliquez sur "Importer"'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-medium">6.</span>
                <span>
                  {language === 'en'
                    ? 'Article is created as DRAFT — publish when ready'
                    : 'L\'article est créé en BROUILLON — publiez quand prêt'}
                </span>
              </li>
            </ol>

            <div className="mt-4 pt-4 border-t border-purple-500/20">
              <h4 className="text-sm font-medium text-purple-300 mb-2">
                {language === 'en' ? 'What happens on import:' : 'Ce qui se passe lors de l\'importation:'}
              </h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>
                    {language === 'en'
                      ? 'Article content is saved to database'
                      : 'Le contenu de l\'article est enregistré dans la base de données'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>
                    {language === 'en'
                      ? 'JSON-LD schema is auto-generated'
                      : 'Le schéma JSON-LD est généré automatiquement'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>
                    {language === 'en'
                      ? 'FAQ schema built from your FAQ array'
                      : 'Schéma FAQ construit à partir de votre tableau FAQ'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>
                    {language === 'en'
                      ? 'Breadcrumb schema built from metadata'
                      : 'Schéma de fil d\'Ariane construit à partir des métadonnées'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>
                    {language === 'en'
                      ? 'Everything stored for fast page rendering'
                      : 'Tout est stocké pour un rendu rapide des pages'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportArticle;
