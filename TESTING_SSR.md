# Testing Server-Side Rendering for Tarot Articles

## Quick Test Guide

### Step 1: Build the Frontend
```bash
npm run build
```

This creates the `dist/` folder with your production build.

### Step 2: Start the Backend
```bash
cd server
npm run dev
```

The server will run on port 3001.

### Step 3: Publish a Test Article

1. Go to Admin Dashboard → Tarot Articles
2. Find or create an article
3. Change its status to "PUBLISHED"
4. Note the slug (e.g., "the-fool")

### Step 4: Test the SSR Route

Open your browser to:
```
http://localhost:3001/tarot/articles/the-fool
```

(Replace `the-fool` with your article's slug)

### Step 5: View Page Source

**IMPORTANT**: Right-click → "View Page Source" (NOT "Inspect Element")

Or press: `Ctrl+U` (Windows/Linux) or `Cmd+Option+U` (Mac)

### Step 6: Search for Schema

In the page source, press `Ctrl+F` / `Cmd+F` and search for:
```
application/ld+json
```

You should see something like:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "The Fool: Meaning & Interpretation",
      "description": "...",
      ...
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        ...
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        ...
      ]
    }
  ]
}
</script>
```

## Command Line Test

You can also test with curl:

```bash
curl http://localhost:3001/tarot/articles/the-fool | grep -A 50 "application/ld+json"
```

This should print the schema JSON.

## What You Should See

✅ **Meta Tags** (in `<head>`):
```html
<title>The Fool: Meaning & Interpretation | CelestiArcana</title>
<meta name="description" content="..." />
<meta property="og:title" content="..." />
<meta property="og:image" content="..." />
<meta property="og:type" content="article" />
```

✅ **JSON-LD Schema** (before `</head>`):
```html
<script type="application/ld+json">
{ "@context": "https://schema.org", ... }
</script>
```

## Common Issues

### Issue: "Template not found"
**Solution**: Make sure you ran `npm run build` to create the `dist/` folder.

### Issue: "Article not found" (404)
**Solution**: Make sure the article status is "PUBLISHED" (not DRAFT).

### Issue: Can't see schema in "Inspect Element"
**Solution**: Use "View Page Source" instead. Inspect Element shows the live DOM (after React loads).

### Issue: Schema shows in Inspect but not in View Source
**Solution**: This means React Helmet is working but SSR is not. Check server logs for errors.

## Validation Tools

### Google Rich Results Test
1. Build and deploy to production
2. Visit: https://search.google.com/test/rich-results
3. Enter your article URL
4. Should show: ✅ Article, ✅ FAQ, ✅ Breadcrumb

### Schema Markup Validator
Visit: https://validator.schema.org/
Paste your HTML source code
Should validate without errors

## Production Testing

Once deployed to production (e.g., Render):

```bash
curl https://celestiarcana.com/tarot/articles/the-fool | grep "application/ld+json"
```

Should return the schema in the initial HTML response.

## Success Criteria

✅ Schema visible in "View Page Source"
✅ Schema NOT just in "Inspect Element" (that would be client-side only)
✅ Meta tags include article-specific content
✅ Page loads and displays article correctly
✅ React app hydrates without errors

## Next Steps

Once SSR is working:
1. Submit sitemap to Google Search Console
2. Request indexing for important articles
3. Monitor rich results in search console
4. Test social media previews (LinkedIn, Twitter, Facebook)
