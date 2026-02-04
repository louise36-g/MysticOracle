/**
 * Remove "Seeking clarity" CTA sections from all tarot articles
 * These are redundant now that we have a dynamic CTA component
 */
import prisma from '../src/db/prisma.js';

async function removeSeekingClarityCTA() {
  console.log('🔄 Removing "Seeking clarity" CTA from all tarot articles...\n');

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

    // English patterns - various formats of "Seeking clarity" CTA
    const seekingClarityPatterns = [
      // Full blockquote with seeking clarity
      /<blockquote[^>]*>[\s\S]*?Seeking clarity[\s\S]*?<\/blockquote>/gi,
      // Paragraph with seeking clarity
      /<p[^>]*>\s*Seeking clarity[^<]*<\/p>/gi,
      // "Let the cards" patterns
      /<p[^>]*>\s*Let the cards[^<]*<\/p>/gi,
      // Combined section with h3 + p + link
      /<h3[^>]*>\s*Seeking[^<]*<\/h3>\s*<p[^>]*>[^<]*<\/p>\s*<a[^>]*>[^<]*reading[^<]*<\/a>/gi,
      // Standalone "Get your reading now" links/buttons after seeking clarity context
      /<p[^>]*>\s*<a[^>]*>\s*Get your reading[^<]*<\/a>\s*<\/p>/gi,
      // Any remaining "Get a reading" or similar CTAs
      /<p[^>]*>\s*<a[^>]*href="\/reading"[^>]*>[^<]*<\/a>\s*<\/p>/gi,
    ];

    // French patterns
    const frenchPatterns = [
      // "Vous cherchez des éclaircissements" or similar
      /<blockquote[^>]*>[\s\S]*?cherchez[\s\S]*?<\/blockquote>/gi,
      /<p[^>]*>\s*Vous cherchez[^<]*<\/p>/gi,
      // "Laissez les cartes" patterns
      /<p[^>]*>\s*Laissez les cartes[^<]*<\/p>/gi,
      // "Obtenez votre tirage" standalone links
      /<p[^>]*>\s*<a[^>]*>\s*Obtenez votre tirage[^<]*<\/a>\s*<\/p>/gi,
    ];

    // Apply English patterns
    for (const pattern of seekingClarityPatterns) {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, '');
        contentUpdated = true;
      }
    }

    // Apply French patterns to French content
    if (newContentFr) {
      for (const pattern of frenchPatterns) {
        if (pattern.test(newContentFr)) {
          newContentFr = newContentFr.replace(pattern, '');
          contentUpdated = true;
        }
      }
      // Also apply English patterns in case they exist in French content
      for (const pattern of seekingClarityPatterns) {
        if (pattern.test(newContentFr)) {
          newContentFr = newContentFr.replace(pattern, '');
          contentUpdated = true;
        }
      }
    }

    // Clean up any double newlines/empty paragraphs left behind
    newContent = newContent.replace(/<p[^>]*>\s*<\/p>/g, '');
    newContent = newContent.replace(/\n{3,}/g, '\n\n').trim();
    if (newContentFr) {
      newContentFr = newContentFr.replace(/<p[^>]*>\s*<\/p>/g, '');
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

removeSeekingClarityCTA().catch(console.error);
