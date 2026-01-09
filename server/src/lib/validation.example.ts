// Example usage of validation.ts with schema-builder and Prisma
// This demonstrates the complete flow from validation to database storage

import {
  validateArticle,
  validateArticleExtended,
  convertToPrismaFormat,
  type TarotArticleInput,
} from './validation.js';
import { processArticleSchema } from './schema-builder.js';
import type { PrismaClient } from '@prisma/client';

/**
 * Example 1: Basic validation
 */
export function exampleBasicValidation() {
  const articleData = {
    title: 'The Fool: New Beginnings and Infinite Potential',
    slug: 'the-fool-new-beginnings',
    excerpt: 'Discover the meaning of The Fool tarot card and how it represents new beginnings...',
    content: '<p>The Fool represents the beginning of a journey...</p>',
    author: 'MysticOracle Team',
    readTime: '12 min read',
    datePublished: '2026-01-09',
    dateModified: '2026-01-09',
    featuredImage: 'https://mysticoracle.com/images/the-fool.jpg',
    featuredImageAlt: 'The Fool tarot card showing a young person stepping off a cliff',
    cardType: 'Major Arcana',
    cardNumber: '0',
    astrologicalCorrespondence: 'Uranus',
    element: 'FIRE',
    categories: ['Major Arcana', 'Beginnings'],
    tags: ['fool', 'new-beginnings', 'potential', 'journey', 'innocence'],
    seo: {
      focusKeyword: 'the fool tarot card',
      metaTitle: 'The Fool Tarot Card: Meaning & Interpretation',
      metaDescription: 'Discover the meaning of The Fool tarot card, its symbolism, and how it guides you toward new beginnings.',
    },
    faq: [
      {
        question: 'What does The Fool card mean?',
        answer: 'The Fool represents new beginnings, innocence, and taking a leap of faith.',
      },
      {
        question: 'Is The Fool a positive card?',
        answer: 'Yes, The Fool is generally positive, symbolizing potential and freedom.',
      },
      {
        question: 'What number is The Fool card?',
        answer: 'The Fool is numbered 0 in the Major Arcana.',
      },
      {
        question: 'What does The Fool reversed mean?',
        answer: 'The Fool reversed can indicate recklessness or fear of taking risks.',
      },
      {
        question: 'What element is The Fool associated with?',
        answer: 'The Fool is associated with Air in most tarot traditions.',
      },
    ],
    breadcrumbCategory: 'Major Arcana',
    isCourtCard: false,
    isChallengeCard: false,
  };

  const result = validateArticle(articleData);

  if (!result.success) {
    console.error('Validation failed:', result.errorMessages);
    return null;
  }

  console.log('✓ Validation passed!');
  return result.data;
}

/**
 * Example 2: Extended validation with quality checks
 */
export function exampleExtendedValidation() {
  const articleData = {
    // ... same structure as above
  };

  const result = validateArticleExtended(articleData, 'The Fool');

  if (!result.success) {
    console.error('Validation failed:', result.errorMessages);
    return null;
  }

  console.log('✓ Validation passed!');
  console.log('Stats:', result.stats);

  if (result.warnings && result.warnings.length > 0) {
    console.warn('⚠️ Quality warnings:', result.warnings);
  }

  return result.data;
}

/**
 * Example 3: Complete API route flow
 */
