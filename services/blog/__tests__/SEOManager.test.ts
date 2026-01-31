import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEOManager } from '../SEOManager';
import { BlogPost as BlogPostType } from '../../api';

// Mock blog post data
const mockPost: BlogPostType = {
  id: '1',
  titleEn: 'Test Blog Post',
  titleFr: 'Article de Blog Test',
  slug: 'test-blog-post',
  excerptEn: 'This is a test excerpt',
  excerptFr: 'Ceci est un extrait de test',
  contentEn: '<p>Test content in English</p>',
  contentFr: '<p>Contenu de test en français</p>',
  coverImage: 'https://example.com/image.jpg',
  coverImageAlt: 'Test image',
  ogImage: 'https://example.com/og-image.jpg',
  metaTitleEn: 'SEO Title English',
  metaTitleFr: 'Titre SEO Français',
  metaDescEn: 'SEO description in English',
  metaDescFr: 'Description SEO en français',
  authorName: 'John Doe',
  publishedAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  status: 'PUBLISHED',
  featured: false,
  viewCount: 100,
  readTimeMinutes: 5,
  categories: [
    { id: '1', slug: 'tarot', nameEn: 'Tarot', nameFr: 'Tarot', color: '#8b5cf6', sortOrder: 1 }
  ],
  tags: [
    { id: '1', slug: 'test', nameEn: 'Test', nameFr: 'Test' }
  ],
  faq: null,
  cta: null,
};

