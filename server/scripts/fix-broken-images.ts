/**
 * Fix broken inline image URLs in French (and English where needed) article content.
 *
 * Each entry maps a broken Cloudinary URL to a confirmed-working replacement,
 * scoped to specific articles and content fields.
 *
 * Usage (from server/ directory):
 *   npx tsx --env-file=.env scripts/fix-broken-images.ts
 */

import pg from 'pg';

interface Fix {
  slug: string;
  broken: string;
  working: string;
  fields: string[];
}

const FIXES: Fix[] = [
  // ── French content image was replaced with a new file but FR content wasn't updated ──
  {
    slug: '3-of-pentacles-tarot-card-meaning',
    broken:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1774343252/celestiarcana/tarot/03-of-pentacles.jpg',
    working:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1779632818/celestiarcana/tarot/03-of-pentacles-ok.jpg',
    fields: ['contentFr'],
  },
  {
    slug: '9-of-pentacles-tarot-card-meaning',
    broken:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1774345438/celestiarcana/tarot/09-of-pentacles.jpg',
    working:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1770719641/celestiarcana/tarot/09-of-pentacles-1.jpg',
    fields: ['contentFr'],
  },
  {
    slug: 'queen-of-pentacles-tarot-card-meaning',
    broken:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1774346685/celestiarcana/tarot/13-queen-of-pentacles.jpg',
    working:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1770719701/celestiarcana/tarot/13-queen-of-pentacles-1.jpg',
    fields: ['contentFr'],
  },
  // ── EN editor updated with new -ok.jpg uploads; FR content still has the old broken URL ──
  {
    slug: 'knight-of-pentacles-tarot-card-meaning',
    broken:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1774346415/celestiarcana/tarot/12-knight-of-pentacles.jpg',
    working:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1779910533/celestiarcana/tarot/12-knight-of-pentacles-ok.jpg',
    fields: ['contentFr'],
  },
  {
    slug: 'the-tower-tarot-card-meaning',
    broken:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1772449192/celestiarcana/tarot/16-the-tower.jpg',
    working:
      'https://res.cloudinary.com/dvt3q1p1c/image/upload/v1779910656/celestiarcana/tarot/16-the-tower-ok.jpg',
    fields: ['contentFr'],
  },
];

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('\n🔧  Fixing broken inline image URLs…\n');

  let totalFixed = 0;

  for (const fix of FIXES) {
    for (const field of fix.fields) {
      const col = `"${field}"`;

      const { rows } = await pool.query<Record<string, string>>(
        `SELECT ${col} FROM "BlogPost" WHERE slug = $1`,
        [fix.slug]
      );

      if (rows.length === 0) {
        console.log(`⚠  Article not found: ${fix.slug}`);
        continue;
      }

      const current = rows[0][field];
      const escapedBroken = fix.broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const count = (current.match(new RegExp(escapedBroken, 'g')) ?? []).length;

      if (count === 0) {
        console.log(`–  ${fix.slug} → ${field}: broken URL not present (already fixed?)`);
        continue;
      }

      const updated = current.split(fix.broken).join(fix.working);

      await pool.query(`UPDATE "BlogPost" SET ${col} = $1 WHERE slug = $2`, [updated, fix.slug]);

      console.log(`✅  ${fix.slug} → ${field}: replaced ${count} occurrence(s)`);
      console.log(`    FROM: ${fix.broken}`);
      console.log(`    TO:   ${fix.working}\n`);
      totalFixed += count;
    }
  }

  console.log(`\nDone — ${totalFixed} URL(s) updated.`);
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
