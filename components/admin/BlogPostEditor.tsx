import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminBlogCategories,
  fetchAdminBlogTags,
  fetchAdminBlogMedia,
  uploadBlogMedia,
  createBlogPost,
  updateBlogPost,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
  CreateBlogPostData,
} from '../../services/apiService';
import {
  ArrowLeft,
  Save,
  Eye,
  Star,
  StarOff,
  Settings,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code,
} from 'lucide-react';
import { motion } from 'framer-motion';
import RichTextEditor from './RichTextEditor';
import MarkdownEditor from './MarkdownEditor';

interface BlogPostEditorProps {
  post: BlogPost;
  isNew: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({
  post: initialPost,
  isNew,
  onSave,
  onCancel,
}) => {
  const { language } = useApp();
  const { getToken } = useAuth();

  const [post, setPost] = useState<BlogPost>(initialPost);
  const [editLanguage, setEditLanguage] = useState<string>('en');
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('markdown');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sidebar data
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [media, setMedia] = useState<BlogMedia[]>([]);

  // Collapsible sections
  const [showSettings, setShowSettings] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showSEO, setShowSEO] = useState(false);
  const [showCoverImage, setShowCoverImage] = useState(true);

  useEffect(() => {
    loadSidebarData();
  }, []);

  const loadSidebarData = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [catResult, tagResult, mediaResult] = await Promise.all([
        fetchAdminBlogCategories(token),
        fetchAdminBlogTags(token),
        fetchAdminBlogMedia(token),
      ]);

