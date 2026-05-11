import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader, Check, AlertTriangle } from 'lucide-react';

interface SeoEntry {
  slug: string;
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoFocusKeyword?: string;
}

interface SeoResult {
  slug: string;
  status: 'updated' | 'not_found' | 'error';
  message?: string;
}

interface SeoUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SeoUpdateModal: React.FC<SeoUpdateModalProps> = ({ isOpen, onClose }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SeoResult[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function handleClose() {
    setJsonInput('');
    setResults(null);
    setParseError(null);
    onClose();
  }

  async function handleSubmit() {
    setParseError(null);
    setResults(null);

    let entries: SeoEntry[];
    try {
      const parsed = JSON.parse(jsonInput);
      entries = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      setParseError(language === 'en' ? 'Invalid JSON — check the format and try again.' : 'JSON invalide — vérifiez le format et réessayez.');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/tarot-articles/admin/update-seo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(entries),
        }
      );
      const data = await response.json();
      setResults(data.results ?? []);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 rounded-xl border border-purple-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <div>
                <h2 className="text-xl font-heading text-amber-400 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  {language === 'en' ? 'Update SEO Metadata' : 'Mettre à jour les métadonnées SEO'}
                </h2>
                <p className="text-sm text-purple-300/60 mt-1">
                  {language === 'en'
                    ? 'Paste your JSON — French translation is generated automatically.'
                    : 'Collez votre JSON — la traduction française est générée automatiquement.'}
                </p>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  {language === 'en' ? 'SEO JSON' : 'JSON SEO'}
                </label>
                <textarea
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  placeholder={`[
  {
    "slug": "the-fool-tarot-meaning",
    "seoMetaTitle": "The Fool Tarot Card Meaning",
    "seoMetaDescription": "Discover what The Fool means...",
    "seoFocusKeyword": "the fool tarot card meaning"
  }
]`}
                  className="w-full h-56 font-mono text-sm p-4 bg-slate-950 border border-slate-700
                    rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    resize-none text-slate-300 placeholder-slate-600"
                />
              </div>

              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {parseError}
                </div>
              )}

              {/* Results */}
              {results && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-purple-300">
                    {language === 'en'
                      ? `${results.filter(r => r.status === 'updated').length} of ${results.length} updated`
                      : `${results.filter(r => r.status === 'updated').length} sur ${results.length} mis à jour`}
                  </p>
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg text-sm border ${
                        r.status === 'updated'
                          ? 'bg-green-500/10 border-green-500/20 text-green-300'
                          : r.status === 'not_found'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                          : 'bg-red-500/10 border-red-500/20 text-red-300'
                      }`}
                    >
                      {r.status === 'updated' ? (
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-mono">{r.slug}</span>
                        {r.message && <span className="ml-2 opacity-70">— {r.message}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-purple-500/20">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                {language === 'en' ? 'Close' : 'Fermer'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!jsonInput.trim() || loading}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg
                  hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    {language === 'en' ? 'Updating...' : 'Mise à jour...'}
                  </>
                ) : (
                  language === 'en' ? 'Update SEO' : 'Mettre à jour SEO'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeoUpdateModal;
