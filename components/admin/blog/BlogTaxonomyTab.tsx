import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../../context/AppContext';
import { generateSlug } from '../../../utils/slug';
import {
  fetchUnifiedCategories,
  createUnifiedCategory,
  updateUnifiedCategory,
  deleteUnifiedCategory,
  reorderUnifiedCategory,
  fetchUnifiedTags,
  createUnifiedTag,
  updateUnifiedTag,
  deleteUnifiedTag,
} from '../../../services/api';
import type { UnifiedCategory, UnifiedTag } from '../../../services/api/taxonomy';
import { Plus, Folder, FolderOpen, Tag, Edit2, Trash2, CornerDownRight, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Local editing types — map unified API fields to form fields
interface CategoryFormData {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  descEn?: string;
  descFr?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  parentId?: string | null;
  blogPostCount?: number;
}

interface TagFormData {
  id: string;
  slug: string;
  nameEn: string;
  nameFr: string;
  blogPostCount?: number;
}

function categoryFromUnified(c: UnifiedCategory): CategoryFormData {
  return {
    id: c.id,
    slug: c.slug,
    nameEn: c.name,
    nameFr: c.nameFr,
    descEn: c.description ?? undefined,
    descFr: c.descriptionFr ?? undefined,
    color: c.color ?? undefined,
    icon: c.icon ?? undefined,
    sortOrder: c.sortOrder,
    parentId: c.parentId,
    blogPostCount: c.blogPostCount,
  };
}

/** Flatten tree response: parents + their children into a single list */
function flattenCategoryTree(cats: UnifiedCategory[]): CategoryFormData[] {
  const result: CategoryFormData[] = [];
  for (const cat of cats) {
    result.push(categoryFromUnified(cat));
    if (cat.children) {
      for (const child of cat.children) {
        result.push(categoryFromUnified(child));
      }
    }
  }
  return result;
}

function tagFromUnified(t: UnifiedTag): TagFormData {
  return {
    id: t.id,
    slug: t.slug,
    nameEn: t.name,
    nameFr: t.nameFr,
    blogPostCount: t.blogPostCount,
  };
}

// ============================================
// Sortable category components
// ============================================

/** A draggable child category item */
const SortableChildItem: React.FC<{
  child: CategoryFormData;
  parentColor?: string;
  language: string;
  onEdit: (cat: CategoryFormData) => void;
  onDelete: (id: string) => void;
}> = ({ child, parentColor, language, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: child.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const color = child.color || parentColor;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-slate-900/40 rounded-lg border border-slate-700/30 p-3 ${isDragging ? 'shadow-xl shadow-purple-500/10' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-purple-400 transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <CornerDownRight className="w-4 h-4 text-purple-500/40 flex-shrink-0" />
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Folder className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-slate-300 text-sm font-medium truncate">
          {language === 'en' ? child.nameEn : child.nameFr}
        </h5>
        <p className="text-slate-500 text-xs truncate">{child.slug}</p>
      </div>
      <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-400 flex-shrink-0">
        {child.blogPostCount || 0}
      </span>
      <button
        onClick={() => onEdit(child)}
        className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onDelete(child.id)}
        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/** A draggable parent category block (card + its children) */
const SortableParentBlock: React.FC<{
  parent: CategoryFormData;
  children: CategoryFormData[];
  language: string;
  onEdit: (cat: CategoryFormData) => void;
  onDelete: (id: string) => void;
  onChildDragEnd: (event: DragEndEvent, parentId: string) => void;
  childDndKey: number;
}> = ({ parent, children, language, onEdit, onDelete, onChildDragEnd, childDndKey }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: parent.id });

  // Own sensors for the child DndContext — must NOT share with the outer parent context
  const childSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const FolderIcon = children.length > 0 ? FolderOpen : Folder;

  return (
    <div ref={setNodeRef} style={style}>
      {/* Parent card */}
      <div className={`bg-slate-900/60 rounded-xl border border-purple-500/20 p-4 ${isDragging ? 'shadow-2xl shadow-purple-500/20' : ''}`}>
        <div className="flex items-center gap-3 mb-3">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-purple-400 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${parent.color}20` }}
          >
            <FolderIcon className="w-5 h-5" style={{ color: parent.color }} />
          </div>
          <div className="flex-1">
            <h4 className="text-slate-200 font-medium">
              {language === 'en' ? parent.nameEn : parent.nameFr}
            </h4>
            <p className="text-slate-500 text-sm">{parent.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-300">
              {parent.blogPostCount || 0} posts
            </span>
            {children.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-500/20 rounded-full text-xs text-purple-300">
                {children.length} {language === 'en' ? 'sub' : 'sous'}
              </span>
            )}
          </div>
        </div>
        {(parent.descEn || parent.descFr) && (
          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
            {language === 'en' ? parent.descEn : parent.descFr}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(parent)}
            className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
          >
            {language === 'en' ? 'Edit' : 'Modifier'}
          </button>
          <button
            onClick={() => onDelete(parent.id)}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Children indented underneath — draggable within parent */}
      {children.length > 0 && (
        <div className="ml-6 mt-1 border-l-2 border-purple-500/15 pl-4">
          <DndContext
            key={`child-${parent.id}-${childDndKey}`}
            sensors={childSensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={(event) => onChildDragEnd(event, parent.id)}
          >
            <SortableContext items={children.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {children.map(child => (
                  <SortableChildItem
                    key={child.id}
                    child={child}
                    parentColor={parent.color}
                    language={language}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

// ============================================
// Main component
// ============================================

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
  const [categories, setCategories] = useState<CategoryFormData[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Tags state
  const [tags, setTags] = useState<TagFormData[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<TagFormData | null>(null);
  const [isNewTag, setIsNewTag] = useState(false);

  const [saving, setSaving] = useState(false);

  // Counter to force DndContext remount after reorder (resets internal position tracking)
  const [dndKey, setDndKey] = useState(0);

  // Drag-and-drop sensors for parent categories
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const token = await getToken();
      if (!token) return;

      const result = await fetchUnifiedCategories(token);
      setCategories(flattenCategoryTree(result.categories));
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

      const result = await fetchUnifiedTags(token);
      setTags(result.tags.map(tagFromUnified));
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
        name: editingCategory.nameEn,
        nameFr: editingCategory.nameFr,
        description: editingCategory.descEn,
        descriptionFr: editingCategory.descFr,
        color: editingCategory.color,
        icon: editingCategory.icon,
        parentId: editingCategory.parentId || null,
      };

      if (isNewCategory) {
        await createUnifiedCategory(token, catData);
      } else {
        await updateUnifiedCategory(token, editingCategory.id, catData);
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

  const handleParentDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const parents = categories.filter(c => !c.parentId);
    const oldIndex = parents.findIndex(c => c.id === active.id);
    const newIndex = parents.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Save original for revert
    const original = [...categories];

    // Optimistically reorder parents in the flat categories list
    const reorderedParents = arrayMove(parents, oldIndex, newIndex);
    const updated: CategoryFormData[] = [];
    for (const p of reorderedParents) {
      updated.push(p);
      // Re-attach children after their parent
      for (const c of categories) {
        if (c.parentId === p.id) updated.push(c);
      }
    }
    setCategories(updated);

    try {
      const token = await getToken();
      if (!token) {
        setCategories(original);
        return;
      }
      await reorderUnifiedCategory(token, String(active.id), newIndex);
      // Force DndContext to remount so it remeasures item positions
      setDndKey(k => k + 1);
    } catch (err) {
      setCategories(original);
      const message = err instanceof Error ? err.message : 'Failed to reorder';
      onError(message);
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
          await deleteUnifiedCategory(token, id);
          loadCategories();
        } catch {
          onError(language === 'en' ? 'Failed to delete category' : 'Échec de la suppression');
        }
      },
    });
  };

  const handleChildDragEnd = async (event: DragEndEvent, parentId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const children = categories.filter(c => c.parentId === parentId);
    const oldIndex = children.findIndex(c => c.id === active.id);
    const newIndex = children.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Save original for revert
    const original = [...categories];

    // Optimistically reorder children in the flat list
    const reorderedChildren = arrayMove(children, oldIndex, newIndex);
    const updated = categories.map(c => {
      if (c.parentId !== parentId) return c;
      const idx = reorderedChildren.findIndex(rc => rc.id === c.id);
      return idx !== -1 ? reorderedChildren[idx] : c;
    });
    setCategories(updated);

    try {
      const token = await getToken();
      if (!token) {
        setCategories(original);
        return;
      }
      await reorderUnifiedCategory(token, String(active.id), newIndex);
      setDndKey(k => k + 1);
    } catch (err) {
      setCategories(original);
      const message = err instanceof Error ? err.message : 'Failed to reorder';
      onError(message);
    }
  };

  const handleEditCategory = (cat: CategoryFormData) => {
    setEditingCategory(cat);
    setIsNewCategory(false);
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
        name: editingTag.nameEn,
        nameFr: editingTag.nameFr,
      };

      if (isNewTag) {
        await createUnifiedTag(token, tagData);
      } else {
        await updateUnifiedTag(token, editingTag.id, tagData);
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
          await deleteUnifiedTag(token, id);
          loadTags();
        } catch {
          onError(language === 'en' ? 'Failed to delete tag' : 'Échec de la suppression');
        }
      },
    });
  };

  // Render Categories
  if (type === 'categories') {
    const parents = categories.filter(c => !c.parentId);

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
          <DndContext
            key={dndKey}
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleParentDragEnd}
          >
            <SortableContext items={parents.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {parents.map(parent => (
                  <SortableParentBlock
                    key={parent.id}
                    parent={parent}
                    children={categories.filter(c => c.parentId === parent.id)}
                    language={language}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onChildDragEnd={handleChildDragEnd}
                    childDndKey={dndKey}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
                  {/* Parent Category selector */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      {language === 'en' ? 'Parent Category' : 'Catégorie parente'}
                    </label>
                    <select
                      value={editingCategory.parentId || ''}
                      onChange={e =>
                        setEditingCategory({ ...editingCategory, parentId: e.target.value || null })
                      }
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                    >
                      <option value="">{language === 'en' ? '— None (top-level)' : '— Aucun (niveau supérieur)'}</option>
                      {categories
                        .filter(c => !c.parentId && c.id !== editingCategory.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {language === 'en' ? c.nameEn : c.nameFr}
                          </option>
                        ))}
                    </select>
                  </div>
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
              <span className="text-slate-500 text-sm">({tag.blogPostCount || 0})</span>
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
