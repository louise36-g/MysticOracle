/**
 * Hook for managing tarot article list state
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchAdminTarotArticles,
  deleteTarotArticle,
  updateTarotArticleStatus,
  reorderTarotArticle,
  TarotArticle,
} from '../../../../services/apiService';
import { CardType, ArticleStatus, PaginationState } from '../types';

interface UseArticleListOptions {
  initialLimit?: number;
}

interface ArticleListState {
  articles: TarotArticle[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  searchQuery: string;
  statusFilter: ArticleStatus | '';
  cardTypeFilter: CardType | '';
  actionLoading: string | null;
  isReordering: boolean;
}

export function useArticleList(options: UseArticleListOptions = {}) {
  const { initialLimit = 20 } = options;
  const { getToken } = useAuth();

  const [state, setState] = useState<ArticleListState>({
    articles: [],
    loading: true,
    error: null,
    pagination: { page: 1, limit: initialLimit, total: 0, totalPages: 0 },
    searchQuery: '',
    statusFilter: '',
    cardTypeFilter: '',
    actionLoading: null,
    isReordering: false,
  });

  // Load articles
  const loadArticles = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const token = await getToken();
      if (!token) return;

      const response = await fetchAdminTarotArticles(token, {
        page: state.pagination.page,
        limit: state.pagination.limit,
        search: state.searchQuery || undefined,
        cardType: state.cardTypeFilter || undefined,
        status: state.statusFilter || undefined,
      });

      setState((prev) => ({
        ...prev,
        articles: response.articles,
        pagination: {
          ...prev.pagination,
          total: response.total,
          totalPages: response.totalPages,
        },
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load articles';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      console.error('Error loading articles:', err);
    }
  }, [getToken, state.pagination.page, state.pagination.limit, state.searchQuery, state.cardTypeFilter, state.statusFilter]);

  // Effects
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Debounced search reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
    }, 500);
    return () => clearTimeout(timer);
  }, [state.searchQuery]);

  // Actions
  const setSearchQuery = (query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  };

  const setStatusFilter = (status: ArticleStatus | '') => {
    setState((prev) => ({
      ...prev,
      statusFilter: status,
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  const setCardTypeFilter = (cardType: CardType | '') => {
    setState((prev) => ({
      ...prev,
      cardTypeFilter: cardType,
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  const setPage = (page: number) => {
    setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const togglePublish = async (article: TarotArticle) => {
    try {
      setState((prev) => ({ ...prev, actionLoading: article.id }));
      const token = await getToken();
      if (!token) return;

      const newStatus: ArticleStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await updateTarotArticleStatus(token, article.id, newStatus);

      setState((prev) => ({
        ...prev,
        articles: prev.articles.map((a) => (a.id === article.id ? { ...a, status: newStatus } : a)),
        actionLoading: null,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      setState((prev) => ({ ...prev, error: message, actionLoading: null }));
      console.error('Error updating status:', err);
    }
  };

  const deleteArticle = async (articleId: string) => {
    try {
      setState((prev) => ({ ...prev, actionLoading: articleId }));
      const token = await getToken();
      if (!token) return;

      await deleteTarotArticle(token, articleId);

      setState((prev) => ({
        ...prev,
        articles: prev.articles.filter((a) => a.id !== articleId),
        pagination: { ...prev.pagination, total: prev.pagination.total - 1 },
        actionLoading: null,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move to trash';
      setState((prev) => ({ ...prev, error: message, actionLoading: null }));
      console.error('Error moving to trash:', err);
    }
  };

  const reorderArticles = async (
    articleId: string,
    cardType: string,
    newPosition: number,
    newArticlesOrder: TarotArticle[]
  ) => {
    try {
      setState((prev) => ({ ...prev, isReordering: true, articles: newArticlesOrder }));
      const token = await getToken();
      if (!token) throw new Error('No auth token');

      await reorderTarotArticle(token, { articleId, cardType, newPosition });

      setState((prev) => ({ ...prev, isReordering: false, error: null }));
    } catch (err) {
      // Revert and reload on error
      const message = err instanceof Error ? err.message : 'Failed to reorder article';
      setState((prev) => ({ ...prev, error: message, isReordering: false }));
      loadArticles();
      console.error('Error reordering:', err);
    }
  };

  // Determine if drag handles should be shown
  const canReorder = !state.searchQuery && !state.statusFilter && !!state.cardTypeFilter;

  return {
    ...state,
    canReorder,
    loadArticles,
    setSearchQuery,
    setStatusFilter,
    setCardTypeFilter,
    setPage,
    clearError,
    togglePublish,
    deleteArticle,
    reorderArticles,
  };
}
