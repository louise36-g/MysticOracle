import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../../context/AppContext';
import {
  fetchAdminBlogPosts,
  fetchAdminBlogPost,
  fetchAdminBlogCategories,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  reorderBlogPost,
  CreateBlogPostData,
  BlogCategory,
} from '../../../services/apiService';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileJson,
  Star,
  ExternalLink,
  Eye,
  Folder,
  GripVertical,
} from 'lucide-react';
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
import BlogPostEditor from '../BlogPostEditor';
import type { BlogPost, Pagination } from './types';

interface BlogPostsTabProps {
  onLoadCategories: () => Promise<void>;
  onLoadTags: () => Promise<void>;
  onLoadTrash: () => Promise<void>;
  onShowImportModal: () => void;
  onShowConfirmModal: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }) => void;
  onError: (error: string | null) => void;
}

const BlogPostsTab: React.FC<BlogPostsTabProps> = ({
  onLoadCategories,
  onLoadTags,
  onLoadTrash,
  onShowImportModal,
  onShowConfirmModal,
  onError,
}) => {
  const { language } = useApp();
  const { getToken } = useAuth();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 100, // Increased for drag-and-drop within category
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>(''); // New category filter
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);
  const [saving, setSaving] = useState(false);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadCategories = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await fetchAdminBlogCategories(token);
      setCategories(result.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, [getToken]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const result = await fetchAdminBlogPosts(token, {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        search: search || undefined,
        category: categoryFilter || undefined, // Add category filter
      });

      setPosts(result.posts);
      setPagination(result.pagination);
      onError(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, statusFilter, search, categoryFilter, onError]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = posts.findIndex((p) => p.id === active.id);
    const newIndex = posts.findIndex((p) => p.id === over.id);

    // Save original order for revert
    const originalPosts = [...posts];

    // Optimistically update UI
    const newPosts = arrayMove(posts, oldIndex, newIndex);
    setPosts(newPosts);

    try {
      const token = await getToken();
      if (!token) {
        // Revert if no token
        setPosts(originalPosts);
        return;
      }

      await reorderBlogPost(token, active.id as string, categoryFilter || null, newIndex);

      // Reload posts to get updated sortOrder from server
      await loadPosts();
    } catch (err) {
      // Revert on error
      setPosts(originalPosts);
      onError('Failed to reorder post');
    }
  };

  const handleNewPost = async () => {
    await Promise.all([onLoadCategories(), onLoadTags()]);
    setEditingPost({
      id: '',
      slug: '',
      titleEn: '',
      titleFr: '',
      excerptEn: '',
      excerptFr: '',
      contentEn: '',
      contentFr: '',
      authorName: '',
      status: 'DRAFT',
      featured: false,
      viewCount: 0,
      readTimeMinutes: 5,
      createdAt: '',
      updatedAt: '',
      categories: [],
      tags: [],
      categoryIds: [],
      tagIds: [],
    });
    setIsNewPost(true);
  };

  const handleEditPost = async (post: BlogPost) => {
    try {
      const token = await getToken();
      if (!token) return;

      await Promise.all([onLoadCategories(), onLoadTags()]);
      const { post: fullPost } = await fetchAdminBlogPost(token, post.id);
      setEditingPost(fullPost);
      setIsNewPost(false);
    } catch {
      onError('Failed to load post');
    }
  };

  const handleSavePost = async () => {
    if (!editingPost) return;

    try {
      setSaving(true);
      const token = await getToken();
      if (!token) return;

      const postData: CreateBlogPostData = {
        slug: editingPost.slug,
        titleEn: editingPost.titleEn,
        titleFr: editingPost.titleFr || '',
        excerptEn: editingPost.excerptEn || '',
        excerptFr: editingPost.excerptFr || '',
        contentEn: editingPost.contentEn || '',
        contentFr: editingPost.contentFr || '',
        coverImage: editingPost.coverImage,
        coverImageAlt: editingPost.coverImageAlt,
        metaTitleEn: editingPost.metaTitleEn,
        metaTitleFr: editingPost.metaTitleFr,
        metaDescEn: editingPost.metaDescEn,
        metaDescFr: editingPost.metaDescFr,
        ogImage: editingPost.ogImage,
        authorName: editingPost.authorName,
        status: editingPost.status,
        featured: editingPost.featured,
        readTimeMinutes: editingPost.readTimeMinutes,
        categoryIds: editingPost.categoryIds || [],
        tagIds: editingPost.tagIds || [],
      };

      if (isNewPost) {
        await createBlogPost(token, postData);
      } else {
        await updateBlogPost(token, editingPost.id, postData);
      }

      setEditingPost(null);
      setIsNewPost(false);
      loadPosts();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = (id: string) => {
    onShowConfirmModal({
      title: language === 'en' ? 'Move to Trash' : 'Déplacer vers la corbeille',
      message:
        language === 'en'
          ? 'This post will be moved to the trash. You can restore it later.'
          : 'Cet article sera déplacé vers la corbeille. Vous pourrez le restaurer plus tard.',
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await deleteBlogPost(token, id);
          loadPosts();
          onLoadTrash();
        } catch {
          onError(language === 'en' ? 'Failed to delete post' : 'Échec de la suppression');
        }
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-slate-500/20 text-slate-300',
      PUBLISHED: 'bg-green-500/20 text-green-400',
      ARCHIVED: 'bg-amber-500/20 text-amber-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
        {status}
      </span>
    );
  };

  // SortableRow component for drag-and-drop
  interface SortableRowProps {
    post: BlogPost;
    showDragHandle: boolean;
  }

  const SortableRow: React.FC<SortableRowProps> = ({ post, showDragHandle }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: post.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <tr
        ref={setNodeRef}
        style={style}
        className="border-b border-purple-500/10 hover:bg-slate-800/30"
      >
        {showDragHandle && (
          <td className="p-4">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-purple-400"
            >
              <GripVertical className="w-5 h-5" />
            </button>
          </td>
        )}
        <td className="p-4">
          <div className="flex items-center gap-2">
            {post.featured && <Star className="w-4 h-4 text-amber-400" />}
            <div>
              <button
                onClick={() => handleEditPost(post)}
                className="text-slate-200 font-medium hover:text-purple-400 transition-colors text-left"
              >
                {language === 'en' ? post.titleEn : post.titleFr}
              </button>
              <p className="text-slate-500 text-sm">{post.slug}</p>
            </div>
          </div>
        </td>
        <td className="p-4">{getStatusBadge(post.status)}</td>
        <td className="p-4">
          <div className="flex flex-wrap gap-1">
            {post.categories.slice(0, 2).map(cat => (
              <span
                key={cat.id}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                {language === 'en' ? cat.nameEn : cat.nameFr}
              </span>
            ))}
          </div>
        </td>
        <td className="p-4 text-slate-400">{post.viewCount}</td>
        <td className="p-4 text-slate-400 text-sm">
          {new Date(post.updatedAt).toLocaleDateString()}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <a
              href={
                post.status === 'PUBLISHED'
                  ? `/blog/${post.slug}`
                  : `/blog/preview/${post.id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg ${
                post.status === 'PUBLISHED'
                  ? 'text-slate-400 hover:text-green-400 hover:bg-green-500/20'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/20'
              }`}
              title={
                post.status === 'PUBLISHED'
                  ? language === 'en'
                    ? 'View'
                    : 'Voir'
                  : language === 'en'
                  ? 'Preview'
                  : 'Apercu'
              }
            >
              {post.status === 'PUBLISHED' ? (
                <ExternalLink className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </a>
            <button
              onClick={() => handleEditPost(post)}
              className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/20 rounded-lg"
              title={language === 'en' ? 'Edit' : 'Modifier'}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeletePost(post.id)}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
              title={language === 'en' ? 'Delete' : 'Supprimer'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // If editing a post, show the full page editor
  if (editingPost) {
    return (
      <BlogPostEditor
        post={editingPost}
        isNew={isNewPost}
        onSave={() => {
          setEditingPost(null);
          setIsNewPost(false);
          loadPosts();
        }}
        onCancel={() => {
          setEditingPost(null);
          setIsNewPost(false);
        }}
      />
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'en' ? 'Search posts...' : 'Rechercher...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => {
            setCategoryFilter(e.target.value);
            setPagination({ ...pagination, page: 1 });
          }}
          className="px-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200"
        >
          <option value="">{language === 'en' ? 'All Categories' : 'Toutes les catégories'}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {language === 'en' ? cat.nameEn : cat.nameFr}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200"
        >
          <option value="">{language === 'en' ? 'All Status' : 'Tous les statuts'}</option>
          <option value="DRAFT">{language === 'en' ? 'Draft' : 'Brouillon'}</option>
          <option value="PUBLISHED">{language === 'en' ? 'Published' : 'Publie'}</option>
          <option value="ARCHIVED">{language === 'en' ? 'Archived' : 'Archive'}</option>
        </select>
        <button
          onClick={onShowImportModal}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"
        >
          <FileJson className="w-4 h-4" />
          {language === 'en' ? 'Import JSON' : 'Importer JSON'}
        </button>
        <button
          onClick={handleNewPost}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Plus className="w-4 h-4" />
          {language === 'en' ? 'New Post' : 'Nouvel article'}
        </button>
      </div>

      {/* Posts Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/20 bg-slate-800/50">
                    {categoryFilter && (
                      <th className="text-left p-4 text-slate-300 font-medium w-12">
                        {/* Drag handle column */}
                      </th>
                    )}
                    <th className="text-left p-4 text-slate-300 font-medium">
                      {language === 'en' ? 'Title' : 'Titre'}
                    </th>
                    <th className="text-left p-4 text-slate-300 font-medium">
                      {language === 'en' ? 'Status' : 'Statut'}
                    </th>
                    <th className="text-left p-4 text-slate-300 font-medium">
                      {language === 'en' ? 'Categories' : 'Categories'}
                    </th>
                    <th className="text-left p-4 text-slate-300 font-medium">
                      {language === 'en' ? 'Views' : 'Vues'}
                    </th>
                    <th className="text-left p-4 text-slate-300 font-medium">
                      {language === 'en' ? 'Updated' : 'Mis a jour'}
                    </th>
                    <th className="text-left p-4 text-slate-300 font-medium">
                      {language === 'en' ? 'Actions' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={categoryFilter ? 7 : 6} className="p-8 text-center text-slate-400">
                        {language === 'en'
                          ? 'No posts yet. Create your first post!'
                          : 'Aucun article. Creez votre premier article!'}
                      </td>
                    </tr>
                  ) : (
                    <SortableContext items={posts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                      {posts.map(post => (
                        <SortableRow key={post.id} post={post} showDragHandle={!!categoryFilter} />
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            {language === 'en'
              ? `Showing ${posts.length} of ${pagination.total} posts`
              : `Affichage de ${posts.length} sur ${pagination.total} articles`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 px-4">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPostsTab;
