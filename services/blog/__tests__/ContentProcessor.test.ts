import { describe, it, expect, beforeEach } from 'vitest';
import { ContentProcessor } from '../ContentProcessor';
import { FAQItem } from '../../api';

describe('ContentProcessor', () => {
  let processor: ContentProcessor;

  beforeEach(() => {
    processor = new ContentProcessor();
  });

  describe('processContent', () => {
    it('should return empty content when input is empty', () => {
      const result = processor.processContent('', null, false, []);

      expect(result.contentBeforeFAQ).toBe('');
      expect(result.contentAfterFAQ).toBe('');
      expect(result.extractedFAQs).toEqual([]);
    });

    it('should sanitize HTML and remove dangerous tags', () => {
      const maliciousHTML = '<p>Safe content</p><script>alert("xss")</script><p>More content</p>';
      const result = processor.processContent(maliciousHTML, null, false, []);

      expect(result.contentBeforeFAQ).not.toContain('<script>');
      expect(result.contentBeforeFAQ).toContain('Safe content');
      expect(result.contentBeforeFAQ).toContain('More content');
    });

    it('should make all links open in new tab', () => {
      const htmlWithLink = '<p>Check out <a href="https://example.com">this link</a></p>';
      const result = processor.processContent(htmlWithLink, null, false, []);

      expect(result.contentBeforeFAQ).toContain('target="_blank"');
      expect(result.contentBeforeFAQ).toContain('rel="noopener noreferrer"');
    });

    it('should extract FAQs from headings ending with "?"', () => {
      const htmlWithFAQ = `
        <h2>Regular Heading</h2>
        <p>Regular content</p>
        <h3>What is tarot?</h3>
        <p>Tarot is a card reading system.</p>
        <h3>How does it work?</h3>
        <p>It provides insights through symbolism.</p>
      `;
      const result = processor.processContent(htmlWithFAQ, null, false, []);

      expect(result.extractedFAQs).toHaveLength(2);
      expect(result.extractedFAQs[0].question).toBe('What is tarot?');
      expect(result.extractedFAQs[0].answer).toBe('Tarot is a card reading system.');
      expect(result.extractedFAQs[1].question).toBe('How does it work?');
      expect(result.extractedFAQs[1].answer).toBe('It provides insights through symbolism.');
    });

    it('should not extract FAQ section heading', () => {
      const htmlWithFAQHeading = `
        <h2>Frequently Asked Questions</h2>
        <h3>What is tarot?</h3>
        <p>Answer here</p>
      `;
      const result = processor.processContent(htmlWithFAQHeading, null, false, []);

      expect(result.contentBeforeFAQ).not.toContain('Frequently Asked Questions');
      expect(result.extractedFAQs).toHaveLength(1);
    });

    it('should remove stored FAQs from content', () => {
      const storedFAQs: FAQItem[] = [
        { question: 'What is numerology?', answer: 'A mystical system' }
      ];
      const htmlWithStoredFAQ = `
        <h3>What is numerology?</h3>
        <p>This answer will be removed</p>
        <p>Other content remains</p>
      `;
      const result = processor.processContent(htmlWithStoredFAQ, null, false, storedFAQs);

      expect(result.contentBeforeFAQ).not.toContain('What is numerology?');
      expect(result.contentBeforeFAQ).toContain('Other content remains');
    });

    it('should remove CTA banner from content', () => {
      const htmlWithCTA = `
        <p>Content before</p>
        <div class="cta-banner">
          <h3>Get a Reading</h3>
          <a href="/reading">Click here</a>
        </div>
        <p>Content after</p>
      `;
      const result = processor.processContent(htmlWithCTA, null, false, []);

      expect(result.contentBeforeFAQ).not.toContain('cta-banner');
      expect(result.contentBeforeFAQ).not.toContain('Get a Reading');
      expect(result.contentBeforeFAQ).toContain('Content before');
      expect(result.contentBeforeFAQ).toContain('Content after');
    });

    it('should remove FAQ sections with various class names', () => {
      const htmlWithFAQSections = `
        <div class="article-faq">FAQ content</div>
        <div class="faq-section">More FAQ</div>
        <p>Regular content</p>
      `;
      const result = processor.processContent(htmlWithFAQSections, null, false, []);

      expect(result.contentBeforeFAQ).not.toContain('FAQ content');
      expect(result.contentBeforeFAQ).not.toContain('More FAQ');
      expect(result.contentBeforeFAQ).toContain('Regular content');
    });

    it('should split content at [FAQ] marker', () => {
      const htmlWithMarker = `
        <p>Content before FAQ</p>
        <p>[FAQ]</p>
        <p>Content after FAQ</p>
      `;
      const result = processor.processContent(htmlWithMarker, null, false, []);

      expect(result.contentBeforeFAQ).toContain('Content before FAQ');
      expect(result.contentBeforeFAQ).not.toContain('[FAQ]');
      expect(result.contentAfterFAQ).toContain('Content after FAQ');
      expect(result.contentAfterFAQ).not.toContain('[FAQ]');
    });

    it('should put all content before FAQ if no marker found', () => {
      const htmlWithoutMarker = '<p>All content here</p>';
      const result = processor.processContent(htmlWithoutMarker, null, false, []);

      expect(result.contentBeforeFAQ).toContain('All content here');
      expect(result.contentAfterFAQ).toBe('');
    });

    it('should add section breaks for Tarot Numerology category', () => {
      const htmlWithH2s = `
        <h2>First Section</h2>
        <p>Content</p>
        <h2>Second Section</h2>
        <p>More content</p>
      `;
      const result = processor.processContent(htmlWithH2s, null, true, []);

      // Should have section break before the second h2 (but not the first)
      expect(result.contentBeforeFAQ).toContain('numerology-section-break');
      expect(result.contentBeforeFAQ).toContain('section-break-symbol');
      expect(result.contentBeforeFAQ).toContain('✦');
    });

    it('should not add section breaks for non-Numerology content', () => {
      const htmlWithH2s = `
        <h2>First Section</h2>
        <h2>Second Section</h2>
      `;
      const result = processor.processContent(htmlWithH2s, null, false, []);

      expect(result.contentBeforeFAQ).not.toContain('numerology-section-break');
    });

    it('should handle complex content with multiple features', () => {
      const complexHTML = `
        <h2>Introduction</h2>
        <p>Learn about tarot</p>
        <h3>What is tarot?</h3>
        <p>Tarot answer here</p>
        <p><a href="https://example.com">External link</a></p>
        <p>[FAQ]</p>
        <h3>How to read cards?</h3>
        <p>Reading guide here</p>
        <div class="cta-banner">CTA content</div>
        <p>Final content</p>
      `;
      const result = processor.processContent(complexHTML, null, false, []);

      // Should extract FAQs
      expect(result.extractedFAQs).toHaveLength(2);

      // Should split at marker
      expect(result.contentBeforeFAQ).toContain('Learn about tarot');
      expect(result.contentAfterFAQ).toContain('Final content');

      // Should remove CTA
      expect(result.contentBeforeFAQ).not.toContain('cta-banner');
      expect(result.contentAfterFAQ).not.toContain('cta-banner');

      // Should make links target blank
      expect(result.contentBeforeFAQ).toContain('target="_blank"');
    });
  });
});
