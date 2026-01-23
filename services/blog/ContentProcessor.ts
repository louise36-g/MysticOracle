import DOMPurify from 'dompurify';
import { processShortcodes } from '../../components/internal-links';
import { FAQItem, LinkRegistry, BlogPost as BlogPostType } from '../apiService';
import { ImageLayoutManager } from './ImageLayoutManager';

export interface ProcessedContent {
  contentBeforeFAQ: string;
  contentAfterFAQ: string;
  extractedFAQs: FAQItem[];
}

/**
 * ContentProcessor
 * Handles HTML sanitization, shortcode processing, FAQ extraction, and content splitting
 */
export class ContentProcessor {
  private imageLayoutManager: ImageLayoutManager;

  constructor() {
    this.imageLayoutManager = new ImageLayoutManager();
  }

  /**
   * Process raw HTML content into sanitized, structured output
   */
  processContent(
    rawContent: string,
    linkRegistry: LinkRegistry | null,
    isTarotNumerology: boolean,
    storedFAQs: FAQItem[]
  ): ProcessedContent {
    if (!rawContent) {
      return { contentBeforeFAQ: '', contentAfterFAQ: '', extractedFAQs: [] };
    }

    // Process internal link shortcodes first [[type:slug]] -> <a> tags
    const processedContent = processShortcodes(rawContent, linkRegistry);

    // Sanitize HTML with DOMPurify
    const sanitized = DOMPurify.sanitize(processedContent, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'figure',
        'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
        'width', 'height', 'loading', 'data-link-type'
      ],
      ALLOW_DATA_ATTR: true,
      ADD_ATTR: ['target', 'rel'],
      FORCE_BODY: true,
    });

    // Parse HTML into DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, 'text/html');

    // Make all links open in new tab
    this.processLinks(doc);

    // Remove FAQ sections from content
    this.removeFAQSections(doc);

    // Extract FAQs from HTML headings
    const extractedFAQs = this.extractFAQs(doc);

    // Remove stored FAQs from content
    this.removeStoredFAQs(doc, storedFAQs);

    // Remove static CTA banner
    this.removeCTABanner(doc);

    // Add section breaks for Tarot Numerology
    if (isTarotNumerology) {
      this.addSectionBreaks(doc);
    }

    // Process images: create flex containers, apply sizing
    this.imageLayoutManager.processImages(doc);

    // Get processed HTML
    const fullContent = doc.body.innerHTML;

    // Split content at [FAQ] marker
    return this.splitContentAtFAQMarker(fullContent, extractedFAQs);
  }

  /**
   * Make all links open in new tab
   */
  private processLinks(doc: Document): void {
    doc.querySelectorAll('a').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }

  /**
   * Remove all static FAQ sections from content
   */
  private removeFAQSections(doc: Document): void {
    const faqSelectors = [
      '.article-faq',
      '.faq',
      '.faq-section',
      '.faqs',
      '[class*="faq"]'
    ];

    faqSelectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => {
        // Also remove any FAQ heading before it
        const prevElement = el.previousElementSibling;
        if (prevElement && prevElement.tagName.match(/^H[23]$/i) &&
            prevElement.textContent?.toLowerCase().includes('faq')) {
          prevElement.remove();
        }
        el.remove();
      });
    });
  }

  /**
   * Extract FAQs from H2/H3 headings that end with "?"
   */
  private extractFAQs(doc: Document): FAQItem[] {
    const extractedFAQItems: FAQItem[] = [];

    doc.querySelectorAll('h2, h3, h4').forEach(heading => {
      const text = heading.textContent?.trim() || '';

      // Check if it's a FAQ-related heading (but skip the main "FAQ" section heading)
      const isFAQSectionHeading =
        text.toLowerCase().includes('frequently asked') ||
        text.toLowerCase() === 'faq';

      const isFaqQuestion = text.endsWith('?'); // FAQ questions typically end with ?

      if (isFAQSectionHeading) {
        // Just remove the FAQ section heading, don't extract it
        heading.remove();
      } else if (isFaqQuestion) {
        // Get the next sibling (the answer)
        const nextEl = heading.nextElementSibling;

        // Extract the question and answer
        if (nextEl && nextEl.tagName === 'P') {
          const answer = nextEl.textContent?.trim() || '';
          extractedFAQItems.push({
            question: text,
            answer: answer
          });

          // Remove both the question heading and answer paragraph
          heading.remove();
          nextEl.remove();
        } else {
          // No answer found, just remove the heading
          heading.remove();
        }
      }
    });

    return extractedFAQItems;
  }

  /**
   * Remove headings that match stored FAQ questions
   */
  private removeStoredFAQs(doc: Document, storedFAQs: FAQItem[]): void {
    if (storedFAQs.length === 0) return;

    const faqQuestions = new Set(
      storedFAQs.map(f => f.question.toLowerCase().trim())
    );

    doc.querySelectorAll('h3, h4').forEach(heading => {
      const headingText = heading.textContent?.trim().toLowerCase() || '';
      if (faqQuestions.has(headingText)) {
        // This heading matches a stored FAQ question - remove it and its answer
        const nextEl = heading.nextElementSibling;
        heading.remove();

        // Remove the following paragraph (the answer)
        if (nextEl && nextEl.tagName.toLowerCase() === 'p') {
          nextEl.remove();
        }
      }
    });
  }

  /**
   * Remove static CTA banner from content (we render it dynamically)
   */
  private removeCTABanner(doc: Document): void {
    const staticCta = doc.querySelector('.cta-banner');
    if (staticCta) {
      staticCta.remove();
    }
  }

  /**
   * Add section breaks for Tarot Numerology category
   */
  private addSectionBreaks(doc: Document): void {
    const h2Elements = doc.querySelectorAll('h2');
    h2Elements.forEach((h2, index) => {
      // Skip the first h2 (no break needed before it)
      if (index > 0) {
        const sectionBreak = doc.createElement('div');
        sectionBreak.className = 'numerology-section-break';
        // Build section break content safely using DOM methods
        const line1 = doc.createElement('div');
        line1.className = 'section-break-line';
        const symbol = doc.createElement('div');
        symbol.className = 'section-break-symbol';
        symbol.textContent = '✦';
        const line2 = doc.createElement('div');
        line2.className = 'section-break-line';
        sectionBreak.appendChild(line1);
        sectionBreak.appendChild(symbol);
        sectionBreak.appendChild(line2);
        h2.parentNode?.insertBefore(sectionBreak, h2);
      }
    });
  }

  /**
   * Split content at [FAQ] marker
   */
  private splitContentAtFAQMarker(fullContent: string, extractedFAQs: FAQItem[]): ProcessedContent {
    // Check for [FAQ] placeholder marker to position FAQ section
    // The marker can be in various formats: [FAQ], <p>[FAQ]</p>, etc.
    const faqMarkerRegex = /<p[^>]*>\s*\[FAQ\]\s*<\/p>|<div[^>]*>\s*\[FAQ\]\s*<\/div>|\[FAQ\]/gi;
    const faqMarkerMatch = fullContent.match(faqMarkerRegex);

    if (faqMarkerMatch) {
      // Split content at the FAQ marker
      const markerIndex = fullContent.search(faqMarkerRegex);
      const markerLength = faqMarkerMatch[0].length;

      return {
        contentBeforeFAQ: fullContent.substring(0, markerIndex),
        contentAfterFAQ: fullContent.substring(markerIndex + markerLength),
        extractedFAQs
      };
    }

    // If no [FAQ] marker found, put all content before FAQ (FAQ renders at end)
    return {
      contentBeforeFAQ: fullContent,
      contentAfterFAQ: '',
      extractedFAQs
    };
  }
}
