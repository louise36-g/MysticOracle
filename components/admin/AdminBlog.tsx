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
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BlogPostEditor from './BlogPostEditor';

type TabType = 'posts' | 'categories' | 'tags' | 'media';

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

  // General
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (activeTab === 'posts') loadPosts();
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'tags') loadTags();
    if (activeTab === 'media') loadMedia();
  }, [activeTab, loadPosts, loadCategories, loadTags, loadMedia]);

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

  const handleDeletePost = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this post?' : 'Supprimer cet article?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      await deleteBlogPost(token, id);
      loadPosts();
    } catch (err) {
      alert('Failed to delete post');
    }
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

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this category?' : 'Supprimer cette categorie?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      await deleteBlogCategory(token, id);
      loadCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
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

  const handleDeleteTag = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this tag?' : 'Supprimer ce tag?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      await deleteBlogTag(token, id);
      loadTags();
    } catch (err) {
      alert('Failed to delete tag');
    }
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

  const handleDeleteMedia = async (id: string) => {
    if (!confirm(language === 'en' ? 'Delete this image?' : 'Supprimer cette image?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      await deleteBlogMedia(token, id);
      loadMedia();
    } catch (err) {
      alert('Failed to delete media');
    }
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
                              {post.status === 'PUBLISHED' && (
                                <a
                                  href={`/blog/${post.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg"
                                  title={language === 'en' ? 'View' : 'Voir'}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
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
    </div>
  );
};

export default AdminBlog;
