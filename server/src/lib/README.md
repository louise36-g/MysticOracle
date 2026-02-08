# Schema Builder Library

## Overview

The schema builder automatically generates JSON-LD structured data for your tarot articles, improving SEO and visibility in search engines.

## Files Created

- **`schema-builder.ts`** - Core schema generation logic
- **`schema-builder.example.ts`** - Usage examples and helper functions

## Features

### Automatic Schema Generation

Generates three types of structured data:

1. **Article Schema** - Main article metadata (title, author, dates, publisher)
2. **FAQPage Schema** - FAQ structured data from your `faq[]` field
3. **BreadcrumbList Schema** - Navigation breadcrumbs for better UX

### Usage

```typescript
import { processArticleSchema } from './lib/schema-builder.js';

// When creating/updating an article
const { schema, schemaHtml } = processArticleSchema({
  title: 'The Fool: Meaning & Symbolism',
  slug: 'the-fool-meaning',
  excerpt: 'Discover the meaning of The Fool tarot card...',
  author: 'CelestiArcana Team',
  datePublished: new Date(),
  dateModified: new Date(),
  featuredImage: 'https://celestiarcana.com/images/the-fool.jpg',
  cardType: 'Major Arcana',
  faq: [
    {
      question: 'What does The Fool mean?',
      answer: 'The Fool represents new beginnings...'
    }
  ],
  breadcrumbCategory: 'Major Arcana',
});

// Save to database
await prisma.tarotArticle.create({
  data: {
    ...articleData,
    schemaJson: schema,      // JSON object
    schemaHtml: schemaHtml,  // Ready-to-inject HTML script tag
  }
});
```

### Frontend Integration

The `schemaHtml` field contains a ready-to-use script tag. Since this is server-generated and trusted content, you can safely inject it:

```tsx
{/* Option 1: Using React/JSX (safe - content is server-generated) */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(article.schemaJson) }}
/>

{/* Option 2: Using the pre-rendered HTML (also safe) */}
<div dangerouslySetInnerHTML={{ __html: article.schemaHtml }} />
```

**Security Note:** This is safe because:
- Schema is generated server-side by your code
- No user input goes directly into the schema
- All article data comes from your trusted database

## Configuration

### Category URL Mappings

Default mappings in `schema-builder.ts`:

```typescript
categoryUrls: {
  'Major Arcana': '/tarot/major-arcana',
  'Suit of Wands': '/tarot/wands',
  'Suit of Cups': '/tarot/cups',
  'Suit of Swords': '/tarot/swords',
  'Suit of Pentacles': '/tarot/pentacles',
}
```

**Note:** Both enum names (e.g., `MAJOR_ARCANA`) and display names (e.g., `Major Arcana`) are supported.

### Article URLs

Articles are expected to be at: `{SITE_URL}/tarot/{slug}`

Example: `https://celestiarcana.com/tarot/the-fool-meaning`

If your URL structure is different, modify the `buildSchema()` function in `schema-builder.ts`.

## Environment Variables Required

Add these to your `server/.env` file:

```env
# Site Configuration (for SEO & Schema.org)
SITE_NAME=CelestiArcana
SITE_URL=https://celestiarcana.com
SITE_LOGO=https://celestiarcana.com/images/logo.png
DEFAULT_AUTHOR_NAME=CelestiArcana Team
DEFAULT_AUTHOR_URL=https://celestiarcana.com/about
```

## Example Output

The generated schema looks like this:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "The Fool: Meaning & Symbolism",
      "description": "Discover the meaning...",
      "image": "https://celestiarcana.com/images/the-fool.jpg",
      "author": {
        "@type": "Person",
        "name": "CelestiArcana Team",
        "url": "https://celestiarcana.com/about"
      },
      "publisher": {
        "@type": "Organization",
        "name": "CelestiArcana",
        "logo": {
          "@type": "ImageObject",
          "url": "https://celestiarcana.com/images/logo.png"
        }
      },
      "datePublished": "2026-01-09T12:00:00.000Z",
      "dateModified": "2026-01-09T12:00:00.000Z",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://celestiarcana.com/tarot/the-fool-meaning"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What does The Fool mean?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Fool represents new beginnings..."
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://celestiarcana.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Major Arcana",
          "item": "https://celestiarcana.com/tarot/major-arcana"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "The Fool",
          "item": "https://celestiarcana.com/tarot/the-fool-meaning"
        }
      ]
    }
  ]
}
```

## Benefits

- **Better SEO** - Structured data helps Google understand your content
- **Rich Snippets** - FAQ sections can appear directly in search results
- **Enhanced Breadcrumbs** - Improved navigation in search results
- **Performance** - Schema is pre-generated and stored, not computed on-the-fly

## Next Steps

1. Add environment variables to your `.env` file
2. Import schema builder in your tarot article routes
3. Generate schema when creating/updating articles
4. Inject `schemaHtml` in your frontend article template
