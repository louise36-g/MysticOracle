import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { processShortcodes } from '../../internal-links';
import type { LinkRegistry } from '../../../services/api';

// DOMPurify sanitization config
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'figure',
    'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div', 'cite', 'nav',
    'svg', 'path', 'circle', 'rect', 'g',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
    'width', 'height', 'loading', 'data-width', 'data-align', 'data-link-type',
    'data-section-type', 'data-expanded', 'data-faq-index', 'data-reversed',
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

  // External links open in new tab; internal links use SPA navigation
  const links = doc.querySelectorAll('a');
  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const isInternal = href.startsWith('/') || href.includes('celestiarcana.com');
    if (!isInternal) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // Auto-detect section divider paragraphs (✦ stars) and add styling class
  doc.querySelectorAll('p').forEach((p) => {
    const text = p.textContent?.trim() || '';
    if (/^[✦\s\u00a0]+$/.test(text) && text.includes('✦')) {
      p.classList.add('section-divider');
    }
  });

  // Optimize Cloudinary images: add auto-format, compression, width limit, and lazy loading
  const images = doc.querySelectorAll('img');
  images.forEach((img) => {
    const src = img.getAttribute('src');
    if (src) {
      const cloudinaryMatch = src.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)/);
      if (cloudinaryMatch) {
        const [, base, rest] = cloudinaryMatch;
        // Strip existing transforms if present (e.g. v1234/...) and re-apply
        img.setAttribute('src', `${base}f_auto,q_auto:good,w_800,c_limit/${rest}`);
      }
      // Lazy-load all content images (featured image is separate with eager loading)
      img.setAttribute('loading', 'lazy');
    }
  });

  // Strip inline styles from containers (not images) - includes hr for consistent break markers
  // But preserve text-align: center on paragraphs (for Keywords sections)
  const containersToStrip = doc.querySelectorAll(
    '.key-takeaways, .key-takeaways-container, .quick-reference, .article-faq, .cta-banner, .symbols-section, blockquote, h2, h3, ul, ol, li, table, tr, td, th, span, hr, div:not(.key-takeaways):not(.key-takeaways-container):not(.quick-reference):not(.article-faq):not(.cta-banner):not(.symbols-section)'
  );
  containersToStrip.forEach((el) => el.removeAttribute('style'));

  // For paragraphs, only strip styles that are NOT text-align: center
  const paragraphs = doc.querySelectorAll('p');
  paragraphs.forEach((p) => {
    const style = p.getAttribute('style');
    if (style && !style.includes('text-align: center') && !style.includes('text-align:center')) {
      p.removeAttribute('style');
    }
  });

  // FIRST: Wrap "Key Takeaways" H2 section in key-takeaways-container
  // Must happen BEFORE upright/reversed wrapping to prevent nesting issues
  // Supports both English and French variants
  const keyTakeawaysH2s = doc.querySelectorAll('h2');
  keyTakeawaysH2s.forEach((h2) => {
    const text = h2.textContent?.toLowerCase() || '';
    // English: "key takeaways", French: "points clés", "à retenir", "l'essentiel"
    const isKeyTakeaways = text.includes('key takeaways') ||
      text.includes('points clés') ||
      text.includes('points cles') ||
      text.includes('à retenir') ||
      text.includes('a retenir') ||
      text.includes("l'essentiel") ||
      text.includes('lessentiel');
    if (!isKeyTakeaways) return;

    // Skip if already in a key-takeaways container
    if (h2.closest('.key-takeaways-container') || h2.closest('.key-takeaways')) return;

    // Create the wrapper
    const wrapper = doc.createElement('div');
    wrapper.className = 'key-takeaways-container';

    // Insert wrapper before the H2
    h2.parentNode?.insertBefore(wrapper, h2);
    wrapper.appendChild(h2);

    // Collect following P elements until we hit another H2 or non-P element
    let nextEl = wrapper.nextElementSibling;
    while (nextEl && nextEl.tagName === 'P') {
      const next = nextEl.nextElementSibling;
      wrapper.appendChild(nextEl);
      nextEl = next;
    }
  });

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
        // Skip elements already wrapped in special containers
        if (nextEl.classList?.contains('key-takeaways-container') ||
            nextEl.classList?.contains('key-takeaways') ||
            nextEl.classList?.contains('article-faq')) {
          break;
        }
        // Stop before section dividers — they sit between sections, not inside
        if (nextEl.classList?.contains('section-divider')) {
          break;
        }
        // Stop at Yes/No H3 heading — it is a standalone section, not part of Reversed
        if (nextEl.tagName === 'H3') {
          const h3Text = (nextEl as HTMLElement).textContent?.toLowerCase() || '';
          if (h3Text.includes('yes or no') || h3Text.includes('oui ou non')) {
            break;
          }
        }
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

      // Add horizontal rule before FAQ section
      const hr = doc.createElement('hr');
      h2.parentNode?.insertBefore(hr, h2);
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

  // Wrap Symbols section in styled container (like Key Takeaways)
  const allH3s = doc.querySelectorAll('h3');
  allH3s.forEach((h3) => {
    // Skip if already in a special container
    if (h3.closest('.article-faq') || h3.closest('.key-takeaways') || h3.closest('.key-takeaways-container') || h3.closest('.symbols-section')) return;

    const text = h3.textContent?.toLowerCase() || '';
    if (text.includes('symbol') || text.includes('imagery')) {
      const wrapper = doc.createElement('div');
      wrapper.className = 'symbols-section';

      h3.parentNode?.insertBefore(wrapper, h3);
      wrapper.appendChild(h3);

      // Only collect P and UL elements that immediately follow (stop at any heading or other element)
      let nextEl = wrapper.nextElementSibling;
      while (nextEl && (nextEl.tagName === 'P' || nextEl.tagName === 'UL' || nextEl.tagName === 'OL')) {
        const next = nextEl.nextElementSibling;
        wrapper.appendChild(nextEl);
        nextEl = next;
      }
    }
  });

  // Add life area classes to H3s (skip FAQ and symbols sections)
  const h3s = doc.querySelectorAll('h3');
  h3s.forEach((h3) => {
    if (h3.closest('.article-faq') || h3.closest('.symbols-section')) return;

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
  // Get language to prefix internal links with /fr/ on French pages
  const lang = typeof document !== 'undefined'
    ? (document.documentElement.lang || 'en')
    : 'en';

  return useMemo(() => {
    if (!content) return '';

    // Process shortcodes first
    let html = processShortcodes(content, linkRegistry);

    // Sanitize
    html = DOMPurify.sanitize(html, SANITIZE_CONFIG);

    // Process structure
    html = processContent(html);

    // Prefix internal links with /fr/ on French pages
    if (lang === 'fr') {
      html = html.replace(
        /href="(https:\/\/celestiarcana\.com)(\/(?:tarot|blog|horoscopes|daily-tarot|about|faq|contact|reading|privacy|terms|cookies|how-credits-work)[^"]*)/g,
        'href="$1/fr$2'
      );
    }

    return html;
  }, [content, linkRegistry, lang]);
}

// useContentInteractions has been moved to its own file for better separation
