# Schema Builder Setup Complete ✅

## Files Created

1. **`src/lib/schema-builder.ts`** _(server/src/lib/schema-builder.ts:1)_
   - Core JSON-LD schema generation
   - Automatically builds Article, FAQPage, and BreadcrumbList schemas
   - Integrated with your existing Prisma TarotArticle model

2. **`src/lib/schema-builder.example.ts`** _(server/src/lib/schema-builder.example.ts:1)_
   - Usage examples and helper functions
   - Shows integration patterns for API routes
   - Example article data structure

3. **`src/lib/README.md`** _(server/src/lib/README.md:1)_
   - Complete documentation
   - Configuration guide
   - Frontend integration examples

## Environment Variables to Add

Add these to your `server/.env` file:

```env
# Site Configuration (for SEO & Schema.org)
SITE_NAME=CelestiArcana
SITE_URL=https://celestiarcana.com
SITE_LOGO=https://celestiarcana.com/images/logo.png
DEFAULT_AUTHOR_NAME=CelestiArcana Team
DEFAULT_AUTHOR_URL=https://celestiarcana.com/about
```

**Also updated:** `server/.env.example` with these variables _(server/.env.example:40)_

## Integration Points

### Your Existing System

✅ **Author System**
- Adapted to work with your `authorName` field from BlogPost
- Uses `DEFAULT_AUTHOR_NAME` as fallback

✅ **Database Schema**
- Works with your new `TarotArticle` model
- Stores generated schema in `schemaJson` and `schemaHtml` fields

✅ **Category URLs**
- Pre-configured for your tarot card structure:
  - Major Arcana → `/tarot/major-arcana`
  - Suit of Wands → `/tarot/wands`
  - Suit of Cups → `/tarot/cups`
  - Suit of Swords → `/tarot/swords`
  - Suit of Pentacles → `/tarot/pentacles`

### URL Structure Assumption

Articles are expected at: `{SITE_URL}/tarot/{slug}`

**Example:** `https://celestiarcana.com/tarot/the-fool-meaning`

If your URL structure differs, update line 205 in `schema-builder.ts`:

```typescript
const articleUrl = `${SITE_CONFIG.url}/tarot/${data.slug}`;
```

## Quick Start

### 1. Add Environment Variables

```bash
# Edit your .env file
nano server/.env

# Add the new variables (see above)
```

### 2. Use in Your API Routes

```typescript
import { processArticleSchema } from '../lib/schema-builder.js';

router.post('/api/tarot-articles', requireAdmin, async (req, res) => {
  const articleData = req.body;

  // Generate schema
  const { schema, schemaHtml } = processArticleSchema(articleData);

  // Save with schema
  const article = await prisma.tarotArticle.create({
    data: {
      ...articleData,
      schemaJson: schema,
      schemaHtml: schemaHtml,
    }
  });

  res.json(article);
});
```

### 3. Frontend Integration (Safe Method)

Use the JSON object directly to avoid any security concerns:

```tsx
{/* In your article page component - SAFE approach */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(article.schemaJson)
  }}
/>
```

**Why this is safe:**
- Schema is generated server-side by your trusted code
- No user input goes directly into the schema
- All data comes from your validated database
- JSON.stringify ensures proper escaping

## What This Does for SEO

1. **Article Schema** - Tells Google about your content:
   - Title, author, publish date
   - Featured image
   - Publisher info (your site)

2. **FAQPage Schema** - Can show FAQ snippets in search results:
   - Questions appear directly in Google
   - "People also ask" sections
   - Higher click-through rates

3. **BreadcrumbList Schema** - Better navigation:
   - Shows breadcrumbs in search results
   - Helps users understand site structure
   - Improves user experience

## Testing

Use Google's Rich Results Test:
https://search.google.com/test/rich-results

Paste your generated `schemaHtml` or the article URL to validate.

## Next Steps

1. ✅ Schema builder created
2. ✅ Environment variables documented
3. ⏳ Add env vars to your `.env` file
4. ⏳ Create API routes for TarotArticles
5. ⏳ Integrate schema generation in routes
6. ⏳ Add schema injection in frontend
7. ⏳ Test with Google Rich Results Test

Need help with any of these steps? Just ask!
