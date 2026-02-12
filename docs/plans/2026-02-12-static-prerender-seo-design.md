# Static Pre-rendering for SEO

**Date:** 2026-02-12
**Status:** Approved
**Goal:** Make all content pages crawlable by Google without JavaScript

## Problem

CelestiArcana is a Single Page Application (SPA). Google crawlers may not wait for JavaScript to render content, resulting in poor indexing. The site needs HTML content available immediately for SEO.

## Solution

Pre-render static HTML files at build time for all SEO-critical pages. These files are served directly to crawlers (and users), while the SPA hydrates on top for interactivity.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Coolify                          │
│                                                     │
│  ┌─────────────────┐      ┌─────────────────────┐  │
│  │    Frontend     │      │      Backend        │  │
│  │                 │      │                     │  │
│  │  - SPA (React)  │      │  - API (/api/*)     │  │
│  │  - Static HTML  │◄─────│                     │  │
│  │    pages        │      │                     │  │
│  └─────────────────┘      └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Request Routing

| Request | Served By |
|---------|-----------|
| `/tarot/:slug` | Static HTML file → SPA hydrates |
| `/blog/:slug` | Static HTML file → SPA hydrates |
| `/`, `/about`, `/faq` | Static HTML file → SPA hydrates |
| `/admin/*`, `/profile` | SPA only (no SEO needed) |
| `/api/*` | Backend API |

## Pre-render Process

Runs during frontend build, after Vite compiles the SPA:

1. `npm install`
2. `vite build` (creates SPA in /dist)
3. Pre-render script:
   - Fetches all tarot articles from API
   - Fetches all blog posts from API
   - Generates HTML file for each item
   - Generates sitemap.xml
4. Deploy /dist to frontend server

### Generated HTML Contains

- Full `<head>` with title, meta description, Open Graph tags
- JSON-LD structured data for SEO
- Article content as plain HTML (readable by crawlers)
- Script tag that loads the SPA for interactivity

### Failure Handling

If the pre-render script fails:
- Build fails
- Coolify doesn't deploy
- Production unchanged
- Developer notified

## Staging Environment

| Production | Staging |
|------------|---------|
| celestiarcana.com | staging.celestiarcana.com |
| api.celestiarcana.com | staging-api.celestiarcana.com |

### Testing Workflow

1. Make changes locally → Test with `npm run build && npm run preview`
2. Push to staging branch → Auto-deploys to staging
3. Verify with Google's Rich Results Test
4. Merge to main → Auto-deploys to production

### Rollback Plan

```bash
git revert <commit>
git push
# Site restored in ~2 minutes
```

## Incremental Rollout

### Phase 1: Setup (no risk)
- Create staging environment in Coolify
- Create staging branch in git
- Verify staging deploys correctly

### Phase 2: Static pages (lowest risk)
- Pre-render: `/`, `/about`, `/faq`, `/privacy`, `/terms`
- No database content, hardcoded HTML
- Test on staging → Deploy to production

### Phase 3: Tarot articles (medium risk)
- Pre-render all `/tarot/:slug` pages
- Fetches from API during build
- Test on staging → Deploy to production

### Phase 4: Blog posts (medium risk)
- Pre-render all `/blog/:slug` pages
- Same pattern as tarot
- Test on staging → Deploy to production

### Phase 5: Sitemap & polish
- Generate sitemap.xml automatically
- Submit to Google Search Console
- Monitor indexing

## Testing Checklist

- [ ] Static HTML files exist in /dist
- [ ] Pages load without JavaScript enabled
- [ ] SPA hydrates and becomes interactive
- [ ] All links work
- [ ] Meta tags and structured data present
- [ ] Google Rich Results Test passes

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Pre-render script breaks build | Fails before deploy, production unchanged |
| Generated HTML looks wrong | Test on staging first |
| Unexpected issues | Staging catches before production |
| Need to rollback | Git revert + redeploy (~2 min) |

## Key Principle

Static HTML files are additive. If pre-rendering fails or files are missing, the SPA still works normally - you just don't get SEO benefits. No black screens.
