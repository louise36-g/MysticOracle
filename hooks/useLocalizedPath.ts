import { useApp } from '../context/AppContext';
import { localizedPath } from '../utils/language';

/**
 * Returns a language-prefixed path based on the current language.
 * Use when you need the path as a string (e.g. for navigate() calls).
 *
 * Usage: const blogPath = useLocalizedPath('/blog');
 *   - On English page → '/blog'
 *   - On French page  → '/fr/blog'
 */
export function useLocalizedPath(path: string): string {
  const { language } = useApp();
  return localizedPath(path, language);
}
