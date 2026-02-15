/**
 * Script to regenerate all tarot article schemas with correct URL
 *
 * Run with: npx ts-node scripts/regenerate-schemas.ts
 * Or: npx tsx scripts/regenerate-schemas.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Force the correct URL (don't rely on env var)
const SITE_URL = 'https://celestiarcana.com';
const SITE_NAME = 'CelestiArcana';

interface FAQItem {
  question: string;
  answer: string;
}

interface ArticleSchema {
  '@type': 'Article';
  headline: string;
  description: string;
  image: string;
  author: {
    '@type': 'Person' | 'Organization';
    name: string;
    url?: string;
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

const CATEGORY_URLS: Record<string, string> = {
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
};

function buildArticleSchema(article: any, articleUrl: string): ArticleSchema {
  const datePublished =
    article.createdAt instanceof Date ? article.createdAt.toISOString() : article.createdAt;

  const dateModified =
    article.updatedAt instanceof Date
      ? article.updatedAt.toISOString()
      : article.updatedAt || datePublished;

  return {
    '@type': 'Article',
    headline: article.title,
    description: article.seoMetaDescription || article.excerpt || '',
    image: article.featuredImage || `${SITE_URL}/images/tarot-default.jpg`,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
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

function buildBreadcrumbSchema(article: any, articleUrl: string): BreadcrumbSchema {
  const category = article.cardType || 'Tarot';
  const categoryPath = CATEGORY_URLS[category] || '/tarot';
  const cardName = article.title.split(':')[0].trim();

  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category,
        item: `${SITE_URL}${categoryPath}`,
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

function buildCompleteSchema(article: any) {
  const articleUrl = `${SITE_URL}/tarot/${article.slug}`;
  const graph: Array<ArticleSchema | FAQSchema | BreadcrumbSchema> = [];

  // Map fields for compatibility
  const mappedArticle = {
    ...article,
    metaDescription: article.seoMetaDescription,
    imageUrl: article.featuredImage,
  };

  // Add Article schema
  graph.push(buildArticleSchema(mappedArticle, articleUrl));

  // Add FAQ schema if FAQ items exist
  const faq = article.faq as FAQItem[] | null;
  if (faq && Array.isArray(faq) && faq.length > 0) {
    const faqSchema = buildFAQSchema(faq);
    if (faqSchema) {
      graph.push(faqSchema);
    }
  }

  // Add Breadcrumb schema
  graph.push(buildBreadcrumbSchema(mappedArticle, articleUrl));

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function schemaToHTML(schema: any): string {
  return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Schema Regeneration Script');
  console.log('='.repeat(60));
  console.log(`Target URL: ${SITE_URL}`);
  console.log('');

  try {
    // Fetch all tarot articles
    const articles = await prisma.tarotArticle.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        seoMetaDescription: true,
        featuredImage: true,
        cardType: true,
        faq: true,
        createdAt: true,
        updatedAt: true,
        schemaJson: true,
      },
    });

    console.log(`Found ${articles.length} articles to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        // Check if schema already has correct URL
        const currentSchema = article.schemaJson as any;
        const currentUrl = currentSchema?.['@graph']?.[0]?.mainEntityOfPage?.['@id'] || '';

        if (currentUrl.startsWith(SITE_URL)) {
          console.log(`✓ ${article.slug} - Already correct`);
          skipped++;
          continue;
        }

        // Generate new schema
        const newSchema = buildCompleteSchema(article);
        const newSchemaHtml = schemaToHTML(newSchema);

        // Update in database
        await prisma.tarotArticle.update({
          where: { id: article.id },
          data: {
            schemaJson: newSchema,
            schemaHtml: newSchemaHtml,
          },
        });

        console.log(`✓ ${article.slug} - Updated (was: ${currentUrl.split('/')[2] || 'unknown'})`);
        updated++;
      } catch (err) {
        console.error(`✗ ${article.slug} - Error:`, err);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped (already correct): ${skipped}`);
    console.log(`  Errors: ${errors}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
