/**
 * Script to check Key Takeaways formatting in tarot articles
 */
import prisma from '../src/db/prisma.js';

async function checkKeyTakeaways() {
  console.log('🔍 Checking Key Takeaways formatting in tarot articles...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { slug: true, content: true },
    orderBy: { slug: 'asc' },
  });

  let hasContainer = 0;
  let noContainer = 0;
  let noKeyTakeaways = 0;

  const needsFixing: string[] = [];

  for (const article of articles) {
    if (!article.content) continue;

    const hasKeyTakeawaysText =
      article.content.toLowerCase().includes('key takeaway') ||
      article.content.toLowerCase().includes('key take-away');

    if (!hasKeyTakeawaysText) {
      noKeyTakeaways++;
      continue;
    }

    const hasContainerClass = article.content.includes('class="key-takeaways"');

    if (hasContainerClass) {
      hasContainer++;
    } else {
      noContainer++;
      needsFixing.push(article.slug);
      console.log(`❌ ${article.slug} - missing container`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total articles: ${articles.length}`);
  console.log(`With Key Takeaways container: ${hasContainer}`);
  console.log(`Without container (needs fixing): ${noContainer}`);
  console.log(`No Key Takeaways section: ${noKeyTakeaways}`);

  if (needsFixing.length > 0) {
    console.log('\n=== ARTICLES NEEDING FIX ===');
    needsFixing.forEach(slug => console.log(`  - ${slug}`));
  }

  await prisma.$disconnect();
}

checkKeyTakeaways();
