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

  // Placeholder for rest of component
  return <div>AdminTarotArticles Component</div>;
};

export default AdminTarotArticles;
