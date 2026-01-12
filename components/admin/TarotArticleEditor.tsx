import React, { useState, useEffect } from 'react';
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
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  BlogMedia,
} from '../../services/apiService';
import { Image as ImageIcon, HelpCircle, Link as LinkIcon, Tag, Folder } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import TarotFAQManager, { FAQItem } from './TarotFAQManager';
import {
  EditorTopBar,
  EditorLayout,
  SidebarSection,
  CoverImageSection,
  TaxonomySelector,
  EditorField,
  TitleInput,
  ExcerptInput,
  SidebarTextArea,
} from './editor';

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

  // Sidebar data
  const [categories, setCategories] = useState<TarotCategory[]>([]);
  const [tags, setTags] = useState<TarotTag[]>([]);
  const [media, setMedia] = useState<BlogMedia[]>([]);

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

  const handleSave = async (publish: boolean = false, overrideStatus?: 'DRAFT' | 'PUBLISHED') => {
    if (!article) return;

    try {
      setSaving(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('No token');

      const status = overrideStatus ?? (publish ? 'PUBLISHED' : article.status);

      const updateData = {
        ...article,
        status,
        _visualEditorMode: true,
      };

      await updateTarotArticle(token, article.id, updateData);
      setArticle(prev => prev ? { ...prev, status } : prev);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = () => {
    if (!article) return;
    const newStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    handleSave(false, newStatus);
  };

  const handleMediaUpload = async (file: File): Promise<string> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    const result = await uploadBlogMedia(token, file, undefined, undefined, 'tarot');
    await loadMedia();
    return result.media.url;
  };

  const handleMediaDelete = async (id: string): Promise<void> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    await deleteBlogMedia(token, id);
    await loadMedia();
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

  const previewUrl = article.status === 'PUBLISHED'
    ? `/tarot/articles/${article.slug}`
    : `/admin/tarot/preview/${article.id}`;

  const topBar = (
    <EditorTopBar
      title={article.title}
      onBack={onCancel}
      onSave={() => handleSave(false)}
      saving={saving}
      language={language}
      previewUrl={previewUrl}
      isPublished={article.status === 'PUBLISHED'}
      showPublish
      onPublish={handleTogglePublish}
    />
  );

  const mainContent = (
    <>
      <EditorField label={language === 'en' ? 'Title' : 'Titre'}>
        <TitleInput
          value={article.title}
          onChange={(value) => setArticle(prev => prev ? { ...prev, title: value } : prev)}
        />
      </EditorField>

      <EditorField label={language === 'en' ? 'Excerpt' : 'Extrait'}>
        <ExcerptInput
          value={article.excerpt}
          onChange={(value) => setArticle(prev => prev ? { ...prev, excerpt: value } : prev)}
        />
      </EditorField>

      <EditorField label={language === 'en' ? 'Content' : 'Contenu'}>
        <RichTextEditor
          content={article.content}
          onChange={(html) => setArticle(prev => prev ? { ...prev, content: html } : prev)}
          placeholder="Write your article content..."
          mediaLibrary={media}
          onMediaUpload={handleMediaUpload}
          onMediaDelete={handleMediaDelete}
        />
      </EditorField>
    </>
  );

  const sidebar = (
    <>
      <SidebarSection
        title={language === 'en' ? 'Featured Image' : 'Image principale'}
        icon={<ImageIcon className="w-4 h-4" />}
        isOpen={showCoverImage}
        onToggle={() => setShowCoverImage(!showCoverImage)}
      >
        <CoverImageSection
          imageUrl={article.featuredImage}
          imageAlt={article.featuredImageAlt}
          onImageChange={(url, alt) => setArticle(prev => prev ? {
            ...prev,
            featuredImage: url,
            featuredImageAlt: alt || prev.featuredImageAlt,
          } : prev)}
          mediaLibrary={media}
          onMediaUpload={handleMediaUpload}
          onMediaDelete={handleMediaDelete}
          language={language}
        />
      </SidebarSection>

      <SidebarSection
        title={language === 'en' ? 'Categories' : 'Catégories'}
        icon={<Folder className="w-4 h-4" />}
        isOpen={showCategories}
        onToggle={() => setShowCategories(!showCategories)}
      >
        <TaxonomySelector
          items={categories.map(c => ({ id: c.id, name: c.name }))}
          selectedNames={article.categories || []}
          onChange={() => {}}
          onChangeNames={(names) => setArticle(prev => prev ? { ...prev, categories: names } : prev)}
          useNames
          language={language}
          emptyMessage={language === 'en' ? 'No categories' : 'Aucune catégorie'}
        />
      </SidebarSection>

      <SidebarSection
        title="Tags"
        icon={<Tag className="w-4 h-4" />}
        isOpen={showTags}
        onToggle={() => setShowTags(!showTags)}
      >
        <TaxonomySelector
          items={tags.map(t => ({ id: t.id, name: t.name }))}
          selectedNames={article.tags || []}
          onChange={() => {}}
          onChangeNames={(names) => setArticle(prev => prev ? { ...prev, tags: names } : prev)}
          useNames
          language={language}
          emptyMessage={language === 'en' ? 'No tags' : 'Aucun tag'}
        />
      </SidebarSection>

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

      <SidebarSection
        title={language === 'en' ? 'Related Cards' : 'Cartes liées'}
        icon={<LinkIcon className="w-4 h-4" />}
        isOpen={showRelated}
        onToggle={() => setShowRelated(!showRelated)}
      >
        <SidebarTextArea
          value={(article.relatedCards || []).join('\n')}
          onChange={(value) => setArticle(prev => prev ? {
            ...prev,
            relatedCards: value.split('\n').filter(Boolean),
          } : prev)}
          placeholder={language === 'en' ? 'One slug per line...' : 'Un slug par ligne...'}
          rows={4}
        />
      </SidebarSection>
    </>
  );

  return (
    <EditorLayout
      topBar={topBar}
      mainContent={mainContent}
      sidebar={sidebar}
      error={error}
    />
  );
};

export default TarotArticleEditor;
