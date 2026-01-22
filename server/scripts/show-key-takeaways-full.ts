/**
 * Script to show the Key Takeaways section with more context
 */
import prisma from '../src/db/prisma.js';

async function showKeyTakeaways() {
  const slug = process.argv[2] || 'the-fool-tarot-card-meaning';

  const article = await prisma.tarotArticle.findFirst({
    where: { slug },
    select: { slug: true, content: true },
  });

  if (!article?.content) {
    console.log('Article not found');
    await prisma.$disconnect();
    return;
  }

  const content = article.content;

  // Check for key-takeaways container
  const hasContainer = content.includes('class="key-takeaways"');
  console.log(`Has container: ${hasContainer}`);

  if (hasContainer) {
    // Find the container and show it
    const containerStart = content.indexOf('<div class="key-takeaways"');
    const containerEnd = content.indexOf('</div>', containerStart) + 6;
    console.log('\n=== CONTAINER CONTENT ===');
    console.log(content.substring(containerStart, containerEnd));
  } else {
    // Show the h2/h3 with Key Takeaway
    const match = content.match(/<h[23][^>]*>([^<]*[Kk]ey [Tt]ake[- ]?[Aa]way[^<]*)<\/h[23]>/i);
    if (match) {
      const startIndex = content.indexOf(match[0]);
      console.log('\n=== KEY TAKEAWAYS (no container) ===');
      console.log(content.substring(startIndex - 100, startIndex + 800));
    }
  }

  await prisma.$disconnect();
}

showKeyTakeaways();
