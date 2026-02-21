/**
 * Update Suit of Pentacles articles to new format with Key Takeaways
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface KeyTakeaways {
  cardName: string;
  coreMeaning: string;
  upright: string;
  reversed: string;
  element: string;
  zodiac: string;
  yesNo: string;
  bestAdvice: string;
}

// Key Takeaways data for all Suit of Pentacles cards
const pentaclesData: Record<string, KeyTakeaways> = {
  'ace-of-pentacles-tarot-card-meaning': {
    cardName: 'Ace of Pentacles',
    coreMeaning: 'New financial opportunity, manifestation, abundance, and prosperity',
    upright: 'New financial opportunity, manifestation, abundance, security, prosperity',
    reversed: 'Lost opportunity, lack of planning, scarcity mindset, missed chance',
    element: 'Earth (material realm, physical manifestation)',
    zodiac: 'Taurus, Virgo, Capricorn (Earth signs)',
    yesNo: 'YES, a prosperous new beginning is at hand',
    bestAdvice:
      'Seize this opportunity, plant seeds for future abundance, ground your dreams in reality',
  },
  '2-of-pentacles-tarot-card-meaning': {
    cardName: 'Two of Pentacles',
    coreMeaning: 'Balance, adaptability, time management, and prioritization',
    upright: 'Balance, adaptability, time management, prioritization, flexibility',
    reversed: 'Overwhelm, disorganization, reprioritization needed, financial stress',
    element: 'Earth (practical balance, juggling resources)',
    zodiac: 'Capricorn (resourcefulness, management)',
    yesNo: 'YES, but maintain balance and stay flexible',
    bestAdvice: 'Stay adaptable, juggle priorities wisely, find your equilibrium',
  },
  '3-of-pentacles-tarot-card-meaning': {
    cardName: 'Three of Pentacles',
    coreMeaning: 'Teamwork, collaboration, skill, and craftsmanship',
    upright: 'Teamwork, collaboration, learning, implementation, craftsmanship',
    reversed: 'Lack of teamwork, disregard for skills, poor quality, conflict at work',
    element: 'Earth (building together, skilled work)',
    zodiac: 'Capricorn (mastery, achievement through effort)',
    yesNo: 'YES, success comes through collaboration and skill',
    bestAdvice: 'Collaborate with others, hone your craft, build something lasting together',
  },
  '4-of-pentacles-tarot-card-meaning': {
    cardName: 'Four of Pentacles',
    coreMeaning: 'Security, control, stability, and possessiveness',
    upright: 'Security, control, stability, conservation, saving, boundaries',
    reversed: 'Greed, materialism, self-protection, financial insecurity, letting go',
    element: 'Earth (holding firm, material security)',
    zodiac: 'Capricorn (conservation, control)',
    yesNo: 'YES for stability, but beware of holding too tightly',
    bestAdvice: 'Protect what matters, but know when to loosen your grip and allow flow',
  },
  '5-of-pentacles-tarot-card-meaning': {
    cardName: 'Five of Pentacles',
    coreMeaning: 'Financial loss, poverty, isolation, and hardship',
    upright: 'Financial loss, poverty, lack mindset, isolation, worry, hardship',
    reversed: 'Recovery from loss, spiritual poverty, improvement, end of hard times',
    element: 'Earth (material struggle, lack)',
    zodiac: 'Taurus (financial concerns, stability threatened)',
    yesNo: 'NO, difficult times are indicated, but help is available',
    bestAdvice: 'Seek help when needed, this hardship is temporary, look for the light',
  },
  '6-of-pentacles-tarot-card-meaning': {
    cardName: 'Six of Pentacles',
    coreMeaning: 'Generosity, charity, giving and receiving, and balance of resources',
    upright: 'Generosity, charity, giving, receiving, sharing wealth, kindness',
    reversed: 'Strings attached, debts, selfishness, one-sided charity, power imbalance',
    element: 'Earth (flow of resources, material exchange)',
    zodiac: 'Taurus (generosity, material values)',
    yesNo: 'YES, generosity and fair exchange are favored',
    bestAdvice: 'Give generously, receive graciously, maintain balance in exchanges',
  },
  '7-of-pentacles-tarot-card-meaning': {
    cardName: 'Seven of Pentacles',
    coreMeaning: 'Patience, long-term investment, perseverance, and assessment',
    upright: 'Long-term view, sustainable results, perseverance, investment, patience',
    reversed: 'Lack of long-term vision, limited success, impatience, wasted effort',
    element: 'Earth (cultivation, patient growth)',
    zodiac: 'Taurus (patience, steady progress)',
    yesNo: 'YES, but patience is required for the harvest',
    bestAdvice: 'Trust the process, your efforts will bear fruit, assess and adjust as needed',
  },
  '8-of-pentacles-tarot-card-meaning': {
    cardName: 'Eight of Pentacles',
    coreMeaning: 'Mastery, skill development, apprenticeship, and diligent work',
    upright: 'Apprenticeship, repetitive tasks, mastery, skill development, diligence',
    reversed: 'Perfectionism, misdirected activity, lack of focus, uninspired work',
    element: 'Earth (craftsmanship, dedicated practice)',
    zodiac: 'Virgo (attention to detail, skill refinement)',
    yesNo: 'YES, dedicated effort will bring mastery',
    bestAdvice: 'Commit to your craft, practice deliberately, mastery comes through repetition',
  },
  '9-of-pentacles-tarot-card-meaning': {
    cardName: 'Nine of Pentacles',
    coreMeaning: 'Abundance, luxury, self-sufficiency, and financial independence',
    upright: 'Abundance, luxury, self-sufficiency, financial independence, reward',
    reversed: 'Self-worth issues, overworking, superficiality, living beyond means',
    element: 'Earth (material abundance, refined living)',
    zodiac: 'Virgo (self-reliance, cultivated success)',
    yesNo: 'YES, enjoy the fruits of your labor',
    bestAdvice: 'Savor your achievements, cultivate independence, you have earned this abundance',
  },
  '10-of-pentacles-tarot-card-meaning': {
    cardName: 'Ten of Pentacles',
    coreMeaning: 'Wealth, legacy, family, inheritance, and long-term success',
    upright: 'Wealth, inheritance, family, establishment, retirement, legacy',
    reversed: 'Financial failure, family disputes, fleeting success, debt, instability',
    element: 'Earth (established wealth, generational security)',
    zodiac: 'Virgo (legacy, practical establishment)',
    yesNo: 'YES, lasting prosperity and family harmony are indicated',
    bestAdvice: 'Build for the long term, honor family bonds, create lasting legacy',
  },
  'page-of-pentacles-tarot-card-meaning': {
    cardName: 'Page of Pentacles',
    coreMeaning: 'Ambition, new venture, scholarship, and manifestation beginning',
    upright: 'Manifestation, financial opportunity, skill development, new venture',
    reversed: 'Lack of progress, procrastination, learn from failure, unrealistic goals',
    element: 'Earth (youthful ambition, grounded potential)',
    zodiac: 'Taurus, Virgo, Capricorn (Earth signs - learning)',
    yesNo: 'YES, a promising opportunity is developing',
    bestAdvice: 'Study diligently, start small but dream big, ground your aspirations in action',
  },
  'knight-of-pentacles-tarot-card-meaning': {
    cardName: 'Knight of Pentacles',
    coreMeaning: 'Hard work, productivity, routine, and methodical progress',
    upright: 'Hard work, productivity, routine, conservatism, methodical progress',
    reversed: 'Self-discipline lacking, boredom, feeling stuck, perfectionism, laziness',
    element: 'Earth (steady action, reliable effort)',
    zodiac: 'Taurus, Virgo, Capricorn (Earth signs - action)',
    yesNo: 'YES, steady effort will bring results',
    bestAdvice: 'Stay the course, be thorough and reliable, slow and steady wins',
  },
  'queen-of-pentacles-tarot-card-meaning': {
    cardName: 'Queen of Pentacles',
    coreMeaning: 'Nurturing, abundance, practical care, and down-to-earth warmth',
    upright: 'Nurturing, practical, providing financially, working parent, down-to-earth',
    reversed: 'Financial independence, self-care, work-home conflict, smothering',
    element: 'Earth (nurturing abundance, grounded care)',
    zodiac: 'Taurus, Virgo, Capricorn (Earth signs - mastery)',
    yesNo: 'YES, abundance through nurturing and practical wisdom',
    bestAdvice: 'Create comfort and security, nurture growth, balance giving with self-care',
  },
  'king-of-pentacles-tarot-card-meaning': {
    cardName: 'King of Pentacles',
    coreMeaning: 'Wealth, business, leadership, security, and material success',
    upright: 'Wealth, business, leadership, security, discipline, abundance',
    reversed: 'Financially inept, obsessed with wealth, stubborn, materialistic',
    element: 'Earth (supreme material mastery, established wealth)',
    zodiac: 'Taurus, Virgo, Capricorn (Earth signs - authority)',
    yesNo: 'YES, material success and stability are assured',
    bestAdvice: 'Lead with practical wisdom, build lasting wealth, share your abundance',
  },
};

function generateKeyTakeawaysHTML(data: KeyTakeaways): string {
  return `<div class="key-takeaways">
<h2>Key Takeaways: ${data.cardName} Tarot Card</h2>
<p><strong>Core Meaning:</strong> ${data.coreMeaning}</p>
<p><strong>Upright:</strong> ${data.upright}</p>
<p><strong>Reversed:</strong> ${data.reversed}</p>
<p><strong>Element:</strong> ${data.element}</p>
<p><strong>Zodiac:</strong> ${data.zodiac}</p>
<p><strong>Yes/No:</strong> ${data.yesNo}</p>
<p><strong>Best Advice:</strong> ${data.bestAdvice}</p>
</div>

`;
}

async function main() {
  console.log('Starting Suit of Pentacles format update...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: {
      cardType: 'SUIT_OF_PENTACLES',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: { id: true, title: true, slug: true, content: true },
  });

  console.log(`Found ${articles.length} Suit of Pentacles articles to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    const data = pentaclesData[article.slug];

    if (!data) {
      console.log(`SKIPPED: ${article.title} - No data found for slug: ${article.slug}`);
      skipped++;
      continue;
    }

    // Check if Key Takeaways already exists in proper format
    if (
      article.content.includes('class="key-takeaways"') &&
      article.content.includes(`Key Takeaways: ${data.cardName}`)
    ) {
      console.log(`SKIPPED: ${article.title} - Already has proper Key Takeaways`);
      skipped++;
      continue;
    }

    // Remove old Key Takeaways if exists (in case it's in old format)
    let cleanContent = article.content;

    // Remove any existing key-takeaways div
    const keyTakeawaysRegex = /<div class="key-takeaways">[\s\S]*?<\/div>\s*/gi;
    cleanContent = cleanContent.replace(keyTakeawaysRegex, '');

    // Remove old h3-based Key Takeaways format
    const oldFormatRegex = /<h3>Key Takeaways:[\s\S]*?<\/ul>\s*/gi;
    cleanContent = cleanContent.replace(oldFormatRegex, '');

    // Generate Key Takeaways HTML
    const keyTakeawaysHTML = generateKeyTakeawaysHTML(data);

    // Prepend Key Takeaways to content
    const updatedContent = keyTakeawaysHTML + cleanContent.trim();

    // Update the article
    await prisma.tarotArticle.update({
      where: { id: article.id },
      data: { content: updatedContent },
    });

    console.log(`UPDATED: ${article.title}`);
    updated++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${articles.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
