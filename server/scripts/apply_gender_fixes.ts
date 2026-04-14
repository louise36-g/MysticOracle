/**
 * apply_gender_fixes.ts
 *
 * Applies targeted, manually verified gender-agreement fixes to the database.
 * Each fix is a precise string replacement in a specific field of a specific slug.
 * All records (blog posts and tarot articles) live in the BlogPost table.
 *
 * Usage (dry run first):
 *   DATABASE_URL="..." npx tsx scripts/apply_gender_fixes.ts
 *
 * Apply:
 *   DATABASE_URL="..." npx tsx scripts/apply_gender_fixes.ts --apply
 */

import pg from 'pg';

const APPLY = process.argv.includes('--apply');

interface Fix {
  contentType: 'BLOG_POST' | 'TAROT_ARTICLE';
  slug: string;
  field: 'titleFr' | 'excerptFr' | 'contentFr';
  find: string;
  replace: string;
  note: string;
}

const FIXES: Fix[] = [
  // ─── Blog Posts ───────────────────────────────────────────────────────────────
  {
    contentType: 'BLOG_POST',
    slug: 'suit-of-pentacles-tarot-guide',
    field: 'excerptFr',
    find: 'la suite de Deniers',
    replace: 'la suite des Deniers',
    note: 'Deniers requires "des" not "de"',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'the-hanged-man-tarot-combinations-part-1',
    field: 'contentFr',
    find: 'régulier et patient',
    replace: 'régulier et patiente',
    note: 'La Force is feminine — adjective must agree',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'the-minor-arcana-tarot-guide',
    field: 'contentFr',
    find: 'quatre figures dans chaque suite',
    replace: 'quatre figures dans chacune des suites',
    note: '"Suite" is feminine — pronoun must agree',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'history-of-tarot',
    field: 'contentFr',
    find: "ornée de feuille d'or",
    replace: "ornée de feuilles d'or",
    note: 'Plural: decorated with gold leaves',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'six-of-cups-healing-properties',
    field: 'titleFr',
    find: 'La Six de Coupes',
    replace: 'Le Six de Coupes',
    note: 'Numbered tarot cards take masculine article in French',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'three-of-cups-healing-properties',
    field: 'titleFr',
    find: 'La Trois de Coupes',
    replace: 'Le Trois de Coupes',
    note: 'Numbered tarot cards take masculine article in French',
  },
  {
    contentType: 'BLOG_POST',
    slug: '9-of-pentacles-healing-properties',
    field: 'titleFr',
    find: 'La 9 de Pentacles',
    replace: 'Le 9 de Pentacles',
    note: 'Numbered tarot cards take masculine article in French',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'tarot-astrology-temperance-sagittarius-daily-energy',
    field: 'titleFr',
    find: 'équilibre douce',
    replace: 'équilibre doux',
    note: '"Équilibre" is masculine — adjective must agree',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'tarot-astrology-the-hanged-man-neptune-daily-energy',
    field: 'titleFr',
    find: 'La Pendue',
    replace: 'Le Pendu',
    note: 'The Hanged Man card is masculine: "Le Pendu"',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'how-to-shuffle-draw-tarot',
    field: 'titleFr',
    find: 'une tirage de tarot',
    replace: 'un tirage de tarot',
    note: '"Tirage" is masculine',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'tarot-healing-cards-complete-guide',
    field: 'titleFr',
    find: 'guide complèt',
    replace: 'guide complet',
    note: 'Typo: accent on wrong vowel',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'tarot-for-inner-child-healing',
    field: 'titleFr',
    find: "l'enfant intérieure",
    replace: "l'enfant intérieur",
    note: '"Enfant" used generically is masculine',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'tarot-astrology-major-arcana-zodiac-guide',
    field: 'contentFr',
    find: 'du Poisson de laisser',
    replace: 'des Poissons de laisser',
    note: 'Zodiac sign "Poissons" is always plural in French',
  },
  {
    contentType: 'BLOG_POST',
    slug: 'the-empress-tarot-combinations-part-2',
    field: 'contentFr',
    find: 'qui a menée à ce matin',
    replace: 'qui a mené à ce matin',
    note: 'Participe passé with "avoir" does not agree with subject',
  },

  // ─── Tarot Articles ───────────────────────────────────────────────────────────
  {
    contentType: 'TAROT_ARTICLE',
    slug: 'knight-of-swords-tarot-card-meaning',
    field: 'contentFr',
    find: 'Croissance Spirituel',
    replace: 'Croissance Spirituelle',
    note: '"Croissance" is feminine — adjective must agree',
  },
  {
    contentType: 'TAROT_ARTICLE',
    slug: 'queen-of-cups-tarot-card-meaning',
    field: 'excerptFr',
    find: 'une guide bienveillante',
    replace: 'un guide bienveillant',
    note: '"Guide" is masculine',
  },
  {
    contentType: 'TAROT_ARTICLE',
    slug: 'queen-of-cups-tarot-card-meaning',
    field: 'contentFr',
    find: 'elle est un avec ses sentiments',
    replace: 'elle est unie avec ses sentiments',
    note: '"Un" → "unie" to agree with feminine subject "elle"',
  },
  {
    contentType: 'TAROT_ARTICLE',
    slug: 'suit-of-cups-tarot-card-meanings',
    field: 'contentFr',
    find: 'y trouvent leur place',
    replace: 'y trouve sa place',
    note: 'Singular subject "Un cœur brisé comme un cœur comblé" → singular verb',
  },
  {
    contentType: 'TAROT_ARTICLE',
    slug: '5-of-swords-tarot-card-meaning',
    field: 'contentFr',
    find: "l'idée d'une collègue",
    replace: "l'idée d'un collègue",
    note: 'Generic/neutral form uses masculine in French',
  },
  {
    contentType: 'TAROT_ARTICLE',
    slug: '9-of-wands-tarot-card-meaning',
    field: 'titleFr',
    find: 'la dernière bastion',
    replace: 'le dernier bastion',
    note: '"Bastion" is masculine',
  },
  {
    contentType: 'TAROT_ARTICLE',
    slug: 'ace-of-pentacles-tarot-card-meaning',
    field: 'contentFr',
    find: "Enracinée dans l'élément Terre",
    replace: "Enraciné dans l'élément Terre",
    note: 'Refers to "l\'As de Deniers" (masculine)',
  },
  {
    contentType: 'TAROT_ARTICLE',
    slug: 'suit-of-pentacles-tarot-card-meanings',
    field: 'contentFr',
    find: 'Studieuse, ancrée et fascinée',
    replace: 'Studieux, ancré et fasciné',
    note: '"Page" in tarot is masculine',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  if (!APPLY) {
    console.log('DRY RUN — run with --apply to write changes\n');
  }

  let applied = 0;
  let alreadyClean = 0;
  let notFound = 0;

  for (const fix of FIXES) {
    const { rows } = await pool.query(
      `SELECT "${fix.field}" FROM "BlogPost"
       WHERE slug = $1 AND "contentType" = $2 AND "deletedAt" IS NULL
       LIMIT 1`,
      [fix.slug, fix.contentType]
    );

    if (rows.length === 0) {
      console.log(`⚠  NOT FOUND: ${fix.contentType} / ${fix.slug}`);
      notFound++;
      continue;
    }

    const current: string = rows[0][fix.field] || '';
    if (!current.includes(fix.find)) {
      console.log(`✓  Already clean: ${fix.slug} / ${fix.field}`);
      alreadyClean++;
      continue;
    }

    const updated = current.replaceAll(fix.find, fix.replace);

    if (APPLY) {
      await pool.query(
        `UPDATE "BlogPost" SET "${fix.field}" = $1
         WHERE slug = $2 AND "contentType" = $3 AND "deletedAt" IS NULL`,
        [updated, fix.slug, fix.contentType]
      );
      console.log(`⚡ Fixed: [${fix.contentType}] ${fix.slug} / ${fix.field} — ${fix.note}`);
    } else {
      console.log(`  Would fix: [${fix.contentType}] ${fix.slug} / ${fix.field}`);
      console.log(`    "${fix.find}"`);
      console.log(`    → "${fix.replace}"`);
      console.log(`    (${fix.note})`);
    }

    applied++;
  }

  await pool.end();

  console.log('\n══════════════════════════════════════════');
  console.log(`Fixes ${APPLY ? 'applied' : 'previewed'}: ${applied}`);
  if (alreadyClean > 0) console.log(`Already clean: ${alreadyClean}`);
  if (notFound > 0) console.log(`Not found:     ${notFound}`);
  if (!APPLY) console.log('\nRun with --apply to write changes.');
  console.log('══════════════════════════════════════════\n');
}

main().catch(console.error);
