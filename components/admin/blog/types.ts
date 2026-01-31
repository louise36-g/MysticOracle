import type { BlogPost, BlogCategory, BlogTag, BlogMedia, ImportResult } from '../../../services/api';

export type TabType = 'posts' | 'categories' | 'tags' | 'media' | 'trash';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ConfirmModalState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  isDangerous?: boolean;
}

export interface BlogAdminContextValue {
  language: 'en' | 'fr';
  getToken: () => Promise<string | null>;

  // Data
  categories: BlogCategory[];
  tags: BlogTag[];

  // Loading states
  saving: boolean;
  setSaving: (saving: boolean) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Confirmation modal
  showConfirmModal: (config: Omit<ConfirmModalState, 'show'>) => void;
  hideConfirmModal: () => void;

  // Data reload functions
  loadPosts: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadTags: () => Promise<void>;
  loadMedia: () => Promise<void>;
  loadTrash: () => Promise<void>;
}

export type { BlogPost, BlogCategory, BlogTag, BlogMedia, ImportResult };
