import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { processShortcodes } from '../../internal-links';
import type { LinkRegistry } from '../../../services/apiService';

// DOMPurify sanitization config
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'figure',
    'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div', 'cite',
    'svg', 'path', 'circle', 'rect', 'g',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'target', 'rel',
    'width', 'height', 'loading', 'data-width', 'data-align', 'data-link-type',
    'data-section-type', 'data-expanded', 'data-faq-index',
    'viewBox', 'fill', 'd', 'xmlns', 'stroke', 'stroke-width',
  ],
  ADD_ATTR: ['target', 'rel'],
  FORCE_BODY: true,
};

/**
 * Process HTML content: sanitize, add section markers, wrap FAQ items
 */
function processContent(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Strip inline styles from containers (not images)
  const containersToStrip = doc.querySelectorAll(
    '.key-takeaways, .quick-reference, .article-faq, .cta-banner, blockquote, h2, h3, p, ul, ol, li, table, tr, td, th, span, div:not(.key-takeaways):not(.quick-reference):not(.article-faq):not(.cta-banner)'
  );
  containersToStrip.forEach((el) => el.removeAttribute('style'));

  // Add section-type attributes to H2s and wrap content
  const h2s = doc.querySelectorAll('h2');
  h2s.forEach((h2) => {
    const text = h2.textContent?.toLowerCase() || '';

    let sectionType = '';
    if (text.includes('upright') && !text.includes('reversed')) {
      sectionType = 'upright';
    } else if (text.includes('reversed')) {
      sectionType = 'reversed';
    }

    if (sectionType) {
      h2.setAttribute('data-section-type', sectionType);

      // Wrap following content until next H2 in a section div
      let nextEl = h2.nextElementSibling;
      const wrapper = doc.createElement('div');
      wrapper.className = `section-${sectionType}`;
      wrapper.setAttribute('data-section-type', sectionType);

      h2.parentNode?.insertBefore(wrapper, h2);
      wrapper.appendChild(h2);

      while (nextEl && nextEl.tagName !== 'H2') {
        const next = nextEl.nextElementSibling;
        wrapper.appendChild(nextEl);
        nextEl = next;
      }
    }
  });

  // Process FAQ sections
  const allH2s = doc.querySelectorAll('h2');
  allH2s.forEach((h2) => {
    const text = h2.textContent?.toLowerCase() || '';
    if (text.includes('frequently asked') || text.includes('faq')) {
      const faqWrapper = doc.createElement('div');
      faqWrapper.className = 'article-faq';

      h2.parentNode?.insertBefore(faqWrapper, h2);
      faqWrapper.appendChild(h2);

      const elements: Element[] = [];
      let nextEl = faqWrapper.nextElementSibling;
      while (nextEl && nextEl.tagName !== 'H2') {
        elements.push(nextEl);
        nextEl = nextEl.nextElementSibling;
      }

      let faqIndex = 0;
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.tagName === 'H3') {
          const faqItem = doc.createElement('div');
          faqItem.className = 'faq-item';
          faqItem.setAttribute('data-expanded', faqIndex === 0 ? 'true' : 'false');

          faqItem.appendChild(el);

          if (i + 1 < elements.length && elements[i + 1].tagName === 'P') {
            faqItem.appendChild(elements[i + 1]);
            i++;
          }

          faqWrapper.appendChild(faqItem);
          faqIndex++;
        } else if (el.tagName !== 'P') {
          faqWrapper.appendChild(el);
        }
      }
    }
  });

  // Add life area classes to H3s (skip FAQ section)
  const h3s = doc.querySelectorAll('h3');
  h3s.forEach((h3) => {
    if (h3.closest('.article-faq')) return;

    const text = h3.textContent?.toLowerCase() || '';
    let lifeArea = '';

    if (text.includes('love') || text.includes('relationship')) {
      lifeArea = 'love';
    } else if (text.includes('career') || text.includes('work') || text.includes('finance')) {
      lifeArea = 'career';
    } else if (text.includes('spiritual') || text.includes('growth')) {
      lifeArea = 'spiritual';
    } else if (text.includes('decision')) {
      lifeArea = 'decisions';
    }

    if (lifeArea) {
      h3.classList.add(`life-area-${lifeArea}`);
    }
  });

  return doc.body.innerHTML;
}

interface UseContentProcessorProps {
  content: string | undefined;
  linkRegistry: LinkRegistry | null;
}

/**
 * Hook to process and sanitize article content
 */
export function useContentProcessor({
  content,
  linkRegistry,
}: UseContentProcessorProps): string {
  return useMemo(() => {
    if (!content) return '';

    // Process shortcodes first
    let html = processShortcodes(content, linkRegistry);

    // Sanitize
    html = DOMPurify.sanitize(html, SANITIZE_CONFIG);

    // Process structure
    return processContent(html);
  }, [content, linkRegistry]);
}

// useContentInteractions has been moved to its own file for better separation
