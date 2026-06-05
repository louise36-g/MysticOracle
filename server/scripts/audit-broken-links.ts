/**
 * Scans all published article content (tarot + blog) for broken internal links.
 *
 * Checks:
 *   - /tarot/<slug> links that don't match any published tarot article slug
 *   - /blog/<slug>  links that don't match any published blog post slug
 *   - Shortcode [[tarot:slug]] and [[blog:slug]] with unknown slugs
 *   - [INSERT ... URL] placeholders that were never replaced (left raw in DB)
 *
 * Usage:
 *   cd server && npx dotenv -e .env -- npx tsx scripts/audit-broken-links.ts
 */

import pg from 'pg';

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // ── 1. Build slug registries ──────────────────────────────────────────────

  const { rows: tarotRows } = await pool.query<{ slug: string }>(
    `SELECT slug FROM "BlogPost"
     WHERE "contentType" = 'TAROT_ARTICLE'
       AND "deletedAt" IS NULL
       AND status = 'PUBLISHED'`
  );
  const tarotSlugs = new Set(tarotRows.map(r => r.slug));

  const { rows: blogRows } = await pool.query<{ slug: string }>(
    `SELECT slug FROM "BlogPost"
     WHERE "contentType" = 'BLOG_POST'
       AND "deletedAt" IS NULL
       AND status = 'PUBLISHED'`
  );
  const blogSlugs = new Set(blogRows.map(r => r.slug));

  console.log(`Registry: ${tarotSlugs.size} tarot articles, ${blogSlugs.size} blog posts\n`);

  // ── 2. Fetch all article content ─────────────────────────────────────────

  const { rows: articles } = await pool.query<{
    id: string;
    slug: string;
    title: string;
    contentType: string;
    contentEn: string | null;
    contentFr: string | null;
  }>(
    `SELECT id, slug, "titleEn" AS title, "contentType", "contentEn", "contentFr"
     FROM "BlogPost"
     WHERE "deletedAt" IS NULL AND status = 'PUBLISHED'
     ORDER BY "contentType", slug`
  );

  console.log(`Scanning ${articles.length} published articles…\n`);

  // ── 3. Patterns to check ──────────────────────────────────────────────────

  // href="/tarot/some-slug"  or  href='/tarot/some-slug'
  const hrefTarot =
    /href=["'](?:https?:\/\/(?:www\.)?celestiarcana\.com)?(?:\/fr)?\/tarot\/([a-z0-9-]+)["']/g;
  // href="/blog/some-slug"
  const hrefBlog =
    /href=["'](?:https?:\/\/(?:www\.)?celestiarcana\.com)?(?:\/fr)?\/blog\/([a-z0-9-]+)["']/g;
  // shortcodes [[tarot:slug]] [[blog:slug]]
  const scTarot = /\[\[tarot:([^\]|]+)/g;
  const scBlog = /\[\[blog:([^\]|]+)/g;
  // unreplaced placeholders
  const rawPlaceholder = /\[INSERT\s+[A-Z0-9\s-]+(?:URL|CARD|ARTICLE)[^\]]*\]/gi;

  type Issue = {
    articleSlug: string;
    articleTitle: string;
    contentType: string;
    lang: string;
    type: string;
    badLink: string;
  };

  const issues: Issue[] = [];

  for (const art of articles) {
    for (const [lang, content] of [
      ['EN', art.contentEn],
      ['FR', art.contentFr],
    ] as [string, string | null][]) {
      if (!content) continue;

      const addIssue = (type: string, badLink: string) =>
        issues.push({
          articleSlug: art.slug,
          articleTitle: art.title,
          contentType: art.contentType,
          lang,
          type,
          badLink,
        });

      // tarot href links
      for (const m of content.matchAll(new RegExp(hrefTarot.source, 'g'))) {
        if (!tarotSlugs.has(m[1])) addIssue('broken /tarot/ href', m[1]);
      }
      // blog href links
      for (const m of content.matchAll(new RegExp(hrefBlog.source, 'g'))) {
        // ignore /blog/category/... and /blog/tag/...
        if (m[1].startsWith('category') || m[1].startsWith('tag')) continue;
        if (!blogSlugs.has(m[1])) addIssue('broken /blog/ href', m[1]);
      }
      // tarot shortcodes
      for (const m of content.matchAll(new RegExp(scTarot.source, 'g'))) {
        const slug = m[1].trim();
        if (!tarotSlugs.has(slug)) addIssue('broken [[tarot:]] shortcode', slug);
      }
      // blog shortcodes
      for (const m of content.matchAll(new RegExp(scBlog.source, 'g'))) {
        const slug = m[1].trim();
        if (!blogSlugs.has(slug)) addIssue('broken [[blog:]] shortcode', slug);
      }
      // unreplaced placeholders
      for (const m of content.matchAll(new RegExp(rawPlaceholder.source, 'gi'))) {
        addIssue('unreplaced placeholder', m[0]);
      }
    }
  }

  await pool.end();

  // ── 4. Report ─────────────────────────────────────────────────────────────

  if (issues.length === 0) {
    console.log('✅ No broken links found.');
    return;
  }

  // Deduplicate: same bad link in same article (EN+FR counted once)
  const deduped = new Map<string, Issue>();
  for (const issue of issues) {
    const key = `${issue.articleSlug}|${issue.type}|${issue.badLink}`;
    if (!deduped.has(key)) deduped.set(key, issue);
  }

  // Group by bad link for easy triage
  const byBadLink = new Map<string, Issue[]>();
  for (const issue of deduped.values()) {
    const k = `${issue.type}: ${issue.badLink}`;
    (byBadLink.get(k) ?? byBadLink.set(k, []).get(k)!).push(issue);
  }

  console.log(
    `⚠️  Found ${deduped.size} unique broken link instances across ${
      new Set([...deduped.values()].map(i => i.articleSlug)).size
    } articles.\n`
  );

  for (const [link, affectedArticles] of [...byBadLink.entries()].sort()) {
    console.log(`\n  ❌  ${link}`);
    for (const a of affectedArticles) {
      console.log(
        `       → in ${a.contentType === 'TAROT_ARTICLE' ? '/tarot/' : '/blog/'}${a.articleSlug} (${a.lang})`
      );
    }
  }

  console.log('\n──────────────────────────────────────────────');
  console.log(
    `Total: ${deduped.size} broken links in ${
      new Set([...deduped.values()].map(i => i.articleSlug)).size
    } articles`
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
