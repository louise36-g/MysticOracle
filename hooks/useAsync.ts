import { useState, useCallback, useRef } from 'react';

/**
 * Result state for async operations
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Return type for useAsync hook
 */
export interface UseAsyncReturn<T, P extends unknown[]> {
  /** Current state of the async operation */
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Execute the async function */
  execute: (...params: P) => Promise<T | null>;
  /** Reset state to initial values */
  reset: () => void;
  /** Whether the operation has been executed at least once */
  hasRun: boolean;
}

/**
 * Options for useAsync hook
 */
export interface UseAsyncOptions<T> {
  /** Callback on successful execution */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Initial data value */
  initialData?: T | null;
}

/**
 * Hook for handling async operations with loading/error states.
 *
 * Unlike useFetchData, this hook:
 * - Does NOT auto-execute on mount
 * - Does NOT require authentication
 * - Is designed for mutations and manual triggers
 *
 * @example
 * ```tsx
 * const { execute, loading, error } = useAsync(async (id: string) => {
 *   const response = await fetch(`/api/items/${id}`);
 *   return response.json();
 * });
 *
 * // Later, trigger manually:
 * const result = await execute('123');
 * ```
 *
 * @example With callbacks
 * ```tsx
 * const { execute, loading } = useAsync(
 *   async (data: FormData) => submitForm(data),
 *   {
 *     onSuccess: (result) => toast.success('Saved!'),
 *     onError: (error) => toast.error(error),
 *   }
 * );
 * ```
 */
export function useAsync<T, P extends unknown[] = []>(
  asyncFn: (...params: P) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, P> {
  const { onSuccess, onError, initialData = null } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });
  const [hasRun, setHasRun] = useState(false);
  const mountedRef = useRef(true);

  // Track mounted state
  const setMounted = useCallback((mounted: boolean) => {
    mountedRef.current = mounted;
  }, []);

  // Cleanup on unmount
  useState(() => {
    return () => setMounted(false);
  });

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      setHasRun(true);

      try {
        const result = await asyncFn(...params);

        if (mountedRef.current) {
          setState({ data: result, loading: false, error: null });
          onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred';

        if (mountedRef.current) {
          setState(prev => ({ ...prev, loading: false, error: errorMessage }));
          onError?.(errorMessage);
        }

        return null;
      }
    },
    [asyncFn, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
    setHasRun(false);
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
    hasRun,
  };
}

/**
 * Hook for handling async operations that should execute immediately on mount.
 * Combines useAsync with auto-execution.
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useAsyncEffect(
 *   () => fetchUserProfile(),
 *   [userId]
 * );
 * ```
 */
export function useAsyncEffect<T>(
  asyncFn: () => Promise<T>,
  dependencies: unknown[] = [],
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, []> & { refetch: () => Promise<T | null> } {
  const { execute, ...rest } = useAsync(asyncFn, options);

  // Auto-execute on mount and when dependencies change
  useState(() => {
    execute();
  });

  // Re-execute when dependencies change (after initial mount)
  const depsRef = useRef(dependencies);
  useState(() => {
    const depsChanged = dependencies.some(
      (dep, i) => dep !== depsRef.current[i]
    );
    if (depsChanged) {
      depsRef.current = dependencies;
      execute();
    }
  });

  return {
    ...rest,
    execute,
    refetch: execute,
  };
}

export default useAsync;
