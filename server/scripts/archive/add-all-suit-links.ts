/**
 * Script to add suit guide links to all suit card articles
 * Links the first occurrence of "Suit of X" to the corresponding blog guide
 */
import prisma from '../src/db/prisma.js';

const SUITS = [
  { name: 'Wands', slug: 'wands', blogSlug: 'suit-of-wands-tarot-guide' },
  { name: 'Cups', slug: 'cups', blogSlug: 'suit-of-cups-tarot-guide' },
  { name: 'Pentacles', slug: 'pentacles', blogSlug: 'suit-of-pentacles-tarot-guide' },
];

async function addAllSuitLinks() {
  console.log('🔄 Adding suit guide links to all suit card articles...\n');

  for (const suit of SUITS) {
    console.log(`\n=== ${suit.name.toUpperCase()} ===\n`);

    // Verify the blog article exists
    const blogArticle = await prisma.blogPost.findFirst({
      where: { slug: suit.blogSlug },
      select: { slug: true, titleEn: true },
    });

    if (!blogArticle) {
      console.log(`❌ Blog article "${suit.blogSlug}" not found!`);
      continue;
    }

    console.log(`✅ Target: ${blogArticle.titleEn}\n`);

    // Get all articles for this suit
    const articles = await prisma.tarotArticle.findMany({
      where: {
        deletedAt: null,
        slug: { contains: suit.slug },
      },
      select: { id: true, slug: true, content: true },
      orderBy: { slug: 'asc' },
    });

    let updated = 0;

    for (const article of articles) {
      if (!article.content) continue;

      // Skip if already has a link to the suit guide
      if (article.content.includes(`[[blog:${suit.blogSlug}`)) {
        console.log(`⏭️  ${article.slug} - already has link`);
        continue;
      }

      // Find "Suit of X" not inside a shortcode or HTML tag
      const pattern = new RegExp(`(?<!\\[\\[[^\\]]*)(Suit of ${suit.name})(?![^\\[]*\\]\\])`, 'i');
      const match = article.content.match(pattern);

      if (!match) {
        console.log(`⏭️  ${article.slug} - no linkable mention found`);
        continue;
      }

      // Replace only the first occurrence
      const newContent = article.content.replace(
        pattern,
        `[[blog:${suit.blogSlug}|Suit of ${suit.name}]]`
      );

      if (newContent !== article.content) {
        await prisma.tarotArticle.update({
          where: { id: article.id },
          data: { content: newContent },
        });
        console.log(`✅ ${article.slug} - added link`);
        updated++;
      }
    }

    console.log(`\n✨ Added links to ${updated} ${suit.name} articles.`);
  }

  await prisma.$disconnect();
}

addAllSuitLinks();
