import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchUnifiedTags,
  createUnifiedTag,
  updateUnifiedTag,
  deleteUnifiedTag,
  UnifiedTag,
} from '../../services/api';
import { Plus, Edit2, Trash2, Tag, X, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TarotTagsManagerProps {
  onTagsChange?: () => void;
}

// Editable tag state (subset of UnifiedTag for form)
interface EditingTag {
  id: string;
  name: string;
  nameFr: string;
  slug: string;
}

const TarotTagsManager: React.FC<TarotTagsManagerProps> = ({ onTagsChange }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [tags, setTags] = useState<UnifiedTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTag, setEditingTag] = useState<EditingTag | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const result = await fetchUnifiedTags(token);
      setTags(result.tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNew = () => {
    setEditingTag({ id: '', name: '', nameFr: '', slug: '' });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editingTag || !editingTag.name || !editingTag.slug) return;

    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return;

      const data = {
        name: editingTag.name,
        nameFr: editingTag.nameFr || undefined,
        slug: editingTag.slug,
      };

      if (isNew) {
        await createUnifiedTag(token, data);
      } else {
        await updateUnifiedTag(token, editingTag.id, data);
      }

      setEditingTag(null);
      setIsNew(false);
      loadTags();
      onTagsChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this tag?' : 'Supprimer ce tag?')) return;

    try {
      const token = await getToken();
      if (!token) return;
      await deleteUnifiedTag(token, id);
      loadTags();
      onTagsChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete tag');
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
      <div className="flex justify-end mb-4">
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Plus className="w-4 h-4" />
          {language === 'en' ? 'New Tag' : 'Nouveau tag'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => {
          const totalUsage = tag.blogPostCount + tag.tarotArticleCount;
          const isInUse = totalUsage > 0;
          return (
            <div
              key={tag.id}
              className="group flex items-center gap-2 bg-slate-900/60 border border-purple-500/20 rounded-full px-4 py-2"
            >
              <Tag className="w-4 h-4 text-purple-400" />
              <span className="text-slate-200">{tag.name}</span>
              {totalUsage > 0 && (
                <span className="text-xs text-slate-500 flex items-center gap-1" title={`${tag.blogPostCount} posts, ${tag.tarotArticleCount} tarot articles`}>
                  ({totalUsage})
                </span>
              )}
              <div className="hidden group-hover:flex gap-1 ml-2">
                <button
                  onClick={() => {
                    setEditingTag({
                      id: tag.id,
                      name: tag.name,
                      nameFr: tag.nameFr || '',
                      slug: tag.slug,
                    });
                    setIsNew(false);
                  }}
                  className="p-1 text-slate-400 hover:text-purple-400"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  disabled={isInUse}
                  className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={isInUse ? (language === 'en' ? 'Cannot delete: tag in use' : 'Impossible de supprimer: tag utilisé') : ''}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        {tags.length === 0 && (
          <div className="w-full text-center py-12 text-slate-400">
            {language === 'en' ? 'No tags yet' : 'Aucun tag'}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTag && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading text-purple-200">
                  {isNew ? (language === 'en' ? 'New Tag' : 'Nouveau tag') : (language === 'en' ? 'Edit Tag' : 'Modifier tag')}
                </h3>
                <button onClick={() => setEditingTag(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">🇬🇧 {language === 'en' ? 'Name' : 'Nom'}</label>
                    <input
                      type="text"
                      value={editingTag.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setEditingTag({
                          ...editingTag,
                          name,
                          slug: editingTag.slug || generateSlug(name),
                        });
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">🇫🇷 {language === 'en' ? 'Name (French)' : 'Nom (Français)'}</label>
                    <input
                      type="text"
                      value={editingTag.nameFr}
                      onChange={(e) => setEditingTag({ ...editingTag, nameFr: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={editingTag.slug}
                    onChange={(e) => setEditingTag({ ...editingTag, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingTag(null)}
                    className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                  >
                    {language === 'en' ? 'Cancel' : 'Annuler'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editingTag.name || !editingTag.slug}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {saving ? '...' : (language === 'en' ? 'Save' : 'Enregistrer')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TarotTagsManager;
