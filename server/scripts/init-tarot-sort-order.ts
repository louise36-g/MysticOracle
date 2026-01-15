#!/usr/bin/env node
/**
 * Initialize sortOrder for all tarot articles based on cardNumber
 * Run once after adding sortOrder field
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing tarot article sort orders...\n');

  // Get all card types
  const cardTypes = [
    'MAJOR_ARCANA',
    'SUIT_OF_WANDS',
    'SUIT_OF_CUPS',
    'SUIT_OF_SWORDS',
    'SUIT_OF_PENTACLES',
  ];

  let totalUpdated = 0;

  for (const cardType of cardTypes) {
    console.log(`Processing ${cardType}...`);

    // Get all articles of this type, ordered by cardNumber
    const articles = await prisma.tarotArticle.findMany({
      where: { cardType: cardType as any },
      orderBy: { cardNumber: 'asc' },
      select: { id: true, cardNumber: true, title: true },
    });

    console.log(`  Found ${articles.length} articles`);

    // Update each article's sortOrder based on its position
    for (let i = 0; i < articles.length; i++) {
      await prisma.tarotArticle.update({
        where: { id: articles[i].id },
        data: { sortOrder: i },
      });
      console.log(`  ✓ ${articles[i].cardNumber} - ${articles[i].title} → sortOrder: ${i}`);
      totalUpdated++;
    }

    console.log('');
  }

  console.log(`\n✅ Initialization complete! Updated ${totalUpdated} articles.`);
}

main()
  .catch((error) => {
    console.error('Error initializing sort orders:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
