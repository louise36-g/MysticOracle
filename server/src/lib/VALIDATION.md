# Validation Library Documentation

## Overview

The validation library provides type-safe validation for tarot articles with content quality checks. It ensures all AI-generated content meets SEO and readability standards before being stored in the database.

## Features

### 1. Type-Safe Validation
- Zod-based schema validation
- Automatic type inference
- Detailed error messages

### 2. Content Quality Checks
- **Word Count**: Ensures 2500-3000 words (optimal for SEO)
- **Forbidden Words**: Detects AI clichés (transmute, ethereal, delve, etc.)
- **Answer-First Opening**: Validates direct meaning in first paragraph
- **FAQ Quality**: Ensures FAQ answers start with direct responses

### 3. SEO Validation
- Meta title length (20-60 chars)
- Meta description length (50-155 chars)
- Focus keyword presence
- Alt text quality (no "image of" prefix)

### 4. Data Integrity
- Slug format validation (lowercase, hyphens only)
- URL validation for images
- Date format validation (YYYY-MM-DD)
- Enum matching with Prisma schema

## Basic Usage

### Simple Validation

```typescript
import { validateArticle } from './lib/validation.js';

const result = validateArticle(articleData);

if (!result.success) {
  console.error('Validation errors:', result.errorMessages);
  return;
}

// Use validated data
const validatedData = result.data;
```

### Extended Validation (with quality checks)

```typescript
import { validateArticleExtended } from './lib/validation.js';

const result = validateArticleExtended(articleData, 'The Fool');

if (!result.success) {
  console.error('Validation errors:', result.errorMessages);
  return;
}

console.log('Statistics:', result.stats);
// {
//   wordCount: 2847,
//   faqCount: 6,
//   hasAnswerFirstOpening: true
// }

if (result.warnings) {
  console.warn('Quality warnings:', result.warnings);
  // ['Word count is 2200, target is 2500-3000']
}
```

## API Route Integration

### Complete Flow

```typescript
import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import prisma from '../db/prisma.js';
import {
  validateArticleExtended,
  convertToPrismaFormat,
} from '../lib/validation.js';
import { processArticleSchema } from '../lib/schema-builder.js';

const router = Router();

router.post('/api/tarot-articles', requireAdmin, async (req, res) => {
  try {
    // Step 1: Validate input
    const validation = validateArticleExtended(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errorMessages,
      });
    }

    const validatedData = validation.data!;

    // Step 2: Generate JSON-LD schema
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
        schemaJson: schema,
        schemaHtml: schemaHtml,
      },
    });

    // Return with quality warnings
    res.json({
      success: true,
      article,
      warnings: validation.warnings,
      stats: validation.stats,
    });

  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

export default router;
```

## Validation Rules

### Required Fields

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | 10-100 chars |
| `slug` | string | Lowercase, hyphens, 5-100 chars |
| `excerpt` | string | 50-300 chars |
| `content` | string | Min 5000 chars (~2500 words), no em dashes |
| `author` | string | 2-100 chars |
| `readTime` | string | Format: "X min read" |
| `datePublished` | string | YYYY-MM-DD format |
| `dateModified` | string | YYYY-MM-DD format |
| `featuredImage` | string | Valid URL |
| `featuredImageAlt` | string | 20-200 chars, no "image of" prefix |
| `cardType` | enum | Major Arcana, Suit of Wands/Cups/Swords/Pentacles |
| `cardNumber` | string | 1-20 chars |
| `astrologicalCorrespondence` | string | 2-50 chars |
| `element` | enum | FIRE, WATER, AIR, EARTH |
| `categories` | string[] | 1-5 items |
| `tags` | string[] | 3-10 items |
| `faq` | FAQItem[] | 5-10 items |
| `breadcrumbCategory` | string | 2-50 chars |

### SEO Fields

| Field | Rules |
|-------|-------|
| `seo.focusKeyword` | 5-100 chars |
| `seo.metaTitle` | 20-60 chars (optimal for Google) |
| `seo.metaDescription` | 50-155 chars (optimal for Google) |

### FAQ Item Fields

| Field | Rules |
|-------|-------|
| `question` | 10-200 chars |
| `answer` | 20-1000 chars |

### Optional Fields

