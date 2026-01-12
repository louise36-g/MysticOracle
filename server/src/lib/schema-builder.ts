// lib/schema-builder.ts
// JSON-LD Schema Builder for Tarot Articles

// ============================================
// TYPES
// ============================================

interface FAQItem {
  question: string;
  answer: string;
}

interface TarotArticleData {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  datePublished: Date | string;
  dateModified: Date | string;
  featuredImage: string;
  featuredImageAlt?: string;
  cardType: string;
  faq: FAQItem[];
  breadcrumbCategory?: string;
  breadcrumbCategoryUrl?: string;
}

interface SiteConfig {
  name: string;
  url: string;
  logo: string;
  defaultAuthor: {
    name: string;
    url: string;
  };
  categoryUrls: Record<string, string>;
}

interface ArticleSchema {
  '@type': 'Article';
  headline: string;
  description: string;
  image: string;
  author: {
    '@type': 'Person';
    name: string;
    url: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
}

interface FAQSchema {
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

interface BreadcrumbSchema {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

interface CompleteSchema {
  '@context': 'https://schema.org';
  '@graph': Array<ArticleSchema | FAQSchema | BreadcrumbSchema>;
}

// ============================================
// SITE CONFIGURATION
// ============================================

export const SITE_CONFIG: SiteConfig = {
  name: process.env.SITE_NAME || 'MysticOracle',
  url: process.env.SITE_URL || 'https://mysticoracle.com',
  logo:
    process.env.SITE_LOGO ||
    `${process.env.SITE_URL || 'https://mysticoracle.com'}/images/logo.png`,
  defaultAuthor: {
    name: process.env.DEFAULT_AUTHOR_NAME || 'MysticOracle',
    url:
      process.env.DEFAULT_AUTHOR_URL ||
      `${process.env.SITE_URL || 'https://mysticoracle.com'}/about`,
  },
  categoryUrls: {
    'Major Arcana': '/tarot/major-arcana',
    MAJOR_ARCANA: '/tarot/major-arcana',
    'Suit of Wands': '/tarot/wands',
    SUIT_OF_WANDS: '/tarot/wands',
    'Suit of Cups': '/tarot/cups',
    SUIT_OF_CUPS: '/tarot/cups',
    'Suit of Swords': '/tarot/swords',
    SUIT_OF_SWORDS: '/tarot/swords',
    'Suit of Pentacles': '/tarot/pentacles',
    SUIT_OF_PENTACLES: '/tarot/pentacles',
  },
};

// ============================================
// SCHEMA BUILDERS
// ============================================

/**
 * Build Article schema
 */
function buildArticleSchema(data: TarotArticleData, articleUrl: string): ArticleSchema {
  // Ensure dates are ISO strings
  const datePublished =
    typeof data.datePublished === 'string'
      ? data.datePublished
      : new Date(data.datePublished).toISOString();

  const dateModified = data.dateModified
    ? typeof data.dateModified === 'string'
      ? data.dateModified
      : new Date(data.dateModified).toISOString()
    : datePublished;

  return {
    '@type': 'Article',
    headline: data.title,
    description: data.excerpt,
    image: data.featuredImage,
    author: {
      '@type': 'Person',
      name: data.author || SITE_CONFIG.defaultAuthor.name,
      url: SITE_CONFIG.defaultAuthor.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo,
      },
    },
    datePublished,
    dateModified,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };
}

/**
 * Build FAQPage schema
 */
function buildFAQSchema(faqItems: FAQItem[]): FAQSchema | null {
  if (!faqItems || faqItems.length === 0) {
    return null;
  }

  return {
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Build BreadcrumbList schema
 */
function buildBreadcrumbSchema(data: TarotArticleData, articleUrl: string): BreadcrumbSchema {
  const category = data.breadcrumbCategory || data.cardType;
  const categoryPath = data.breadcrumbCategoryUrl || SITE_CONFIG.categoryUrls[category] || '/tarot';

  // Extract card name from title (before the colon if present)
  const cardName = data.title.split(':')[0].trim();

  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_CONFIG.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category,
        item: `${SITE_CONFIG.url}${categoryPath}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cardName,
        item: articleUrl,
      },
    ],
  };
}

/**
 * Build complete schema with @graph
 */
export function buildSchema(data: TarotArticleData): CompleteSchema {
  const articleUrl = `${SITE_CONFIG.url}/tarot/${data.slug}`;

  const graph: Array<ArticleSchema | FAQSchema | BreadcrumbSchema> = [];

  // Always add Article schema
  graph.push(buildArticleSchema(data, articleUrl));

  // Add FAQ schema if FAQ items exist
  const faqSchema = buildFAQSchema(data.faq);
  if (faqSchema) {
    graph.push(faqSchema);
  }

  // Always add Breadcrumb schema
  graph.push(buildBreadcrumbSchema(data, articleUrl));

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

/**
 * Convert schema object to HTML script tag
 */
export function schemaToHTML(schema: CompleteSchema): string {
  return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

/**
 * Main function: Process article and return schema
 */
export function processArticleSchema(data: TarotArticleData): {
  schema: CompleteSchema;
  schemaHtml: string;
} {
  const schema = buildSchema(data);
  const schemaHtml = schemaToHTML(schema);

  return { schema, schemaHtml };
}

// ============================================
// UTILITY EXPORTS
// ============================================

export {
  buildArticleSchema,
  buildFAQSchema,
  buildBreadcrumbSchema,
  type CompleteSchema,
  type ArticleSchema,
  type FAQSchema,
  type BreadcrumbSchema,
  type FAQItem,
  type TarotArticleData,
};
