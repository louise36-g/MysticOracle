import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminBlogPosts,
  fetchAdminBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  fetchAdminBlogCategories,
  CreateBlogPostData,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  fetchAdminBlogTags,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  importBlogArticles,
  restoreBlogPost,
  permanentlyDeleteBlogPost,
  emptyBlogTrash,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
  ImportResult,
} from '../../services/apiService';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  Tag,
  Image,
  Upload,
  Star,
  Copy,
  Check,
  ExternalLink,
  FileJson,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Trash,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BlogPostEditor from './BlogPostEditor';

type TabType = 'posts' | 'categories' | 'tags' | 'media' | 'trash';

const AdminBlog: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  // Posts state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsPagination, setPostsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [postsSearch, setPostsSearch] = useState('');
  const [postsStatus, setPostsStatus] = useState<string>('');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);

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

  // Media state
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trash state
  const [trashPosts, setTrashPosts] = useState<BlogPost[]>([]);
  const [trashLoading, setTrashLoading] = useState(true);
  const [trashPagination, setTrashPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // General
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const jsonTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // Auto-focus textarea when import modal opens
  useEffect(() => {
    if (showImportModal && jsonTextareaRef.current) {
      // Small delay to ensure modal animation is complete
      setTimeout(() => {
        jsonTextareaRef.current?.focus();
      }, 100);
    }
  }, [showImportModal]);

  // Load posts
  const loadPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      const token = await getToken();
      if (!token) return;

      const result = await fetchAdminBlogPosts(token, {
        page: postsPagination.page,
        limit: postsPagination.limit,
        status: postsStatus || undefined,
        search: postsSearch || undefined,
      });

      setPosts(result.posts);
      setPostsPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  }, [getToken, postsPagination.page, postsPagination.limit, postsStatus, postsSearch]);

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

  // Load media
  const loadMedia = useCallback(async () => {
    try {
      setMediaLoading(true);
      const token = await getToken();
      if (!token) return;

      const result = await fetchAdminBlogMedia(token);
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setMediaLoading(false);
    }
  }, [getToken]);

  // Load trash
  const loadTrash = useCallback(async () => {
    try {
      setTrashLoading(true);
      const token = await getToken();
      if (!token) return;

      const result = await fetchAdminBlogPosts(token, {
        page: trashPagination.page,
        limit: trashPagination.limit,
        deleted: true,
      });

      setTrashPosts(result.posts);
      setTrashPagination(result.pagination);
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setTrashLoading(false);
    }
  }, [getToken, trashPagination.page, trashPagination.limit]);

  useEffect(() => {
    if (activeTab === 'posts') loadPosts();
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'trash') loadTrash();
    if (activeTab === 'tags') loadTags();
    if (activeTab === 'media') loadMedia();
  }, [activeTab, loadPosts, loadCategories, loadTags, loadMedia, loadTrash]);

  // Copy URL to clipboard
  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // ============================================
  // POST HANDLERS
  // ============================================

  const handleNewPost = async () => {
    await Promise.all([loadCategories(), loadTags()]);
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

      await Promise.all([loadCategories(), loadTags()]);
      const { post: fullPost } = await fetchAdminBlogPost(token, post.id);
      setEditingPost(fullPost);
      setIsNewPost(false);
    } catch (err) {
      alert('Failed to load post');
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
      alert(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = (id: string) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Move to Trash' : 'Déplacer vers la corbeille',
      message: language === 'en'
        ? 'This post will be moved to the trash. You can restore it later.'
        : 'Cet article sera déplacé vers la corbeille. Vous pourrez le restaurer plus tard.',
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await deleteBlogPost(token, id);
          loadPosts();
          loadTrash();
        } catch (err) {
          setError(language === 'en' ? 'Failed to delete post' : 'Échec de la suppression');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  // ============================================
  // CATEGORY HANDLERS
  // ============================================

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
      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Delete Category' : 'Supprimer la catégorie',
      message: language === 'en'
        ? 'Are you sure you want to delete this category?'
        : 'Êtes-vous sûr de vouloir supprimer cette catégorie?',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await deleteBlogCategory(token, id);
          loadCategories();
        } catch (err) {
          setError(language === 'en' ? 'Failed to delete category' : 'Échec de la suppression');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  // ============================================
  // TAG HANDLERS
  // ============================================

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
      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = (id: string) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Delete Tag' : 'Supprimer le tag',
      message: language === 'en'
        ? 'Are you sure you want to delete this tag?'
        : 'Êtes-vous sûr de vouloir supprimer ce tag?',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await deleteBlogTag(token, id);
          loadTags();
        } catch (err) {
          setError(language === 'en' ? 'Failed to delete tag' : 'Échec de la suppression');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  // ============================================
  // MEDIA HANDLERS
  // ============================================

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const token = await getToken();
      if (!token) return;

      for (const file of Array.from(files)) {
        await uploadBlogMedia(token, file);
      }

      loadMedia();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      alert(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMedia = (id: string) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Delete Image' : 'Supprimer l\'image',
      message: language === 'en'
        ? 'Are you sure you want to delete this image?'
        : 'Êtes-vous sûr de vouloir supprimer cette image?',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await deleteBlogMedia(token, id);
          loadMedia();
        } catch (err) {
          setError(language === 'en' ? 'Failed to delete media' : 'Échec de la suppression');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  // ============================================
  // TRASH HANDLERS
  // ============================================

  const handleRestorePost = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await restoreBlogPost(token, id);
      loadTrash();
      loadPosts();
    } catch (err) {
      alert(language === 'en' ? 'Failed to restore post' : 'Échec de la restauration');
    }
  };

  const handlePermanentDelete = (id: string) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Permanently Delete' : 'Supprimer définitivement',
      message: language === 'en'
        ? 'This will permanently delete this post. This action cannot be undone.'
        : 'Cela supprimera définitivement cet article. Cette action est irréversible.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await permanentlyDeleteBlogPost(token, id);
          loadTrash();
        } catch (err) {
          setError(language === 'en' ? 'Failed to delete post' : 'Échec de la suppression');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Empty Trash' : 'Vider la corbeille',
      message: language === 'en'
        ? `Permanently delete all ${trashPosts.length} items in trash? This cannot be undone.`
        : `Supprimer définitivement les ${trashPosts.length} éléments de la corbeille? Cette action est irréversible.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await emptyBlogTrash(token);
          loadTrash();
        } catch (err) {
          setError(language === 'en' ? 'Failed to empty trash' : 'Échec du vidage de la corbeille');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      },
    });
  };

  // ============================================
  // IMPORT HANDLERS
  // ============================================

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);

    if (jsonInputRef.current) {
      jsonInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      setError('Please provide JSON data to import');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      // Parse JSON
      let articles;
      try {
        const parsed = JSON.parse(importJson);
        // Support both single article and array
        articles = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        setError('Invalid JSON format');
        return;
      }

      const token = await getToken();
      if (!token) return;

      const result = await importBlogArticles(token, articles, {
        skipDuplicates: true,
        createMissingTaxonomies: true,
      });

      // If all successful with no errors, close modal automatically
      if (result.results.errors.length === 0 && result.results.imported > 0) {
        loadPosts();
        loadCategories();
        loadTags();
        closeImportModal();
        return;
      }

      // Otherwise show results
      setImportResult(result);

      if (result.results.imported > 0) {
        loadPosts();
        loadCategories();
        loadTags();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportJson('');
    setImportResult(null);
    setError(null);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // ============================================
  // TABS CONTENT
  // ============================================

  const tabs = [
    { id: 'posts' as TabType, label: language === 'en' ? 'Posts' : 'Articles', icon: FileText },
    { id: 'categories' as TabType, label: language === 'en' ? 'Categories' : 'Categories', icon: Folder },
    { id: 'tags' as TabType, label: language === 'en' ? 'Tags' : 'Tags', icon: Tag },
    { id: 'media' as TabType, label: language === 'en' ? 'Media' : 'Medias', icon: Image },
    { id: 'trash' as TabType, label: language === 'en' ? 'Trash' : 'Corbeille', icon: Trash, count: trashPosts.length },
  ];

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
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {'count' in tab && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300 mb-4">
          {error}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={postsSearch}
                onChange={(e) => setPostsSearch(e.target.value)}
                placeholder={language === 'en' ? 'Search posts...' : 'Rechercher...'}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <select
              value={postsStatus}
              onChange={(e) => setPostsStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200"
            >
              <option value="">{language === 'en' ? 'All Status' : 'Tous les statuts'}</option>
              <option value="DRAFT">{language === 'en' ? 'Draft' : 'Brouillon'}</option>
              <option value="PUBLISHED">{language === 'en' ? 'Published' : 'Publie'}</option>
              <option value="ARCHIVED">{language === 'en' ? 'Archived' : 'Archive'}</option>
            </select>
            <button
              onClick={() => setShowImportModal(true)}
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
          {postsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-500/20 bg-slate-800/50">
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Title' : 'Titre'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Status' : 'Statut'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Categories' : 'Categories'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Views' : 'Vues'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Updated' : 'Mis a jour'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Actions' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          {language === 'en' ? 'No posts yet. Create your first post!' : 'Aucun article. Creez votre premier article!'}
                        </td>
                      </tr>
                    ) : (
                      posts.map((post) => (
                        <tr key={post.id} className="border-b border-purple-500/10 hover:bg-slate-800/30">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {post.featured && <Star className="w-4 h-4 text-amber-400" />}
                              <div>
                                <p className="text-slate-200 font-medium">{language === 'en' ? post.titleEn : post.titleFr}</p>
                                <p className="text-slate-500 text-sm">{post.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{getStatusBadge(post.status)}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {post.categories.slice(0, 2).map((cat) => (
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
                          <td className="p-4 text-slate-400 text-sm">{new Date(post.updatedAt).toLocaleDateString()}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <a
                                href={post.status === 'PUBLISHED' ? `/blog/${post.slug}` : `/blog/preview/${post.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-2 rounded-lg ${
                                  post.status === 'PUBLISHED'
                                    ? 'text-slate-400 hover:text-green-400 hover:bg-green-500/20'
                                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/20'
                                }`}
                                title={post.status === 'PUBLISHED'
                                  ? (language === 'en' ? 'View' : 'Voir')
                                  : (language === 'en' ? 'Preview' : 'Apercu')}
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {postsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-slate-400 text-sm">
                {language === 'en'
                  ? `Showing ${posts.length} of ${postsPagination.total} posts`
                  : `Affichage de ${posts.length} sur ${postsPagination.total} articles`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPostsPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={postsPagination.page === 1}
                  className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-slate-300 px-4">{postsPagination.page} / {postsPagination.totalPages}</span>
                <button
                  onClick={() => setPostsPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                  disabled={postsPagination.page >= postsPagination.totalPages}
                  className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
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
              {categories.map((cat) => (
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
                      <h4 className="text-slate-200 font-medium">{language === 'en' ? cat.nameEn : cat.nameFr}</h4>
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
                      onClick={() => { setEditingCategory(cat); setIsNewCategory(false); }}
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
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
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
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-2 bg-slate-900/60 border border-purple-500/20 rounded-full px-4 py-2"
                >
                  <Tag className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-200">{language === 'en' ? tag.nameEn : tag.nameFr}</span>
                  <span className="text-slate-500 text-sm">({tag._count?.posts || 0})</span>
                  <div className="hidden group-hover:flex gap-1 ml-2">
                    <button
                      onClick={() => { setEditingTag(tag); setIsNewTag(false); }}
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
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div>
          <div className="flex justify-end mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {language === 'en' ? 'Upload Images' : 'Telecharger images'}
            </button>
          </div>

          {mediaLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-slate-900/60 rounded-lg border border-purple-500/20 overflow-hidden"
                >
                  <img
                    src={item.url}
                    alt={item.altText || item.originalName}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyToClipboard(item.url)}
                      className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30"
                      title={language === 'en' ? 'Copy URL' : 'Copier URL'}
                    >
                      {copiedUrl === item.url ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteMedia(item.id)}
                      className="p-2 bg-red-500/50 rounded-lg text-white hover:bg-red-500/70"
                      title={language === 'en' ? 'Delete' : 'Supprimer'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-slate-400 text-xs truncate">{item.originalName}</p>
                  </div>
                </div>
              ))}
              {media.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  {language === 'en' ? 'No images uploaded yet' : 'Aucune image telecharge'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trash Tab */}
      {activeTab === 'trash' && (
        <div>
          {trashPosts.length > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
              >
                <Trash2 className="w-4 h-4" />
                {language === 'en' ? 'Empty Trash' : 'Vider la corbeille'}
              </button>
            </div>
          )}

          {trashLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trashPosts.length === 0 ? (
            <div className="text-center py-20">
              <Trash className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl text-slate-400 mb-2">
                {language === 'en' ? 'Trash is empty' : 'La corbeille est vide'}
              </h3>
              <p className="text-slate-500">
                {language === 'en'
                  ? 'Deleted posts will appear here'
                  : 'Les articles supprimés apparaîtront ici'}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-500/20 bg-slate-800/50">
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Title' : 'Titre'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Original Slug' : 'Slug original'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Deleted' : 'Supprimé'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Actions' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashPosts.map((post) => (
                      <tr key={post.id} className="border-b border-purple-500/10 hover:bg-slate-800/30">
                        <td className="p-4">
                          <p className="text-slate-200 font-medium">{language === 'en' ? post.titleEn : post.titleFr}</p>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {post.originalSlug || post.slug.replace(/^_deleted_\d+_/, '')}
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {post.deletedAt ? new Date(post.deletedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestorePost(post.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 text-sm"
                              title={language === 'en' ? 'Restore' : 'Restaurer'}
                            >
                              <RotateCcw className="w-4 h-4" />
                              {language === 'en' ? 'Restore' : 'Restaurer'}
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(post.id)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                              title={language === 'en' ? 'Delete permanently' : 'Supprimer définitivement'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trash Pagination */}
          {trashPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-slate-400 text-sm">
                {language === 'en'
                  ? `Showing ${trashPosts.length} of ${trashPagination.total} items`
                  : `Affichage de ${trashPosts.length} sur ${trashPagination.total} éléments`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTrashPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={trashPagination.page === 1}
                  className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-slate-300 px-4">{trashPagination.page} / {trashPagination.totalPages}</span>
                <button
                  onClick={() => setTrashPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                  disabled={trashPagination.page >= trashPagination.totalPages}
                  className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
                  ? language === 'en' ? 'New Category' : 'Nouvelle categorie'
                  : language === 'en' ? 'Edit Category' : 'Modifier categorie'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm text-slate-400 mb-1">{language === 'en' ? 'Color' : 'Couleur'}</label>
                    <input
                      type="color"
                      value={editingCategory.color || '#8b5cf6'}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
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
                      onChange={(e) => {
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
                      onChange={(e) => setEditingCategory({ ...editingCategory, nameFr: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Description (EN)</label>
                    <textarea
                      value={editingCategory.descEn || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, descEn: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Description (FR)</label>
                    <textarea
                      value={editingCategory.descFr || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, descFr: e.target.value })}
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
                    {saving ? (language === 'en' ? 'Saving...' : 'Sauvegarde...') : (language === 'en' ? 'Save' : 'Enregistrer')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  ? language === 'en' ? 'New Tag' : 'Nouveau tag'
                  : language === 'en' ? 'Edit Tag' : 'Modifier tag'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={editingTag.slug}
                    onChange={(e) => setEditingTag({ ...editingTag, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Name (English)</label>
                    <input
                      type="text"
                      value={editingTag.nameEn}
                      onChange={(e) => {
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
                      onChange={(e) => setEditingTag({ ...editingTag, nameFr: e.target.value })}
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
                    {saving ? (language === 'en' ? 'Saving...' : 'Sauvegarde...') : (language === 'en' ? 'Save' : 'Enregistrer')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JSON Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeImportModal(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') closeImportModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading text-purple-200">
                  {language === 'en' ? 'Import Articles from JSON' : 'Importer articles depuis JSON'}
                </h3>
                <button onClick={closeImportModal} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={`mb-4 p-4 rounded-lg border ${
                  importResult.results.errors.length > 0
                    ? 'bg-amber-900/20 border-amber-500/30'
                    : 'bg-green-900/20 border-green-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.results.errors.length > 0 ? (
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <span className="font-medium text-slate-200">
                      {language === 'en' ? 'Import Complete' : 'Import terminé'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div className="text-center p-2 bg-slate-800/50 rounded">
                      <div className="text-2xl font-bold text-green-400">{importResult.results.imported}</div>
                      <div className="text-slate-400">{language === 'en' ? 'Imported' : 'Importés'}</div>
                    </div>
                    <div className="text-center p-2 bg-slate-800/50 rounded">
                      <div className="text-2xl font-bold text-amber-400">{importResult.results.skipped}</div>
                      <div className="text-slate-400">{language === 'en' ? 'Skipped' : 'Ignorés'}</div>
                    </div>
                    <div className="text-center p-2 bg-slate-800/50 rounded">
                      <div className="text-2xl font-bold text-red-400">{importResult.results.errors.length}</div>
                      <div className="text-slate-400">{language === 'en' ? 'Errors' : 'Erreurs'}</div>
                    </div>
                  </div>
                  {importResult.results.skippedSlugs && importResult.results.skippedSlugs.length > 0 && (
                    <p className="text-sm text-amber-400 mb-2">
                      {language === 'en' ? 'Skipped (already exist):' : 'Ignorés (existent déjà):'}{' '}
                      <span className="text-slate-300">{importResult.results.skippedSlugs.join(', ')}</span>
                    </p>
                  )}
                  {importResult.results.createdCategories.length > 0 && (
                    <p className="text-sm text-slate-400">
                      {language === 'en' ? 'Created categories:' : 'Catégories créées:'}{' '}
                      <span className="text-purple-400">{importResult.results.createdCategories.join(', ')}</span>
                    </p>
                  )}
                  {importResult.results.createdTags.length > 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      {language === 'en' ? 'Created tags:' : 'Tags créés:'}{' '}
                      <span className="text-purple-400">{importResult.results.createdTags.join(', ')}</span>
                    </p>
                  )}
                  {importResult.results.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-red-400 font-medium mb-1">
                        {language === 'en' ? 'Errors:' : 'Erreurs:'}
                      </p>
                      <ul className="text-sm text-slate-400 space-y-1">
                        {importResult.results.errors.map((err, i) => (
                          <li key={i}>
                            <span className="text-slate-500">{err.slug}:</span> {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!importResult && (
                <>
                  {/* File upload */}
                  <div className="mb-4">
                    <input
                      ref={jsonInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                    <button
                      onClick={() => jsonInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-purple-500/30 rounded-lg text-slate-400 hover:text-purple-300 hover:border-purple-500/50 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      {language === 'en' ? 'Upload JSON file' : 'Télécharger fichier JSON'}
                    </button>
                  </div>

                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-slate-900 text-slate-500">
                        {language === 'en' ? 'or paste JSON' : 'ou coller JSON'}
                      </span>
                    </div>
                  </div>

                  {/* JSON input */}
                  <div className="mb-4">
                    <textarea
                      ref={jsonTextareaRef}
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder={`{
  "title": "Article Title",
  "slug": "article-slug",
  "excerpt": "Short description",
  "content": "<p>HTML content...</p>",
  "author": "Author Name",
  "read_time": "5 min",
  "categories": ["Category Name"],
  "tags": ["Tag1", "Tag2"],
  "seo_meta": {
    "meta_title": "SEO Title",
    "meta_description": "SEO Description"
  }
}`}
                      rows={12}
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 font-mono text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <p className="text-xs text-slate-500 mb-4">
                    {language === 'en'
                      ? 'Import single article or array of articles. Posts will be created as drafts. Missing categories/tags will be auto-created.'
                      : 'Importez un article ou un tableau d\'articles. Les articles seront créés comme brouillons. Les catégories/tags manquants seront créés automatiquement.'}
                  </p>
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeImportModal}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                >
                  {importResult
                    ? (language === 'en' ? 'Close' : 'Fermer')
                    : (language === 'en' ? 'Cancel' : 'Annuler')}
                </button>
                {!importResult && (
                  <button
                    onClick={handleImport}
                    disabled={importing || !importJson.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {language === 'en' ? 'Importing...' : 'Import en cours...'}
                      </>
                    ) : (
                      <>
                        <FileJson className="w-4 h-4" />
                        {language === 'en' ? 'Import' : 'Importer'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} }); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                {confirmModal.isDangerous ? (
                  <div className="p-2 bg-red-500/20 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-amber-500/20 rounded-full">
                    <Trash2 className="w-6 h-6 text-amber-400" />
                  </div>
                )}
                <h3 className="text-lg font-heading text-purple-200">
                  {confirmModal.title}
                </h3>
              </div>
              <p className="text-slate-400 mb-6">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
                  className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-2 text-white rounded-lg ${
                    confirmModal.isDangerous
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  {language === 'en' ? 'Confirm' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBlog;
