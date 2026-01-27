import { useEffect, useLayoutEffect, useCallback, useRef, RefObject } from 'react';

interface UseContentInteractionsProps {
  contentRef: RefObject<HTMLDivElement>;
  sanitizedContent: string;
  onNavigate: (path: string) => void;
  onImageClick: (src: string) => void;
}

/**
 * Hook to set up click handlers on article content using EVENT DELEGATION
 *
 * Uses a single click handler on the container element that detects:
 * - FAQ accordion clicks (toggle data-expanded on .faq-item)
 * - Image clicks (trigger lightbox)
 * - Internal link clicks (SPA navigation)
 *
 * Event delegation eliminates race conditions with DOM updates since
 * the handler is attached to the container, not individual elements.
 *
 * FAQ state is persisted in a ref to survive re-renders and scrolling.
 * useLayoutEffect ensures state is restored synchronously before paint.
 */
export function useContentInteractions({
  contentRef,
  sanitizedContent,
  onNavigate,
  onImageClick,
}: UseContentInteractionsProps): void {

  // Persist FAQ expanded state across re-renders
  // Key: faq item index, Value: expanded state
  const faqStateRef = useRef<Map<number, boolean>>(new Map());

  // Track if we've initialized (to set first item expanded on first load)
  const initializedRef = useRef(false);

  // Restore FAQ state synchronously when content changes
  // Only runs when sanitizedContent changes (which replaces the DOM)
  // The scroll handler in useSectionNavigation was fixed to not trigger re-renders,
  // so we no longer need to run this after every render
  useLayoutEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || !sanitizedContent) return;

    const faqSection = contentEl.querySelector('.article-faq');
    if (!faqSection) return;

    const faqItems = faqSection.querySelectorAll('.faq-item');
    if (faqItems.length === 0) return;

    if (!initializedRef.current) {
      // First load - set initial state (first item expanded)
      initializedRef.current = true;
      faqItems.forEach((item, index) => {
        const isExpanded = index === 0;
        item.setAttribute('data-expanded', isExpanded ? 'true' : 'false');
        faqStateRef.current.set(index, isExpanded);
      });
    } else {
      // Content changed - restore saved state from ref
      faqItems.forEach((item, index) => {
        const savedState = faqStateRef.current.get(index);
        if (savedState !== undefined) {
          item.setAttribute('data-expanded', savedState ? 'true' : 'false');
        }
      });
    }
  }, [sanitizedContent, contentRef]); // Only run when content changes

  // Memoized click handler using event delegation
  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    // === FAQ ACCORDION ===
    // Check if click is on an H3 (or child of H3) inside .article-faq
    const h3Element = target.closest('h3');
    if (h3Element) {
      const faqSection = h3Element.closest('.article-faq');
      if (faqSection) {
        e.preventDefault();
        e.stopPropagation();

        // Find the parent .faq-item
        const faqItem = h3Element.closest('.faq-item');
        if (faqItem) {
          const isExpanded = faqItem.getAttribute('data-expanded') === 'true';
          const newState = !isExpanded;
          faqItem.setAttribute('data-expanded', newState ? 'true' : 'false');

          // Persist state - find index of this faq-item
          const allFaqItems = faqSection.querySelectorAll('.faq-item');
          const index = Array.from(allFaqItems).indexOf(faqItem);
          if (index !== -1) {
            faqStateRef.current.set(index, newState);
          }
        }
        return;
      }
    }

    // === IMAGE LIGHTBOX ===
    if (target.tagName === 'IMG') {
      e.preventDefault();
      const src = (target as HTMLImageElement).src;
      if (src) {
        onImageClick(src);
      }
      return;
    }

    // === LINK HANDLING ===
    const link = target.closest('a') as HTMLAnchorElement | null;
    if (link) {
      const href = link.getAttribute('href');
      const target_attr = link.getAttribute('target');

      // If link has target="_blank", let it open in new tab (don't intercept)
      if (target_attr === '_blank') {
        // Don't prevent default - let browser handle new tab
        return;
      }

      // Internal links (starting with /) - use SPA navigation
      if (href?.startsWith('/')) {
        e.preventDefault();
        onNavigate(href);
      }
      return;
    }
  }, [onNavigate, onImageClick]);

  // Set up event delegation on the content container
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || !sanitizedContent) return;

    // Add delegated click handler to container
    contentEl.addEventListener('click', handleClick);

    // cursor: zoom-in is applied via CSS (.prose img) to avoid
    // imperative DOM mutations that conflict with React re-renders

    return () => {
      contentEl.removeEventListener('click', handleClick);
    };
  }, [sanitizedContent, handleClick, contentRef]);
}
