/**
 * Move the suit-nav to the top of the yes-or-no-tarot article.
 * Run: npx tsx scripts/move-suitnav-top.ts
 */
import 'dotenv/config';
import prisma from '../src/db/prisma.js';

async function main() {
  const post = await prisma.blogPost.findUnique({
    where: { slug: 'yes-or-no-tarot' },
    select: { id: true, contentEn: true },
  });

  if (!post) {
    console.log('Not found');
    return;
  }

  let content = post.contentEn;

  // Extract the suit-nav block
  const navMatch = content.match(/<div class="suit-nav[^"]*">[\s\S]*?<\/div>/);
  if (!navMatch) {
    console.log('No suit-nav found');
    return;
  }
  const navHtml = navMatch[0];
  console.log('Found nav at index:', content.indexOf(navHtml));

  // Remove from current position
  content = content.replace(navHtml, '');

  // Remove the "visible" class (not needed, always visible now)
  const cleanNav = navHtml.replace(' visible', '');

  // Insert at the very beginning of the content
  content = cleanNav + content;

  console.log('New nav position: 0');
  console.log('New content starts with:', content.substring(0, 200));

  await prisma.blogPost.update({
    where: { id: post.id },
    data: { contentEn: content },
  });

  console.log('✅ Moved suit-nav to top of article');
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
