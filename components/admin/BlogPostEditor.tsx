import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../routes/routes';
import { generateSlug } from '../../utils/slug';
import {
  fetchUnifiedCategories,
  fetchUnifiedTags,
  createBlogPost,
  updateBlogPost,
  fetchAdminBlogPost,
  BlogPost,
  CreateBlogPostData,
} from '../../services/api';
import type { UnifiedCategory, UnifiedTag } from '../../services/api/taxonomy';
import {
  Settings,
  FileText,
  Image as ImageIcon,
  Eye,
  Star,
  StarOff,
  Link2,
  Loader2,
  HelpCircle,
  Megaphone,
} from 'lucide-react';
import BlogFAQManager from './BlogFAQManager';
import BlogCTAManager from './BlogCTAManager';
import { LinkSuggestionModal } from '../internal-links';
import RichTextEditor from './RichTextEditor';
import MarkdownEditor from './MarkdownEditor';
import { useEditorMedia } from './editor/hooks/useEditorMedia';
import { useEditorLinks } from './editor/hooks/useEditorLinks';
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
import TranslationToolbar from './editor/TranslationToolbar';

interface BlogPostEditorProps {
  post?: BlogPost;
  isNew?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

const BlogPostEditor: React.FC<BlogPostEditorProps> = ({
  post: initialPost,
  isNew = false,
  onSave,
  onCancel,
}) => {
  const { language } = useApp();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const params = useParams();
  const navigate = useNavigate();

  // Support both prop-based (parent component) and route-based (direct URL) usage
  const handleBack = onCancel || (() => navigate(ROUTES.ADMIN_BLOG));
  const handleSaved = onSave || (() => navigate(ROUTES.ADMIN_BLOG));

  const [post, setPost] = useState<BlogPost | null>(initialPost || null);
  const [loadingPost, setLoadingPost] = useState(!initialPost && !!params.id);
  const [editLanguage, setEditLanguage] = useState<string>('en');
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sidebar data
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [tags, setTags] = useState<UnifiedTag[]>([]);

  // Media library
  const { media, setMedia, loadMedia, handleMediaUpload, handleMediaDelete } = useEditorMedia();

  // Collapsible sections
  const [showSettings, setShowSettings] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [showSEO, setShowSEO] = useState(false);
  const [showCoverImage, setShowCoverImage] = useState(true);

  // Internal links
  const {
    showLinkModal,
    linkSuggestions,
    scanningLinks,
    handleOpenLinkModal,
    handleApplyLinks,
    closeLinkModal,
  } = useEditorLinks({
    getContent: () => editLanguage === 'en' ? (post?.contentEn || '') : (post?.contentFr || ''),
    slug: post?.slug || '',
    language,
    onContentUpdate: (updatedContent) => {
      setPost(prev => prev ? {
        ...prev,
        ...(editLanguage === 'en' ? { contentEn: updatedContent } : { contentFr: updatedContent }),
      } : prev);
    },
    onError: setError,
  });

  // Fetch post from API when accessed via URL (no prop passed)
  useEffect(() => {
    if (!initialPost && params.id) {
      const loadPost = async () => {
        try {
          setLoadingPost(true);
          const token = await getToken();
          if (!token) return;
          const data = await fetchAdminBlogPost(token, params.id!);
          setPost(data.post);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load post');
        } finally {
          setLoadingPost(false);
        }
      };
      loadPost();
    }
  }, [params.id]);

  useEffect(() => {
    if (isAuthLoaded) {
      loadSidebarData();
      loadMedia();
    }
  }, [isAuthLoaded]);

  const loadSidebarData = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // Load independently so one failure doesn't block the other
      const [catResult, tagResult] = await Promise.allSettled([
        fetchUnifiedCategories(token),
        fetchUnifiedTags(token),
      ]);

      if (catResult.status === 'fulfilled') {
        setCategories(catResult.value.categories);
      } else {
        console.error('Failed to load categories:', catResult.reason);
      }
      if (tagResult.status === 'fulfilled') {
        setTags(tagResult.value.tags);
      } else {
        console.error('Failed to load tags:', tagResult.reason);
      }
    } catch (err) {
      console.error('Failed to load sidebar data:', err);
    }
  };

  const handleSave = async (action: boolean | 'publish' | 'unpublish' = false) => {
    const publish = action === 'publish' || action === true;
    const unpublish = action === 'unpublish';
    if (!post) return;
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
        status: publish ? 'PUBLISHED' : unpublish ? 'DRAFT' : post.status,
        featured: post.featured,
        readTimeMinutes: post.readTimeMinutes,
        categoryIds: post.categoryIds || [],
        tagIds: post.tagIds || [],
        faq: post.faq,
        cta: post.cta ?? null,
      };

      if (isNew) {
        await createBlogPost(token, postData);
      } else {
        await updateBlogPost(token, post.id, postData);
      }

      handleSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
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
    ? (post.status === 'PUBLISHED' ? `/blog/${post.slug}` : `/admin/blog/preview/${post.id}`)
    : undefined;

  const currentLangFlag = AVAILABLE_LANGUAGES.find(l => l.code === editLanguage)?.flag;

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Post not found'}</p>
          <button onClick={handleBack} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
            {language === 'en' ? 'Back to Blog' : 'Retour au Blog'}
          </button>
        </div>
      </div>
    );
  }

  const topBar = (
    <EditorTopBar
      title={isNew
        ? (language === 'en' ? 'New Post' : 'Nouvel article')
        : (language === 'en' ? 'Edit Post' : 'Modifier article')}
      isNew={isNew}
      onBack={handleBack}
      onSave={() => handleSave(false)}
      saving={saving}
      language={language}
      editLanguage={editLanguage}
      onEditLanguageChange={setEditLanguage}
      editorMode={editorMode}
      onEditorModeChange={setEditorMode}
      previewUrl={previewUrl}
      isPublished={post.status === 'PUBLISHED'}
      showPublish={true}
      onPublish={() => handleSave(post.status === 'PUBLISHED' ? 'unpublish' : 'publish')}
    />
  );

  const handleImportFrench = (data: { title: string; excerpt: string; content: string; seoMetaTitle?: string; seoMetaDescription?: string }) => {
    setPost({
      ...post,
      titleFr: data.title,
      excerptFr: data.excerpt,
      contentFr: data.content,
      metaTitleFr: data.seoMetaTitle || '',
      metaDescFr: data.seoMetaDescription || '',
    });
  };

  const mainContent = (
    <>
      {/* Translation Toolbar (only in French mode) */}
      <TranslationToolbar
        editLanguage={editLanguage}
        language={language}
        englishData={{
          title: post.titleEn,
          excerpt: post.excerptEn || '',
          content: post.contentEn || '',
          seoMetaTitle: post.metaTitleEn,
          seoMetaDescription: post.metaDescEn,
        }}
        onImportFrench={handleImportFrench}
        filenamePrefix={post.slug || 'blog-post'}
      />

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
        {/* Internal Links Button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={handleOpenLinkModal}
            disabled={scanningLinks}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg border border-purple-500/30 transition-colors disabled:opacity-50"
          >
            {scanningLinks ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            {language === 'en' ? 'Add Internal Links' : 'Ajouter des liens internes'}
          </button>
        </div>
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
          items={categories.flatMap(c => [
            { id: c.id, nameEn: c.name, nameFr: c.nameFr },
            ...(c.children || []).map(child => ({
              id: child.id,
              nameEn: child.name,
              nameFr: child.nameFr,
              depth: 1,
            })),
          ])}
          selectedIds={post.categoryIds || []}
          onChange={(ids) => setPost({ ...post, categoryIds: ids })}
          language={language}
          emptyMessage={language === 'en' ? 'No categories yet' : 'Aucune catégorie'}
        />
      </SidebarSection>

      {/* FAQ */}
      <SidebarSection
        title="FAQ"
        icon={<HelpCircle className="w-4 h-4" />}
        isOpen={showFAQ}
        onToggle={() => setShowFAQ(!showFAQ)}
      >
        <BlogFAQManager
          faq={post.faq || []}
          onChange={(faq) => setPost({ ...post, faq })}
        />
      </SidebarSection>

      {/* Call to Action */}
      <SidebarSection
        title={language === 'en' ? 'Call to Action' : 'Appel a l\'action'}
        icon={<Megaphone className="w-4 h-4" />}
        isOpen={showCTA}
        onToggle={() => setShowCTA(!showCTA)}
      >
        <BlogCTAManager
          cta={post.cta}
          onChange={(cta) => setPost({ ...post, cta })}
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
          items={tags.map(t => ({ id: t.id, nameEn: t.name, nameFr: t.nameFr }))}
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
    <>
      <EditorLayout
        topBar={topBar}
        mainContent={mainContent}
        sidebar={sidebar}
        error={error}
      />
      <LinkSuggestionModal
        isOpen={showLinkModal}
        onClose={closeLinkModal}
        suggestions={linkSuggestions}
        onApply={handleApplyLinks}
      />
    </>
  );
};

export default BlogPostEditor;
