/**
 * Shared types for Tarot Articles Admin
 */

export type TabType = 'articles' | 'categories' | 'tags' | 'media' | 'trash';
export type CardType = 'MAJOR_ARCANA' | 'SUIT_OF_WANDS' | 'SUIT_OF_CUPS' | 'SUIT_OF_SWORDS' | 'SUIT_OF_PENTACLES';
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ConfirmModal {
  show: boolean;
  title: string;
  message: string;
  isDangerous?: boolean;
  onConfirm: () => void;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Badge configurations
export const CARD_TYPE_BADGES: Record<CardType, { bg: string; text: string; label: string }> = {
  MAJOR_ARCANA: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Major Arcana' },
  SUIT_OF_WANDS: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Wands' },
  SUIT_OF_CUPS: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Cups' },
  SUIT_OF_SWORDS: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Swords' },
  SUIT_OF_PENTACLES: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Pentacles' },
};

// Utility functions
export const formatDate = (dateString: string, language: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
