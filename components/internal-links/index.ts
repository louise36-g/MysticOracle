/**
 * Internal Links Module
 *
 * SEO internal linking system for content editors.
 */

export {
  scanForLinkableTerms,
  applyLinkSuggestions,
  type LinkSuggestion,
  type ScanOptions,
} from './contentScanner';

export {
  processShortcodes,
  extractShortcodes,
  validateShortcodes,
  countShortcodes,
  stripShortcodes,
  getUrlForType,
  type LinkType,
} from './shortcodeProcessor';

export { default as LinkSuggestionModal } from './LinkSuggestionModal';
