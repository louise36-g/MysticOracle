/**
 * Update Suit of Wands articles to new format with Key Takeaways
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

// Key Takeaways data for all Suit of Wands cards
const wandsData: Record<string, KeyTakeaways> = {
  'ace-of-wands-tarot-card-meaning': {
    cardName: 'Ace of Wands',
    coreMeaning: 'New beginnings, inspiration, creative spark, and potential',
    upright: 'Inspiration, new opportunities, growth, potential, creativity',
    reversed: 'Delays, lack of motivation, missed opportunities, creative blocks',
    element: 'Fire (passion, energy, willpower)',
    zodiac: 'Aries, Leo, Sagittarius (Fire signs)',
    yesNo: 'YES, a powerful new beginning awaits',
    bestAdvice: 'Seize the creative spark, take inspired action, trust your passion',
  },
  '2-of-wands-tarot-card-meaning': {
    cardName: 'Two of Wands',
    coreMeaning: 'Planning, future vision, decisions, and personal power',
    upright: 'Future planning, progress, decisions, discovery, personal power',
    reversed: 'Fear of change, playing it safe, lack of planning, impatience',
    element: 'Fire (ambition, forward momentum)',
    zodiac: 'Aries (pioneering spirit, initiative)',
    yesNo: 'YES, but requires careful planning first',
    bestAdvice: 'Look beyond your current situation, plan boldly, expand your horizons',
  },
  '3-of-wands-tarot-card-meaning': {
    cardName: 'Three of Wands',
    coreMeaning: 'Expansion, foresight, overseas opportunities, and progress',
    upright: 'Expansion, foresight, overseas opportunities, long-term success',
    reversed: 'Obstacles, delays, frustration, lack of foresight, playing small',
    element: 'Fire (expansion, vision)',
    zodiac: 'Aries (leadership, pioneering)',
    yesNo: 'YES, expansion and success are on the horizon',
    bestAdvice: 'Think big, your ships are coming in, prepare for growth',
  },
  '4-of-wands-tarot-card-meaning': {
    cardName: 'Four of Wands',
    coreMeaning: 'Celebration, harmony, homecoming, and community',
    upright: 'Celebration, joy, harmony, relaxation, homecoming, community',
    reversed: 'Lack of support, instability, feeling unwelcome, cancelled events',
    element: 'Fire (joyful energy, warmth)',
    zodiac: 'Aries (celebration of achievements)',
    yesNo: 'YES, celebration and happiness are indicated',
    bestAdvice: 'Celebrate your achievements, enjoy harmony, welcome community support',
  },
  '5-of-wands-tarot-card-meaning': {
    cardName: 'Five of Wands',
    coreMeaning: 'Competition, conflict, rivalry, and tension',
    upright: 'Competition, rivalry, conflict, disagreements, tension, diversity',
    reversed: 'Avoiding conflict, respecting differences, inner conflict, resolution',
    element: 'Fire (competitive energy, friction)',
    zodiac: 'Leo (pride, competition)',
    yesNo: 'UNCLEAR, competition and challenges complicate the outcome',
    bestAdvice:
      'Stand your ground but pick battles wisely, channel competitive energy constructively',
  },
  '6-of-wands-tarot-card-meaning': {
    cardName: 'Six of Wands',
    coreMeaning: 'Victory, success, public recognition, and triumph',
    upright: 'Success, public recognition, progress, self-confidence, victory',
    reversed: 'Ego, lack of recognition, fall from grace, private achievement',
    element: 'Fire (triumphant energy, pride)',
    zodiac: 'Leo (recognition, leadership)',
    yesNo: 'YES, victory and recognition are coming',
    bestAdvice: 'Accept recognition gracefully, lead with confidence, celebrate your wins',
  },
  '7-of-wands-tarot-card-meaning': {
    cardName: 'Seven of Wands',
    coreMeaning: 'Defense, perseverance, maintaining position, and courage',
    upright: 'Challenge, competition, protection, perseverance, standing ground',
    reversed: 'Exhaustion, giving up, overwhelmed, admitting defeat',
    element: 'Fire (defensive energy, courage)',
    zodiac: 'Leo (courage, determination)',
    yesNo: 'YES, but you must stand firm and defend your position',
    bestAdvice: 'Hold your ground, defend what you have built, stay courageous',
  },
  '8-of-wands-tarot-card-meaning': {
    cardName: 'Eight of Wands',
    coreMeaning: 'Swift action, movement, rapid progress, and momentum',
    upright: 'Movement, fast-paced change, action, air travel, swift progress',
    reversed: 'Delays, frustration, resisting change, internal alignment needed',
    element: 'Fire (swift energy, momentum)',
    zodiac: 'Sagittarius (travel, expansion, speed)',
    yesNo: 'YES, things will move quickly now',
    bestAdvice: 'Act swiftly, embrace momentum, strike while the iron is hot',
  },
  '9-of-wands-tarot-card-meaning': {
    cardName: 'Nine of Wands',
    coreMeaning: 'Resilience, persistence, courage, and boundaries',
    upright: 'Resilience, courage, persistence, test of faith, boundaries',
    reversed: 'Exhaustion, fatigue, questioning everything, giving up',
    element: 'Fire (enduring flame, perseverance)',
    zodiac: 'Sagittarius (determination, resilience)',
    yesNo: 'YES, persist through this final challenge',
    bestAdvice: 'You are close to the finish line, maintain your boundaries, stay resilient',
  },
  '10-of-wands-tarot-card-meaning': {
    cardName: 'Ten of Wands',
    coreMeaning: 'Burden, responsibility, hard work, and overwhelm',
    upright: 'Burden, extra responsibility, hard work, completion, overwhelm',
    reversed: 'Doing it all, carrying the burden, delegation, release',
    element: 'Fire (exhausted energy, heavy load)',
    zodiac: 'Sagittarius (overcommitment, responsibility)',
    yesNo: 'YES, but expect heavy responsibilities',
    bestAdvice: 'Delegate where possible, the end is near, release unnecessary burdens',
  },
  'page-of-wands-tarot-card-meaning': {
    cardName: 'Page of Wands',
    coreMeaning: 'Enthusiasm, exploration, discovery, and free spirit',
    upright: 'Inspiration, ideas, discovery, free spirit, new venture',
    reversed: 'Newly-formed ideas, lack of direction, procrastination, hasty decisions',
    element: 'Fire (youthful enthusiasm, spark)',
    zodiac: 'Aries, Leo, Sagittarius (Fire signs - learning)',
    yesNo: 'YES, embrace new adventures with enthusiasm',
    bestAdvice: 'Follow your curiosity, embrace new experiences, let your spirit run free',
  },
  'knight-of-wands-tarot-card-meaning': {
    cardName: 'Knight of Wands',
    coreMeaning: 'Energy, passion, adventure, and impulsiveness',
    upright: 'Energy, passion, inspired action, adventure, impulsiveness',
    reversed: 'Passion project, haste, scattered energy, delays, frustration',
    element: 'Fire (charging energy, bold action)',
    zodiac: 'Aries, Leo, Sagittarius (Fire signs - action)',
    yesNo: 'YES, charge forward with passion and energy',
    bestAdvice: 'Take bold action, pursue your passion, but avoid recklessness',
  },
  'queen-of-wands-tarot-card-meaning': {
    cardName: 'Queen of Wands',
    coreMeaning: 'Courage, confidence, determination, and vibrant energy',
    upright: 'Courage, confidence, independence, social butterfly, determination',
    reversed: 'Self-respect, self-confidence, introverted, demanding, vengeful',
    element: 'Fire (radiant energy, warmth)',
    zodiac: 'Aries, Leo, Sagittarius (Fire signs - mastery)',
    yesNo: 'YES, approach with confidence and courage',
    bestAdvice: 'Own your power, radiate confidence, inspire others with your warmth',
  },
  'king-of-wands-tarot-card-meaning': {
    cardName: 'King of Wands',
    coreMeaning: 'Leadership, vision, entrepreneurship, and bold action',
    upright: 'Natural leader, vision, entrepreneur, honour, bold decisions',
    reversed: 'Impulsiveness, haste, ruthless, high expectations, domineering',
    element: 'Fire (supreme will, mastery of passion)',
    zodiac: 'Aries, Leo, Sagittarius (Fire signs - authority)',
    yesNo: 'YES, lead boldly and take decisive action',
    bestAdvice: 'Lead with vision, inspire through action, channel passion into achievement',
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
  console.log('Starting Suit of Wands format update...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: {
      cardType: 'SUIT_OF_WANDS',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: { id: true, title: true, slug: true, content: true },
  });

  console.log(`Found ${articles.length} Suit of Wands articles to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    const data = wandsData[article.slug];

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
