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
    // Update all content (blog posts + tarot articles are now in one table)
    const result = await prisma.blogPost.updateMany({
      data: {
        authorName: NEW_AUTHOR,
      },
    });
    console.log(`✓ Updated ${result.count} posts (blog + tarot)`);

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  Total updated: ${result.count}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error updating authors:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
