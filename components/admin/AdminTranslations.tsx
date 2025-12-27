import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTranslation } from '../../context/TranslationContext';
import { Languages, Search, ChevronDown, ChevronRight, Plus, Download, Globe, Edit2, Trash2, Check, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  _count?: { translations: number };
}

interface Translation {
  id: string;
  key: string;
  value: string;
  languageId: string;
}

const AdminTranslations: React.FC = () => {
  const { language: currentLang } = useTranslation();
  const { getToken } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No token');

        const res = await fetch(`${API_URL}/api/translations/admin/languages`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch languages');

        const data = await res.json();
        setLanguages(data.languages);

        // Select first language by default
        if (data.languages.length > 0 && !selectedLang) {
          setSelectedLang(data.languages[0].code);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load languages');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, [getToken]);

  // Fetch translations for selected language
  useEffect(() => {
    if (!selectedLang) return;

    const fetchTranslations = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${API_URL}/api/translations/admin/${selectedLang}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch translations');

        const data = await res.json();
        setTranslations(data.translations);
      } catch (err) {
        console.error('Failed to fetch translations:', err);
      }
    };

    fetchTranslations();
  }, [selectedLang, getToken]);

  const handleSeedTranslations = async () => {
    try {
      setSeeding(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const res = await fetch(`${API_URL}/api/translations/admin/seed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to seed translations');

      // Reload languages
      const langRes = await fetch(`${API_URL}/api/translations/admin/languages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await langRes.json();
      setLanguages(data.languages);

      if (data.languages.length > 0) {
        setSelectedLang(data.languages[0].code);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed');
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveTranslation = async (key: string, value: string) => {
    try {
      setSaving(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const lang = languages.find(l => l.code === selectedLang);
      if (!lang) return;

      const res = await fetch(`${API_URL}/api/translations/admin/translations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, value, languageId: lang.id })
      });

      if (!res.ok) throw new Error('Failed to save');

      // Update local state
      setTranslations(prev => {
        const existing = prev.find(t => t.key === key);
        if (existing) {
          return prev.map(t => t.key === key ? { ...t, value } : t);
        }
        return [...prev, { id: 'new', key, value, languageId: lang.id }];
      });

      setEditingKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Group translations by prefix (e.g., nav.*, tarot.*)
  const groupedTranslations = translations.reduce((acc, t) => {
    const prefix = t.key.split('.')[0];
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(t);
    return acc;
  }, {} as Record<string, Translation[]>);

  const filteredGroups = Object.entries(groupedTranslations)
    .map(([prefix, items]) => ({
      prefix,
      items: items.filter(t =>
        t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(g => g.items.length > 0);

  const toggleGroup = (prefix: string) => {
    setExpandedKeys(prev =>
      prev.includes(prefix)
        ? prev.filter(p => p !== prefix)
        : [...prev, prefix]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Languages className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-heading text-purple-200">
              {currentLang === 'en' ? 'Translations' : 'Traductions'}
            </h2>
            <p className="text-xs text-slate-400">
              {languages.length} {currentLang === 'en' ? 'languages' : 'langues'}, {translations.length} {currentLang === 'en' ? 'strings' : 'chaînes'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Empty State - Seed Button */}
      {languages.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 mb-4">
            {currentLang === 'en' ? 'No languages configured yet.' : 'Aucune langue configurée.'}
          </p>
          <button
            onClick={handleSeedTranslations}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm mx-auto disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {seeding
              ? (currentLang === 'en' ? 'Loading...' : 'Chargement...')
              : (currentLang === 'en' ? 'Load Default Translations' : 'Charger les traductions par défaut')}
          </button>
        </div>
      ) : (
        <>
          {/* Language Tabs */}
          <div className="flex gap-2 border-b border-slate-700 pb-4">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedLang === lang.code
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {lang.nativeName}
                {lang.isDefault && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">
                    Default
                  </span>
                )}
                <span className="text-xs opacity-60">
                  ({lang._count?.translations || 0})
                </span>
              </button>
            ))}
            <button
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 text-slate-400 hover:bg-slate-700 rounded-lg"
              title="Add language"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLang === 'en' ? 'Search translations...' : 'Rechercher...'}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>

          {/* Translation Groups */}
          <div className="space-y-3">
            {filteredGroups.map(({ prefix, items }) => (
              <div
                key={prefix}
                className="bg-slate-900/60 rounded-lg border border-purple-500/20 overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(prefix)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedKeys.includes(prefix) ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="font-medium text-white capitalize">{prefix}</span>
                    <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                      {items.length}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedKeys.includes(prefix) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700"
                    >
                      <div className="p-4 space-y-2">
                        {items.map((t) => (
                          <div
                            key={t.key}
                            className="flex items-center gap-3 p-2 bg-slate-800/50 rounded"
                          >
                            <div className="flex-shrink-0 w-48 font-mono text-xs text-purple-300 truncate" title={t.key}>
                              {t.key}
                            </div>
                            {editingKey === t.key ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveTranslation(t.key, editValue)}
                                  disabled={saving}
                                  className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingKey(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 text-sm text-slate-300 truncate" title={t.value}>
                                  {t.value}
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingKey(t.key);
                                    setEditValue(t.value);
                                  }}
                                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {filteredGroups.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              {currentLang === 'en' ? 'No translations found.' : 'Aucune traduction trouvée.'}
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-slate-800/30 rounded-lg text-sm text-slate-400">
            <p>
              {currentLang === 'en'
                ? 'Click on a translation to edit it. Changes are saved immediately. The frontend will use these translations dynamically.'
                : 'Cliquez sur une traduction pour la modifier. Les modifications sont enregistrées immédiatement.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTranslations;
