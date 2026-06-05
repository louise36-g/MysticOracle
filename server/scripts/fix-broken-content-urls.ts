/**
 * Fix broken internal URLs stored in article content.
 *
 * Three classes of error, all traced to their root cause:
 *
 * 1. FR translation error: AI changed /blog/X → /fr/tarot/X instead of /fr/blog/X
 *    for blog sub-articles whose slugs contain card names.
 *    Fix: /fr/tarot/X → /fr/blog/X when X does not end in -tarot-card-meaning.
 *
 * 2. EN wrong prefix: /tarot/major-arcana-deep-dives and /tarot/X-numerology-guide
 *    linked as tarot pages when they are blog posts.
 *    Fix: specific REPLACE calls per affected article.
 *
 * 3. EN fake slugs: [INSERT TAROT FOR HEARTBREAK URL] was processed by urlReplacer
 *    Pattern 3 into /tarot/tarot-for-heartbreak-tarot-card-meaning. These articles
 *    don't exist. Fix: strip <a> wrapper, keep link text only.
 *
 * Dry-run by default — shows every change without writing.
 * Pass --apply to commit to DB.
 *
 *   cd server && npx dotenv -e .env -- npx tsx scripts/fix-broken-content-urls.ts
 *   cd server && npx dotenv -e .env -- npx tsx scripts/fix-broken-content-urls.ts --apply
 */

import pg from 'pg';

const DRY_RUN = !process.argv.includes('--apply');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fix 1: /fr/tarot/X → /fr/blog/X only for non-tarot-card-meaning slugs */
function fixFrTarotPrefix(content: string): string {
  return content.replace(/\/fr\/tarot\/([a-z0-9-]+)/g, (match, slug) => {
    if (slug.endsWith('-tarot-card-meaning') || slug.endsWith('-tarot-card-meanings')) {
      return match; // correct tarot article URL — leave it
    }
    return `/fr/blog/${slug}`;
  });
}

/** Fix 2a: /tarot/major-arcana-deep-dives → /blog/major-arcana-deep-dives */
function fixMajorArcanaDeepDivesEn(content: string): string {
  return content
    .replace(/\/tarot\/major-arcana-deep-dives/g, '/blog/major-arcana-deep-dives')
    .replace(
      /celestiarcana\.com\/tarot\/major-arcana-deep-dives/g,
      'celestiarcana.com/tarot/major-arcana-deep-dives'
    ); // already caught above, no-op guard
}

/** Fix 2b: /tarot/X-numerology-guide and /tarot/tarot-numerology-complete-guide → /blog/ */
function fixNumerologyLinks(content: string): string {
  return content
    .replace(/\/tarot\/(cups-numerology-guide)/g, '/blog/$1')
    .replace(/\/tarot\/(swords-numerology-guide)/g, '/blog/$1')
    .replace(/\/tarot\/(wands-numerology-guide)/g, '/blog/$1')
    .replace(/\/tarot\/(tarot-numerology-complete-guide)/g, '/blog/$1');
}

/** Fix 3: strip <a> tags whose href contains the fake tarot-for-* slugs */
function stripFakeTarotForLinks(content: string): string {
  const fakePatterns = [
    'tarot-for-heartbreak-tarot-card-meaning',
    'tarot-for-betrayal-tarot-card-meaning',
    'tarot-for-leaving-tarot-card-meaning',
    'shadow-work-article-tarot-card-meaning',
  ];
  let result = content;
  for (const fake of fakePatterns) {
    // Replace <a href="...fake...">TEXT</a> with just TEXT
    const re = new RegExp(`<a[^>]*href=["'][^"']*${fake}[^"']*["'][^>]*>([^<]*)<\\/a>`, 'gi');
    result = result.replace(re, '$1');
  }
  return result;
}

/** Fix 4: /tarot/the-emporer-* → /blog/the-emperor-* (typo + prefix)
 *  Also fixes the typo after fixFrTarotPrefix has already converted /fr/tarot/ → /fr/blog/ */
function fixEmperorTypoLinks(content: string): string {
  return content
    .replace(/\/tarot\/the-emporer-as-feelings/g, '/blog/the-emperor-as-feelings')
    .replace(/\/tarot\/the-emporer-current-situation/g, '/blog/the-emperor-current-situation')
    .replace(/\/blog\/the-emporer-/g, '/blog/the-emperor-'); // catches /blog/ and /fr/blog/ post-prefix-fix
}

// ── Per-article fix map ───────────────────────────────────────────────────────

type Fix = {
  slug: string;
  field: 'contentEn' | 'contentFr';
  fns: Array<(s: string) => string>;
};

