# Server-Side Rendering for Tarot Articles

## Overview

Tarot article pages now use server-side rendering (SSR) to inject JSON-LD schema and meta tags into the initial HTML. This ensures search engines and social media crawlers can see the schema in "View Source" rather than waiting for JavaScript to load.

## How It Works

### Development Mode
- Frontend runs on Vite dev server (port 5173)
- Backend API runs on Express (port 3001)
- React Helmet handles meta tags client-side (not ideal for SEO)

### Production Mode
- Backend serves both API and frontend static files
- SSR route intercepts `/tarot/articles/:slug` requests
- HTML is served with schema and meta tags pre-injected
- React app hydrates on top of server-rendered HTML

## Architecture

### SSR Route: `server/src/routes/ssr.ts`

When a request comes to `/tarot/articles/:slug`:

1. **Fetch Article**: Queries database for published article by slug
2. **Load HTML Template**: Reads `index.html` from dist folder
3. **Generate Schema Script**: Creates `<script type="application/ld+json">` tag
4. **Generate Meta Tags**: Creates SEO meta tags (title, description, Open Graph, Twitter)
5. **Inject Into HTML**: Replaces `</head>` with meta tags + schema
6. **Serve HTML**: Returns modified HTML to client
7. **React Hydrates**: Frontend JavaScript loads and takes over

### Schema Injection

```html
<head>
  <!-- Original meta tags from index.html -->
  ...

  <!-- Injected meta tags (SEO) -->
  <title>The Fool: Meaning & Interpretation | MysticOracle</title>
  <meta name="description" content="..." />
  <meta property="og:title" content="..." />
  <meta property="og:image" content="..." />

  <!-- Injected JSON-LD schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", ... },
      { "@type": "FAQPage", ... },
      { "@type": "BreadcrumbList", ... }
    ]
  }
  </script>
</head>
```

## Testing

### 1. Build Frontend
```bash
npm run build
```

### 2. Start Backend
```bash
cd server
npm run dev
```

### 3. Test SSR Endpoint

Visit a published article:
```
http://localhost:3001/tarot/articles/the-fool
```

### 4. View Source

Right-click → "View Page Source" (NOT "Inspect")

Search for `application/ld+json` - you should see the schema!

### 5. Test with curl

```bash
curl http://localhost:3001/tarot/articles/the-fool | grep "application/ld+json"
```

Should return the schema in the HTML.

## Production Deployment

### Build Process

1. Build frontend: `npm run build` (creates `dist/` folder)
2. Build backend: `cd server && npm run build`
3. Deploy both to server (Render, Vercel, etc.)

### Hosting Requirements

The backend must be able to:
- Serve API routes (`/api/*`)
- Serve static files from `dist/` folder
- Serve SSR routes (`/tarot/articles/:slug`)

### Render Configuration

If deploying to Render, ensure:
1. Build command builds BOTH frontend and backend
2. Start command runs the Express server
3. Server has access to `dist/index.html`

Example `render.yaml`:
```yaml
services:
  - type: web
    name: mysticoracle
    env: node
    buildCommand: npm install && npm run build && cd server && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
```

## SEO Benefits

✅ **Schema Visible in View Source**: Search engines see JSON-LD immediately
✅ **Social Media Previews**: Open Graph tags pre-rendered
✅ **Fast Indexing**: No JavaScript execution required for crawlers
✅ **Rich Snippets**: FAQ, Article, and Breadcrumb schemas for Google

## Fallback Behavior

If the SSR route fails (article not found, template missing):
- Returns appropriate error (404, 500)
- React app can still handle routing client-side
- User sees error page from frontend

## Future Enhancements

- [ ] Cache rendered HTML in Redis for performance
- [ ] Pre-render all published articles at build time (Static Site Generation)
- [ ] Add SSR for blog posts
- [ ] Implement incremental static regeneration (ISR)

## Notes

- The React app still needs to run for interactivity
- SSR only applies to initial page load (HTML response)
- Client-side navigation still uses React Router
- Schema is injected from `schemaJson` field in database (auto-generated on article import)
