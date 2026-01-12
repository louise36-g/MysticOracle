/**
 * Translation Service - Client-side translation caching with version-based invalidation
 *
 * Stores translations in localStorage with version tracking.
 * On load: returns cached data immediately, checks version in background.
 * If server version > local version: refetches and dispatches 'translations-updated' event.
 */

import { Language } from '../types';

// API URL configuration
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = rawUrl.replace(/\/api$/, '');

// Storage keys
const STORAGE_KEY = 'mystic_translations';
const VERSION_KEY = 'mystic_translations_version';

// Cache configuration
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes - check version after this

// Types
export interface TranslationData {
  translations: Record<string, string>;
  language: Language;
  version: number;
  timestamp: number;
}

interface TranslationsResponse {
  translations: Record<string, string>;
  version: number;
}

interface VersionResponse {
  entity: string;
  version: number;
}

/**
 * Get cached translations from localStorage
 */
function getCachedTranslations(language: Language): TranslationData | null {
  try {
    const cached = localStorage.getItem(`${STORAGE_KEY}_${language}`);
    if (!cached) return null;
    return JSON.parse(cached) as TranslationData;
  } catch {
    return null;
  }
}

/**
 * Save translations to localStorage
 */
function setCachedTranslations(data: TranslationData): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${data.language}`, JSON.stringify(data));
    localStorage.setItem(`${VERSION_KEY}_${data.language}`, data.version.toString());
  } catch (e) {
    console.warn('[TranslationService] Failed to cache translations:', e);
  }
}

/**
 * Get cached version number
 */
function getCachedVersion(language: Language): number {
  try {
    const version = localStorage.getItem(`${VERSION_KEY}_${language}`);
    return version ? parseInt(version, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch translations from the server
 */
async function fetchTranslationsFromServer(language: Language): Promise<TranslationsResponse | null> {
  try {
    const response = await fetch(`${API_URL}/api/translations/${language}`);
    if (!response.ok) {
      console.error('[TranslationService] Failed to fetch translations:', response.status);
      return null;
    }
    return response.json();
  } catch (e) {
    console.error('[TranslationService] Error fetching translations:', e);
    return null;
  }
}

/**
 * Fetch current version from server
 */
async function fetchVersionFromServer(): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/api/translations/version`);
    if (!response.ok) return 0;
    const data: VersionResponse = await response.json();
    return data.version || 0;
  } catch {
    return 0;
  }
}

/**
 * Check if cache is stale (needs version check)
 */
function isCacheStale(cached: TranslationData): boolean {
  return Date.now() - cached.timestamp > STALE_THRESHOLD_MS;
}

/**
 * Dispatch event when translations are updated
 */
function dispatchTranslationsUpdated(language: Language): void {
  window.dispatchEvent(new CustomEvent('translations-updated', {
    detail: { language }
  }));
}

/**
 * Load translations for a language
 * Returns cached immediately if available, then checks for updates in background
 */
export async function loadTranslations(language: Language): Promise<Record<string, string>> {
  const cached = getCachedTranslations(language);

  // If we have cached data, return it immediately
  if (cached) {
    // Check for updates in background if cache is stale
    if (isCacheStale(cached)) {
      checkForUpdates(language, cached.version);
    }
    return cached.translations;
  }

  // No cache - must fetch synchronously
  const serverData = await fetchTranslationsFromServer(language);

  if (serverData) {
    const data: TranslationData = {
      translations: serverData.translations,
      language,
      version: serverData.version,
      timestamp: Date.now()
    };
    setCachedTranslations(data);
    return data.translations;
  }

  // Fallback to empty object if server fetch fails
  console.warn('[TranslationService] No translations available, using empty fallback');
  return {};
}

/**
 * Background check for translation updates
 */
async function checkForUpdates(language: Language, localVersion: number): Promise<void> {
  const serverVersion = await fetchVersionFromServer();

  if (serverVersion > localVersion) {
    console.log(`[TranslationService] New version available (${localVersion} -> ${serverVersion}), refetching...`);

    const serverData = await fetchTranslationsFromServer(language);
    if (serverData) {
      const data: TranslationData = {
        translations: serverData.translations,
        language,
        version: serverData.version,
        timestamp: Date.now()
      };
      setCachedTranslations(data);
      dispatchTranslationsUpdated(language);
    }
  }
}

/**
 * Force refresh translations (used after admin mutations)
 */
export async function refreshTranslations(language: Language): Promise<Record<string, string>> {
  const serverData = await fetchTranslationsFromServer(language);

  if (serverData) {
    const data: TranslationData = {
      translations: serverData.translations,
      language,
      version: serverData.version,
      timestamp: Date.now()
    };
    setCachedTranslations(data);
    return data.translations;
  }

  // Return cached if refresh fails
  const cached = getCachedTranslations(language);
  return cached?.translations || {};
}

/**
 * Clear cached translations (useful for logout or language change)
 */
export function clearTranslationCache(language?: Language): void {
  try {
    if (language) {
      localStorage.removeItem(`${STORAGE_KEY}_${language}`);
      localStorage.removeItem(`${VERSION_KEY}_${language}`);
    } else {
      // Clear all languages
      ['en', 'fr'].forEach(lang => {
        localStorage.removeItem(`${STORAGE_KEY}_${lang}`);
        localStorage.removeItem(`${VERSION_KEY}_${lang}`);
      });
    }
  } catch (e) {
    console.warn('[TranslationService] Failed to clear cache:', e);
  }
}

/**
 * Create a translation function bound to loaded translations
 */
export function createTranslationFunction(
  translations: Record<string, string>
): (key: string, fallback?: string) => string {
  return (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };
}

/**
 * Get translation with fallback
 */
export function translate(
  translations: Record<string, string>,
  key: string,
  fallback?: string
): string {
  return translations[key] || fallback || key;
}
