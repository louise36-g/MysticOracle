import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminTarotArticle,
  updateTarotArticle,
  fetchTarotCategories,
  fetchTarotTags,
  TarotArticle,
  TarotCategory,
  TarotTag,
  // Use blog media system - it already works!
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  BlogMedia,
} from '../../services/apiService';
import {
  ArrowLeft,
  Save,
  Eye,
  ExternalLink,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Upload,
  HelpCircle,
  Link as LinkIcon,
  Tag,
  Folder,
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import TarotFAQManager, { FAQItem } from './TarotFAQManager';

// SidebarSection component - defined OUTSIDE to prevent re-renders losing focus
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

interface TarotArticleEditorProps {
  articleId: string;
  onSave: () => void;
  onCancel: () => void;
}

const TarotArticleEditor: React.FC<TarotArticleEditorProps> = ({
  articleId,
  onSave,
  onCancel,
}) => {
  const { language } = useApp();
  const { getToken } = useAuth();

  const [article, setArticle] = useState<TarotArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sidebar data
  const [categories, setCategories] = useState<TarotCategory[]>([]);
  const [tags, setTags] = useState<TarotTag[]>([]);
  const [media, setMedia] = useState<BlogMedia[]>([]); // Use shared blog media

  // Collapsible sections
  const [showCoverImage, setShowCoverImage] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showFAQ, setShowFAQ] = useState(true);
  const [showRelated, setShowRelated] = useState(false);

  useEffect(() => {
    loadArticle();
    loadSidebarData();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const data = await fetchAdminTarotArticle(token, articleId);
      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const loadSidebarData = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [catResult, tagResult, mediaResult] = await Promise.all([
        fetchTarotCategories(token),
        fetchTarotTags(token),
        fetchAdminBlogMedia(token), // Use shared blog media system
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
      const result = await fetchAdminBlogMedia(token); // Use shared blog media system
      setMedia(result.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!article) return;

    try {
      setSaving(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const updateData = {
        ...article,
        status: publish ? 'PUBLISHED' : article.status,
        _visualEditorMode: true, // Flag to skip strict validation on backend
      };

      await updateTarotArticle(token, article.id, updateData);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = () => {
    if (!article) return;
    setArticle(prev => {
      if (!prev) return prev;
      const newStatus = prev.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      return { ...prev, status: newStatus };
    });
  };

  const handleMediaUpload = async (file: File): Promise<string> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    const result = await uploadBlogMedia(token, file); // Use shared blog media system
    await loadMedia();
    return result.media.url;
  };

  const handleMediaDelete = async (id: string): Promise<void> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    await deleteBlogMedia(token, id); // Use shared blog media system
    await loadMedia();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!article) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const url = await handleMediaUpload(file);
      const altText = file.name.replace(/\.[^/.]+$/, '');
      setArticle(prev => prev ? { ...prev, featuredImage: url, featuredImageAlt: altText } : prev);
    } catch (err) {
      setError('Failed to upload cover image');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-red-400">Article not found</p>
      </div>
    );
  }

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
              <span className="hidden sm:inline">{language === 'en' ? 'Back' : 'Retour'}</span>
            </button>
            <div className="h-6 w-px bg-slate-700" />
            <h1 className="text-lg font-heading text-purple-200 truncate max-w-md">
              {article.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Preview button */}
            <a
              href={article.status === 'PUBLISHED'
                ? `/tarot/articles/${article.slug}`
                : `/admin/tarot/preview/${article.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
            >
              {article.status === 'PUBLISHED' ? <ExternalLink className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {article.status === 'PUBLISHED' ? (language === 'en' ? 'View' : 'Voir') : (language === 'en' ? 'Preview' : 'Aperçu')}
              </span>
            </a>

            {/* Save button */}
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {language === 'en' ? 'Save' : 'Enregistrer'}
            </button>

            {/* Publish/Unpublish toggle */}
            <button
              onClick={handleTogglePublish}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                article.status === 'PUBLISHED'
                  ? 'bg-slate-600 hover:bg-slate-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {article.status === 'PUBLISHED'
                ? (language === 'en' ? 'Unpublish' : 'Dépublier')
                : (language === 'en' ? 'Publish' : 'Publier')}
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
            <label className="block text-sm text-slate-400 mb-2">{language === 'en' ? 'Title' : 'Titre'}</label>
            <input
              type="text"
              value={article.title}
              onChange={(e) => setArticle(prev => prev ? { ...prev, title: e.target.value } : prev)}
              className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 text-xl font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">{language === 'en' ? 'Excerpt' : 'Extrait'}</label>
            <textarea
              value={article.excerpt}
              onChange={(e) => setArticle(prev => prev ? { ...prev, excerpt: e.target.value } : prev)}
              rows={2}
              className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">{language === 'en' ? 'Content' : 'Contenu'}</label>
            <RichTextEditor
              content={article.content}
              onChange={(html) => setArticle(prev => prev ? { ...prev, content: html } : prev)}
              placeholder="Write your article content..."
              mediaLibrary={media}
              onMediaUpload={handleMediaUpload}
              onMediaDelete={handleMediaDelete}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 border-l border-slate-800 bg-slate-900/50">
          <div className="sticky top-[57px] max-h-[calc(100vh-57px)] overflow-y-auto">
            {/* Featured Image */}
            <SidebarSection
              title={language === 'en' ? 'Featured Image' : 'Image principale'}
              icon={<ImageIcon className="w-4 h-4" />}
              isOpen={showCoverImage}
              onToggle={() => setShowCoverImage(!showCoverImage)}
            >
              <div className="space-y-3">
                {article.featuredImage && (
                  <img
                    src={article.featuredImage}
                    alt={article.featuredImageAlt || 'Cover'}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm rounded-lg"
                >
                  {uploadingCover ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                  {language === 'en' ? 'Upload' : 'Télécharger'}
                </button>
                <input
                  type="text"
                  value={article.featuredImage}
                  onChange={(e) => setArticle(prev => prev ? { ...prev, featuredImage: e.target.value } : prev)}
                  placeholder="Image URL"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                />
                <input
                  type="text"
                  value={article.featuredImageAlt}
                  onChange={(e) => setArticle(prev => prev ? { ...prev, featuredImageAlt: e.target.value } : prev)}
                  placeholder="Alt text"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200"
                />
              </div>
            </SidebarSection>

            {/* Categories */}
            <SidebarSection
              title={language === 'en' ? 'Categories' : 'Catégories'}
              icon={<Folder className="w-4 h-4" />}
              isOpen={showCategories}
              onToggle={() => setShowCategories(!showCategories)}
            >
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setArticle(prev => {
                        if (!prev) return prev;
                        const current = prev.categories || [];
                        const updated = current.includes(cat.name)
                          ? current.filter((c) => c !== cat.name)
                          : [...current, cat.name];
                        return { ...prev, categories: updated };
                      });
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      (article.categories || []).includes(cat.name)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
                {categories.length === 0 && <p className="text-xs text-slate-500">No categories</p>}
              </div>
            </SidebarSection>

            {/* Tags */}
            <SidebarSection
              title="Tags"
              icon={<Tag className="w-4 h-4" />}
              isOpen={showTags}
              onToggle={() => setShowTags(!showTags)}
            >
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setArticle(prev => {
                        if (!prev) return prev;
                        const current = prev.tags || [];
                        const updated = current.includes(tag.name)
                          ? current.filter((t) => t !== tag.name)
                          : [...current, tag.name];
                        return { ...prev, tags: updated };
                      });
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      (article.tags || []).includes(tag.name)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && <p className="text-xs text-slate-500">No tags</p>}
              </div>
            </SidebarSection>

            {/* FAQ */}
            <SidebarSection
              title="FAQ"
              icon={<HelpCircle className="w-4 h-4" />}
              isOpen={showFAQ}
              onToggle={() => setShowFAQ(!showFAQ)}
            >
              <TarotFAQManager
                faq={(article.faq as FAQItem[]) || []}
                onChange={(faq) => setArticle(prev => prev ? { ...prev, faq } : prev)}
              />
            </SidebarSection>

            {/* Related Cards */}
            <SidebarSection
              title={language === 'en' ? 'Related Cards' : 'Cartes liées'}
              icon={<LinkIcon className="w-4 h-4" />}
              isOpen={showRelated}
              onToggle={() => setShowRelated(!showRelated)}
            >
              <textarea
                value={(article.relatedCards || []).join('\n')}
                onChange={(e) => setArticle(prev => prev ? {
                  ...prev,
                  relatedCards: e.target.value.split('\n').filter(Boolean),
                } : prev)}
                placeholder={language === 'en' ? 'One slug per line...' : 'Un slug par ligne...'}
                rows={4}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 resize-none"
              />
            </SidebarSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarotArticleEditor;
