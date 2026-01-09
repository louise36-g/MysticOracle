import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchTarotCategories,
  createTarotCategory,
  updateTarotCategory,
  deleteTarotCategory,
  TarotCategory,
} from '../../services/apiService';
import { Plus, Trash2, Folder, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TarotCategoriesManagerProps {
  onCategoriesChange?: () => void;
}

const TarotCategoriesManager: React.FC<TarotCategoriesManagerProps> = ({ onCategoriesChange }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<TarotCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TarotCategory | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const result = await fetchTarotCategories(token);
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
    setEditingCategory({ id: '', name: '', slug: '', description: '', createdAt: '', updatedAt: '' });
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
        slug: editingCategory.slug,
        description: editingCategory.description || undefined,
      };

      if (isNew) {
        await createTarotCategory(token, data);
      } else {
        await updateTarotCategory(token, editingCategory.id, data);
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
      await deleteTarotCategory(token, id);
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
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Folder className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-slate-200 font-medium">{cat.name}</h4>
                <p className="text-slate-500 text-sm">{cat.slug}</p>
              </div>
            </div>
            {cat.description && (
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{cat.description}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingCategory(cat); setIsNew(false); }}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
              >
                {language === 'en' ? 'Edit' : 'Modifier'}
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
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
                <div>
                  <label className="block text-sm text-slate-400 mb-1">{language === 'en' ? 'Name' : 'Nom'}</label>
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
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 resize-none"
                  />
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
