import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminPrompts,
  updateAdminPrompt,
  resetAdminPrompt,
  seedAdminPrompts,
  AdminPrompt,
} from '../../services/apiService';
import { MessageSquare, Edit2, Check, X, RotateCcw, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminPrompts: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [prompts, setPrompts] = useState<AdminPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({ value: '' });
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const data = await fetchAdminPrompts(token);
      setPrompts(data.prompts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string) => {
    try {
      setSaving(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      await updateAdminPrompt(token, key, { value: formData.value });
      await loadPrompts();
      setEditingKey(null);
      setFormData({ value: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (key: string) => {
    if (
      !confirm(
        language === 'en'
          ? 'This will replace your custom prompt with the default. Continue?'
          : 'Cela remplacera votre prompt personnalisé par le défaut. Continuer?'
      )
    )
      return;

    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      await resetAdminPrompt(token, key);
      await loadPrompts();
      if (editingKey === key) {
        setEditingKey(null);
        setFormData({ value: '' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset prompt');
    }
  };

  const startEdit = (prompt: AdminPrompt) => {
    setFormData({ value: prompt.value });
    setEditingKey(prompt.key);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setFormData({ value: '' });
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const token = await getToken();
      if (!token) throw new Error('No token');

      await seedAdminPrompts(token);
      await loadPrompts();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed prompts');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group prompts by category
  const tarotPrompts = prompts.filter(p => p.category === 'tarot');
  const horoscopePrompts = prompts.filter(p => p.category === 'horoscope');

  const PromptEditor = ({ prompt }: { prompt: AdminPrompt }) => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30 mt-3"
    >
      <div className="mb-3">
        <label className="block text-xs text-slate-400 mb-2">
          {language === 'en' ? 'Prompt Content' : 'Contenu du Prompt'}
        </label>
        <textarea
          value={formData.value}
          onChange={e => setFormData({ value: e.target.value })}
          rows={12}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm font-mono leading-relaxed"
          style={{ fontFamily: 'Monaco, Menlo, Consolas, monospace' }}
        />
      </div>

      {/* Variable Guide */}
      {prompt.variables.length > 0 && (
        <div className="mb-3 p-3 bg-slate-900/50 rounded text-xs text-slate-400">
          <div className="font-semibold text-purple-300 mb-1">
            {language === 'en' ? 'Available Variables:' : 'Variables Disponibles:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {prompt.variables.map(v => (
              <code key={v} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                {'{{' + v + '}}'}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Character Counter */}
      <div className="mb-3 text-xs text-slate-400">
        {language === 'en' ? 'Characters:' : 'Caractères:'} {formData.value.length}
        {formData.value.length < 50 && (
          <span className="ml-2 text-amber-400">
            ({language === 'en' ? 'Minimum 50 required' : 'Minimum 50 requis'})
          </span>
        )}
        {formData.value.length > 10000 && (
          <span className="ml-2 text-red-400">
            ({language === 'en' ? 'Maximum 10,000' : 'Maximum 10 000'})
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleUpdate(prompt.key)}
          disabled={saving || formData.value.length < 50 || formData.value.length > 10000}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          {saving
            ? language === 'en'
              ? 'Saving...'
              : 'Sauvegarde...'
            : language === 'en'
            ? 'Save'
            : 'Sauvegarder'}
        </button>
        <button
          onClick={cancelEdit}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          {language === 'en' ? 'Cancel' : 'Annuler'}
        </button>
        <button
          onClick={() => handleReset(prompt.key)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-white text-sm disabled:opacity-50 ml-auto"
        >
          <RotateCcw className="w-4 h-4" />
          {language === 'en' ? 'Reset to Default' : 'Réinitialiser'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-heading text-purple-200">
              {language === 'en' ? 'AI Prompts' : 'Prompts IA'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'en'
                ? 'Manage AI prompts for tarot readings and horoscopes'
                : 'Gérer les prompts IA pour les lectures de tarot et les horoscopes'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Tarot Prompts */}
      <div>
        <h3 className="text-lg font-heading text-amber-400 mb-3">
          {language === 'en' ? 'Tarot Prompts' : 'Prompts Tarot'} ({tarotPrompts.length})
        </h3>
        <div className="space-y-3">
          {tarotPrompts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">
                {language === 'en' ? 'No prompts yet.' : 'Aucun prompt.'}
              </p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm mx-auto disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {seeding
                  ? language === 'en'
                    ? 'Loading...'
                    : 'Chargement...'
                  : language === 'en'
                  ? 'Load Default Prompts'
                  : 'Charger les prompts par défaut'}
              </button>
            </div>
          )}

          {tarotPrompts.map((prompt, index) => (
            <motion.div
              key={prompt.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-900/60 rounded-lg border border-purple-500/20 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs font-mono">
                    {prompt.key}
                  </span>
                  {prompt.isBase && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">
                      {language === 'en' ? 'Base Template' : 'Modèle de Base'}
                    </span>
                  )}
                  {prompt.isCustom && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                      {language === 'en' ? 'Custom' : 'Personnalisé'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{prompt.characterCount} chars</span>
                  {editingKey !== prompt.key && (
                    <button
                      onClick={() => startEdit(prompt)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-300">{prompt.description}</p>

              {editingKey === prompt.key && <PromptEditor prompt={prompt} />}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Horoscope Prompts */}
      <div>
        <h3 className="text-lg font-heading text-amber-400 mb-3">
          {language === 'en' ? 'Horoscope Prompts' : 'Prompts Horoscope'} ({horoscopePrompts.length})
        </h3>
        <div className="space-y-3">
          {horoscopePrompts.map((prompt, index) => (
            <motion.div
              key={prompt.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-900/60 rounded-lg border border-purple-500/20 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs font-mono">
                    {prompt.key}
                  </span>
                  {prompt.isCustom && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">
                      {language === 'en' ? 'Custom' : 'Personnalisé'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{prompt.characterCount} chars</span>
                  {editingKey !== prompt.key && (
                    <button
                      onClick={() => startEdit(prompt)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-300">{prompt.description}</p>

              {editingKey === prompt.key && <PromptEditor prompt={prompt} />}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPrompts;