| Field | Type | Default |
|-------|------|---------|
| `breadcrumbCategoryUrl` | string | undefined |
| `relatedCards` | string[] | [] |
| `isCourtCard` | boolean | false |
| `isChallengeCard` | boolean | false |
| `status` | enum | DRAFT |

## Content Quality Checks

### Word Count
- **Target**: 2500-3000 words
- **Minimum**: ~2500 words (5000 chars)
- **Warning if**: <2500 or >3500 words

### Forbidden Words
Avoids AI-generated clichés:
- transmute, ethereal, precipice, myriad
- delve, realm, embark, unveil
- unravel, resonate, harness, catalyst, conduit

### Answer-First Opening
Validates that the first paragraph starts with direct meaning:
- "The Fool represents..."
- "The Fool stands for..."
- "The Fool signifies..."
- "The Fool means..."
- "The Fool symbolizes..."

### FAQ Answer Quality
Ensures answers start with direct responses, not context:
- ❌ "When you draw this card..."
- ❌ "If you're asking about..."
- ✅ "The Fool represents new beginnings..."
- ✅ "Yes, The Fool is positive because..."

## Helper Functions

### `convertToPrismaFormat()`
Converts validated data to Prisma-compatible format:
- Flattens nested SEO object
- Converts date strings to Date objects
- Ensures all required fields are present

```typescript
import { convertToPrismaFormat } from './lib/validation.js';

const prismaData = convertToPrismaFormat(validatedData);

await prisma.tarotArticle.create({
  data: {
    ...prismaData,
    schemaJson: schema,
    schemaHtml: schemaHtml,
  }
});
```

### `getWordCount()`
Estimates word count from HTML content:

```typescript
import { getWordCount } from './lib/validation.js';

const wordCount = getWordCount('<p>Content here...</p>');
console.log(`Article has ${wordCount} words`);
```

### `checkForbiddenWords()`
Checks for AI clichés:

```typescript
import { checkForbiddenWords } from './lib/validation.js';

const forbidden = checkForbiddenWords(content);
if (forbidden.length > 0) {
  console.warn(`Found forbidden words: ${forbidden.join(', ')}`);
}
```

### `validateAnswerFirstOpening()`
Checks if content follows answer-first pattern:

```typescript
import { validateAnswerFirstOpening } from './lib/validation.js';

const hasAnswerFirst = validateAnswerFirstOpening(content, 'The Fool');
if (!hasAnswerFirst) {
  console.warn('Article may not have answer-first opening');
}
```

## Enum Values (Prisma-compatible)

### CardType
```typescript
'Major Arcana'
'Suit of Wands'
'Suit of Cups'
'Suit of Swords'
'Suit of Pentacles'
```

### Element
```typescript
'FIRE'
'WATER'
'AIR'
'EARTH'
```

### ArticleStatus
```typescript
'DRAFT'
'PUBLISHED'
'ARCHIVED'
```

## Example Data Structure

See `validation.example.ts` for complete examples, including:
- Minimal valid article
- Complete API route handlers
- Bulk import with validation
- Error handling patterns

## Error Handling

### Validation Errors
```typescript
{
  success: false,
  errors: [
    {
      path: ['content'],
      message: 'Content too short (minimum ~2500 words)'
    }
  ],
  errorMessages: [
    'content: Content too short (minimum ~2500 words)'
  ]
}
```

### Quality Warnings
```typescript
{
  success: true,
  data: { /* validated data */ },
  warnings: [
    'Word count is 2200, target is 2500-3000',
    'Forbidden words found: delve, realm'
  ],
  stats: {
    wordCount: 2200,
    faqCount: 6,
    hasAnswerFirstOpening: false
  }
}
```

## Testing Validation

```typescript
import { MINIMAL_VALID_ARTICLE } from './lib/validation.example.js';
import { validateArticleExtended } from './lib/validation.js';

// Test with example data
const result = validateArticleExtended(MINIMAL_VALID_ARTICLE);

console.log('Validation passed:', result.success);
console.log('Stats:', result.stats);
console.log('Warnings:', result.warnings);
```

## Next Steps

1. Import validation in your API routes
2. Add validation to article creation endpoint
3. Return quality warnings to admin users
4. Use stats for content dashboard metrics
5. Monitor forbidden words usage over time
