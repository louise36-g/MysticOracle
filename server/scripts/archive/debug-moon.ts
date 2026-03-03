import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }),
});

async function check() {
  const article = await prisma.tarotArticle.findUnique({
    where: { slug: 'the-moon-tarot-card-meaning' },
    select: { content: true },
  });

  if (!article) {
    console.log('Article not found');
    return;
  }

  // Find the Keywords section
  const idx = article.content.indexOf('Keywords');
  if (idx === -1) {
    console.log('No Keywords found');
    return;
  }

  // Show 500 chars before and after
  const start = Math.max(0, idx - 500);
  const end = Math.min(article.content.length, idx + 500);
  console.log('Content around Keywords:');
  console.log('---');
  console.log(article.content.substring(start, end));
  console.log('---');

  await prisma.$disconnect();
}

check().catch(console.error);
