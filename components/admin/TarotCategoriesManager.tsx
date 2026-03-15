import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { generateSlug } from '../../utils/slug';
import {
  fetchUnifiedCategories,
  createUnifiedCategory,
  updateUnifiedCategory,
  deleteUnifiedCategory,
  UnifiedCategory,
} from '../../services/api';
import { useAdminCrud } from '../../hooks';
import { Plus, Trash2, Folder, FolderOpen, X, FileText, ChevronRight } from 'lucide-react';
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
  parentId: string | null;
}

// Category card component (reused for parents and children)
const CategoryCard: React.FC<{
  cat: UnifiedCategory;
  language: string;
  isChild?: boolean;
  onEdit: (cat: UnifiedCategory) => void;
  onDelete: (id: string) => void;
}> = ({ cat, language, isChild, onEdit, onDelete }) => {
  const totalPosts = cat.blogPostCount + cat.tarotArticleCount;
  const childCount = cat.children?.length || 0;
  const childPostTotal = cat.children?.reduce((sum, c) => sum + c.blogPostCount + c.tarotArticleCount, 0) || 0;

  return (
    <div
      className={`bg-slate-900/60 rounded-xl border p-4 ${
        isChild
          ? 'border-slate-700/30'
          : 'border-purple-500/20'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cat.color ? `${cat.color}30` : 'rgba(168, 85, 247, 0.2)' }}
        >
          {childCount > 0 ? (
            <FolderOpen className="w-4 h-4" style={{ color: cat.color || '#a855f7' }} />
          ) : (
            <Folder className="w-4 h-4" style={{ color: cat.color || '#a855f7' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-slate-200 font-medium text-sm truncate">{cat.name}</h4>
          <p className="text-slate-500 text-xs truncate">{cat.slug}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {totalPosts}{childCount > 0 ? ` (+${childPostTotal})` : ''}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(cat)}
          className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
        >
          {language === 'en' ? 'Edit' : 'Modifier'}
        </button>
        <button
          onClick={() => onDelete(cat.id)}
          disabled={totalPosts > 0}
          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          title={totalPosts > 0 ? (language === 'en' ? 'Cannot delete: category in use' : 'Impossible de supprimer: catégorie utilisée') : ''}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const TarotCategoriesManager: React.FC<TarotCategoriesManagerProps> = ({ onCategoriesChange }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const crud = useAdminCrud();
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

  const handleNew = (parentId?: string) => {
    setEditingCategory({
      id: '', name: '', nameFr: '', slug: '', description: '', color: '', icon: '',
      parentId: parentId || null,
    });
    setIsNew(true);
  };

  const handleEdit = (cat: UnifiedCategory) => {
    setEditingCategory({
      id: cat.id,
      name: cat.name,
      nameFr: cat.nameFr || '',
      slug: cat.slug,
      description: cat.description || '',
      color: cat.color || '',
      icon: cat.icon || '',
      parentId: cat.parentId || null,
    });
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!editingCategory || !editingCategory.name || !editingCategory.slug) return;

    await crud.withSaving(async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');

      const data = {
        name: editingCategory.name,
        nameFr: editingCategory.nameFr || undefined,
        slug: editingCategory.slug,
        description: editingCategory.description || undefined,
        color: editingCategory.color || undefined,
        icon: editingCategory.icon || undefined,
        parentId: editingCategory.parentId || null,
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
    }, { resetOnSuccess: false, errorPrefix: 'Failed to save category' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this category?' : 'Supprimer cette catégorie?')) return;

    await crud.withSaving(async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      await deleteUnifiedCategory(token, id);
      loadCategories();
      onCategoriesChange?.();
    }, { resetOnSuccess: false, errorPrefix: 'Failed to delete category' });
  };

  // Build list of possible parents for the selector (exclude self and own children)
  const getParentOptions = (): UnifiedCategory[] => {
    const editId = editingCategory?.id;
    return categories.filter(cat => {
      if (cat.id === editId) return false;
      // Don't allow selecting own children as parent
      if (cat.children?.some(c => c.id === editId)) return false;
      return true;
    });
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
          onClick={() => handleNew()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Plus className="w-4 h-4" />
          {language === 'en' ? 'New Category' : 'Nouvelle catégorie'}
        </button>
      </div>

      {crud.error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300 mb-4">
          {crud.error}
        </div>
      )}

      {/* Tree display: parents with nested children */}
      <div className="space-y-6">
        {categories.map((parent) => (
          <div key={parent.id}>
            {/* Parent category */}
            <CategoryCard
              cat={parent}
              language={language}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {/* Children */}
            {parent.children && parent.children.length > 0 && (
              <div className="ml-8 mt-2 space-y-2 border-l-2 border-purple-500/10 pl-4">
                {parent.children.map((child) => (
                  <div key={child.id} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-500/30 mt-4 flex-shrink-0" />
                    <div className="flex-1">
                      <CategoryCard
                        cat={child}
                        language={language}
                        isChild
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add child button */}
            <button
              onClick={() => handleNew(parent.id)}
              className="ml-8 mt-2 flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-400 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {language === 'en' ? 'Add subcategory' : 'Ajouter sous-catégorie'}
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-12 text-slate-400">
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
                {/* Parent selector */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    {language === 'en' ? 'Parent Category' : 'Catégorie parente'}
                  </label>
                  <select
                    value={editingCategory.parentId || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, parentId: e.target.value || null })}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  >
                    <option value="">{language === 'en' ? '— None (top-level)' : '— Aucun (niveau supérieur)'}</option>
                    {getParentOptions().map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

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
                    disabled={crud.saving || !editingCategory.name || !editingCategory.slug}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {crud.saving ? '...' : (language === 'en' ? 'Save' : 'Enregistrer')}
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
