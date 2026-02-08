// Example usage of schema-builder with TarotArticle model
// This file demonstrates how to integrate the schema builder into your API routes

import { processArticleSchema, type TarotArticleData } from './schema-builder.js';
import type { TarotArticle } from '@prisma/client';

/**
 * Example: Convert Prisma TarotArticle to schema-ready format
 */
export function convertTarotArticleToSchemaData(article: TarotArticle): TarotArticleData {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    author: article.author,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    featuredImage: article.featuredImage,
    featuredImageAlt: article.featuredImageAlt,
    cardType: article.cardType,
    faq: article.faq as Array<{ question: string; answer: string }>,
    breadcrumbCategory: article.breadcrumbCategory,
    breadcrumbCategoryUrl: article.breadcrumbCategoryUrl || undefined,
  };
}

/**
 * Example API route usage:
 *
 * router.post('/api/tarot-articles', requireAdmin, async (req, res) => {
 *   const articleData = req.body;
 *
 *   // Generate schema
 *   const { schema, schemaHtml } = processArticleSchema(articleData);
 *
 *   // Save to database with schema
 *   const article = await prisma.tarotArticle.create({
 *     data: {
 *       ...articleData,
 *       schemaJson: schema,
 *       schemaHtml: schemaHtml,
 *     }
 *   });
 *
 *   res.json(article);
 * });
 *
 * router.get('/api/tarot-articles/:slug', async (req, res) => {
 *   const article = await prisma.tarotArticle.findUnique({
 *     where: { slug: req.params.slug }
 *   });
 *
 *   if (!article) {
 *     return res.status(404).json({ error: 'Article not found' });
 *   }
 *
 *   // Schema is already stored in article.schemaHtml
 *   // Frontend can inject it directly into the <head>
 *   res.json(article);
 * });
 */

/**
 * Example: Generate/update schema for existing article
 */
export async function regenerateArticleSchema(article: TarotArticle): Promise<{
  schemaJson: any;
  schemaHtml: string;
}> {
  const schemaData = convertTarotArticleToSchemaData(article);
  const { schema, schemaHtml } = processArticleSchema(schemaData);

  return {
    schemaJson: schema,
    schemaHtml: schemaHtml,
  };
}

/**
 * Example data structure for creating a new article
 */
export const EXAMPLE_ARTICLE_DATA: TarotArticleData = {
  title: 'The Fool: Meaning, Symbolism & Interpretation',
  slug: 'the-fool-meaning',
  excerpt:
    'Discover the profound meaning of The Fool tarot card, its symbolism, and how it guides you toward new beginnings.',
  author: 'CelestiArcana Team',
  datePublished: new Date().toISOString(),
  dateModified: new Date().toISOString(),
  featuredImage: 'https://celestiarcana.com/images/tarot/the-fool.jpg',
  featuredImageAlt: 'The Fool tarot card illustration',
  cardType: 'Major Arcana',
  faq: [
    {
      question: 'What does The Fool card mean in a reading?',
      answer:
        'The Fool represents new beginnings, innocence, and taking a leap of faith. It encourages you to embrace uncertainty and trust in the journey ahead.',
    },
    {
      question: 'Is The Fool a positive card?',
      answer:
        'Yes, The Fool is generally considered a positive card. It symbolizes potential, freedom, and the excitement of starting something new.',
    },
  ],
  breadcrumbCategory: 'Major Arcana',
  breadcrumbCategoryUrl: '/tarot/major-arcana',
};
