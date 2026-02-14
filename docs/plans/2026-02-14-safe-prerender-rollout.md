# Safe Pre-render Rollout Plan

**Date:** 2026-02-14
**Status:** Ready for execution
**Priority:** Safety first, SEO second

## Pre-Flight Checklist (Before ANY Code Changes)

### Step 1: Tag Last Working Commit
```bash
git tag -a v1.0.0-stable -m "Last known stable production state before pre-render work"
git push origin v1.0.0-stable
```

### Step 2: Verify Current Production Works
- [ ] Visit https://celestiarcana.com - homepage loads
- [ ] Visit https://celestiarcana.com/tarot/the-fool-tarot-card-meaning - direct URL works
- [ ] Visit https://celestiarcana.com/blog - blog loads
- [ ] Client-side navigation works
- [ ] A tarot reading can be completed

### Step 3: Confirm Rollback Process
```bash
# If anything breaks, rollback is:
git checkout v1.0.0-stable
git push origin main --force  # Only in emergency
# Then trigger manual redeploy in Coolify
```

### Step 4: Disable Auto-Deploy
- [x] Production frontend: auto-deploy OFF
- [x] Production backend: auto-deploy OFF
- [ ] Staging frontend: auto-deploy OFF (or controlled)

### Step 5: Clear ALL Traefik Remnants
On the server (via Coolify Terminal):
```bash
# List what's there
ls -la /data/coolify/proxy/dynamic/

# Remove any SSR or custom routing files (NOT default_redirect_503.yaml)
rm -f /data/coolify/proxy/dynamic/ssr-routes.yaml
rm -f /data/coolify/proxy/dynamic/ssr-routes.yaml.save
rm -f /data/coolify/proxy/dynamic/ssr-routes.yaml.bak

# Verify only safe files remain
ls -la /data/coolify/proxy/dynamic/
# Should show: Caddyfile, default_redirect_503.yaml (these are safe)

# Restart Traefik to clear any in-memory routes
# Click "Restart Proxy" in Coolify Server settings
```

### Step 6: Verify Staging Environment
Before any pre-render work:
- [ ] Staging frontend deploys successfully
- [ ] Staging serves SPA correctly (visit staging.celestiarcana.com)
- [ ] Direct URL access works on staging
- [ ] Check Caddy config in staging container

```bash
# In staging container terminal:
cat /app/.nixpacks/assets/Caddyfile
# Should show try_files with fallback to index.html
```

---

## Build Script Design

### Current Problem
- `vite build` and prerender are separate
- Prerender could run at wrong time or fail silently

### Solution: Single Atomic Build Script

Create `scripts/build-with-prerender.sh`:
```bash
#!/bin/bash
set -e  # Exit on any error

echo "=========================================="
echo "CelestiArcana Production Build"
echo "=========================================="

# Step 1: Clean slate
echo ""
echo "[1/4] Cleaning previous build..."
rm -rf dist
echo "  ✓ Cleaned dist directory"

# Step 2: Vite build
echo ""
echo "[2/4] Running Vite build..."
npm run build:vite
if [ $? -ne 0 ]; then
    echo "  ✗ Vite build failed!"
    exit 1
fi
echo "  ✓ Vite build complete"

# Step 3: Pre-render (with graceful failure)
echo ""
echo "[3/4] Pre-rendering static pages..."
node scripts/prerender.js
PRERENDER_EXIT=$?

if [ $PRERENDER_EXIT -ne 0 ]; then
    echo "  ⚠ Pre-render had errors (exit code: $PRERENDER_EXIT)"
    echo "  → SPA will still work, but some pages won't have static HTML"
    # Don't exit - SPA is still functional
else
    echo "  ✓ Pre-render complete"
fi

# Step 4: Verify build output
echo ""
echo "[4/4] Verifying build..."
if [ ! -f "dist/index.html" ]; then
    echo "  ✗ CRITICAL: dist/index.html missing!"
    exit 1
fi
echo "  ✓ index.html present"

# Count pre-rendered files
STATIC_COUNT=$(find dist -name "*.html" ! -name "index.html" | wc -l | tr -d ' ')
echo "  ✓ ${STATIC_COUNT} static HTML pages generated"

echo ""
echo "=========================================="
echo "Build complete!"
echo "=========================================="
```

### Update package.json
```json
{
  "scripts": {
    "build:vite": "vite build",
    "build": "bash scripts/build-with-prerender.sh",
    "build:spa-only": "rm -rf dist && vite build"
  }
}
```

---

## Pre-render Script Requirements

### File: `scripts/prerender.ts`

