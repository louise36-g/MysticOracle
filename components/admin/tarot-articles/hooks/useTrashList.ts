/**
 * Hook for managing tarot article trash state
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchAdminTarotArticles,
  restoreTarotArticle,
  permanentlyDeleteTarotArticle,
  emptyTarotArticlesTrash,
  TarotArticle,
} from '../../../../services/apiService';
import { PaginationState } from '../types';

interface UseTrashListOptions {
  initialLimit?: number;
}

interface TrashListState {
  articles: TarotArticle[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  actionLoading: string | null;
}

export function useTrashList(options: UseTrashListOptions = {}) {
  const { initialLimit = 20 } = options;
  const { getToken } = useAuth();

  const [state, setState] = useState<TrashListState>({
    articles: [],
    loading: true,
    error: null,
    pagination: { page: 1, limit: initialLimit, total: 0, totalPages: 0 },
    actionLoading: null,
  });

  // Load trash articles
  const loadTrash = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const token = await getToken();
      if (!token) return;

      const response = await fetchAdminTarotArticles(token, {
        page: state.pagination.page,
        limit: state.pagination.limit,
        deleted: true,
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
      const message = err instanceof Error ? err.message : 'Failed to load trash';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      console.error('Error loading trash:', err);
    }
  }, [getToken, state.pagination.page, state.pagination.limit]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  // Actions
  const setPage = (page: number) => {
    setState((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const restoreArticle = async (articleId: string): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, actionLoading: articleId }));
      const token = await getToken();
      if (!token) return false;

      await restoreTarotArticle(token, articleId);

      setState((prev) => ({
        ...prev,
        articles: prev.articles.filter((a) => a.id !== articleId),
        pagination: { ...prev.pagination, total: prev.pagination.total - 1 },
        actionLoading: null,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore article';
      setState((prev) => ({ ...prev, error: message, actionLoading: null }));
      console.error('Error restoring article:', err);
      return false;
    }
  };

  const permanentDelete = async (articleId: string): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, actionLoading: articleId }));
      const token = await getToken();
      if (!token) return false;

      await permanentlyDeleteTarotArticle(token, articleId);

      setState((prev) => ({
        ...prev,
        articles: prev.articles.filter((a) => a.id !== articleId),
        pagination: { ...prev.pagination, total: prev.pagination.total - 1 },
        actionLoading: null,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to permanently delete article';
      setState((prev) => ({ ...prev, error: message, actionLoading: null }));
      console.error('Error permanently deleting article:', err);
      return false;
    }
  };

  const emptyTrash = async (): Promise<boolean> => {
    try {
      const token = await getToken();
      if (!token) return false;

      await emptyTarotArticlesTrash(token);

      setState((prev) => ({
        ...prev,
        articles: [],
        pagination: { page: 1, limit: prev.pagination.limit, total: 0, totalPages: 0 },
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to empty trash';
      setState((prev) => ({ ...prev, error: message }));
      console.error('Error emptying trash:', err);
      return false;
    }
  };

  return {
    ...state,
    loadTrash,
    setPage,
    clearError,
    restoreArticle,
    permanentDelete,
    emptyTrash,
  };
}