const FIXES: Fix[] = [
  // Fix 1 — FR translation prefix errors
  { slug: 'the-chariot-complete-guide', field: 'contentFr', fns: [fixFrTarotPrefix] },
  { slug: 'the-moon-complete-guide', field: 'contentFr', fns: [fixFrTarotPrefix] },
  { slug: 'the-star-complete-guide', field: 'contentFr', fns: [fixFrTarotPrefix] },
  { slug: 'the-star-current-situation', field: 'contentFr', fns: [fixFrTarotPrefix] },
  { slug: 'death-current-situation', field: 'contentFr', fns: [fixFrTarotPrefix] },
  { slug: 'death-reconciliation', field: 'contentFr', fns: [fixFrTarotPrefix] },
  { slug: 'the-empress-spirituality', field: 'contentFr', fns: [fixFrTarotPrefix] },
  {
    slug: 'the-emperor-as-a-person',
    field: 'contentFr',
    fns: [fixFrTarotPrefix, fixEmperorTypoLinks],
  },
  {
    slug: 'the-emperor-spirituality',
    field: 'contentFr',
    fns: [fixFrTarotPrefix, fixEmperorTypoLinks],
  },
  { slug: 'the-world-love-advice', field: 'contentFr', fns: [fixFrTarotPrefix] },
  { slug: 'the-world-love-outcome', field: 'contentFr', fns: [fixFrTarotPrefix] },

  // Fix 2a — EN major-arcana-deep-dives wrong prefix
  { slug: 'strength-complete-guide', field: 'contentEn', fns: [fixMajorArcanaDeepDivesEn] },
  { slug: 'the-chariot-complete-guide', field: 'contentEn', fns: [fixMajorArcanaDeepDivesEn] },
  { slug: 'the-emperor-complete-guide', field: 'contentEn', fns: [fixMajorArcanaDeepDivesEn] },
  { slug: 'the-empress-complete-guide', field: 'contentEn', fns: [fixMajorArcanaDeepDivesEn] },
  { slug: 'the-fool-complete-guide', field: 'contentEn', fns: [fixMajorArcanaDeepDivesEn] },
  { slug: 'the-hermit-complete-guide', field: 'contentEn', fns: [fixMajorArcanaDeepDivesEn] },
  { slug: 'the-hierophant-complete-guide', field: 'contentEn', fns: [fixMajorArcanaDeepDivesEn] },
  { slug: 'the-magician-complete-guide', field: 'contentEn', fns: [fixMajorArcanaDeepDivesEn] },

  // Fix 2b — EN numerology guide wrong prefix
  { slug: 'cups-numerology-guide', field: 'contentEn', fns: [fixNumerologyLinks] },
  { slug: 'swords-numerology-guide', field: 'contentEn', fns: [fixNumerologyLinks] },
  { slug: 'wands-numerology-guide', field: 'contentEn', fns: [fixNumerologyLinks] },

  // Fix 3 — EN fake tarot-for-* slugs
  { slug: 'death-reconciliation', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'judgement-reconciliation', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'the-hierophant-breakup', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'the-high-priestess-reconciliation', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'the-magician-breakup', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'the-magician-reconciliation', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'the-moon-reconciliation', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'the-star-reconciliation', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'the-tower-reconciliation', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'the-world-reconciliation', field: 'contentEn', fns: [stripFakeTarotForLinks] },
  { slug: 'tarot-for-wellbeing-complete-guide', field: 'contentFr', fns: [stripFakeTarotForLinks] },

  // Fix 4 — EN emperor typo + wrong prefix
  { slug: 'the-emperor-as-a-person', field: 'contentEn', fns: [fixEmperorTypoLinks] },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN — no changes written' : '⚠️  APPLYING CHANGES'}\n`);

  let totalChanges = 0;

  for (const fix of FIXES) {
    const { rows } = await pool.query<{ id: string; contentEn: string; contentFr: string }>(
      `SELECT id, "contentEn", "contentFr" FROM "BlogPost" WHERE slug = $1 AND "deletedAt" IS NULL LIMIT 1`,
      [fix.slug]
    );

    if (!rows.length) {
      console.log(`⚠  ${fix.slug} — NOT FOUND in DB`);
      continue;
    }

    const row = rows[0];
    const original = (row[fix.field] ?? '') as string;
    const fixed = fix.fns.reduce((s, fn) => fn(s), original);

    if (fixed === original) {
      console.log(`✓  ${fix.slug} (${fix.field}) — no change needed`);
      continue;
    }

    // Count changed URLs for summary
    const diff = countDiff(original, fixed);
    console.log(`\n  ${fix.slug} (${fix.field}) — ${diff} URL(s) fixed`);

    // Show specifics
    showUrlDiff(original, fixed);

    totalChanges++;

    if (!DRY_RUN) {
      await pool.query(`UPDATE "BlogPost" SET "${fix.field}" = $1 WHERE id = $2`, [fixed, row.id]);
      console.log(`  ✅ saved`);
    }
  }

  await pool.end();

  console.log(`\n${'─'.repeat(50)}`);
  if (DRY_RUN) {
    console.log(`Dry run complete. ${totalChanges} article(s) would be updated.`);
    console.log(`Run with --apply to commit changes.`);
  } else {
    console.log(`Done. ${totalChanges} article(s) updated.`);
  }
}

function countDiff(before: string, after: string): number {
  // crude count: number of positions that differ
  let count = 0;
  const bUrls = before.match(/href="[^"]+"/g) ?? [];
  const aUrls = after.match(/href="[^"]+"/g) ?? [];
  const bSet = new Set(bUrls);
  const aSet = new Set(aUrls);
  for (const u of bSet) if (!aSet.has(u)) count++;
  return count || 1;
}

function showUrlDiff(before: string, after: string) {
  const bUrls = new Set(before.match(/href="[^"]+"/g) ?? []);
  const aUrls = new Set(after.match(/href="[^"]+"/g) ?? []);
  for (const u of bUrls) {
    if (!aUrls.has(u)) console.log(`    - ${u}`);
  }
  for (const u of aUrls) {
    if (!bUrls.has(u)) console.log(`    + ${u}`);
  }
  // Also show stripped links (anchor tags removed)
  const bAnchors = before.match(/<a[^>]*href="[^"]*tarot-for-[^"]*"[^>]*>[^<]*<\/a>/gi) ?? [];
  for (const a of bAnchors) {
    console.log(`    - (stripped) ${a.substring(0, 80)}…`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