export async function exampleCompleteFlow(
  prisma: PrismaClient,
  rawInput: unknown
) {
  // Step 1: Validate input
  const validationResult = validateArticleExtended(rawInput);

  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.errorMessages?.join(', ')}`);
  }

  const validatedData = validationResult.data!;

  // Step 2: Generate schema for SEO
  const { schema, schemaHtml } = processArticleSchema({
    title: validatedData.title,
    slug: validatedData.slug,
    excerpt: validatedData.excerpt,
    author: validatedData.author,
    datePublished: new Date(validatedData.datePublished),
    dateModified: new Date(validatedData.dateModified),
    featuredImage: validatedData.featuredImage,
    featuredImageAlt: validatedData.featuredImageAlt,
    cardType: validatedData.cardType,
    faq: validatedData.faq,
    breadcrumbCategory: validatedData.breadcrumbCategory,
    breadcrumbCategoryUrl: validatedData.breadcrumbCategoryUrl,
  });

  // Step 3: Convert to Prisma format
  const prismaData = convertToPrismaFormat(validatedData);

  // Step 4: Save to database
  const article = await prisma.tarotArticle.create({
    data: {
      ...prismaData,
      schemaJson: schema as any,
      schemaHtml: schemaHtml,
    },
  });

  return {
    article,
    warnings: validationResult.warnings,
    stats: validationResult.stats,
  };
}

/**
 * Example 4: API route handler (Express)
 */
export function exampleAPIRoute() {
  /*
  import { Router } from 'express';
  import { requireAdmin } from '../middleware/auth.js';
  import prisma from '../db/prisma.js';

  const router = Router();

  // Create new tarot article
  router.post('/api/tarot-articles', requireAdmin, async (req, res) => {
    try {
      // Validate input
      const validationResult = validateArticleExtended(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.errorMessages,
        });
      }

      const validatedData = validationResult.data!;

      // Generate schema
      const { schema, schemaHtml } = processArticleSchema({
        title: validatedData.title,
        slug: validatedData.slug,
        excerpt: validatedData.excerpt,
        author: validatedData.author,
        datePublished: new Date(validatedData.datePublished),
        dateModified: new Date(validatedData.dateModified),
        featuredImage: validatedData.featuredImage,
        featuredImageAlt: validatedData.featuredImageAlt,
        cardType: validatedData.cardType,
        faq: validatedData.faq,
        breadcrumbCategory: validatedData.breadcrumbCategory,
        breadcrumbCategoryUrl: validatedData.breadcrumbCategoryUrl,
      });

      // Convert and save
      const prismaData = convertToPrismaFormat(validatedData);
      const article = await prisma.tarotArticle.create({
        data: {
          ...prismaData,
          schemaJson: schema,
          schemaHtml: schemaHtml,
        },
      });

      // Return with warnings
      res.json({
        article,
        warnings: validationResult.warnings,
        stats: validationResult.stats,
      });

    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  export default router;
  */
}

/**
 * Example 5: Bulk import with validation
 */
export async function exampleBulkImport(
  prisma: PrismaClient,
  articles: unknown[]
) {
  const results = {
    success: [] as any[],
    failed: [] as any[],
    warnings: [] as any[],
  };

  for (const rawArticle of articles) {
    try {
      // Validate with extended checks
      const validation = validateArticleExtended(rawArticle);

      if (!validation.success) {
        results.failed.push({
          data: rawArticle,
          errors: validation.errorMessages,
        });
        continue;
      }

      const validatedData = validation.data!;

      // Generate schema
      const { schema, schemaHtml } = processArticleSchema({
        title: validatedData.title,
        slug: validatedData.slug,
        excerpt: validatedData.excerpt,
        author: validatedData.author,
        datePublished: new Date(validatedData.datePublished),
        dateModified: new Date(validatedData.dateModified),
        featuredImage: validatedData.featuredImage,
        featuredImageAlt: validatedData.featuredImageAlt,
        cardType: validatedData.cardType,
        faq: validatedData.faq,
        breadcrumbCategory: validatedData.breadcrumbCategory,
        breadcrumbCategoryUrl: validatedData.breadcrumbCategoryUrl,
      });

      // Save to database
      const prismaData = convertToPrismaFormat(validatedData);
      const article = await prisma.tarotArticle.create({
        data: {
          ...prismaData,
          schemaJson: schema as any,
          schemaHtml: schemaHtml,
        },
      });

      results.success.push(article);

      // Track warnings
      if (validation.warnings && validation.warnings.length > 0) {
        results.warnings.push({
          slug: validatedData.slug,
          warnings: validation.warnings,
        });
      }
    } catch (error) {
      results.failed.push({
        data: rawArticle,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Example validation data (minimal valid article)
 */
export const MINIMAL_VALID_ARTICLE: TarotArticleInput = {
  title: 'The Fool: New Beginnings and Infinite Potential',
  slug: 'the-fool-new-beginnings',
  excerpt:
    'Discover the meaning of The Fool tarot card and how it represents new beginnings, innocence, and infinite potential.',
  content:
    '<p>The Fool represents new beginnings, infinite potential, and the start of a journey...</p>'.repeat(
      100
    ), // ~5000+ chars
  author: 'MysticOracle Team',
  readTime: '12 min read',
  datePublished: '2026-01-09',
  dateModified: '2026-01-09',
  featuredImage: 'https://mysticoracle.com/images/the-fool.jpg',
  featuredImageAlt:
    'The Fool tarot card showing a young traveler with a bindle standing at the edge of a cliff',
  cardType: 'Major Arcana',
  cardNumber: '0',
  astrologicalCorrespondence: 'Uranus',
  element: 'FIRE',
  categories: ['Major Arcana', 'Beginnings'],
  tags: ['fool', 'new-beginnings', 'potential', 'journey', 'innocence'],
  seo: {
    focusKeyword: 'the fool tarot card',
    metaTitle: 'The Fool Tarot Card: Meaning & Interpretation Guide',
    metaDescription:
      'Discover the meaning of The Fool tarot card, its symbolism, and how it guides you toward new beginnings and infinite possibilities.',
  },
  faq: [
    {
      question: 'What does The Fool tarot card mean?',
      answer:
        'The Fool represents new beginnings, innocence, and taking a leap of faith into the unknown.',
    },
    {
      question: 'Is The Fool a positive card?',
      answer:
        'Yes, The Fool is generally positive, symbolizing potential, freedom, and fresh starts.',
    },
    {
      question: 'What number is The Fool card?',
      answer: 'The Fool is numbered 0 in the Major Arcana.',
    },
    {
      question: 'What does The Fool reversed mean?',
      answer:
        'The Fool reversed can indicate recklessness, poor judgment, or fear of taking risks.',
    },
    {
      question: 'What element is The Fool associated with?',
      answer: 'The Fool is associated with the element of Air in most tarot traditions.',
    },
  ],
  breadcrumbCategory: 'Major Arcana',
  breadcrumbCategoryUrl: '/tarot/major-arcana',
  relatedCards: ['The Magician', 'The World'],
  isCourtCard: false,
  isChallengeCard: false,
};
