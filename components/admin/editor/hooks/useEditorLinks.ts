import { useState } from 'react';
import { fetchLinkRegistry } from '../../../../services/api';
import {
  scanForLinkableTerms,
  applyLinkSuggestions,
  type LinkSuggestion,
} from '../../../internal-links';

interface UseEditorLinksOptions {
  /** Returns the content string for the currently active edit language. */
  getContent: () => string;
  /** Current article/post slug (used to prevent self-linking). */
  slug: string;
  /** UI language ('en' | 'fr') for error messages. */
  language: string;
  /** Called with the updated content after link insertion. */
  onContentUpdate: (content: string) => void;
  /** Called when an error occurs. */
  onError: (message: string) => void;
}

/**
 * Shared internal-link scanning and insertion logic for both editors.
 *
 * Manages the link modal state, scans content for linkable terms
 * via the link registry, and applies selected link suggestions.
 */
export function useEditorLinks({
  getContent,
  slug,
  language,
  onContentUpdate,
  onError,
}: UseEditorLinksOptions) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([]);
  const [scanningLinks, setScanningLinks] = useState(false);

  const handleOpenLinkModal = async () => {
    const content = getContent();
    if (!content.trim()) {
      onError(
        language === 'en'
          ? 'Add some content first before adding internal links'
          : "Ajoutez du contenu avant d'ajouter des liens internes"
      );
      return;
    }

    try {
      setScanningLinks(true);
      const registry = await fetchLinkRegistry();
      const suggestions = scanForLinkableTerms(content, registry, {
        skipExistingLinks: false,
        currentArticleSlug: slug,
      });

      setLinkSuggestions(suggestions);
      setShowLinkModal(true);
    } catch (err) {
      console.error('Failed to scan for links:', err);
      onError(
        language === 'en'
          ? 'Failed to scan for linkable content'
          : "Échec de l'analyse du contenu"
      );
    } finally {
      setScanningLinks(false);
    }
  };

  const handleApplyLinks = (selected: LinkSuggestion[]) => {
    const content = getContent();
    const updatedContent = applyLinkSuggestions(content, selected);
    onContentUpdate(updatedContent);
  };

  const closeLinkModal = () => setShowLinkModal(false);

  return {
    showLinkModal,
    linkSuggestions,
    scanningLinks,
    handleOpenLinkModal,
    handleApplyLinks,
    closeLinkModal,
  };
}
