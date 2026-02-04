/**
 * Remove orphaned "Seeking Clarity" headings and any remaining CTA fragments
 */
import prisma from '../src/db/prisma.js';

async function cleanupOrphanHeadings() {
  console.log('🔄 Cleaning up orphaned CTA headings...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true, contentFr: true },
    orderBy: { slug: 'asc' },
  });

  let articlesFixed = 0;

  for (const article of articles) {
    let contentUpdated = false;
    let newContent = article.content || '';
    let newContentFr = article.contentFr || '';

    // Patterns for orphaned headings and CTA fragments
    const patterns = [
      // Orphaned "Seeking Clarity" headings (EN)
      /<h3[^>]*>\s*Seeking Clarity\??\s*<\/h3>/gi,
      // French equivalent
      /<h3[^>]*>\s*Vous cherchez[^<]*\??\s*<\/h3>/gi,
      /<h3[^>]*>\s*Besoin de clarté\??\s*<\/h3>/gi,
      // Any "Let the cards" or "Let the tarot" text
      /<p[^>]*>[^<]*Let the (cards|tarot)[^<]*<\/p>/gi,
      // French: "Laissez les cartes"
      /<p[^>]*>[^<]*Laissez les cartes[^<]*<\/p>/gi,
      // Any standalone reading links
      /<p[^>]*>\s*<a[^>]*href="\/reading"[^>]*>[^<]*<\/a>\s*<\/p>/gi,
      // Empty paragraphs
      /<p[^>]*>\s*<\/p>/g,
    ];

    // Apply patterns to English content
    for (const pattern of patterns) {
      const before = newContent;
      newContent = newContent.replace(pattern, '');
      if (before !== newContent) {
        contentUpdated = true;
      }
    }

    // Apply patterns to French content
    if (newContentFr) {
      for (const pattern of patterns) {
        const before = newContentFr;
        newContentFr = newContentFr.replace(pattern, '');
        if (before !== newContentFr) {
          contentUpdated = true;
        }
      }
    }

    // Clean up whitespace
    newContent = newContent.replace(/\n{3,}/g, '\n\n').trim();
    if (newContentFr) {
      newContentFr = newContentFr.replace(/\n{3,}/g, '\n\n').trim();
    }

    if (contentUpdated) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: {
          content: newContent,
          contentFr: newContentFr || undefined,
        },
      });
      console.log(`✅ Cleaned: ${article.slug}`);
      articlesFixed++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total articles checked: ${articles.length}`);
  console.log(`Articles cleaned: ${articlesFixed}`);

  await prisma.$disconnect();
}

cleanupOrphanHeadings().catch(console.error);
