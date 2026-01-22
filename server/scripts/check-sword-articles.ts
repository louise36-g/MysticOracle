/**
 * Script to check sword card articles for potential Suit of Swords links
 */
import prisma from '../src/db/prisma.js';

async function checkSwordArticles() {
  console.log('🔍 Checking sword card articles for "Suit of Swords" mentions...\n');

  // Get all sword card articles
  const articles = await prisma.tarotArticle.findMany({
    where: {
      deletedAt: null,
      slug: { contains: 'swords' },
    },
    select: { slug: true, title: true, content: true },
    orderBy: { slug: 'asc' },
  });

  console.log(`Found ${articles.length} sword articles\n`);

  for (const article of articles) {
    if (!article.content) continue;

    // Check for existing shortcodes
    const existingShortcodes = article.content.match(/\[\[blog:suit-of-swords[^\]]*\]\]/g);

    // Check for "Suit of Swords" mentions not in shortcodes
    // Remove shortcodes first, then check for mentions
    const contentWithoutShortcodes = article.content.replace(/\[\[[^\]]+\]\]/g, '');
    const suitMentions = contentWithoutShortcodes.match(/Suit of Swords/gi);

    console.log(`📄 ${article.slug}`);
    console.log(`   Existing links to suit guide: ${existingShortcodes?.length || 0}`);
    console.log(`   Unlinked "Suit of Swords" mentions: ${suitMentions?.length || 0}`);

    if (suitMentions && suitMentions.length > 0) {
      console.log(`   ⚠️  Could add link!`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

checkSwordArticles();
