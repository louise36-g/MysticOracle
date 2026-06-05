/**
 * Round 2 content URL fixes — addresses issues found on second audit pass.
 *
 * 1. FR complete-guides: /tarot/major-arcana-deep-dives → /blog/major-arcana-deep-dives
 * 2. FR reconciliation/breakup: strip fake tarot-for-heartbreak/betrayal/leaving links
 * 3. FR yes-or-no slug mismatches: the-X-yes-or-no → the-X-as-yes-or-no (prefix already fixed in round 1)
 * 4. FR page-of-pentacles: French shortcodes → correct English shortcodes
 * 5. EN tarot-combinations: replace [INSERT MAJOR ARCANA GUIDE URL] / [INSERT SINGLE CARD READING URL]
 *
 * Usage:
 *   cd server && npx dotenv -e .env -- npx tsx scripts/fix-broken-content-urls-2.ts
 *   cd server && npx dotenv -e .env -- npx tsx scripts/fix-broken-content-urls-2.ts --apply
 */

import pg from 'pg';

const DRY_RUN = !process.argv.includes('--apply');

// ── Fix functions ─────────────────────────────────────────────────────────────

function fixFrMajorArcanaDeepDives(content: string): string {
  return content
    .replace(/\/tarot\/major-arcana-deep-dives/g, '/blog/major-arcana-deep-dives')
    .replace(
      /celestiarcana\.com\/tarot\/major-arcana-deep-dives/g,
      'celestiarcana.com/blog/major-arcana-deep-dives'
    );
}

function stripFakeTarotForLinks(content: string): string {
  const fakePatterns = [
    'tarot-for-heartbreak-tarot-card-meaning',
    'tarot-for-betrayal-tarot-card-meaning',
    'tarot-for-leaving-tarot-card-meaning',
  ];
  let result = content;
  for (const fake of fakePatterns) {
    const re = new RegExp(`<a[^>]*href=["'][^"']*${fake}[^"']*["'][^>]*>([^<]*)<\\/a>`, 'gi');
    result = result.replace(re, '$1');
  }
  return result;
}

/** Fix the-X-yes-or-no → the-X-as-yes-or-no where the blog post uses "as-" */
function fixYesOrNoSlug(content: string): string {
  return content
    .replace(/the-chariot-yes-or-no/g, 'the-chariot-as-yes-or-no')
    .replace(/the-moon-yes-or-no/g, 'the-moon-as-yes-or-no')
    .replace(/the-star-yes-or-no/g, 'the-star-as-yes-or-no');
}

