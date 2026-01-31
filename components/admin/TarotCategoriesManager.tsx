import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchUnifiedCategories,
  createUnifiedCategory,
  updateUnifiedCategory,
  deleteUnifiedCategory,
  UnifiedCategory,
} from '../../services/api';
import { Plus, Trash2, Folder, X, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TarotCategoriesManagerProps {
  onCategoriesChange?: () => void;
}

// Editable category state (subset of UnifiedCategory for form)
interface EditingCategory {
  id: string;
  name: string;
  nameFr: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

const TarotCategoriesManager: React.FC<TarotCategoriesManagerProps> = ({ onCategoriesChange }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const result = await fetchUnifiedCategories(token);
      setCategories(result.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNew = () => {
    setEditingCategory({ id: '', name: '', nameFr: '', slug: '', description: '', color: '', icon: '' });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!editingCategory || !editingCategory.name || !editingCategory.slug) return;

    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return;

      const data = {
        name: editingCategory.name,
        nameFr: editingCategory.nameFr || undefined,
        slug: editingCategory.slug,
        description: editingCategory.description || undefined,
        color: editingCategory.color || undefined,
        icon: editingCategory.icon || undefined,
      };

      if (isNew) {
        await createUnifiedCategory(token, data);
      } else {
        await updateUnifiedCategory(token, editingCategory.id, data);
      }

      setEditingCategory(null);
      setIsNew(false);
      loadCategories();
      onCategoriesChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this category?' : 'Supprimer cette catégorie?')) return;

    try {
      const token = await getToken();
      if (!token) return;
      await deleteUnifiedCategory(token, id);
      loadCategories();
      onCategoriesChange?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
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
          {language === 'en' ? 'New Category' : 'Nouvelle catégorie'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: cat.color ? `${cat.color}30` : 'rgba(168, 85, 247, 0.2)' }}
              >
                <Folder className="w-5 h-5" style={{ color: cat.color || '#a855f7' }} />
              </div>
              <div className="flex-1">
                <h4 className="text-slate-200 font-medium">{cat.name}</h4>
                <p className="text-slate-500 text-sm">{cat.slug}</p>
              </div>
            </div>
            {cat.description && (
              <p className="text-slate-400 text-sm mb-3 line-clamp-2">{cat.description}</p>
            )}
            <div className="flex gap-3 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {cat.blogPostCount} {language === 'en' ? 'posts' : 'articles'}
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {cat.tarotArticleCount} tarot
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingCategory({
                    id: cat.id,
                    name: cat.name,
                    nameFr: cat.nameFr || '',
                    slug: cat.slug,
                    description: cat.description || '',
                    color: cat.color || '',
                    icon: cat.icon || '',
                  });
                  setIsNew(false);
                }}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
              >
                {language === 'en' ? 'Edit' : 'Modifier'}
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={cat.blogPostCount > 0 || cat.tarotArticleCount > 0}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                title={cat.blogPostCount > 0 || cat.tarotArticleCount > 0 ? (language === 'en' ? 'Cannot delete: category in use' : 'Impossible de supprimer: catégorie utilisée') : ''}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            {language === 'en' ? 'No categories yet' : 'Aucune catégorie'}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading text-purple-200">
                  {isNew ? (language === 'en' ? 'New Category' : 'Nouvelle catégorie') : (language === 'en' ? 'Edit Category' : 'Modifier catégorie')}
                </h3>
                <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">🇬🇧 {language === 'en' ? 'Name' : 'Nom'}</label>
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setEditingCategory({
                          ...editingCategory,
                          name,
                          slug: editingCategory.slug || generateSlug(name),
                        });
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">🇫🇷 {language === 'en' ? 'Name (French)' : 'Nom (Français)'}</label>
                    <input
                      type="text"
                      value={editingCategory.nameFr}
                      onChange={(e) => setEditingCategory({ ...editingCategory, nameFr: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea
                    value={editingCategory.description}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">{language === 'en' ? 'Color' : 'Couleur'}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editingCategory.color || '#a855f7'}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-slate-800 border border-purple-500/20"
                    />
                    <input
                      type="text"
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      placeholder="#a855f7"
                      className="flex-1 px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                  >
                    {language === 'en' ? 'Cancel' : 'Annuler'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editingCategory.name || !editingCategory.slug}
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

export default TarotCategoriesManager;
