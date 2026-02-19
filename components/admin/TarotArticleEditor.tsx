import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../routes/routes';
import {
  fetchAdminTarotArticle,
  updateTarotArticle,
  fetchUnifiedCategories,
  fetchUnifiedTags,
  fetchLinkRegistry,
  TarotArticle,
  UnifiedCategory,
  UnifiedTag,
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  BlogMedia,
} from '../../services/api';
import { Image as ImageIcon, HelpCircle, Link as LinkIcon, Tag, Folder, AlertCircle, Link2, Loader2, Eye } from 'lucide-react';
import {
  scanForLinkableTerms,
  applyLinkSuggestions,
  LinkSuggestionModal,
  type LinkSuggestion,
} from '../internal-links';
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
  SidebarInput,
  SidebarLabel,
  TranslationToolbar,
  AVAILABLE_LANGUAGES,
} from './editor';
import { useArticleForm } from './tarot-articles/hooks/useArticleForm';

interface TarotArticleEditorProps {
  articleId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const TarotArticleEditor: React.FC<TarotArticleEditorProps> = ({
  articleId: propArticleId,
  onSave,
  onCancel,
}) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const params = useParams();
  const navigate = useNavigate();

  // Support both prop-based (parent component) and route-based (direct URL) usage
  const articleId = propArticleId || params.id || '';
  const handleBack = onCancel || (() => navigate(ROUTES.ADMIN_TAROT));
  const handleSaved = onSave || (() => navigate(ROUTES.ADMIN_TAROT));

