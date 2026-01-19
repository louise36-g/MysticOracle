/**
 * TarotArticlePage - Re-export from modular architecture
 *
 * This file maintains backwards compatibility with existing imports.
 * The component has been refactored into a modular structure at:
 * - components/tarot-article/TarotArticlePage.tsx (main component)
 * - components/tarot-article/hooks/ (custom hooks)
 * - components/tarot-article/*.tsx (sub-components)
 * - components/tarot-article/tarot-article.css (styles)
 *
 * For new code, prefer importing from 'components/tarot-article':
 * import { TarotArticlePage } from './tarot-article';
 */

// Import CSS for prose styles
import './tarot-article/tarot-article.css';

// Re-export the refactored component
export { TarotArticlePage, default } from './tarot-article';
