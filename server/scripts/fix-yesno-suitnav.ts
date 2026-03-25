/**
 * One-shot script: Fix the yes-or-no-tarot blog post content.
 *
 * 1. Replaces the broken suit-nav text with proper <div class="suit-nav"> links.
 * 2. Adds id attributes to the suit H2 headings so the links work.
 * 3. Fixes unclosed <strong> tags in card answers — closes after the label
 *    (YES/NO/MAYBE/etc.) and applies .answer-label color class.
 *
 * Run: npx tsx scripts/fix-yesno-suitnav.ts
 */

import 'dotenv/config';
import prisma from '../src/db/prisma.js';

const SLUG = 'yes-or-no-tarot';

// Mapping: nav label → heading id → heading text pattern
const SUIT_SECTIONS = [
  {
    label: 'Major Arcana',
    labelFr: 'Arcanes Majeurs',
    id: 'major-arcana',
    pattern: /The Major Arcana/i,
    patternFr: /Arcanes Majeurs/i,
  },
  { label: 'Wands', labelFr: 'Bâtons', id: 'wands', pattern: /Wands Tarot/i, patternFr: /Bâtons/i },
  { label: 'Cups', labelFr: 'Coupes', id: 'cups', pattern: /Cups Tarot/i, patternFr: /Coupes/i },
  {
    label: 'Swords',
    labelFr: 'Épées',
    id: 'swords',
    pattern: /Swords Tarot/i,
    patternFr: /Épées/i,
  },
  {
    label: 'Pentacles',
    labelFr: 'Pentacles',
    id: 'pentacles',
    pattern: /Pentacles Tarot/i,
    patternFr: /Pentacles/i,
  },
];

function buildSuitNav(lang: 'en' | 'fr'): string {
  const links = SUIT_SECTIONS.map(s => {
    const label = lang === 'fr' ? s.labelFr : s.label;
    return `<a href="#${s.id}">${label}</a>`;
  }).join('\n');

  return `<div class="suit-nav visible">\n${links}\n</div>`;
}

function addHeadingIds(content: string, lang: 'en' | 'fr'): string {
  let result = content;

  for (const section of SUIT_SECTIONS) {
    const pattern = lang === 'fr' ? section.patternFr : section.pattern;
    // Match <h2> containing the pattern text and add id if not present
    result = result.replace(
      new RegExp(
        `<h2(?![^>]*\\bid=)([^>]*)>((?:(?!<\\/h2>).)*${pattern.source}(?:(?!<\\/h2>).)*)<\\/h2>`,
        'i'
      ),
      `<h2 id="${section.id}"$1>$2</h2>`
    );
  }

  return result;
}

function fixBrokenNav(content: string, lang: 'en' | 'fr'): string {
  // Replace the broken nav text with proper suit-nav HTML
  // Patterns to match the broken nav (may vary between EN and FR)
  const brokenPatterns = [
    // English: <p><strong>Major ArcanaWandsCupsSwordsPentacles</strong></p>
    /<p>\s*<strong>\s*Major\s*Arcana\s*Wands\s*Cups\s*Swords\s*Pentacles\s*<\/strong>\s*<\/p>/i,
    // French variant
    /<p>\s*<strong>\s*Arcanes?\s*Majeurs?\s*Bâtons?\s*Coupes?\s*Épées?\s*Pentacles?\s*<\/strong>\s*<\/p>/i,
    // Without strong
    /<p>\s*Major\s*Arcana\s*Wands\s*Cups\s*Swords\s*Pentacles\s*<\/p>/i,
  ];

  const suitNav = buildSuitNav(lang);

  for (const pattern of brokenPatterns) {
    if (pattern.test(content)) {
      return content.replace(pattern, suitNav);
    }
  }

  console.warn(
    `[${lang}] Could not find broken nav pattern — content may already be fixed or have a different format`
  );
  return content;
}

/**
 * Fix unclosed <strong> tags in card answer paragraphs.
 *
 * Before: <p><strong>YES - Long answer text that is all bold...</strong></p>
 *   (or the </strong> is missing entirely, making the whole paragraph bold)
 *
 * After:  <p><span class="answer-label yes">YES</span> - Long answer text in normal weight...</p>
 */
function fixBoldAnswers(content: string): { content: string; count: number } {
  let count = 0;

  // Map answer words to CSS classes
  const answerMap: Record<string, string> = {
    'CONDITIONAL YES': 'conditional',
    'PATIENT YES': 'patient-yes',
    'NOT YET': 'not-yet',
    YES: 'yes',
    NO: 'no',
    MAYBE: 'conditional',
    UNCLEAR: 'conditional',
    WAIT: 'not-yet',
    // French
    'OUI CONDITIONNEL': 'conditional',
    'PAS ENCORE': 'not-yet',
    OUI: 'yes',
    NON: 'no',
    'PEUT-ÊTRE': 'conditional',
    INCERTAIN: 'conditional',
    ATTENDEZ: 'not-yet',
  };

  // Build alternation pattern for all answer labels (longest first to match "NOT YET" before "NO")
  const labels = Object.keys(answerMap).sort((a, b) => b.length - a.length);
  const labelPattern = labels.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  // Pattern: <p><strong>LABEL - rest of text</strong></p>
  // The </strong> may or may not be present (browser auto-closes it)
  const regex = new RegExp(`<p>\\s*<strong>\\s*(${labelPattern})\\s*[-–—]\\s*`, 'gi');

  const result = content.replace(regex, (match, label: string) => {
    const upperLabel = label.toUpperCase().trim();
    const cssClass = answerMap[upperLabel] || 'conditional';
    count++;
    return `<p><span class="answer-label ${cssClass}">${upperLabel}</span> – `;
  });

  // Now remove any orphaned </strong> before </p> that were part of these paragraphs
  // Only remove </strong> that appears right before </p> (the auto-closed ones)
  const cleaned = result.replace(/<\/strong>\s*<\/p>/g, '</p>');

  return { content: cleaned, count };
}

async function main() {
  const post = await prisma.blogPost.findUnique({
    where: { slug: SLUG },
    select: { id: true, contentEn: true, contentFr: true },
  });

  if (!post) {
    console.error(`Post "${SLUG}" not found`);
    process.exit(1);
  }

  console.log(`Found post: ${SLUG} (id: ${post.id})`);

  // Fix English content
  let contentEn = post.contentEn;
  contentEn = fixBrokenNav(contentEn, 'en');
  contentEn = addHeadingIds(contentEn, 'en');
  const enBold = fixBoldAnswers(contentEn);
  contentEn = enBold.content;
  console.log(`EN: Fixed ${enBold.count} bold answer labels`);

  // Fix French content
  let contentFr = post.contentFr;
  contentFr = fixBrokenNav(contentFr, 'fr');
  contentFr = addHeadingIds(contentFr, 'fr');
  const frBold = fixBoldAnswers(contentFr);
  contentFr = frBold.content;
  console.log(`FR: Fixed ${frBold.count} bold answer labels`);

  // Verify the suit-nav was inserted
  if (!contentEn.includes('class="suit-nav')) {
    console.error('EN: suit-nav not found after fix — aborting');
    process.exit(1);
  }

  // Check heading IDs
  for (const s of SUIT_SECTIONS) {
    if (!contentEn.includes(`id="${s.id}"`)) {
      console.warn(`EN: heading id="${s.id}" not added — heading pattern may not match`);
    }
  }

  await prisma.blogPost.update({
    where: { id: post.id },
    data: { contentEn, contentFr },
  });

  console.log('✅ Updated yes-or-no-tarot post with proper suit-nav and heading IDs');
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
