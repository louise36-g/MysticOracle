/**
 * Migration script to convert static FAQ HTML to structured accordion data
 *
 * This script:
 * 1. Fetches ALL blog posts (published and drafts)
 * 2. Parses HTML content to extract FAQ sections
 * 3. Converts them to structured FAQ format (question/answer pairs)
 * 4. Updates posts with extracted FAQs in the faq field
 * 5. Removes static FAQ HTML from content
 *
 * Usage: cd server && npx tsx scripts/migrate-blog-faqs.ts
 */

import prisma from '../src/db/prisma.js';
import { JSDOM } from 'jsdom';

interface FAQItem {
  question: string;
  answer: string;
}

interface MigrationResult {
  id: string;
  slug: string;
  title: string;
  faqsExtracted: number;
  status: 'updated' | 'skipped' | 'error';
  message?: string;
}

/**
 * Extract FAQs from HTML content
 */
function extractFAQsFromHTML(html: string): { faqs: FAQItem[]; cleanedHtml: string } {
  if (!html) return { faqs: [], cleanedHtml: html };

  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const faqs: FAQItem[] = [];

  // Pattern 1: Definition lists (dl/dt/dd)
  doc.querySelectorAll('dl').forEach(dl => {
    const dts = dl.querySelectorAll('dt');
    const dds = dl.querySelectorAll('dd');

    dts.forEach((dt, i) => {
      const question = dt.textContent?.trim() || '';
      const answer = dds[i]?.textContent?.trim() || '';
      if (question && answer) {
        faqs.push({ question, answer });
      }
    });

    // Check if this dl is inside or after an FAQ heading
    const prevHeading = findPreviousHeading(dl);
    if (prevHeading && isFAQHeading(prevHeading)) {
      prevHeading.remove();
    }
    dl.remove();
  });

  // Pattern 2: Elements with FAQ-related classes
  const faqSelectors = [
    '.article-faq',
    '.faq',
    '.faq-section',
    '.faqs',
    '.faq-container',
    '.faq-list',
    '.faq-item',
    '[class*="faq"]',
  ];

  faqSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => {
      // Try to extract Q&A from the element
      const extractedFaqs = extractFAQsFromElement(el);
      faqs.push(...extractedFaqs);

      // Remove heading before it
      const prevHeading = findPreviousHeading(el);
      if (prevHeading && isFAQHeading(prevHeading)) {
        prevHeading.remove();
      }
      el.remove();
    });
  });

  // Pattern 3: FAQ headings followed by content
  doc.querySelectorAll('h2, h3, h4').forEach(heading => {
    if (isFAQHeading(heading)) {
      let nextEl = heading.nextElementSibling;
      const elementsToRemove: Element[] = [heading];

      while (nextEl) {
        const tagName = nextEl.tagName.toLowerCase();

        // Stop at next heading
        if (tagName.match(/^h[1-6]$/)) break;

        // Extract FAQs from this element
        const extractedFaqs = extractFAQsFromElement(nextEl);
        if (extractedFaqs.length > 0) {
          faqs.push(...extractedFaqs);
          elementsToRemove.push(nextEl);
          nextEl = nextEl.nextElementSibling;
        } else if (tagName === 'p' && nextEl.textContent?.includes('?')) {
          // Paragraph with question mark - might be Q&A format
          const text = nextEl.textContent.trim();
          const nextSibling = nextEl.nextElementSibling;

          if (nextSibling && nextSibling.tagName.toLowerCase() === 'p') {
            faqs.push({
              question: text,
              answer: nextSibling.textContent?.trim() || '',
            });
            elementsToRemove.push(nextEl);
            elementsToRemove.push(nextSibling);
            nextEl = nextSibling.nextElementSibling;
          } else {
            break;
          }
        } else if (tagName === 'div' || tagName === 'ul' || tagName === 'ol') {
          const extractedFromContainer = extractFAQsFromElement(nextEl);
          if (extractedFromContainer.length > 0) {
            faqs.push(...extractedFromContainer);
            elementsToRemove.push(nextEl);
            nextEl = nextEl.nextElementSibling;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // Remove all FAQ elements
      elementsToRemove.forEach(el => el.remove());
    }
  });

  // Pattern 4: Strong/bold questions followed by answers
  doc.querySelectorAll('p').forEach(p => {
    const strong = p.querySelector('strong, b');
    if (strong && strong.textContent?.includes('?')) {
      const question = strong.textContent.trim();
      // Check if there's more text after the strong tag
      const fullText = p.textContent || '';
      const answer = fullText.replace(question, '').trim();

      if (answer) {
        faqs.push({ question, answer });
        p.remove();
      } else {
        // Answer might be in next paragraph
        const nextP = p.nextElementSibling;
        if (nextP && nextP.tagName.toLowerCase() === 'p') {
          faqs.push({
            question,
            answer: nextP.textContent?.trim() || '',
          });
          p.remove();
          nextP.remove();
        }
      }
    }
  });

  return {
    faqs: deduplicateFAQs(faqs),
    cleanedHtml: doc.body.innerHTML,
  };
}

/**
 * Extract FAQs from a container element
 */
function extractFAQsFromElement(el: Element): FAQItem[] {
  const faqs: FAQItem[] = [];

  // Check for dt/dd pairs
  const dts = el.querySelectorAll('dt');
  const dds = el.querySelectorAll('dd');
  if (dts.length > 0) {
    dts.forEach((dt, i) => {
      const question = dt.textContent?.trim() || '';
      const answer = dds[i]?.textContent?.trim() || '';
      if (question && answer) {
        faqs.push({ question, answer });
      }
    });
    return faqs;
  }

  // Check for question/answer divs or spans
  const questions = el.querySelectorAll('.question, .faq-question, [class*="question"]');
  const answers = el.querySelectorAll('.answer, .faq-answer, [class*="answer"]');
  if (questions.length > 0) {
    questions.forEach((q, i) => {
      const question = q.textContent?.trim() || '';
      const answer = answers[i]?.textContent?.trim() || '';
      if (question && answer) {
        faqs.push({ question, answer });
      }
    });
    return faqs;
  }

  // Check for h3/h4 questions with following p answers
  el.querySelectorAll('h3, h4, h5').forEach(heading => {
    const question = heading.textContent?.trim() || '';
    if (question.includes('?') || question.length < 200) {
      const nextEl = heading.nextElementSibling;
      if (
        nextEl &&
        (nextEl.tagName.toLowerCase() === 'p' || nextEl.tagName.toLowerCase() === 'div')
      ) {
        const answer = nextEl.textContent?.trim() || '';
        if (answer) {
          faqs.push({ question, answer });
        }
      }
    }
  });

  return faqs;
}

/**
 * Find the previous heading element
 */
function findPreviousHeading(el: Element): Element | null {
  let prev = el.previousElementSibling;
  while (prev) {
    if (prev.tagName.match(/^H[1-6]$/i)) {
      return prev;
    }
    // Only look back a couple elements
    if (prev.tagName.match(/^(P|DIV|UL|OL)$/i)) {
      prev = prev.previousElementSibling;
    } else {
      break;
    }
  }
  return null;
}

/**
 * Check if heading is an FAQ heading
 */
function isFAQHeading(heading: Element): boolean {
  const text = heading.textContent?.toLowerCase() || '';
  return (
    text.includes('frequently asked') ||
    text.includes('faq') ||
    text.includes('common questions') ||
    text.includes('questions & answers') ||
    text.includes('q&a')
  );
}

/**
 * Remove duplicate FAQs
 */
function deduplicateFAQs(faqs: FAQItem[]): FAQItem[] {
  const seen = new Set<string>();
  return faqs.filter(faq => {
    const key = faq.question.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return faq.question.length > 0 && faq.answer.length > 0;
  });
}

/**
 * Main migration function
 */
async function migrateBlogFAQs() {
  console.log('🔄 Starting FAQ migration for all blog posts...\n');

  try {
    // Fetch ALL blog posts (including drafts, excluding deleted)
    const posts = await prisma.blogPost.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        titleEn: true,
        titleFr: true,
        contentEn: true,
        contentFr: true,
        faq: true,
        status: true,
      },
    });

    console.log(`📊 Found ${posts.length} blog posts to process\n`);

    const results: MigrationResult[] = [];
    let totalUpdated = 0;
    let totalFAQsExtracted = 0;

    for (const post of posts) {
      try {
        // Extract FAQs from English content
        const enResult = extractFAQsFromHTML(post.contentEn || '');
        // Extract FAQs from French content
        const frResult = extractFAQsFromHTML(post.contentFr || '');

        // Combine FAQs (prefer English, add unique French ones)
        const existingFaqs = (post.faq as FAQItem[]) || [];
        const allFaqs = [...existingFaqs, ...enResult.faqs];

        // Add French FAQs that aren't already present
        frResult.faqs.forEach(frFaq => {
          const exists = allFaqs.some(
            f => f.question.toLowerCase() === frFaq.question.toLowerCase()
          );
          if (!exists) {
            allFaqs.push(frFaq);
          }
        });

        const uniqueFaqs = deduplicateFAQs(allFaqs);
        const newFaqsCount = uniqueFaqs.length - existingFaqs.length;

        // Check if content was cleaned (FAQs were removed from HTML)
        const contentChanged =
          enResult.cleanedHtml !== post.contentEn || frResult.cleanedHtml !== post.contentFr;

        if (newFaqsCount > 0 || contentChanged) {
          // Update the post
          await prisma.blogPost.update({
            where: { id: post.id },
            data: {
              contentEn: enResult.cleanedHtml,
              contentFr: frResult.cleanedHtml,
              faq: uniqueFaqs.length > 0 ? uniqueFaqs : undefined,
            },
          });

          results.push({
            id: post.id,
            slug: post.slug,
            title: post.titleEn,
            faqsExtracted: newFaqsCount,
            status: 'updated',
            message: `Extracted ${newFaqsCount} FAQs, total: ${uniqueFaqs.length}`,
          });

          totalUpdated++;
          totalFAQsExtracted += newFaqsCount;
          console.log(
            `✅ ${post.slug}: Extracted ${newFaqsCount} FAQs (total: ${uniqueFaqs.length})`
          );
        } else {
          results.push({
            id: post.id,
            slug: post.slug,
            title: post.titleEn,
            faqsExtracted: 0,
            status: 'skipped',
            message:
              existingFaqs.length > 0
                ? `Already has ${existingFaqs.length} FAQs`
                : 'No FAQs found in content',
          });
          console.log(`⏭️  ${post.slug}: No changes needed`);
        }
      } catch (err) {
        results.push({
          id: post.id,
          slug: post.slug,
          title: post.titleEn,
          faqsExtracted: 0,
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        console.error(`❌ ${post.slug}: Error - ${err instanceof Error ? err.message : err}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total posts processed: ${posts.length}`);
    console.log(`Posts updated: ${totalUpdated}`);
    console.log(`Total FAQs extracted: ${totalFAQsExtracted}`);
    console.log(`Posts skipped: ${results.filter(r => r.status === 'skipped').length}`);
    console.log(`Errors: ${results.filter(r => r.status === 'error').length}`);

    if (results.filter(r => r.status === 'error').length > 0) {
      console.log('\n⚠️  Posts with errors:');
      results
        .filter(r => r.status === 'error')
        .forEach(r => {
          console.log(`   - ${r.slug}: ${r.message}`);
        });
    }

    console.log('\n✨ Migration complete!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateBlogFAQs();
