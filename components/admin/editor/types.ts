import React from 'react';
import { BlogMedia } from '../../../services/apiService';

export interface EditorLanguage {
  code: string;
  name: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: EditorLanguage[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export interface EditorTopBarProps {
  title: string;
  isNew?: boolean;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  language: 'en' | 'fr';
  // Optional bilingual support
  editLanguage?: string;
  onEditLanguageChange?: (lang: string) => void;
  // Optional preview
  previewUrl?: string;
  isPublished?: boolean;
  // Optional publish button
  showPublish?: boolean;
  onPublish?: () => void;
  // Optional editor mode toggle
  editorMode?: 'visual' | 'markdown';
  onEditorModeChange?: (mode: 'visual' | 'markdown') => void;
}

export interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export interface TaxonomyItem {
  id: string;
  name?: string;
  nameEn?: string;
  nameFr?: string;
}

export interface TaxonomySelectorProps {
  title: string;
  items: TaxonomyItem[];
  selectedIds?: string[];
  selectedNames?: string[];
  onChange: (ids: string[]) => void;
  onChangeNames?: (names: string[]) => void;
  useNames?: boolean;
  language: 'en' | 'fr';
  emptyMessage?: string;
}

export interface CoverImageSectionProps {
  imageUrl?: string;
  imageAlt?: string;
  onImageChange: (url: string, alt?: string) => void;
  mediaLibrary: BlogMedia[];
  onMediaUpload: (file: File) => Promise<string>;
  onMediaDelete?: (id: string) => Promise<void>;
  language: 'en' | 'fr';
  uploading?: boolean;
}

export interface ContentEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  mediaLibrary: BlogMedia[];
  onMediaUpload: (file: File) => Promise<string>;
  onMediaDelete?: (id: string) => Promise<void>;
  editorMode?: 'visual' | 'markdown';
  language?: 'en' | 'fr';
}
