import { BlogPost as BlogPostType, BlogCategory, BlogTag } from '../api';

/**
 * SEOManager
 * Handles SEO meta tags, Open Graph, Twitter Cards, and JSON-LD structured data
 */
export class SEOManager {
  /**
   * Update page meta tags for SEO
   */
  updatePageMeta(post: BlogPostType, language: 'en' | 'fr'): void {
    const title = language === 'en'
      ? (post.metaTitleEn || post.titleEn)
      : (post.metaTitleFr || post.titleFr);
    const description = language === 'en'
      ? (post.metaDescEn || post.excerptEn)
      : (post.metaDescFr || post.excerptFr);
    const image = post.ogImage || post.coverImage;
    const url = window.location.href;

    // Update document title
    document.title = `${title} | CelestiArcana`;

    // Update or create meta tags
    this.updateOrCreateMeta('description', description);
    this.updateOrCreateMeta('author', post.authorName);

    // Open Graph tags
    this.updateOrCreateMeta('og:title', title, 'property');
    this.updateOrCreateMeta('og:description', description, 'property');
    this.updateOrCreateMeta('og:type', 'article', 'property');
    this.updateOrCreateMeta('og:url', url, 'property');
    if (image) this.updateOrCreateMeta('og:image', image, 'property');
    this.updateOrCreateMeta('og:site_name', 'CelestiArcana', 'property');
    this.updateOrCreateMeta('og:locale', language === 'en' ? 'en_US' : 'fr_FR', 'property');

    // Twitter Card tags
    this.updateOrCreateMeta('twitter:card', 'summary_large_image', 'name');
    this.updateOrCreateMeta('twitter:title', title, 'name');
    this.updateOrCreateMeta('twitter:description', description, 'name');
    if (image) this.updateOrCreateMeta('twitter:image', image, 'name');

    // Article specific meta
    if (post.publishedAt) {
      this.updateOrCreateMeta('article:published_time', post.publishedAt, 'property');
    }
    this.updateOrCreateMeta('article:author', post.authorName, 'property');

    // Add JSON-LD structured data
    this.addJsonLd(post, url, language);
  }

  /**
   * Reset meta tags when unmounting
   */
  resetPageMeta(): void {
    document.title = 'CelestiArcana - AI Tarot Readings';

    // Remove blog-specific meta tags
    const tagsToReset = [
      'og:type',
      'article:published_time',
      'article:author',
    ];
    tagsToReset.forEach((tag) => {
      const meta = document.querySelector(`meta[property="${tag}"]`);
      if (meta) meta.remove();
    });

    // Remove JSON-LD
    const jsonLd = document.querySelector('script[type="application/ld+json"][data-blog]');
    if (jsonLd) jsonLd.remove();
  }

  /**
   * Update or create a meta tag
   */
  private updateOrCreateMeta(key: string, value: string, attribute: 'name' | 'property' = 'name'): void {
    let meta = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, key);
      document.head.appendChild(meta);
    }
    meta.content = value;
  }

  /**
   * Add JSON-LD structured data
   */
  private addJsonLd(post: BlogPostType, url: string, lang: string): void {
    // Remove existing JSON-LD
    const existing = document.querySelector('script[type="application/ld+json"][data-blog]');
    if (existing) existing.remove();

    const title = lang === 'en' ? post.titleEn : post.titleFr;
    const description = lang === 'en' ? post.excerptEn : post.excerptFr;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': title,
      'description': description,
      'image': post.coverImage || '',
      'author': {
        '@type': 'Person',
        'name': post.authorName,
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'CelestiArcana',
        'logo': {
          '@type': 'ImageObject',
          'url': `${window.location.origin}/logo.png`,
        },
      },
      'datePublished': post.publishedAt,
      'dateModified': post.updatedAt,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': url,
      },
      'keywords': post.tags.map((t: BlogTag) => lang === 'en' ? t.nameEn : t.nameFr).join(', '),
      'articleSection': post.categories.map((c: BlogCategory) => lang === 'en' ? c.nameEn : c.nameFr).join(', '),
      'wordCount': Math.round(
        ((lang === 'en' ? post.contentEn : post.contentFr) || '').split(/\s+/).length
      ),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-blog', 'true');
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}
