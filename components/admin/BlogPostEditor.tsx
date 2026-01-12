import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminBlogCategories,
  fetchAdminBlogTags,
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  createBlogPost,
  updateBlogPost,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
  CreateBlogPostData,
} from '../../services/apiService';
import {
  Settings,
  FileText,
  Image as ImageIcon,
  Eye,
  Star,
  StarOff,
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MarkdownEditor from './MarkdownEditor';
import {
  EditorTopBar,
  EditorLayout,
  SidebarSection,
  CoverImageSection,
  TaxonomySelector,
  EditorField,
  TitleInput,
  ExcerptInput,
  SidebarInput,
  SidebarSelect,
  SidebarLabel,
  SidebarTextArea,
  AVAILABLE_LANGUAGES,
} from './editor';

interface BlogPostEditorProps {
  post: BlogPost;
  isNew: boolean;
  onSave: () => void;
  onCancel: () => void;
}

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
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');
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

  const handleSave = async (publish: boolean = false) => {
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
        status: publish ? 'PUBLISHED' : post.status,
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

  const handleMediaDelete = async (id: string): Promise<void> => {
    const token = await getToken();
    if (!token) throw new Error('No token');
    await deleteBlogMedia(token, id);
    await loadMedia();
  };

  const handleTitleChange = (value: string) => {
    if (editLanguage === 'en') {
      setPost({
        ...post,
        titleEn: value,
        slug: post.slug || generateSlug(value),
      });
    } else {
      setPost({ ...post, titleFr: value });
    }
  };

  const previewUrl = !isNew
    ? (post.status === 'PUBLISHED' ? `/blog/${post.slug}` : `/blog/preview/${post.id}`)
    : undefined;

  const currentLangFlag = AVAILABLE_LANGUAGES.find(l => l.code === editLanguage)?.flag;

  const topBar = (
    <EditorTopBar
      title={isNew
        ? (language === 'en' ? 'New Post' : 'Nouvel article')
        : (language === 'en' ? 'Edit Post' : 'Modifier article')}
      isNew={isNew}
      onBack={onCancel}
      onSave={() => handleSave(false)}
      saving={saving}
      language={language}
      editLanguage={editLanguage}
      onEditLanguageChange={setEditLanguage}
      editorMode={editorMode}
      onEditorModeChange={setEditorMode}
      previewUrl={previewUrl}
      isPublished={post.status === 'PUBLISHED'}
      showPublish={post.status !== 'PUBLISHED'}
      onPublish={() => handleSave(true)}
    />
  );

  const mainContent = (
    <>
      {/* Title */}
      <EditorField
        label={language === 'en' ? 'Title' : 'Titre'}
        languageFlag={currentLangFlag}
      >
        <TitleInput
          value={editLanguage === 'en' ? post.titleEn : (post.titleFr || '')}
          onChange={handleTitleChange}
          placeholder={editLanguage === 'en' ? 'Enter your post title...' : 'Entrez le titre de votre article...'}
        />
      </EditorField>

      {/* Excerpt */}
      <EditorField
        label={language === 'en' ? 'Excerpt' : 'Extrait'}
        languageFlag={currentLangFlag}
      >
        <ExcerptInput
          value={editLanguage === 'en' ? (post.excerptEn || '') : (post.excerptFr || '')}
          onChange={(value) => setPost({
            ...post,
            ...(editLanguage === 'en' ? { excerptEn: value } : { excerptFr: value }),
          })}
          placeholder={editLanguage === 'en' ? 'Brief summary for listings and SEO...' : 'Bref résumé pour les listes et le SEO...'}
        />
      </EditorField>

      {/* Content */}
      <EditorField
        label={language === 'en' ? 'Content' : 'Contenu'}
        languageFlag={currentLangFlag}
      >
        {editorMode === 'markdown' ? (
          <MarkdownEditor
            content={editLanguage === 'en' ? (post.contentEn || '') : (post.contentFr || '')}
            onChange={(html) => setPost({
              ...post,
              ...(editLanguage === 'en' ? { contentEn: html } : { contentFr: html }),
            })}
            placeholder={editLanguage === 'en' ? 'Write your post in Markdown...' : 'Écrivez votre article en Markdown...'}
            mediaLibrary={media}
            onMediaUpload={handleMediaUpload}
            onMediaDelete={handleMediaDelete}
          />
        ) : (
          <RichTextEditor
            content={editLanguage === 'en' ? (post.contentEn || '') : (post.contentFr || '')}
            onChange={(html) => setPost({
              ...post,
              ...(editLanguage === 'en' ? { contentEn: html } : { contentFr: html }),
            })}
            placeholder={editLanguage === 'en' ? 'Start writing your post...' : 'Commencez à écrire votre article...'}
            mediaLibrary={media}
            onMediaUpload={handleMediaUpload}
            onMediaDelete={handleMediaDelete}
          />
        )}
      </EditorField>
    </>
  );

  const sidebar = (
    <>
      {/* Settings */}
      <SidebarSection
        title={language === 'en' ? 'Settings' : 'Paramètres'}
        icon={<Settings className="w-4 h-4" />}
        isOpen={showSettings}
        onToggle={() => setShowSettings(!showSettings)}
      >
        <div className="space-y-3">
          <div>
            <SidebarLabel>Slug (URL)</SidebarLabel>
            <SidebarInput
              value={post.slug}
              onChange={(value) => setPost({ ...post, slug: value })}
            />
          </div>
          <div>
            <SidebarLabel>{language === 'en' ? 'Status' : 'Statut'}</SidebarLabel>
            <SidebarSelect
              value={post.status}
              onChange={(value) => setPost({ ...post, status: value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' })}
              options={[
                { value: 'DRAFT', label: language === 'en' ? 'Draft' : 'Brouillon' },
                { value: 'PUBLISHED', label: language === 'en' ? 'Published' : 'Publié' },
                { value: 'ARCHIVED', label: language === 'en' ? 'Archived' : 'Archivé' },
              ]}
            />
          </div>
          <div>
            <SidebarLabel>{language === 'en' ? 'Author' : 'Auteur'}</SidebarLabel>
            <SidebarInput
              value={post.authorName}
              onChange={(value) => setPost({ ...post, authorName: value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <SidebarLabel>{language === 'en' ? 'Featured' : 'À la une'}</SidebarLabel>
            <button
              onClick={() => setPost({ ...post, featured: !post.featured })}
              className={`p-1.5 rounded ${post.featured ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}
            >
              {post.featured ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
            </button>
          </div>
          <div>
            <SidebarLabel>{language === 'en' ? 'Read time (min)' : 'Temps lecture (min)'}</SidebarLabel>
            <SidebarInput
              type="number"
              value={String(post.readTimeMinutes)}
              onChange={(value) => setPost({ ...post, readTimeMinutes: parseInt(value) || 5 })}
              min={1}
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
        <CoverImageSection
          imageUrl={post.coverImage}
          imageAlt={post.coverImageAlt}
          onImageChange={(url, alt) => setPost({
            ...post,
            coverImage: url,
            coverImageAlt: alt || post.coverImageAlt,
          })}
          mediaLibrary={media}
          onMediaUpload={handleMediaUpload}
          onMediaDelete={handleMediaDelete}
          language={language}
        />
      </SidebarSection>

      {/* Categories */}
      <SidebarSection
        title={language === 'en' ? 'Categories' : 'Catégories'}
        icon={<FileText className="w-4 h-4" />}
        isOpen={showCategories}
        onToggle={() => setShowCategories(!showCategories)}
      >
        <TaxonomySelector
          items={categories.map(c => ({ id: c.id, nameEn: c.nameEn, nameFr: c.nameFr }))}
          selectedIds={post.categoryIds || []}
          onChange={(ids) => setPost({ ...post, categoryIds: ids })}
          language={language}
          emptyMessage={language === 'en' ? 'No categories yet' : 'Aucune catégorie'}
        />
      </SidebarSection>

      {/* Tags */}
      <SidebarSection
        title="Tags"
        icon={<FileText className="w-4 h-4" />}
        isOpen={showTags}
        onToggle={() => setShowTags(!showTags)}
      >
        <TaxonomySelector
          items={tags.map(t => ({ id: t.id, nameEn: t.nameEn, nameFr: t.nameFr }))}
          selectedIds={post.tagIds || []}
          onChange={(ids) => setPost({ ...post, tagIds: ids })}
          language={language}
          emptyMessage={language === 'en' ? 'No tags yet' : 'Aucun tag'}
        />
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
            <SidebarLabel>Meta Title ({editLanguage.toUpperCase()})</SidebarLabel>
            <SidebarInput
              value={editLanguage === 'en' ? (post.metaTitleEn || '') : (post.metaTitleFr || '')}
              onChange={(value) => setPost({
                ...post,
                ...(editLanguage === 'en' ? { metaTitleEn: value } : { metaTitleFr: value }),
              })}
              placeholder={editLanguage === 'en' ? post.titleEn : post.titleFr}
            />
          </div>
          <div>
            <SidebarLabel>Meta Description ({editLanguage.toUpperCase()})</SidebarLabel>
            <SidebarTextArea
              value={editLanguage === 'en' ? (post.metaDescEn || '') : (post.metaDescFr || '')}
              onChange={(value) => setPost({
                ...post,
                ...(editLanguage === 'en' ? { metaDescEn: value } : { metaDescFr: value }),
              })}
              placeholder={editLanguage === 'en' ? post.excerptEn : post.excerptFr}
            />
          </div>
          <div>
            <SidebarLabel>OG Image URL</SidebarLabel>
            <SidebarInput
              value={post.ogImage || ''}
              onChange={(value) => setPost({ ...post, ogImage: value })}
              placeholder={post.coverImage || 'https://...'}
            />
          </div>
        </div>
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

export default BlogPostEditor;
