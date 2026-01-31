import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../../context/AppContext';
import {
  fetchAdminBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  fetchAdminBlogTags,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
} from '../../../services/api';
import { Plus, Folder, Tag, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlogCategory, BlogTag } from './types';

interface BlogTaxonomyTabProps {
  type: 'categories' | 'tags';
  onShowConfirmModal: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }) => void;
  onError: (error: string | null) => void;
}

const BlogTaxonomyTab: React.FC<BlogTaxonomyTabProps> = ({ type, onShowConfirmModal, onError }) => {
  const { language } = useApp();
  const { getToken } = useAuth();

  // Categories state
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Tags state
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [isNewTag, setIsNewTag] = useState(false);

  const [saving, setSaving] = useState(false);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const token = await getToken();
      if (!token) return;

      const result = await fetchAdminBlogCategories(token);
      setCategories(result.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, [getToken]);

  // Load tags
  const loadTags = useCallback(async () => {
    try {
      setTagsLoading(true);
      const token = await getToken();
      if (!token) return;

      const result = await fetchAdminBlogTags(token);
      setTags(result.tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setTagsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (type === 'categories') {
      loadCategories();
    } else {
      loadTags();
    }
  }, [type, loadCategories, loadTags]);

  // Category handlers
  const handleNewCategory = () => {
    setEditingCategory({
      id: '',
      slug: '',
      nameEn: '',
      nameFr: '',
      descEn: '',
      descFr: '',
      color: '#8b5cf6',
      icon: '',
      sortOrder: categories.length,
    });
    setIsNewCategory(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;

    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return;

      const catData = {
        slug: editingCategory.slug,
        nameEn: editingCategory.nameEn,
        nameFr: editingCategory.nameFr,
        descEn: editingCategory.descEn,
        descFr: editingCategory.descFr,
        color: editingCategory.color,
        icon: editingCategory.icon,
        sortOrder: editingCategory.sortOrder,
      };

      if (isNewCategory) {
        await createBlogCategory(token, catData);
      } else {
        await updateBlogCategory(token, editingCategory.id, catData);
      }

      setEditingCategory(null);
      setIsNewCategory(false);
      loadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save category';
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    onShowConfirmModal({
      title: language === 'en' ? 'Delete Category' : 'Supprimer la catégorie',
      message:
        language === 'en'
          ? 'Are you sure you want to delete this category?'
          : 'Êtes-vous sûr de vouloir supprimer cette catégorie?',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await deleteBlogCategory(token, id);
          loadCategories();
        } catch {
          onError(language === 'en' ? 'Failed to delete category' : 'Échec de la suppression');
        }
      },
    });
  };

  // Tag handlers
  const handleNewTag = () => {
    setEditingTag({
      id: '',
      slug: '',
      nameEn: '',
      nameFr: '',
    });
    setIsNewTag(true);
  };

  const handleSaveTag = async () => {
    if (!editingTag) return;

    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return;

      const tagData = {
        slug: editingTag.slug,
        nameEn: editingTag.nameEn,
        nameFr: editingTag.nameFr,
      };

      if (isNewTag) {
        await createBlogTag(token, tagData);
      } else {
        await updateBlogTag(token, editingTag.id, tagData);
      }

      setEditingTag(null);
      setIsNewTag(false);
      loadTags();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save tag';
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = (id: string) => {
    onShowConfirmModal({
      title: language === 'en' ? 'Delete Tag' : 'Supprimer le tag',
      message:
        language === 'en'
          ? 'Are you sure you want to delete this tag?'
          : 'Êtes-vous sûr de vouloir supprimer ce tag?',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await deleteBlogTag(token, id);
          loadTags();
        } catch {
          onError(language === 'en' ? 'Failed to delete tag' : 'Échec de la suppression');
        }
      },
    });
  };

  // Render Categories
  if (type === 'categories') {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <button
            onClick={handleNewCategory}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
          >
            <Plus className="w-4 h-4" />
            {language === 'en' ? 'New Category' : 'Nouvelle categorie'}
          </button>
        </div>

        {categoriesLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <Folder className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-slate-200 font-medium">
                      {language === 'en' ? cat.nameEn : cat.nameFr}
                    </h4>
                    <p className="text-slate-500 text-sm">{cat.slug}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-300">
                    {cat._count?.posts || 0} posts
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {language === 'en' ? cat.descEn : cat.descFr}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsNewCategory(false);
                    }}
                    className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
                  >
                    {language === 'en' ? 'Edit' : 'Modifier'}
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Editor Modal */}
        <AnimatePresence>
          {editingCategory && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-lg w-full"
              >
                <h3 className="text-lg font-heading text-purple-200 mb-4">
                  {isNewCategory
                    ? language === 'en'
                      ? 'New Category'
                      : 'Nouvelle categorie'
                    : language === 'en'
                      ? 'Edit Category'
                      : 'Modifier categorie'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Slug</label>
                      <input
                        type="text"
                        value={editingCategory.slug}
                        onChange={e =>
                          setEditingCategory({ ...editingCategory, slug: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        {language === 'en' ? 'Color' : 'Couleur'}
                      </label>
                      <input
                        type="color"
                        value={editingCategory.color || '#8b5cf6'}
                        onChange={e =>
                          setEditingCategory({ ...editingCategory, color: e.target.value })
                        }
                        className="w-full h-10 bg-slate-800 border border-purple-500/20 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Name (English)</label>
                      <input
                        type="text"
                        value={editingCategory.nameEn}
                        onChange={e => {
                          const name = e.target.value;
                          setEditingCategory({
                            ...editingCategory,
                            nameEn: name,
                            slug: editingCategory.slug || generateSlug(name),
                          });
                        }}
                        className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Nom (Francais)</label>
                      <input
                        type="text"
                        value={editingCategory.nameFr}
                        onChange={e =>
                          setEditingCategory({ ...editingCategory, nameFr: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Description (EN)</label>
                      <textarea
                        value={editingCategory.descEn || ''}
                        onChange={e =>
                          setEditingCategory({ ...editingCategory, descEn: e.target.value })
                        }
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Description (FR)</label>
                      <textarea
                        value={editingCategory.descFr || ''}
                        onChange={e =>
                          setEditingCategory({ ...editingCategory, descFr: e.target.value })
                        }
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 resize-none"
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
                      onClick={handleSaveCategory}
                      disabled={saving || !editingCategory.slug || !editingCategory.nameEn}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                    >
                      {saving
                        ? language === 'en'
                          ? 'Saving...'
                          : 'Sauvegarde...'
                        : language === 'en'
                          ? 'Save'
                          : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render Tags
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleNewTag}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Plus className="w-4 h-4" />
          {language === 'en' ? 'New Tag' : 'Nouveau tag'}
        </button>
      </div>

      {tagsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="group flex items-center gap-2 bg-slate-900/60 border border-purple-500/20 rounded-full px-4 py-2"
            >
              <Tag className="w-4 h-4 text-purple-400" />
              <span className="text-slate-200">{language === 'en' ? tag.nameEn : tag.nameFr}</span>
              <span className="text-slate-500 text-sm">({tag._count?.posts || 0})</span>
              <div className="hidden group-hover:flex gap-1 ml-2">
                <button
                  onClick={() => {
                    setEditingTag(tag);
                    setIsNewTag(false);
                  }}
                  className="p-1 text-slate-400 hover:text-purple-400"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="p-1 text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tag Editor Modal */}
      <AnimatePresence>
        {editingTag && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-heading text-purple-200 mb-4">
                {isNewTag
                  ? language === 'en'
                    ? 'New Tag'
                    : 'Nouveau tag'
                  : language === 'en'
                    ? 'Edit Tag'
                    : 'Modifier tag'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={editingTag.slug}
                    onChange={e => setEditingTag({ ...editingTag, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Name (English)</label>
                    <input
                      type="text"
                      value={editingTag.nameEn}
                      onChange={e => {
                        const name = e.target.value;
                        setEditingTag({
                          ...editingTag,
                          nameEn: name,
                          slug: editingTag.slug || generateSlug(name),
                        });
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Nom (Francais)</label>
                    <input
                      type="text"
                      value={editingTag.nameFr}
                      onChange={e => setEditingTag({ ...editingTag, nameFr: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingTag(null)}
                    className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                  >
                    {language === 'en' ? 'Cancel' : 'Annuler'}
                  </button>
                  <button
                    onClick={handleSaveTag}
                    disabled={saving || !editingTag.slug || !editingTag.nameEn}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {saving
                      ? language === 'en'
                        ? 'Saving...'
                        : 'Sauvegarde...'
                      : language === 'en'
                        ? 'Save'
                        : 'Enregistrer'}
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

export default BlogTaxonomyTab;
