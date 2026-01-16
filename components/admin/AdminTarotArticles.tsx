import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminTarotArticles,
  updateTarotArticleStatus,
  deleteTarotArticle,
  restoreTarotArticle,
  permanentlyDeleteTarotArticle,
  emptyTarotArticlesTrash,
  reorderTarotArticle,
  TarotArticle,
} from '../../services/apiService';
import {
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  Archive,
  Trash,
  RotateCcw,
  ImageOff,
  Folder,
  Tag,
  Image as ImageIcon,
  GripVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TarotArticleEditor from './TarotArticleEditor';
import TarotCategoriesManager from './TarotCategoriesManager';
import TarotTagsManager from './TarotTagsManager';
import TarotMediaManager from './TarotMediaManager';
import ImportArticle from './ImportArticle';

type TabType = 'articles' | 'categories' | 'tags' | 'media' | 'trash';
type CardType = 'MAJOR_ARCANA' | 'SUIT_OF_WANDS' | 'SUIT_OF_CUPS' | 'SUIT_OF_SWORDS' | 'SUIT_OF_PENTACLES';
type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface ConfirmModal {
  show: boolean;
  title: string;
  message: string;
  isDangerous?: boolean;
  onConfirm: () => void;
}

interface SortableArticleRowProps {
  article: TarotArticle;
  cardTypeBadges: Record<CardType, { bg: string; text: string; label: string }>;
  getStatusBadge: (status: ArticleStatus) => React.ReactElement;
  formatDate: (dateString: string) => string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: string | null;
  language: string;
  isDragEnabled: boolean;
}

const SortableArticleRow: React.FC<SortableArticleRowProps> = ({
  article,
  cardTypeBadges,
  getStatusBadge,
  formatDate,
  onEdit,
  onDelete,
  actionLoading,
  language,
  isDragEnabled,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: article.id,
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardTypeBadge = cardTypeBadges[article.cardType as CardType];

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
        isDragging ? 'z-50 shadow-2xl' : ''
      }`}
    >
      {/* Drag Handle */}
      <td className="px-4 py-3">
        {isDragEnabled ? (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-5 h-5" />
        )}
      </td>

      {/* Image */}
      <td className="px-4 py-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
          {article.featuredImage ? (
            <img
              src={article.featuredImage}
              alt={article.featuredImageAlt || article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOff className="w-6 h-6 text-slate-600" />
          )}
        </div>
      </td>

      {/* Title */}
      <td className="px-4 py-3">
        <div className="font-medium text-white">{article.title}</div>
        <div className="text-sm text-slate-400 mt-1">{article.slug}</div>
      </td>

      {/* Card Number */}
      <td className="px-4 py-3">
        <span className="text-slate-300 font-mono">{article.cardNumber}</span>
      </td>

      {/* Card Type */}
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs ${cardTypeBadge.bg} ${cardTypeBadge.text}`}>
          {cardTypeBadge.label}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">{getStatusBadge(article.status)}</td>

      {/* Updated */}
      <td className="px-4 py-3 text-sm text-slate-400">
        {formatDate(article.updatedAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(article.id)}
            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
            title={language === 'en' ? 'Edit' : 'Modifier'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(article.id)}
            disabled={actionLoading === article.id}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            title={language === 'en' ? 'Delete' : 'Supprimer'}
          >
            {actionLoading === article.id ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
};

const AdminTarotArticles: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();

  // Tab and view state
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Articles state
  const [articles, setArticles] = useState<TarotArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('');
  const [cardTypeFilter, setCardTypeFilter] = useState<CardType | ''>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorTimeoutId, setErrorTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Constants
  const ERROR_DISPLAY_DURATION_MS = 5000;

  // Trash state
  const [trashArticles, setTrashArticles] = useState<TarotArticle[]>([]);
  const [trashLoading, setTrashLoading] = useState(true);
  const [trashPagination, setTrashPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  // Determine if drag handles should be shown
  // Only allow reordering when viewing articles of same card type
  // Don't allow when: searching, filtering by status, or viewing mixed types
  const canReorder = () => {
    if (searchQuery) return false;
    if (statusFilter) return false;
    if (!cardTypeFilter) return false; // Must have card type filter
    return true;
  };

  const isDragEnabled = canReorder();

  // Utility functions
  const getWordCount = (htmlContent: string): number => {
    const text = htmlContent.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Badge configurations
  const cardTypeBadges: Record<CardType, { bg: string; text: string; label: string }> = {
    MAJOR_ARCANA: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Major Arcana' },
    SUIT_OF_WANDS: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Wands' },
    SUIT_OF_CUPS: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Cups' },
    SUIT_OF_SWORDS: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Swords' },
    SUIT_OF_PENTACLES: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Pentacles' },
  };

  const getStatusBadge = (status: ArticleStatus) => {
    const badges = {
      DRAFT: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: language === 'en' ? 'Draft' : 'Brouillon', Icon: FileText },
      PUBLISHED: { bg: 'bg-green-500/20', text: 'text-green-400', label: language === 'en' ? 'Published' : 'Publié', Icon: CheckCircle },
      ARCHIVED: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: language === 'en' ? 'Archived' : 'Archivé', Icon: Archive },
    };
    const badge = badges[status];
    const Icon = badge.Icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  // Load articles
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) return;

      const response = await fetchAdminTarotArticles(token, {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        cardType: cardTypeFilter || undefined,
        status: statusFilter || undefined,
      });

      setArticles(response.articles);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load articles';
      setError(message);
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, searchQuery, cardTypeFilter, statusFilter]);

  // Load trash articles
  const loadTrash = useCallback(async () => {
    try {
      setTrashLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) return;

      const response = await fetchAdminTarotArticles(token, {
        page: trashPagination.page,
        limit: trashPagination.limit,
        deleted: true,
      });

      setTrashArticles(response.articles);
      setTrashPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load trash';
      setError(message);
      console.error('Error loading trash:', err);
    } finally {
      setTrashLoading(false);
    }
  }, [getToken, trashPagination.page, trashPagination.limit]);

  // Load on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'articles') {
      loadArticles();
    } else if (activeTab === 'trash') {
      loadTrash();
    }
  }, [activeTab, loadArticles, loadTrash]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cleanup error timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutId) {
        clearTimeout(errorTimeoutId);
      }
    };
  }, []);

  // Action handlers
  const handleTogglePublish = async (article: TarotArticle) => {
    try {
      setActionLoading(article.id);
      const token = await getToken();
      if (!token) return;

      const newStatus: ArticleStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await updateTarotArticleStatus(token, article.id, newStatus);

      setArticles(prev => prev.map(a =>
        a.id === article.id ? { ...a, status: newStatus } : a
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      setError(message);
      console.error('Error updating status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (article: TarotArticle) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Move to Trash?' : 'Déplacer vers la corbeille?',
      message: language === 'en'
        ? `Move "${article.title}" to trash? You can restore it later.`
        : `Déplacer "${article.title}" vers la corbeille? Vous pourrez le restaurer plus tard.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          setActionLoading(article.id);
          const token = await getToken();
          if (!token) return;

          await deleteTarotArticle(token, article.id);

          setArticles(prev => prev.filter(a => a.id !== article.id));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));
          loadTrash();

          setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to move to trash';
          setError(message);
          console.error('Error moving to trash:', err);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleRestore = async (articleId: string) => {
    try {
      setActionLoading(articleId);
      const token = await getToken();
      if (!token) return;

      await restoreTarotArticle(token, articleId);

      setTrashArticles(prev => prev.filter(a => a.id !== articleId));
      setTrashPagination(prev => ({ ...prev, total: prev.total - 1 }));
      loadArticles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore article';
      setError(message);
      console.error('Error restoring article:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = (articleId: string) => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Permanently Delete?' : 'Supprimer définitivement?',
      message: language === 'en'
        ? 'Permanently delete this article? This action cannot be undone.'
        : 'Supprimer définitivement cet article? Cette action est irréversible.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          setActionLoading(articleId);
          const token = await getToken();
          if (!token) return;

          await permanentlyDeleteTarotArticle(token, articleId);

          setTrashArticles(prev => prev.filter(a => a.id !== articleId));
          setTrashPagination(prev => ({ ...prev, total: prev.total - 1 }));

          setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to permanently delete article';
          setError(message);
          console.error('Error permanently deleting article:', err);
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmModal({
      show: true,
      title: language === 'en' ? 'Empty Trash?' : 'Vider la corbeille?',
      message: language === 'en'
        ? `Permanently delete all ${trashArticles.length} items in trash? This action cannot be undone.`
        : `Supprimer définitivement les ${trashArticles.length} éléments de la corbeille? Cette action est irréversible.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;

          await emptyTarotArticlesTrash(token);

          setTrashArticles([]);
          setTrashPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });

          setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to empty trash';
          setError(message);
          console.error('Error emptying trash:', err);
        }
      },
    });
  };

  const performReorder = async (movedArticle: TarotArticle, newIndex: number) => {
    const token = await getToken();
    if (!token) throw new Error('No auth token');

    await reorderTarotArticle(token, {
      articleId: movedArticle.id,
      cardType: movedArticle.cardType,
      newPosition: newIndex,
    });

    console.log('✓ Article reordered successfully');
    setError(null);
  };

  const handleReorderError = (error: unknown) => {
    console.error('✗ Failed to reorder article:', error);

    loadArticles();

    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to reorder article. Changes have been reverted.';
    setError(errorMessage);

    // Clear any existing timeout
    if (errorTimeoutId) {
      clearTimeout(errorTimeoutId);
    }

    // Set new timeout and store ID
    const timeoutId = setTimeout(() => setError(null), ERROR_DISPLAY_DURATION_MS);
    setErrorTimeoutId(timeoutId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || isReordering) {
      return;
    }

    try {
      setIsReordering(true);

      const oldIndex = articles.findIndex((a) => a.id === active.id);
      const newIndex = articles.findIndex((a) => a.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const movedArticle = articles[oldIndex];

      // Optimistic update
      const reorderedArticles = arrayMove(articles, oldIndex, newIndex);
      setArticles(reorderedArticles);

      await performReorder(movedArticle, newIndex);
    } catch (error) {
      handleReorderError(error);
    } finally {
      setIsReordering(false);
    }
  };

  // If editing an article, show the editor
  if (editingArticleId) {
    return (
      <TarotArticleEditor
        articleId={editingArticleId}
        onSave={() => {
          setEditingArticleId(null);
          loadArticles();
        }}
        onCancel={() => setEditingArticleId(null)}
      />
    );
  }

  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'articles' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          {language === 'en' ? 'Articles' : 'Articles'}
          <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'articles' ? 'bg-purple-700' : 'bg-slate-700'}`}>
            {pagination.total}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'categories' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Folder className="w-4 h-4" />
          {language === 'en' ? 'Categories' : 'Catégories'}
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'tags' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          Tags
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'media' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          {language === 'en' ? 'Media' : 'Médias'}
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'trash' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Trash className="w-4 h-4" />
          {language === 'en' ? 'Trash' : 'Corbeille'}
          {trashArticles.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'trash' ? 'bg-purple-700' : 'bg-slate-700'}`}>
              {trashArticles.length}
            </span>
          )}
        </button>
      </div>

      {/* Articles Tab */}
      {activeTab === 'articles' && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search by title or slug...' : 'Rechercher par titre ou slug...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={cardTypeFilter}
              onChange={(e) => setCardTypeFilter(e.target.value as CardType | '')}
              className="px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">{language === 'en' ? 'All Types' : 'Tous les types'}</option>
              <option value="MAJOR_ARCANA">Major Arcana</option>
              <option value="SUIT_OF_WANDS">Wands</option>
              <option value="SUIT_OF_CUPS">Cups</option>
              <option value="SUIT_OF_SWORDS">Swords</option>
              <option value="SUIT_OF_PENTACLES">Pentacles</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ArticleStatus | '')}
              className="px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">{language === 'en' ? 'All Status' : 'Tous les statuts'}</option>
              <option value="DRAFT">{language === 'en' ? 'Draft' : 'Brouillon'}</option>
              <option value="PUBLISHED">{language === 'en' ? 'Published' : 'Publié'}</option>
              <option value="ARCHIVED">{language === 'en' ? 'Archived' : 'Archivé'}</option>
            </select>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
            >
              <Upload className="w-4 h-4" />
              {language === 'en' ? 'Import JSON' : 'Importer JSON'}
            </button>
          </div>

          {/* Articles Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 p-8 text-center text-slate-400">
              {language === 'en' ? 'No articles yet. Import your first article!' : 'Aucun article. Importez votre premier article!'}
            </div>
          ) : (
            <>
              {/* Loading indicator during reorder */}
              {isReordering && (
                <div className="mb-4 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-blue-400 text-sm">
                    {language === 'en' ? 'Saving new order...' : 'Enregistrement du nouvel ordre...'}
                  </span>
                </div>
              )}

              <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                  <SortableContext
                    items={articles.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-12">
                            {/* Drag handle column */}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            {language === 'en' ? 'Image' : 'Image'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            {language === 'en' ? 'Title' : 'Titre'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            {language === 'en' ? 'Card #' : 'Carte #'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            {language === 'en' ? 'Type' : 'Type'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            {language === 'en' ? 'Status' : 'Statut'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            {language === 'en' ? 'Updated' : 'Modifié'}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                            {language === 'en' ? 'Actions' : 'Actions'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {articles.map((article) => (
                          <SortableArticleRow
                            key={article.id}
                            article={article}
                            cardTypeBadges={cardTypeBadges}
                            getStatusBadge={getStatusBadge}
                            formatDate={formatDate}
                            onEdit={setEditingArticleId}
                            onDelete={(id) => handleDelete(articles.find(a => a.id === id)!)}
                            actionLoading={actionLoading}
                            language={language}
                            isDragEnabled={isDragEnabled}
                          />
                        ))}
                      </tbody>
                    </table>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-slate-400 text-sm">
                {language === 'en'
                  ? `Showing ${articles.length} of ${pagination.total} articles`
                  : `Affichage de ${articles.length} sur ${pagination.total} articles`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-slate-300 px-4">{pagination.page} / {pagination.totalPages}</span>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && <TarotCategoriesManager />}

      {/* Tags Tab */}
      {activeTab === 'tags' && <TarotTagsManager />}

      {/* Media Tab */}
      {activeTab === 'media' && <TarotMediaManager />}

      {/* Trash Tab */}
      {activeTab === 'trash' && (
        <>
          {trashArticles.length > 0 && (
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
          ) : trashArticles.length === 0 ? (
            <div className="text-center py-20">
              <Trash className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl text-slate-400 mb-2">
                {language === 'en' ? 'Trash is empty' : 'La corbeille est vide'}
              </h3>
              <p className="text-slate-500">
                {language === 'en' ? 'Deleted articles will appear here' : 'Les articles supprimés apparaîtront ici'}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-500/20 bg-slate-800/50">
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Article' : 'Article'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Original Slug' : 'Slug original'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Deleted' : 'Supprimé'}</th>
                      <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Actions' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashArticles.map((article) => (
                      <tr key={article.id} className="border-b border-purple-500/10 hover:bg-slate-800/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 flex-shrink-0">
                              {article.featuredImage ? (
                                <img
                                  src={article.featuredImage}
                                  alt={article.featuredImageAlt || article.title}
                                  className="w-full h-full object-cover rounded-lg bg-slate-800"
                                />
                              ) : (
                                <div className="w-full h-full rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                  <ImageOff className="w-5 h-5 text-purple-400/50" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-slate-200 font-medium">{article.title}</p>
                              <p className="text-slate-500 text-sm">{article.cardNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {article.originalSlug || article.slug.replace(/^_deleted_\d+_/, '')}
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {article.deletedAt ? formatDate(article.deletedAt as unknown as string) : '-'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestore(article.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 text-sm"
                              title={language === 'en' ? 'Restore' : 'Restaurer'}
                              disabled={actionLoading === article.id}
                            >
                              <RotateCcw className="w-4 h-4" />
                              {language === 'en' ? 'Restore' : 'Restaurer'}
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(article.id)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                              title={language === 'en' ? 'Delete permanently' : 'Supprimer définitivement'}
                              disabled={actionLoading === article.id}
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
                  ? `Showing ${trashArticles.length} of ${trashPagination.total} articles`
                  : `Affichage de ${trashArticles.length} sur ${trashPagination.total} articles`}
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
        </>
      )}

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-xl border border-purple-500/30 p-0 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <ImportArticle
                isModal={true}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                  setShowImportModal(false);
                  loadArticles();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl border border-purple-500/20 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-heading text-amber-400 mb-4">{confirmModal.title}</h3>
              <p className="text-slate-300 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
                  className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`px-4 py-2 rounded-lg ${
                    confirmModal.isDangerous
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  {language === 'en' ? 'Confirm' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTarotArticles;
