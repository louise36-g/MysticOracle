/**
 * One-time script to initialize sortOrder for tarot articles.
 * Run with: npx tsx scripts/initSortOrder.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }),
});

async function main() {
  const cardTypes = [
    'MAJOR_ARCANA',
    'SUIT_OF_WANDS',
    'SUIT_OF_CUPS',
    'SUIT_OF_SWORDS',
    'SUIT_OF_PENTACLES',
  ] as const;

  for (const cardType of cardTypes) {
    const articles = await prisma.blogPost.findMany({
      where: { contentType: 'TAROT_ARTICLE', cardType, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, sortOrder: true },
    });
    const allZero = articles.every(a => a.sortOrder === 0);
    if (allZero && articles.length > 1) {
      await prisma.$transaction(
        articles.map((article, index) =>
          prisma.blogPost.update({
            where: { id: article.id },
            data: { sortOrder: index },
          })
        )
      );
      console.log(`Initialized ${articles.length} ${cardType} articles`);
    }
  }

  console.log('Done. Note: server in-memory cache will expire naturally or clear on restart.');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