describe('SEOManager', () => {
  let manager: SEOManager;
  let originalTitle: string;
  let createdElements: Element[] = [];

  beforeEach(() => {
    manager = new SEOManager();
    originalTitle = document.title;
    createdElements = [];

    // Mock window.location.href
    vi.stubGlobal('location', {
      href: 'https://example.com/blog/test-post',
      origin: 'https://example.com'
    });
  });

  afterEach(() => {
    // Cleanup: restore original title
    document.title = originalTitle;

    // Remove all created meta tags
    createdElements.forEach(el => el.remove());
    createdElements = [];

    // Remove all blog-specific meta tags
    const metaTags = document.head.querySelectorAll('meta[property^="og:"], meta[property^="article:"], meta[property^="twitter:"], meta[name^="twitter:"]');
    metaTags.forEach(tag => tag.remove());

    // Remove JSON-LD scripts
    const jsonLdScripts = document.head.querySelectorAll('script[type="application/ld+json"][data-blog]');
    jsonLdScripts.forEach(script => script.remove());

    vi.unstubAllGlobals();
  });

  describe('updatePageMeta', () => {
    it('should update document title with post title', () => {
      manager.updatePageMeta(mockPost, 'en');

      expect(document.title).toBe('SEO Title English | MysticOracle');
    });

    it('should use French title when language is French', () => {
      manager.updatePageMeta(mockPost, 'fr');

      expect(document.title).toBe('Titre SEO Français | MysticOracle');
    });

    it('should fallback to titleEn if metaTitleEn is not set', () => {
      const postWithoutMetaTitle = { ...mockPost, metaTitleEn: undefined };
      manager.updatePageMeta(postWithoutMetaTitle, 'en');

      expect(document.title).toBe('Test Blog Post | MysticOracle');
    });

    it('should create description meta tag', () => {
      manager.updatePageMeta(mockPost, 'en');

      const meta = document.querySelector('meta[name="description"]');
      expect(meta).toBeTruthy();
      expect(meta?.getAttribute('content')).toBe('SEO description in English');
    });

    it('should create author meta tag', () => {
      manager.updatePageMeta(mockPost, 'en');

      const meta = document.querySelector('meta[name="author"]');
      expect(meta).toBeTruthy();
      expect(meta?.getAttribute('content')).toBe('John Doe');
    });

    it('should create Open Graph meta tags', () => {
      manager.updatePageMeta(mockPost, 'en');

      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const ogType = document.querySelector('meta[property="og:type"]');
      const ogUrl = document.querySelector('meta[property="og:url"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      const ogSiteName = document.querySelector('meta[property="og:site_name"]');
      const ogLocale = document.querySelector('meta[property="og:locale"]');

      expect(ogTitle?.getAttribute('content')).toBe('SEO Title English');
      expect(ogDesc?.getAttribute('content')).toBe('SEO description in English');
      expect(ogType?.getAttribute('content')).toBe('article');
      expect(ogUrl?.getAttribute('content')).toBe('https://example.com/blog/test-post');
      expect(ogImage?.getAttribute('content')).toBe('https://example.com/og-image.jpg');
      expect(ogSiteName?.getAttribute('content')).toBe('MysticOracle');
      expect(ogLocale?.getAttribute('content')).toBe('en_US');
    });

    it('should use French locale when language is French', () => {
      manager.updatePageMeta(mockPost, 'fr');

      const ogLocale = document.querySelector('meta[property="og:locale"]');
      expect(ogLocale?.getAttribute('content')).toBe('fr_FR');
    });

    it('should create Twitter Card meta tags', () => {
      manager.updatePageMeta(mockPost, 'en');

      const twitterCard = document.querySelector('meta[name="twitter:card"]');
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      const twitterDesc = document.querySelector('meta[name="twitter:description"]');
      const twitterImage = document.querySelector('meta[name="twitter:image"]');

      expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
      expect(twitterTitle?.getAttribute('content')).toBe('SEO Title English');
      expect(twitterDesc?.getAttribute('content')).toBe('SEO description in English');
      expect(twitterImage?.getAttribute('content')).toBe('https://example.com/og-image.jpg');
    });

    it('should use coverImage if ogImage is not set', () => {
      const postWithoutOgImage = { ...mockPost, ogImage: undefined };
      manager.updatePageMeta(postWithoutOgImage, 'en');

      const ogImage = document.querySelector('meta[property="og:image"]');
      expect(ogImage?.getAttribute('content')).toBe('https://example.com/image.jpg');
    });

    it('should create article meta tags', () => {
      manager.updatePageMeta(mockPost, 'en');

      const publishedTime = document.querySelector('meta[property="article:published_time"]');
      const author = document.querySelector('meta[property="article:author"]');

      expect(publishedTime?.getAttribute('content')).toBe('2024-01-01T00:00:00Z');
      expect(author?.getAttribute('content')).toBe('John Doe');
    });

    it('should create JSON-LD structured data', () => {
      manager.updatePageMeta(mockPost, 'en');

      const jsonLdScript = document.querySelector('script[type="application/ld+json"][data-blog]');
      expect(jsonLdScript).toBeTruthy();

      const jsonLd = JSON.parse(jsonLdScript?.textContent || '{}');
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('BlogPosting');
      expect(jsonLd.headline).toBe('Test Blog Post');
      expect(jsonLd.description).toBe('This is a test excerpt');
      expect(jsonLd.author.name).toBe('John Doe');
      expect(jsonLd.publisher.name).toBe('MysticOracle');
      expect(jsonLd.datePublished).toBe('2024-01-01T00:00:00Z');
      expect(jsonLd.dateModified).toBe('2024-01-02T00:00:00Z');
      expect(jsonLd.keywords).toBe('Test');
      expect(jsonLd.articleSection).toBe('Tarot');
    });

    it('should update existing meta tags instead of creating duplicates', () => {
      // First call
      manager.updatePageMeta(mockPost, 'en');
      const firstCallMetaCount = document.querySelectorAll('meta[property="og:title"]').length;

      // Second call with different data
      const updatedPost = { ...mockPost, metaTitleEn: 'Updated Title' };
      manager.updatePageMeta(updatedPost, 'en');
      const secondCallMetaCount = document.querySelectorAll('meta[property="og:title"]').length;

      expect(firstCallMetaCount).toBe(1);
      expect(secondCallMetaCount).toBe(1);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      expect(ogTitle?.getAttribute('content')).toBe('Updated Title');
    });
  });

  describe('resetPageMeta', () => {
    it('should reset document title to default', () => {
      // Set a custom title first
      document.title = 'Custom Title';

      manager.resetPageMeta();

      expect(document.title).toBe('MysticOracle - AI Tarot Readings');
    });

    it('should remove article-specific meta tags', () => {
      // Create article meta tags
      const meta1 = document.createElement('meta');
      meta1.setAttribute('property', 'og:type');
      meta1.content = 'article';
      document.head.appendChild(meta1);

      const meta2 = document.createElement('meta');
      meta2.setAttribute('property', 'article:published_time');
      meta2.content = '2024-01-01';
      document.head.appendChild(meta2);

      const meta3 = document.createElement('meta');
      meta3.setAttribute('property', 'article:author');
      meta3.content = 'Author';
      document.head.appendChild(meta3);

      manager.resetPageMeta();

      expect(document.querySelector('meta[property="og:type"]')).toBe(null);
      expect(document.querySelector('meta[property="article:published_time"]')).toBe(null);
      expect(document.querySelector('meta[property="article:author"]')).toBe(null);
    });

    it('should remove JSON-LD script', () => {
      // Create JSON-LD script
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-blog', 'true');
      script.textContent = '{}';
      document.head.appendChild(script);

      manager.resetPageMeta();

      expect(document.querySelector('script[type="application/ld+json"][data-blog]')).toBe(null);
    });
  });
});
