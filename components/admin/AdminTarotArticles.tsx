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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CardType = 'MAJOR_ARCANA' | 'SUIT_OF_WANDS' | 'SUIT_OF_CUPS' | 'SUIT_OF_SWORDS' | 'SUIT_OF_PENTACLES';
type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface AdminTarotArticlesProps {
  onNavigateToImport: (articleId: string | null) => void;
}

interface ConfirmModal {
  show: boolean;
  title: string;
  message: string;
  isDangerous?: boolean;
  onConfirm: () => void;
}

const AdminTarotArticles: React.FC<AdminTarotArticlesProps> = ({ onNavigateToImport }) => {
  const { language } = useApp();
  const { getToken } = useAuth();

  // State
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [articles, setArticles] = useState<TarotArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | ''>('');
  const [cardTypeFilter, setCardTypeFilter] = useState<CardType | ''>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Trash state
  const [trashArticles, setTrashArticles] = useState<TarotArticle[]>([]);
  const [trashLoading, setTrashLoading] = useState(true);
  const [trashPagination, setTrashPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

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

  // Load on mount and when view mode or filters change
  useEffect(() => {
    if (viewMode === 'active') {
      loadArticles();
    } else {
      loadTrash();
    }
  }, [viewMode, loadArticles, loadTrash]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Action handlers
  const handleTogglePublish = async (article: TarotArticle) => {
    try {
      setActionLoading(article.id);
      const token = await getToken();
      if (!token) return;

      const newStatus: ArticleStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await updateTarotArticleStatus(token, article.id, newStatus);

      // Update local state
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

          // Remove from local state and reload trash
          setArticles(prev => prev.filter(a => a.id !== article.id));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));
          loadTrash(); // Reload trash to show the new item

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

  // Trash handlers
  const handleRestore = async (articleId: string) => {
    try {
      setActionLoading(articleId);
      const token = await getToken();
      if (!token) return;

      await restoreTarotArticle(token, articleId);

      // Remove from trash and reload active articles
      setTrashArticles(prev => prev.filter(a => a.id !== articleId));
      setTrashPagination(prev => ({ ...prev, total: prev.total - 1 }));
      loadArticles(); // Reload active articles to show the restored item
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

          // Remove from trash
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

          // Clear trash
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

  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setViewMode('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'active'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          {language === 'en' ? 'Active Articles' : 'Articles Actifs'}
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            viewMode === 'active' ? 'bg-purple-700' : 'bg-slate-700'
          }`}>
            {pagination.total}
          </span>
        </button>
        <button
          onClick={() => setViewMode('trash')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'trash'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Trash className="w-4 h-4" />
          {language === 'en' ? 'Trash' : 'Corbeille'}
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            viewMode === 'trash' ? 'bg-purple-700' : 'bg-slate-700'
          }`}>
            {trashArticles.length}
          </span>
        </button>
      </div>

      {/* Filter Bar - Only show for active view */}
      {viewMode === 'active' && (
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
          onClick={() => onNavigateToImport(null)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Upload className="w-4 h-4" />
          {language === 'en' ? 'Go to Import' : 'Aller à Import'}
        </button>
      </div>
      )}

      {/* Active Articles View */}
      {viewMode === 'active' && (
        <>
      {/* Articles Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-purple-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20 bg-slate-800/50">
                  <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Article' : 'Article'}</th>
                  <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Status' : 'Statut'}</th>
                  <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Stats' : 'Stats'}</th>
                  <th className="text-left p-4 text-slate-300 font-medium">{language === 'en' ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      {language === 'en' ? 'No articles yet. Import your first article!' : 'Aucun article. Importez votre premier article!'}
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => (
                    <tr key={article.id} className="border-b border-purple-500/10 hover:bg-slate-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-20 h-20 flex-shrink-0">
                            {article.featuredImage ? (
                              <img
                                src={article.featuredImage}
                                alt={article.featuredImageAlt || article.title}
                                className="w-full h-full object-cover rounded-lg bg-slate-800"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const placeholder = target.parentElement?.querySelector('.img-placeholder');
                                  if (placeholder) placeholder.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`img-placeholder absolute inset-0 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center ${article.featuredImage ? 'hidden' : ''}`}>
                              <ImageOff className="w-6 h-6 text-purple-400/50" />
                            </div>
                          </div>
                          <div>
                            <button
                              onClick={() => onNavigateToImport(article.id)}
                              className="text-slate-200 font-medium hover:text-purple-400 transition-colors text-left"
                            >
                              {article.title}
                            </button>
                            <p className="text-slate-500 text-sm">{article.slug}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1 ${cardTypeBadges[article.cardType as CardType].bg} ${cardTypeBadges[article.cardType as CardType].text}`}>
                              {cardTypeBadges[article.cardType as CardType].label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(article.status as ArticleStatus)}</td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-slate-400">{getWordCount(article.content).toLocaleString()} words</p>
                          {article.datePublished && (
                            <p className="text-slate-500 text-xs mt-1">
                              {formatDate(article.datePublished)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const port = window.location.port || '3000';
                              const url = article.status === 'PUBLISHED'
                                ? `http://localhost:${port}/tarot/articles/${article.slug}`
                                : `http://localhost:${port}/admin/tarot/preview/${article.id}`;
                              window.open(url, '_blank');
                            }}
                            className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg"
                            title={article.status === 'PUBLISHED'
                              ? (language === 'en' ? 'View' : 'Voir')
                              : (language === 'en' ? 'Preview' : 'Aperçu')
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigateToImport(article.id)}
                            className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/20 rounded-lg"
                            title={language === 'en' ? 'Edit' : 'Modifier'}
                            disabled={actionLoading === article.id}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleTogglePublish(article)}
                            className={`p-2 rounded-lg ${
                              article.status === 'PUBLISHED'
                                ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/20'
                                : 'text-slate-400 hover:text-green-400 hover:bg-green-500/20'
                            }`}
                            title={article.status === 'PUBLISHED'
                              ? (language === 'en' ? 'Unpublish' : 'Dépublier')
                              : (language === 'en' ? 'Publish' : 'Publier')}
                            disabled={actionLoading === article.id}
                          >
                            {actionLoading === article.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : article.status === 'PUBLISHED' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(article)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                            title={language === 'en' ? 'Delete' : 'Supprimer'}
                            disabled={actionLoading === article.id}
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

      {/* Trash View */}
      {viewMode === 'trash' && (
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
                {language === 'en'
                  ? 'Deleted articles will appear here'
                  : 'Les articles supprimés apparaîtront ici'}
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
                            <img
                              src={article.featuredImage || '/placeholder-card.png'}
                              alt={article.featuredImageAlt || article.title}
                              className="w-16 h-16 object-cover rounded-lg bg-slate-800"
                            />
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
