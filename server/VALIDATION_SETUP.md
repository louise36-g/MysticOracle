# Validation Library Setup Complete ✅

## Files Created

### Core Library Files

1. **`src/lib/validation.ts`** _(server/src/lib/validation.ts:1)_ - 9.7KB
   - Zod validation schemas for tarot articles
   - Content quality checks (word count, forbidden words, answer-first)
   - Extended validation with warnings
   - Prisma format converter

2. **`src/lib/validation.example.ts`** _(server/src/lib/validation.example.ts:1)_ - 10KB
   - Complete usage examples
   - API route patterns
   - Bulk import examples
   - Minimal valid article template

3. **`src/lib/VALIDATION.md`** _(server/src/lib/VALIDATION.md:1)_ - 9KB
   - Complete documentation
   - All validation rules
   - Content quality standards
   - Helper function reference

### Previously Created (Schema Builder)

4. **`src/lib/schema-builder.ts`** _(server/src/lib/schema-builder.ts:1)_ - 6.4KB
5. **`src/lib/schema-builder.example.ts`** _(server/src/lib/schema-builder.example.ts:1)_ - 3.4KB
6. **`src/lib/README.md`** _(server/src/lib/README.md:1)_ - 5.3KB

## Dependencies

✅ **Zod already installed**: `zod@3.22.4` _(server/package.json:30)_

No additional installation needed!

## Features

### 1. Type-Safe Validation

```typescript
import { validateArticle } from './lib/validation.js';

const result = validateArticle(articleData);

if (!result.success) {
  console.error('Errors:', result.errorMessages);
  return;
}

// Fully typed data
const validatedData = result.data;
```

### 2. Content Quality Checks

```typescript
import { validateArticleExtended } from './lib/validation.js';

const result = validateArticleExtended(articleData, 'The Fool');

console.log('Stats:', result.stats);
// {
//   wordCount: 2847,
//   faqCount: 6,
//   hasAnswerFirstOpening: true
// }

console.log('Warnings:', result.warnings);
// ['Word count is 2200, target is 2500-3000']
```

**Quality Checks Include:**
- ✅ Word count: 2500-3000 words (optimal for SEO)
- ✅ Forbidden AI clichés: transmute, ethereal, delve, realm, etc.
- ✅ Answer-first opening: Validates direct meaning in first paragraph
- ✅ FAQ quality: Ensures answers start with direct responses

### 3. Prisma Integration

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

**Automatic conversions:**
- Date strings → Date objects
- Nested SEO object → flattened fields
- Enum validation matching Prisma schema

## Validation Rules

### Content Requirements

| Field | Rules |
|-------|-------|
| Title | 10-100 characters |
| Slug | Lowercase, hyphens only, 5-100 chars |
| Excerpt | 50-300 characters |
| Content | Min 5000 chars (~2500 words), no em dashes |
| Author | 2-100 characters |
| Read Time | Format: "X min read" |

### SEO Requirements

| Field | Rules | Reason |
|-------|-------|--------|
| Focus Keyword | 5-100 chars | SEO targeting |
| Meta Title | 20-60 chars | Optimal for Google |
| Meta Description | 50-155 chars | Optimal for snippets |
| Featured Alt Text | 20-200 chars, no "image of" | Accessibility + SEO |

### FAQ Requirements

- **Minimum**: 5 FAQ items (critical for GEO)
- **Maximum**: 10 FAQ items
- **Question**: 10-200 characters
- **Answer**: 20-1000 characters
- **Quality**: Answers must start with direct responses

### Enum Values

**CardType** (matches Prisma @map):
```typescript
'Major Arcana'
'Suit of Wands'
'Suit of Cups'
'Suit of Swords'
'Suit of Pentacles'
```

**Element** (matches Prisma):
```typescript
'FIRE'
'WATER'
'AIR'
'EARTH'
```

**ArticleStatus**:
```typescript
'DRAFT'
'PUBLISHED'
'ARCHIVED'
```

## Complete API Flow Example

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
    // Step 1: Validate with quality checks
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

    // Return with quality metrics
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

## Content Quality Standards

### Word Count Target
- **Minimum**: 2500 words
- **Optimal**: 2500-3000 words
- **Warning if**: <2500 or >3500 words

### Forbidden Words (AI Clichés)
```typescript
// These trigger warnings
'transmute', 'ethereal', 'precipice', 'myriad',
'delve', 'realm', 'embark', 'unveil',
'unravel', 'resonate', 'harness', 'catalyst', 'conduit'
```

### Answer-First Pattern
First paragraph must contain direct meaning:
```typescript
✅ "The Fool represents new beginnings..."
✅ "The Fool stands for infinite potential..."
✅ "The Fool signifies innocence..."
❌ "When you encounter The Fool..." (delayed)
❌ "In the tarot deck..." (context-first)
```

### FAQ Answer Quality
Answers must start with direct responses:
```typescript
✅ "The Fool represents new beginnings because..."
✅ "Yes, The Fool is positive. It symbolizes..."
❌ "When you draw this card..." (delayed)
❌ "If you're asking about love..." (conditional)
```

## Helper Functions

### `getWordCount(content: string): number`
Estimates word count from HTML content

### `checkForbiddenWords(content: string): string[]`
Returns list of forbidden AI clichés found

### `validateAnswerFirstOpening(content: string, cardName: string): boolean`
Checks if content follows answer-first pattern

### `convertToPrismaFormat(data: TarotArticleInput): object`
Converts validated data to Prisma-compatible format

## Testing

Use the minimal valid article template:

```typescript
import { MINIMAL_VALID_ARTICLE } from './lib/validation.example.js';
import { validateArticleExtended } from './lib/validation.js';

const result = validateArticleExtended(MINIMAL_VALID_ARTICLE);

console.log('Passed:', result.success);
console.log('Stats:', result.stats);
console.log('Warnings:', result.warnings);
```

## Documentation

- **Complete API reference**: `src/lib/VALIDATION.md`
- **Usage examples**: `src/lib/validation.example.ts`
- **Schema builder docs**: `src/lib/README.md`

## Integration Checklist

- [x] Validation library created
- [x] Schema builder integrated
- [x] Zod dependency verified
- [ ] Create tarot article API routes
- [ ] Implement validation in routes
- [ ] Add quality metrics to admin dashboard
- [ ] Test with real article data
- [ ] Monitor forbidden words usage

## Benefits

1. **Type Safety**: Automatic TypeScript types from Zod schemas
2. **Content Quality**: Catches AI-generated clichés and poor structure
3. **SEO Optimization**: Ensures optimal length for titles/descriptions
4. **Data Integrity**: Validates all fields match Prisma schema
5. **Developer Experience**: Clear error messages and warnings

## Next Steps

1. Import validation in your API routes
2. Create POST endpoint for tarot articles
3. Use `validateArticleExtended()` for quality checks
4. Return warnings to admin users for review
5. Use stats for content quality dashboard

Need help implementing the API routes? Just ask! 🎴✨