```typescript
/**
 * Pre-render Script for CelestiArcana
 *
 * SAFETY RULES:
 * 1. Never fail the entire build - log errors and continue
 * 2. Always log what's happening
 * 3. Verify each file was created
 * 4. Print summary at end
 */

interface PreRenderResult {
  success: boolean;
  path: string;
  error?: string;
}

const results: PreRenderResult[] = [];

// Configuration
const API_BASE = process.env.API_URL || 'https://api.celestiarcana.com';
const API_TIMEOUT = 30000; // 30 seconds
const DIST_DIR = './dist';

async function main() {
  console.log('');
  console.log('=== Pre-render Starting ===');
  console.log(`API: ${API_BASE}`);
  console.log(`Output: ${DIST_DIR}`);
  console.log('');

  // Phase 1: Static pages (no API needed)
  console.log('[Phase 1] Static pages...');
  await prerenderStaticPages();

  // Phase 2: Tarot articles (requires API)
  console.log('');
  console.log('[Phase 2] Tarot articles...');
  await prerenderTarotArticles();

  // Phase 3: Blog posts (requires API)
  console.log('');
  console.log('[Phase 3] Blog posts...');
  await prerenderBlogPosts();

  // Summary
  printSummary();
}

function printSummary() {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('');
  console.log('=== Pre-render Summary ===');
  console.log(`Total attempted: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('');
    console.log('Failed pages:');
    failed.forEach(f => console.log(`  - ${f.path}: ${f.error}`));
  }

  console.log('');

  // Exit with error code if ANY failures, but build script handles this gracefully
  if (failed.length > 0) {
    process.exit(1);
  }
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
```

### Logging Requirements
Every pre-render action must log:
```
[Phase 1] Static pages...
  Generating /about... ✓
  Generating /faq... ✓
  Generating /privacy... ✓
  Generating /terms... ✓
  Generating /cookies... ✓

[Phase 2] Tarot articles...
  Fetching article list from API...
  Fetched 78 articles
  Generating /tarot/the-fool-tarot-card-meaning... ✓
  Generating /tarot/the-magician-tarot-card-meaning... ✓
  ...
  Generated 78/78 tarot articles

[Phase 3] Blog posts...
  Fetching blog list from API...
  Fetched 12 posts
  Generating /blog/how-to-read-tarot... ✓
  ...
  Generated 12/12 blog posts

=== Pre-render Summary ===
Total attempted: 95
Successful: 95
Failed: 0
```

---

## Cloudflare Risk Mitigation

### Before Any Deploy
1. **Enable Development Mode** in Cloudflare dashboard
   - This bypasses cache for 3 hours
   - Allows immediate verification of changes

### After Successful Deploy
1. Verify site works with Development Mode ON
2. If working, disable Development Mode
3. If issues, you can still see them without cache interference

### Cache Purge Procedure
```
Cloudflare Dashboard → celestiarcana.com → Caching → Purge Everything
```

### Cache Rules to Consider
For pre-rendered content, consider:
- Shorter TTL for HTML files (1 hour vs 1 day)
- Longer TTL for JS/CSS assets (1 week)

---

## Deployment Checklist

### Before Deploying to Staging
- [ ] All pre-flight checks passed
- [ ] v1.0.0-stable tag exists
- [ ] Traefik remnants cleared
- [ ] Auto-deploy disabled
- [ ] Cloudflare Development Mode ON

### Staging Verification
- [ ] Build completes with pre-render summary
- [ ] Homepage loads
- [ ] `/tarot/the-fool-tarot-card-meaning` direct access works
- [ ] `/blog/some-post` direct access works
- [ ] JavaScript disabled: content still visible
- [ ] JavaScript enabled: SPA hydrates, navigation works
- [ ] Google Rich Results Test passes for a tarot article

### Before Deploying to Production
- [ ] ALL staging checks passed
- [ ] Team notified of deployment window
- [ ] Rollback procedure reviewed

### Production Verification
- [ ] Same checks as staging
- [ ] Monitor for 15 minutes
- [ ] Check Sentry for errors
- [ ] Disable Cloudflare Development Mode

---

## Rollback Procedure

### If Production Breaks

**Immediate (< 5 minutes):**
1. In Coolify: click "Redeploy" on production frontend
2. This redeploys the same code (might fix container issues)

**If Redeploy Doesn't Fix:**
1. ```bash
   git checkout v1.0.0-stable
   git push origin main --force
   ```
2. In Coolify: click "Redeploy"
3. Purge Cloudflare cache

**If Traefik Issues (502 errors):**
1. Check `/data/coolify/proxy/dynamic/` for rogue files
2. Delete any non-default files
3. Restart Traefik proxy

**Nuclear Option:**
1. Delete frontend service in Coolify
2. Recreate from scratch with GitHub connection
3. Configure domain
4. Deploy from v1.0.0-stable tag

---

## Success Criteria

The pre-render rollout is successful when:

1. **SEO**: Google Rich Results Test shows valid structured data
2. **Crawlability**: `curl` to any article returns full HTML content
3. **Functionality**: All existing features still work
4. **Performance**: Page load time not significantly increased
5. **Stability**: No errors in Sentry for 24 hours

---

## Timeline

| Time | Action |
|------|--------|
| 09:00 | Pre-flight checks, tag stable commit |
| 09:30 | Clear Traefik, verify staging SPA |
| 10:00 | Implement build script |
| 11:00 | Implement pre-render (static pages only) |
| 12:00 | Test on staging |
| 14:00 | If staging OK: implement tarot article pre-render |
| 15:00 | Test on staging |
| 16:00 | If all staging OK: deploy to production |
| 16:30 | Production verification |
| 17:00 | Monitor and wrap up |

---

## Notes

- **Never** run prerender independently of build
- **Never** modify Traefik config files manually
- **Always** test on staging first
- **Always** have Cloudflare Development Mode ready
- **Always** know where the rollback tag is
