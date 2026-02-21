/**
 * Script to show the Key Takeaways section format in an article
 */
import prisma from '../src/db/prisma.js';

async function showKeyTakeaways() {
  const slug = process.argv[2] || 'ace-of-cups-tarot-card-meaning';

  const article = await prisma.tarotArticle.findFirst({
    where: { slug },
    select: { slug: true, content: true },
  });

  if (!article?.content) {
    console.log('Article not found');
    await prisma.$disconnect();
    return;
  }

  // Find Key Takeaways section
  const content = article.content;

  // Look for h2 or h3 with "Key Takeaway"
  const keyTakeawaysMatch = content.match(
    /<h[23][^>]*>([^<]*[Kk]ey [Tt]ake[- ]?[Aa]way[^<]*)<\/h[23]>/i
  );

  if (keyTakeawaysMatch) {
    const startIndex = content.indexOf(keyTakeawaysMatch[0]);
    // Get ~1500 chars after the heading
    const snippet = content.substring(startIndex, startIndex + 1500);
    console.log(`=== ${slug} ===`);
    console.log('Key Takeaways section found:');
    console.log(snippet);
  } else {
    console.log('Key Takeaways heading not found');
  }

  await prisma.$disconnect();
}

showKeyTakeaways();