  const [article, setArticle] = useState<TarotArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editLanguage, setEditLanguage] = useState<string>('en');

  // Sidebar data
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [tags, setTags] = useState<UnifiedTag[]>([]);
  const [media, setMedia] = useState<BlogMedia[]>([]);

  // Form validation
  const {
    errors: validationErrors,
    touched,
    validate,
    setFieldTouched,
    getFieldError,
    hasError,
    clearErrors,
  } = useArticleForm(article, { language });

  // Collapsible sections
  const [showCoverImage, setShowCoverImage] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showFAQ, setShowFAQ] = useState(true);
  const [showRelated, setShowRelated] = useState(false);
  const [showSEO, setShowSEO] = useState(false);

  // Internal links
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([]);
  const [scanningLinks, setScanningLinks] = useState(false);

  // Field change handlers - must be before any early returns to follow Rules of Hooks
  const handleFieldChange = useCallback((field: keyof TarotArticle, value: unknown) => {
    setArticle(prev => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const handleFieldBlur = useCallback((field: string) => {
    setFieldTouched(field);
  }, [setFieldTouched]);

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
        fetchUnifiedCategories(token),
        fetchUnifiedTags(token),
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

    // Validate before saving
    const isValid = validate();
    if (!isValid) {
      // Collect error messages for display
      const errorMessages = Object.values(validationErrors).filter(Boolean);
      const errorSummary = language === 'en'
        ? `Please fix ${errorMessages.length} validation error${errorMessages.length > 1 ? 's' : ''} before saving`
        : `Veuillez corriger ${errorMessages.length} erreur${errorMessages.length > 1 ? 's' : ''} avant d'enregistrer`;
      setError(errorSummary);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const status = overrideStatus ?? (publish ? 'PUBLISHED' : article.status);

      const updateData = {
        ...article,
        status,
        _visualEditorMode: true,
      };

      console.log('[TarotArticleEditor] Saving article:', {
        id: article.id,
        title: article.title,
        status,
        hasToken: !!token,
      });

      await updateTarotArticle(token, article.id, updateData);

      console.log('[TarotArticleEditor] Save successful');
      clearErrors();
      setArticle(prev => prev ? { ...prev, status } : prev);
      handleSaved();
    } catch (err) {
      console.error('[TarotArticleEditor] Save failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to save: ${errorMessage}`);
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

  // Internal links handlers
  const handleOpenLinkModal = async () => {
    if (!article) return;
    const content = editLanguage === 'en' ? (article.content || '') : (article.contentFr || '');
    if (!content.trim()) {
      setError(language === 'en' ? 'Add some content first before adding internal links' : 'Ajoutez du contenu avant d\'ajouter des liens internes');
      return;
    }

    try {
      setScanningLinks(true);
      const registry = await fetchLinkRegistry();
      const suggestions = scanForLinkableTerms(content, registry, {
        // Allow converting existing <a> links (e.g., legacy "[INSERT CARD URL]" anchors)
        // into shortcodes, but still skip existing shortcodes
        skipExistingLinks: false,
        currentArticleSlug: article.slug, // Prevent self-linking
      });

      setLinkSuggestions(suggestions);
      setShowLinkModal(true);
    } catch (err) {
      console.error('Failed to scan for links:', err);
      setError(language === 'en' ? 'Failed to scan for linkable content' : 'Échec de l\'analyse du contenu');
    } finally {
      setScanningLinks(false);
    }
  };

  const handleApplyLinks = (selected: LinkSuggestion[]) => {
    if (!article) return;
    const content = editLanguage === 'en' ? (article.content || '') : (article.contentFr || '');
    const updatedContent = applyLinkSuggestions(content, selected);
    const fieldToUpdate = editLanguage === 'en' ? 'content' : 'contentFr';
    setArticle(prev => prev ? { ...prev, [fieldToUpdate]: updatedContent } : prev);
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
    ? `/tarot/${article.slug}`
    : `/admin/tarot-articles/preview/${article.id}`;

  const currentLangFlag = AVAILABLE_LANGUAGES.find(l => l.code === editLanguage)?.flag;

  const topBar = (
    <EditorTopBar
      title={editLanguage === 'en' ? article.title : (article.titleFr || article.title)}
      onBack={handleBack}
      onSave={() => handleSave(false)}
      saving={saving}
      language={language}
      editLanguage={editLanguage}
      onEditLanguageChange={setEditLanguage}
      previewUrl={previewUrl}
      isPublished={article.status === 'PUBLISHED'}
      showPublish
      onPublish={handleTogglePublish}
    />
  );

  // Get current field values based on edit language
  const currentTitle = editLanguage === 'en' ? article.title : (article.titleFr || '');
  const currentExcerpt = editLanguage === 'en' ? article.excerpt : (article.excerptFr || '');
  const currentContent = editLanguage === 'en' ? article.content : (article.contentFr || '');

  // Handle field changes based on edit language
  const handleTitleChange = (value: string) => {
    if (editLanguage === 'en') {
      handleFieldChange('title', value);
    } else {
      handleFieldChange('titleFr', value);
    }
  };

  const handleExcerptChange = (value: string) => {
    if (editLanguage === 'en') {
      handleFieldChange('excerpt', value);
    } else {
      handleFieldChange('excerptFr', value);
    }
  };

  const handleContentChange = (html: string) => {
    if (editLanguage === 'en') {
      handleFieldChange('content', html);
    } else {
      handleFieldChange('contentFr', html);
    }
  };

  const handleImportFrench = (data: {
    title: string;
    excerpt: string;
    content: string;
    seoMetaTitle?: string;
    seoMetaDescription?: string;
    seoFocusKeyword?: string;
    featuredImageAlt?: string;
  }) => {
    setArticle(prev => prev ? {
      ...prev,
      titleFr: data.title,
      excerptFr: data.excerpt,
      contentFr: data.content,
      seoMetaTitleFr: data.seoMetaTitle || '',
      seoMetaDescriptionFr: data.seoMetaDescription || '',
      seoFocusKeywordFr: data.seoFocusKeyword || '',
      featuredImageAltFr: data.featuredImageAlt || '',
    } : prev);
  };

  const mainContent = (
    <>
      {/* Translation Toolbar (only in French mode) */}
      <TranslationToolbar
        editLanguage={editLanguage}
        language={language}
        englishData={{
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          seoMetaTitle: article.seoMetaTitle,
          seoMetaDescription: article.seoMetaDescription,
          seoFocusKeyword: article.seoFocusKeyword,
          featuredImageAlt: article.featuredImageAlt,
        }}
        onImportFrench={handleImportFrench}
        filenamePrefix={article.slug}
      />

      <div className="space-y-2">
        <EditorField
          label={language === 'en' ? 'Title *' : 'Titre *'}
          languageFlag={currentLangFlag}
        >
          <TitleInput
            value={currentTitle}
            onChange={handleTitleChange}
            onBlur={() => handleFieldBlur(editLanguage === 'en' ? 'title' : 'titleFr')}
            hasError={editLanguage === 'en' && hasError('title')}
            placeholder={editLanguage === 'en' ? 'Enter the card title...' : 'Entrez le titre de la carte...'}
          />
        </EditorField>
        {editLanguage === 'en' && getFieldError('title') && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{getFieldError('title')}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <EditorField
          label={language === 'en' ? 'Excerpt *' : 'Extrait *'}
          languageFlag={currentLangFlag}
        >
          <ExcerptInput
            value={currentExcerpt}
            onChange={handleExcerptChange}
            onBlur={() => handleFieldBlur(editLanguage === 'en' ? 'excerpt' : 'excerptFr')}
            hasError={editLanguage === 'en' && hasError('excerpt')}
            placeholder={editLanguage === 'en' ? 'Brief summary of the card...' : 'Bref résumé de la carte...'}
          />
        </EditorField>
        {editLanguage === 'en' && getFieldError('excerpt') && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{getFieldError('excerpt')}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <EditorField
          label={language === 'en' ? 'Content *' : 'Contenu *'}
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
          <div className={editLanguage === 'en' && hasError('content') ? 'ring-1 ring-red-500/50 rounded-lg' : ''}>
            <RichTextEditor
              content={currentContent}
              onChange={handleContentChange}
              onBlur={() => handleFieldBlur(editLanguage === 'en' ? 'content' : 'contentFr')}
              placeholder={editLanguage === 'en' ? 'Write your article content...' : 'Écrivez le contenu de l\'article...'}
              mediaLibrary={media}
              onMediaUpload={handleMediaUpload}
              onMediaDelete={handleMediaDelete}
            />
          </div>
        </EditorField>
        {editLanguage === 'en' && getFieldError('content') && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{getFieldError('content')}</span>
          </div>
        )}
      </div>
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

      <SidebarSection
        title="SEO"
        icon={<Eye className="w-4 h-4" />}
        isOpen={showSEO}
        onToggle={() => setShowSEO(!showSEO)}
      >
        <div className="space-y-3">
          <div>
            <SidebarLabel>
              {language === 'en' ? 'Meta Title' : 'Meta Titre'} ({editLanguage.toUpperCase()})
            </SidebarLabel>
            <SidebarInput
              value={editLanguage === 'en' ? (article.seoMetaTitle || '') : (article.seoMetaTitleFr || '')}
              onChange={(value) => handleFieldChange(
                editLanguage === 'en' ? 'seoMetaTitle' : 'seoMetaTitleFr',
                value
              )}
              placeholder={editLanguage === 'en' ? article.title : (article.titleFr || article.title)}
            />
          </div>
          <div>
            <SidebarLabel>
              {language === 'en' ? 'Meta Description' : 'Meta Description'} ({editLanguage.toUpperCase()})
            </SidebarLabel>
            <SidebarTextArea
              value={editLanguage === 'en' ? (article.seoMetaDescription || '') : (article.seoMetaDescriptionFr || '')}
              onChange={(value) => handleFieldChange(
                editLanguage === 'en' ? 'seoMetaDescription' : 'seoMetaDescriptionFr',
                value
              )}
              placeholder={editLanguage === 'en' ? article.excerpt : (article.excerptFr || article.excerpt)}
              rows={3}
            />
          </div>
          <div>
            <SidebarLabel>
              {language === 'en' ? 'Focus Keyword' : 'Mot-clé cible'} ({editLanguage.toUpperCase()})
            </SidebarLabel>
            <SidebarInput
              value={editLanguage === 'en' ? (article.seoFocusKeyword || '') : (article.seoFocusKeywordFr || '')}
              onChange={(value) => handleFieldChange(
                editLanguage === 'en' ? 'seoFocusKeyword' : 'seoFocusKeywordFr',
                value
              )}
              placeholder={language === 'en' ? 'e.g., the fool tarot card' : 'ex: carte de tarot le fou'}
            />
          </div>
          <div>
            <SidebarLabel>
              {language === 'en' ? 'Image Alt Text' : 'Alt de l\'image'} ({editLanguage.toUpperCase()})
            </SidebarLabel>
            <SidebarInput
              value={editLanguage === 'en' ? (article.featuredImageAlt || '') : (article.featuredImageAltFr || '')}
              onChange={(value) => handleFieldChange(
                editLanguage === 'en' ? 'featuredImageAlt' : 'featuredImageAltFr',
                value
              )}
              placeholder={language === 'en' ? 'Describe the image...' : 'Décrivez l\'image...'}
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
        onClose={() => setShowLinkModal(false)}
        suggestions={linkSuggestions}
        onApply={handleApplyLinks}
      />
    </>
  );
};

export default TarotArticleEditor;
