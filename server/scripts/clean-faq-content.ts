/**
 * Script to clean FAQ content from blog posts that have structured FAQ data
 * - Removes h3/h4 FAQ questions and their answers from content
 * - Keeps only the LAST [FAQ] marker (user's intended position)
 */
import prisma from '../src/db/prisma.js';
import { JSDOM } from 'jsdom';

interface FAQItem {
  question: string;
  answer: string;
}

async function cleanFAQContent() {
  console.log('🔄 Cleaning FAQ content from blog posts...\n');

  // Get all posts that have FAQs
  const posts = await prisma.blogPost.findMany({
    where: {
      deletedAt: null,
      faq: { not: null },
    },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      contentEn: true,
      contentFr: true,
      faq: true,
    },
  });

  console.log(`Found ${posts.length} posts with FAQ data\n`);

  let updated = 0;

  for (const post of posts) {
    const faqs = (post.faq as FAQItem[]) || [];
    if (faqs.length === 0) continue;

    let contentEnChanged = false;
    let contentFrChanged = false;
    let newContentEn = post.contentEn || '';
    let newContentFr = post.contentFr || '';

    // Process English content
    if (newContentEn) {
      const result = cleanContent(newContentEn, faqs);
      if (result !== newContentEn) {
        newContentEn = result;
        contentEnChanged = true;
      }
    }

    // Process French content
    if (newContentFr) {
      const result = cleanContent(newContentFr, faqs);
      if (result !== newContentFr) {
        newContentFr = result;
        contentFrChanged = true;
      }
    }

    if (contentEnChanged || contentFrChanged) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          contentEn: newContentEn,
          contentFr: newContentFr,
        },
      });
      console.log(`✅ Cleaned: ${post.slug}`);
      updated++;
    } else {
      console.log(`⏭️  No changes: ${post.slug}`);
    }
  }

  console.log(`\n✨ Done! Updated ${updated} posts.`);
  await prisma.$disconnect();
}

function cleanContent(html: string, faqs: FAQItem[]): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Create set of FAQ questions for matching
  const faqQuestions = new Set(faqs.map(f => f.question.toLowerCase().trim()));

  // Remove h3/h4 headings that match FAQ questions and their following paragraphs
  doc.querySelectorAll('h3, h4').forEach(heading => {
    const headingText = heading.textContent?.trim().toLowerCase() || '';
    if (faqQuestions.has(headingText)) {
      // Remove the following paragraph (the answer) first
      const nextEl = heading.nextElementSibling;
      if (nextEl && nextEl.tagName.toLowerCase() === 'p') {
        nextEl.remove();
      }
      heading.remove();
    }
  });

  // Handle multiple [FAQ] markers - keep only the last one
  let result = doc.body.innerHTML;
  const faqMarkerRegex = /<p[^>]*>\s*\[FAQ\]\s*<\/p>/gi;
  const matches = result.match(faqMarkerRegex);

  if (matches && matches.length > 1) {
    // Remove all but the last marker
    for (let i = 0; i < matches.length - 1; i++) {
      result = result.replace(matches[i], '');
    }
    console.log(`   Removed ${matches.length - 1} duplicate [FAQ] marker(s)`);
  }

  return result;
}

cleanFAQContent();
