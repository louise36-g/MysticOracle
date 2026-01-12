import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

export interface UseFetchDataOptions<T, P = void> {
  fetchFn: (token: string, params: P) => Promise<T>;
  params?: P;
  dependencies?: unknown[];
  enabled?: boolean;
  debounceMs?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  initialData?: T | null;
}

export interface UseFetchDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFetchData<T, P = void>({
  fetchFn,
  params,
  dependencies = [],
  enabled = true,
  debounceMs = 0,
  onSuccess,
  onError,
  initialData = null,
}: UseFetchDataOptions<T, P>): UseFetchDataResult<T> {
  const { getToken } = useAuth();
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const result = await fetchFn(token, params as P);

      if (mountedRef.current) {
        setData(result);
        setError(null);
        onSuccess?.(result);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [getToken, fetchFn, params, enabled, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;

    if (debounceMs > 0) {
      const timeoutId = setTimeout(() => {
        fetchData();
      }, debounceMs);

      return () => {
        clearTimeout(timeoutId);
        mountedRef.current = false;
        abortControllerRef.current?.abort();
      };
    }

    fetchData();

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, debounceMs, ...dependencies]);

  return { data, loading, error, refetch };
}

export interface UseFetchPaginatedOptions<T, P = void> {
  fetchFn: (token: string, params: P & { page: number; limit: number }) => Promise<{
    items: T[];
    pagination: {
      page: number;
      totalPages: number;
      total: number;
      limit: number;
    };
  }>;
  params?: P;
  limit?: number;
  dependencies?: unknown[];
  enabled?: boolean;
  debounceMs?: number;
}

export interface UseFetchPaginatedResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

export function useFetchPaginated<T, P = void>({
  fetchFn,
  params,
  limit = 15,
  dependencies = [],
  enabled = true,
  debounceMs = 0,
}: UseFetchPaginatedOptions<T, P>): UseFetchPaginatedResult<T> {
  const { getToken } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const result = await fetchFn(token, { ...params, page, limit } as P & {
        page: number;
        limit: number;
      });

      if (mountedRef.current) {
        setData(result.items);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [getToken, fetchFn, params, page, limit, enabled]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;

    if (debounceMs > 0) {
      const timeoutId = setTimeout(() => {
        fetchData();
      }, debounceMs);

      return () => {
        clearTimeout(timeoutId);
        mountedRef.current = false;
      };
    }

    fetchData();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, debounceMs, ...dependencies]);

  return { data, loading, error, page, totalPages, total, setPage, refetch };
}

export default useFetchData;