function fixFrShortcodes(content: string): string {
  return content
    .replace(
      /\[\[tarot:as-de-deniers-tarot-card-meaning/g,
      '[[tarot:ace-of-pentacles-tarot-card-meaning'
    )
    .replace(
      /\[\[tarot:valet-de-coupes-tarot-card-meaning/g,
      '[[tarot:page-of-cups-tarot-card-meaning'
    );
}

/** Replace unreplaced placeholders with real URLs */
function fixUnreplacedPlaceholders(content: string): string {
  // These were skipped by urlReplacer exclusion list and stored literally
  return content
    .replace(/\[INSERT MAJOR ARCANA GUIDE URL\]/gi, '/blog/major-arcana-deep-dives')
    .replace(/\[INSERT SINGLE CARD READING URL\]/gi, '/tarot-card-reading');
}

// ── Fix map ───────────────────────────────────────────────────────────────────

type Fix = { slug: string; field: 'contentEn' | 'contentFr'; fns: Array<(s: string) => string> };

const FIXES: Fix[] = [
  // Fix 1 — FR complete guides: /tarot/major-arcana-deep-dives
  { slug: 'strength-complete-guide', field: 'contentFr', fns: [fixFrMajorArcanaDeepDives] },
  { slug: 'the-emperor-complete-guide', field: 'contentFr', fns: [fixFrMajorArcanaDeepDives] },
  { slug: 'the-empress-complete-guide', field: 'contentFr', fns: [fixFrMajorArcanaDeepDives] },
  { slug: 'the-hermit-complete-guide', field: 'contentFr', fns: [fixFrMajorArcanaDeepDives] },
  { slug: 'the-hierophant-complete-guide', field: 'contentFr', fns: [fixFrMajorArcanaDeepDives] },
  { slug: 'the-magician-complete-guide', field: 'contentFr', fns: [fixFrMajorArcanaDeepDives] },

  // Fix 2 — FR reconciliation/breakup: strip fake tarot-for-* links
  { slug: 'death-reconciliation', field: 'contentFr', fns: [stripFakeTarotForLinks] },
  { slug: 'the-hierophant-breakup', field: 'contentFr', fns: [stripFakeTarotForLinks] },
  { slug: 'the-high-priestess-reconciliation', field: 'contentFr', fns: [stripFakeTarotForLinks] },
  { slug: 'the-magician-breakup', field: 'contentFr', fns: [stripFakeTarotForLinks] },
  { slug: 'the-magician-reconciliation', field: 'contentFr', fns: [stripFakeTarotForLinks] },
  { slug: 'the-moon-reconciliation', field: 'contentFr', fns: [stripFakeTarotForLinks] },
  { slug: 'the-star-reconciliation', field: 'contentFr', fns: [stripFakeTarotForLinks] },
  { slug: 'the-tower-reconciliation', field: 'contentFr', fns: [stripFakeTarotForLinks] },
  { slug: 'the-world-reconciliation', field: 'contentFr', fns: [stripFakeTarotForLinks] },

  // Fix 3 — yes-or-no slug (round 1 fixed prefix but left wrong slug in FR complete guides)
  { slug: 'the-chariot-complete-guide', field: 'contentFr', fns: [fixYesOrNoSlug] },
  { slug: 'the-moon-complete-guide', field: 'contentFr', fns: [fixYesOrNoSlug] },
  { slug: 'the-star-complete-guide', field: 'contentFr', fns: [fixYesOrNoSlug] },

  // Fix 4 — FR shortcodes in page-of-pentacles
  { slug: 'page-of-pentacles-tarot-card-meaning', field: 'contentFr', fns: [fixFrShortcodes] },

  // Fix 5 — EN unreplaced placeholders
  {
    slug: 'the-heirophant-tarot-combinations-part-2',
    field: 'contentEn',
    fns: [fixUnreplacedPlaceholders],
  },
  {
    slug: 'the-magician-tarot-combinations-part-2',
    field: 'contentEn',
    fns: [fixUnreplacedPlaceholders],
  },
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
      `SELECT id, "contentEn", "contentFr" FROM "BlogPost"
       WHERE slug = $1 AND "deletedAt" IS NULL LIMIT 1`,
      [fix.slug]
    );

    if (!rows.length) {
      console.log(`⚠  ${fix.slug} — NOT FOUND`);
      continue;
    }

    const row = rows[0];
    const original = (row[fix.field] ?? '') as string;
    const fixed = fix.fns.reduce((s, fn) => fn(s), original);

    if (fixed === original) {
      console.log(`✓  ${fix.slug} (${fix.field}) — no change needed`);
      continue;
    }

    // Show what changed
    const removedUrls = (original.match(/href="[^"]+"/g) ?? []).filter(u => !fixed.includes(u));
    const addedUrls = (fixed.match(/href="[^"]+"/g) ?? []).filter(u => !original.includes(u));
    const removedSC = (original.match(/\[\[tarot:[^\]]+\]\]/g) ?? []).filter(
      u => !fixed.includes(u)
    );
    const addedSC = (fixed.match(/\[\[tarot:[^\]]+\]\]/g) ?? []).filter(u => !original.includes(u));
    const removedPH = (original.match(/\[INSERT[^\]]+\]/g) ?? []).filter(u => !fixed.includes(u));

    console.log(`\n  ${fix.slug} (${fix.field})`);
    removedUrls.forEach(u => console.log(`    - ${u}`));
    addedUrls.forEach(u => console.log(`    + ${u}`));
    removedSC.forEach(u => console.log(`    - shortcode ${u}`));
    addedSC.forEach(u => console.log(`    + shortcode ${u}`));
    removedPH.forEach(u => console.log(`    - placeholder replaced: ${u.substring(0, 60)}`));

    totalChanges++;

    if (!DRY_RUN) {
      await pool.query(`UPDATE "BlogPost" SET "${fix.field}" = $1 WHERE id = $2`, [fixed, row.id]);
      console.log(`    ✅ saved`);
    }
  }

  await pool.end();
  console.log(`\n${'─'.repeat(50)}`);
  if (DRY_RUN) {
    console.log(`Dry run complete. ${totalChanges} article(s) would be updated.`);
    console.log(`Run with --apply to commit.`);
  } else {
    console.log(`Done. ${totalChanges} article(s) updated.`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
