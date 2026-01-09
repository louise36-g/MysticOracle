import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import {
  fetchAdminTarotArticles,
  updateTarotArticleStatus,
  deleteTarotArticle,
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

  // Load on mount and when filters change
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

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
      title: language === 'en' ? 'Delete Article?' : 'Supprimer l\'article?',
      message: language === 'en'
        ? `Delete "${article.title}"? This action cannot be undone.`
        : `Supprimer "${article.title}"? Cette action est irréversible.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          setActionLoading(article.id);
          const token = await getToken();
          if (!token) return;

          await deleteTarotArticle(token, article.id);

          // Remove from local state
          setArticles(prev => prev.filter(a => a.id !== article.id));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));

          setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to delete article';
          setError(message);
          console.error('Error deleting article:', err);
        } finally {
          setActionLoading(null);
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
          onClick={() => onNavigateToImport(null)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <Upload className="w-4 h-4" />
          {language === 'en' ? 'Go to Import' : 'Aller à Import'}
        </button>
      </div>

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
                          <img
                            src={article.featuredImage || '/placeholder-card.png'}
                            alt={article.featuredImageAlt || article.title}
                            className="w-20 h-20 object-cover rounded-lg bg-slate-800"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Prevent infinite loop by only setting fallback once
                              if (target.src !== `${window.location.origin}/placeholder-card.png`) {
                                target.src = '/placeholder-card.png';
                              } else {
                                // If placeholder also fails, hide the image
                                target.style.display = 'none';
                              }
                            }}
                          />
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
                          {article.status === 'PUBLISHED' && (
                            <a
                              href={`/tarot/articles/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg"
                              title={language === 'en' ? 'Preview' : 'Aperçu'}
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
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
