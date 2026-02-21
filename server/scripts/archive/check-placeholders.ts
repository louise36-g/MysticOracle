import prisma from '../src/db/prisma.js';

async function checkPlaceholders() {
  const posts = await prisma.blogPost.findMany({
    where: {
      contentEn: {
        contains: '[INSERT',
      },
    },
    select: {
      titleEn: true,
      slug: true,
      contentEn: true,
    },
    take: 3,
  });

  console.log(`Found ${posts.length} posts with [INSERT placeholders:\n`);

  for (const post of posts) {
    console.log(`\n📄 ${post.titleEn}`);
    console.log(`   Slug: ${post.slug}`);

    const matches = post.contentEn.match(/\[INSERT[^\]]+\]/g);
    if (matches) {
      console.log(`   Placeholders found:`);
      matches.slice(0, 5).forEach(match => {
        console.log(`   - ${match}`);
      });
      if (matches.length > 5) {
        console.log(`   ... and ${matches.length - 5} more`);
      }
    }
  }

  await prisma.$disconnect();
}

checkPlaceholders();
