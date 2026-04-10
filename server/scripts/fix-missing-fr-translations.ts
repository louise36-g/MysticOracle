/**
 * Force-upserts French translation keys that may have been missed or seeded
 * with the wrong value (e.g. English fallback used as French value).
 *
 * Run with: npx tsx scripts/fix-missing-fr-translations.ts
 */

import prisma from '../src/db/prisma.js';

const FIXES: Record<string, string> = {
  'tarot.breadcrumbs.home': 'Accueil',
  'tarot.breadcrumbs.arcanas': 'Les Arcanes',
  'tarot.ArticleHeader.updated': 'Mis à jour',
  'tarot.TarotArticlePage.related_blog_posts': 'Articles Connexes',
  'tarot.TarotArticlePage.court_card': 'Carte de Cour',
  'tarot.TarotArticlePage.not_found': 'Article Introuvable',
  'tarot.TarotArticlePage.related_cards': 'Cartes Associées',
  'tarot.TarotArticlePage.related_topics': 'Thèmes Connexes',
  'tarot.TableOfContents.contents': 'Sommaire',
  'blog.BlogList.tarot_card_label': 'Carte de Tarot',
  'reading.OracleChat.ask_the_oracle': "Demandez à l'Oracle",
  'profile.TransactionItem.today': "Aujourd'hui",
};

const frLang = await prisma.language.findFirstOrThrow({ where: { code: 'fr' } });

let updated = 0;
let created = 0;

for (const [key, frValue] of Object.entries(FIXES)) {
  const existing = await prisma.translation.findFirst({
    where: { key, languageId: frLang.id },
  });

  if (existing) {
    if (existing.value !== frValue) {
      await prisma.translation.update({
        where: { id: existing.id },
        data: { value: frValue },
      });
      console.log(`  ✎ updated  "${key}" → "${frValue}" (was: "${existing.value}")`);
      updated++;
    } else {
      console.log(`  ✓ ok       "${key}" already correct`);
    }
  } else {
    await prisma.translation.create({
      data: { key, value: frValue, languageId: frLang.id },
    });
    console.log(`  + created  "${key}" → "${frValue}"`);
    created++;
  }
}

// Bump the translation version so clients invalidate their localStorage cache
await prisma.cacheVersion.upsert({
  where: { entity: 'translations' },
  create: { entity: 'translations', version: 2 },
  update: { version: { increment: 1 } },
});

console.log(`\nDone. ${created} created, ${updated} updated. Cache version bumped.`);
await prisma.$disconnect();
