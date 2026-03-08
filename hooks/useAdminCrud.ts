import { useState, useCallback } from 'react';

export interface UseAdminCrudReturn {
  /** ID of the item currently being edited, or null */
  editingId: string | null;
  /** Whether the create form is visible */
  showNewForm: boolean;
  /** Whether a save/delete operation is in progress */
  saving: boolean;
  /** Error message from the last mutation, or null */
  error: string | null;

  /** Start editing an item by ID */
  startEditing: (id: string) => void;
  /** Cancel editing (clears editingId) */
  cancelEditing: () => void;
  /** Show the create form (closes any editing) */
  startCreating: () => void;
  /** Hide the create form */
  cancelCreating: () => void;
  /** Clear the error message */
  clearError: () => void;
  /** Set an error message manually */
  setError: (message: string) => void;

  /**
   * Wrap an async operation with saving/error state management.
   * Sets `saving = true` before, `saving = false` after.
   * On error, sets the error message. On success, optionally resets UI state.
   *
   * @param fn - The async operation to execute
   * @param options.resetOnSuccess - If true, clears editingId and showNewForm on success (default: true)
   * @param options.errorPrefix - Prefix for error messages (e.g., "Failed to create")
   */
  withSaving: <T>(
    fn: () => Promise<T>,
    options?: { resetOnSuccess?: boolean; errorPrefix?: string }
  ) => Promise<T | null>;
}

export function useAdminCrud(): UseAdminCrudReturn {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = useCallback((id: string) => {
    setEditingId(id);
    setShowNewForm(false);
    setError(null);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setError(null);
  }, []);

  const startCreating = useCallback(() => {
    setShowNewForm(true);
    setEditingId(null);
    setError(null);
  }, []);

  const cancelCreating = useCallback(() => {
    setShowNewForm(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withSaving = useCallback(async <T>(
    fn: () => Promise<T>,
    options?: { resetOnSuccess?: boolean; errorPrefix?: string }
  ): Promise<T | null> => {
    const { resetOnSuccess = true, errorPrefix } = options ?? {};

    try {
      setSaving(true);
      setError(null);
      const result = await fn();

      if (resetOnSuccess) {
        setEditingId(null);
        setShowNewForm(false);
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorPrefix ? `${errorPrefix}: ${message}` : message);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    editingId,
    showNewForm,
    saving,
    error,
    startEditing,
    cancelEditing,
    startCreating,
    cancelCreating,
    clearError,
    setError,
    withSaving,
  };
}

export default useAdminCrud;