      setCategories(catResult.categories);
      setTags(tagResult.tags);
      setMedia(mediaResult.media);
    } catch (err) {
      console.error('Failed to load sidebar data:', err);
    }
  };

  const loadMedia = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const result = await fetchAdminBlogMedia(token);
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    }
  };

  const handleSave = async () => {
    if (!post.slug || !post.titleEn || !post.authorName) {
      setError('Please fill in required fields: Slug, Title (EN), and Author Name');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const postData: CreateBlogPostData = {
        slug: post.slug,
        titleEn: post.titleEn,
        titleFr: post.titleFr || '',
        excerptEn: post.excerptEn || '',
        excerptFr: post.excerptFr || '',
        contentEn: post.contentEn || '',
        contentFr: post.contentFr || '',
        coverImage: post.coverImage,
        coverImageAlt: post.coverImageAlt,
        metaTitleEn: post.metaTitleEn,
        metaTitleFr: post.metaTitleFr,
        metaDescEn: post.metaDescEn,
        metaDescFr: post.metaDescFr,
        ogImage: post.ogImage,
        authorName: post.authorName,
        status: post.status,
        featured: post.featured,
        readTimeMinutes: post.readTimeMinutes,
        categoryIds: post.categoryIds || [],
        tagIds: post.tagIds || [],
      };

      if (isNew) {
        await createBlogPost(token, postData);
      } else {
        await updateBlogPost(token, post.id, postData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleMediaUpload = async (file: File): Promise<string> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    const result = await uploadBlogMedia(token, file);
    await loadMedia();
    return result.media.url;
  };

  const SidebarSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }> = ({ title, icon, isOpen, onToggle, children }) => (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-300">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-purple-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{language === 'en' ? 'Back to Posts' : 'Retour aux articles'}</span>
            </button>
            <div className="h-6 w-px bg-slate-700" />
            <h1 className="text-lg font-heading text-purple-200">
              {isNew
                ? language === 'en' ? 'New Post' : 'Nouvel article'
                : language === 'en' ? 'Edit Post' : 'Modifier article'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {AVAILABLE_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setEditLanguage(lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    editLanguage === lang.code
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.name}</span>
                </button>
              ))}
            </div>

            {/* Preview button */}
            {!isNew && post.status === 'PUBLISHED' && (
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'View' : 'Voir'}</span>
              </a>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {language === 'en' ? 'Save' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Editor Area */}
        <div className="flex-1 p-4 lg:p-6 max-w-4xl">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">
              {AVAILABLE_LANGUAGES.find(l => l.code === editLanguage)?.flag} {language === 'en' ? 'Title' : 'Titre'}
            </label>
            {editLanguage === 'en' ? (
              <input
                type="text"
                value={post.titleEn}
                onChange={(e) => {
                  const title = e.target.value;
                  setPost({
                    ...post,
                    titleEn: title,
                    slug: post.slug || generateSlug(title),
                  });
                }}
                placeholder="Enter your post title..."
                className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 text-xl font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            ) : (
              <input
                type="text"
                value={post.titleFr}
                onChange={(e) => setPost({ ...post, titleFr: e.target.value })}
                placeholder="Entrez le titre de votre article..."
                className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 text-xl font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            )}
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">
              {AVAILABLE_LANGUAGES.find(l => l.code === editLanguage)?.flag} {language === 'en' ? 'Excerpt' : 'Extrait'}
            </label>
            {editLanguage === 'en' ? (
              <textarea
                value={post.excerptEn}
                onChange={(e) => setPost({ ...post, excerptEn: e.target.value })}
                rows={2}
                placeholder="Brief summary for listings and SEO..."
                className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
              />
            ) : (
              <textarea
                value={post.excerptFr}
                onChange={(e) => setPost({ ...post, excerptFr: e.target.value })}
                rows={2}
                placeholder="Bref résumé pour les listes et le SEO..."
                className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
              />
            )}
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-400">
                {AVAILABLE_LANGUAGES.find(l => l.code === editLanguage)?.flag} {language === 'en' ? 'Content' : 'Contenu'}
              </label>
              {/* Editor Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setEditorMode('markdown')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                    editorMode === 'markdown'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Markdown editor"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Markdown</span>
                </button>
                <button
                  onClick={() => setEditorMode('visual')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                    editorMode === 'visual'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Visual editor"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Visual</span>
                </button>
              </div>
            </div>
            {editorMode === 'markdown' ? (
              editLanguage === 'en' ? (
                <MarkdownEditor
                  content={post.contentEn}
                  onChange={(html) => setPost({ ...post, contentEn: html })}
                  placeholder="Write your post in Markdown..."
                  mediaLibrary={media}
                  onMediaUpload={handleMediaUpload}
                />
              ) : (
                <MarkdownEditor
                  content={post.contentFr}
                  onChange={(html) => setPost({ ...post, contentFr: html })}
                  placeholder="Écrivez votre article en Markdown..."
                  mediaLibrary={media}
                  onMediaUpload={handleMediaUpload}
                />
              )
            ) : (
              editLanguage === 'en' ? (
                <RichTextEditor
                  content={post.contentEn}
                  onChange={(html) => setPost({ ...post, contentEn: html })}
                  placeholder="Start writing your post..."
                  mediaLibrary={media}
                  onMediaUpload={handleMediaUpload}
                />
              ) : (
                <RichTextEditor
                  content={post.contentFr}
                  onChange={(html) => setPost({ ...post, contentFr: html })}
                  placeholder="Commencez à écrire votre article..."
                  mediaLibrary={media}
                  onMediaUpload={handleMediaUpload}
                />
              )
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 border-l border-slate-800 bg-slate-900/50">
          <div className="sticky top-[57px] max-h-[calc(100vh-57px)] overflow-y-auto">
            {/* Settings */}
            <SidebarSection
              title={language === 'en' ? 'Settings' : 'Paramètres'}
              icon={<Settings className="w-4 h-4" />}
              isOpen={showSettings}
              onToggle={() => setShowSettings(!showSettings)}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={post.slug}
                    onChange={(e) => setPost({ ...post, slug: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{language === 'en' ? 'Status' : 'Statut'}</label>
                  <select
                    value={post.status}
                    onChange={(e) => setPost({ ...post, status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                  >
                    <option value="DRAFT">{language === 'en' ? 'Draft' : 'Brouillon'}</option>
                    <option value="PUBLISHED">{language === 'en' ? 'Published' : 'Publié'}</option>
                    <option value="ARCHIVED">{language === 'en' ? 'Archived' : 'Archivé'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{language === 'en' ? 'Author' : 'Auteur'}</label>
                  <input
                    type="text"
                    value={post.authorName}
                    onChange={(e) => setPost({ ...post, authorName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-500">{language === 'en' ? 'Featured' : 'À la une'}</label>
                  <button
                    onClick={() => setPost({ ...post, featured: !post.featured })}
                    className={`p-1.5 rounded ${post.featured ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}
                  >
                    {post.featured ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{language === 'en' ? 'Read time (min)' : 'Temps lecture (min)'}</label>
                  <input
                    type="number"
                    value={post.readTimeMinutes}
                    onChange={(e) => setPost({ ...post, readTimeMinutes: parseInt(e.target.value) || 5 })}
                    min={1}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                  />
                </div>
              </div>
            </SidebarSection>

            {/* Cover Image */}
            <SidebarSection
              title={language === 'en' ? 'Cover Image' : 'Image couverture'}
              icon={<ImageIcon className="w-4 h-4" />}
              isOpen={showCoverImage}
              onToggle={() => setShowCoverImage(!showCoverImage)}
            >
              <div className="space-y-3">
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.coverImageAlt || 'Cover'}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">URL</label>
                  <input
                    type="text"
                    value={post.coverImage || ''}
                    onChange={(e) => setPost({ ...post, coverImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                  />
                </div>
                {media.length > 0 && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{language === 'en' ? 'Or select' : 'Ou sélectionner'}</label>
                    <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto">
                      {media.slice(0, 12).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setPost({ ...post, coverImage: item.url, coverImageAlt: item.originalName })}
                          className={`aspect-square rounded overflow-hidden border-2 ${
                            post.coverImage === item.url ? 'border-purple-500' : 'border-transparent'
                          }`}
                        >
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Alt text</label>
                  <input
                    type="text"
                    value={post.coverImageAlt || ''}
                    onChange={(e) => setPost({ ...post, coverImageAlt: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                  />
                </div>
              </div>
            </SidebarSection>

            {/* Categories */}
            <SidebarSection
              title={language === 'en' ? 'Categories' : 'Catégories'}
              icon={<FileText className="w-4 h-4" />}
              isOpen={showCategories}
              onToggle={() => setShowCategories(!showCategories)}
            >
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const ids = post.categoryIds || [];
                      setPost({
                        ...post,
                        categoryIds: ids.includes(cat.id)
                          ? ids.filter((id) => id !== cat.id)
                          : [...ids, cat.id],
                      });
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      (post.categoryIds || []).includes(cat.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {language === 'en' ? cat.nameEn : cat.nameFr}
                  </button>
                ))}
                {categories.length === 0 && (
                  <p className="text-xs text-slate-500">{language === 'en' ? 'No categories yet' : 'Aucune catégorie'}</p>
                )}
              </div>
            </SidebarSection>

            {/* Tags */}
            <SidebarSection
              title="Tags"
              icon={<FileText className="w-4 h-4" />}
              isOpen={showTags}
              onToggle={() => setShowTags(!showTags)}
            >
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      const ids = post.tagIds || [];
                      setPost({
                        ...post,
                        tagIds: ids.includes(tag.id)
                          ? ids.filter((id) => id !== tag.id)
                          : [...ids, tag.id],
                      });
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      (post.tagIds || []).includes(tag.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {language === 'en' ? tag.nameEn : tag.nameFr}
                  </button>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-slate-500">{language === 'en' ? 'No tags yet' : 'Aucun tag'}</p>
                )}
              </div>
            </SidebarSection>

            {/* SEO */}
            <SidebarSection
              title="SEO"
              icon={<Eye className="w-4 h-4" />}
              isOpen={showSEO}
              onToggle={() => setShowSEO(!showSEO)}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Meta Title ({editLanguage.toUpperCase()})</label>
                  {editLanguage === 'en' ? (
                    <input
                      type="text"
                      value={post.metaTitleEn || ''}
                      onChange={(e) => setPost({ ...post, metaTitleEn: e.target.value })}
                      placeholder={post.titleEn}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                    />
                  ) : (
                    <input
                      type="text"
                      value={post.metaTitleFr || ''}
                      onChange={(e) => setPost({ ...post, metaTitleFr: e.target.value })}
                      placeholder={post.titleFr}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Meta Description ({editLanguage.toUpperCase()})</label>
                  {editLanguage === 'en' ? (
                    <textarea
                      value={post.metaDescEn || ''}
                      onChange={(e) => setPost({ ...post, metaDescEn: e.target.value })}
                      placeholder={post.excerptEn}
                      rows={2}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 resize-none"
                    />
                  ) : (
                    <textarea
                      value={post.metaDescFr || ''}
                      onChange={(e) => setPost({ ...post, metaDescFr: e.target.value })}
                      placeholder={post.excerptFr}
                      rows={2}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 resize-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">OG Image URL</label>
                  <input
                    type="text"
                    value={post.ogImage || ''}
                    onChange={(e) => setPost({ ...post, ogImage: e.target.value })}
                    placeholder={post.coverImage || 'https://...'}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                  />
                </div>
              </div>
            </SidebarSection>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {/* Could implement mobile sidebar */}}
          className="p-4 bg-purple-600 text-white rounded-full shadow-lg"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BlogPostEditor;
