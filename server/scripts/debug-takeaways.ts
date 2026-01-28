import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const slugs = ['the-moon-tarot-card-meaning', 'the-fool-tarot-card-meaning'];

  for (const slug of slugs) {
    const article = await prisma.tarotArticle.findUnique({
      where: { slug },
      select: { title: true, content: true },
    });

    if (!article) continue;

    console.log('\n=== ' + article.title + ' ===');

    // Check for Key Takeaways
    const hasKeyTakeaways = article.content.includes('Key Takeaways');
    const hasContainer = article.content.includes('key-takeaways');

    console.log('Has "Key Takeaways" text: ' + hasKeyTakeaways);
    console.log('Has key-takeaways class: ' + hasContainer);

    if (hasKeyTakeaways) {
      const idx = article.content.indexOf('Key Takeaways');
      const start = Math.max(0, idx - 100);
      const end = Math.min(article.content.length, idx + 600);
      console.log('\nContext:');
      console.log(article.content.substring(start, end));
    }
  }

  await prisma.$disconnect();
}

check().catch(console.error);
