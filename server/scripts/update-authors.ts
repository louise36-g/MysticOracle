/**
 * Script to update all authors to "Louise Griffin"
 *
 * Run with: npx tsx scripts/update-authors.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_AUTHOR = 'Louise Griffin';

async function main() {
  console.log('='.repeat(60));
  console.log('Author Update Script');
  console.log('='.repeat(60));
  console.log(`Setting all authors to: ${NEW_AUTHOR}\n`);

  try {
    // Update Tarot Articles
    const tarotResult = await prisma.tarotArticle.updateMany({
      data: {
        author: NEW_AUTHOR,
      },
    });
    console.log(`✓ Updated ${tarotResult.count} Tarot articles`);

    // Update Blog Posts
    const blogResult = await prisma.blogPost.updateMany({
      data: {
        authorName: NEW_AUTHOR,
      },
    });
    console.log(`✓ Updated ${blogResult.count} Blog posts`);

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  Tarot articles updated: ${tarotResult.count}`);
    console.log(`  Blog posts updated: ${blogResult.count}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error updating authors:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
