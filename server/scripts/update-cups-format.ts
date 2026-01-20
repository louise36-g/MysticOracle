/**
 * Update Suit of Cups articles to new format with Key Takeaways
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

// Key Takeaways data for all Suit of Cups cards
const cupsData: Record<string, KeyTakeaways> = {
  'ace-of-cups-tarot-card-meaning': {
    cardName: 'Ace of Cups',
    coreMeaning: 'New love, emotional awakening, intuition, and compassion',
    upright: 'New love, compassion, creativity, overwhelming emotion, spiritual awakening',
    reversed: 'Emotional loss, blocked creativity, emptiness, unrequited love',
    element: 'Water (emotions, intuition, the subconscious)',
    zodiac: 'Cancer, Scorpio, Pisces (Water signs)',
    yesNo: 'YES, love and emotional fulfillment are flowing toward you',
    bestAdvice:
      'Open your heart to receive love, trust your intuition, embrace emotional beginnings',
  },
  '2-of-cups-tarot-card-meaning': {
    cardName: 'Two of Cups',
    coreMeaning: 'Partnership, unified love, mutual attraction, and connection',
    upright: 'Unified love, partnership, mutual attraction, soul connection, harmony',
    reversed: 'Self-love, breakup, disharmony, distrust, imbalanced relationship',
    element: 'Water (emotional bonds, heart connection)',
    zodiac: 'Cancer (nurturing love, emotional security)',
    yesNo: 'YES, a meaningful connection or partnership is indicated',
    bestAdvice: 'Honor your connections, seek balance in relationships, open to partnership',
  },
  '3-of-cups-tarot-card-meaning': {
    cardName: 'Three of Cups',
    coreMeaning: 'Celebration, friendship, community, and joyful gatherings',
    upright: 'Celebration, friendship, creativity, collaborations, community',
    reversed: 'Independence, alone time, hardcore partying, gossip, overindulgence',
    element: 'Water (shared emotions, collective joy)',
    zodiac: 'Cancer (family bonds, nurturing friendships)',
    yesNo: 'YES, celebration and social joy are on the horizon',
    bestAdvice: 'Celebrate with loved ones, nurture friendships, embrace community support',
  },
  '4-of-cups-tarot-card-meaning': {
    cardName: 'Four of Cups',
    coreMeaning: 'Meditation, contemplation, apathy, and reevaluation',
    upright: 'Meditation, contemplation, apathy, reevaluation, missed opportunities',
    reversed: 'Retreat, withdrawal, checking in with yourself, renewed motivation',
    element: 'Water (emotional introspection, inner reflection)',
    zodiac: 'Cancer (emotional withdrawal, self-protection)',
    yesNo: 'WAIT, take time to reflect before making decisions',
    bestAdvice: 'Look within, but do not miss what is being offered, be open to new possibilities',
  },
  '5-of-cups-tarot-card-meaning': {
    cardName: 'Five of Cups',
    coreMeaning: 'Loss, grief, disappointment, and focusing on the negative',
    upright: 'Regret, failure, disappointment, pessimism, grief, loss',
    reversed: 'Acceptance, moving on, finding peace, forgiveness, recovery',
    element: 'Water (emotional pain, deep sorrow)',
    zodiac: 'Scorpio (transformation through loss, emotional depth)',
    yesNo: 'NO, disappointment surrounds this situation, but hope remains',
    bestAdvice: 'Acknowledge your grief, but turn around to see what still remains, hope endures',
  },
  '6-of-cups-tarot-card-meaning': {
    cardName: 'Six of Cups',
    coreMeaning: 'Nostalgia, childhood memories, innocence, and reunion',
    upright: 'Revisiting the past, childhood memories, innocence, joy, reunion',
    reversed: 'Living in the past, forgiveness, lacking playfulness, moving forward',
    element: 'Water (emotional memories, sentimental feelings)',
    zodiac: 'Scorpio (deep memories, emotional transformation)',
    yesNo: 'YES, reconnection with the past brings happiness',
    bestAdvice: 'Honor your memories, reconnect with innocence, but do not get stuck in the past',
  },
  '7-of-cups-tarot-card-meaning': {
    cardName: 'Seven of Cups',
    coreMeaning: 'Fantasy, illusion, wishful thinking, and many choices',
    upright: 'Opportunities, choices, wishful thinking, illusion, fantasy',
    reversed: 'Alignment, personal values, overwhelmed by choices, clarity',
    element: 'Water (dreams, imagination, emotional confusion)',
    zodiac: 'Scorpio (hidden depths, illusions)',
    yesNo: 'UNCLEAR, separate fantasy from reality before deciding',
    bestAdvice: 'Ground your dreams in reality, make a choice and commit, avoid escapism',
  },
  '8-of-cups-tarot-card-meaning': {
    cardName: 'Eight of Cups',
    coreMeaning: 'Walking away, disillusionment, seeking deeper meaning',
    upright: 'Disappointment, abandonment, withdrawal, seeking truth, moving on',
    reversed: 'Trying again, indecision, aimless drifting, fear of change',
    element: 'Water (emotional journey, seeking fulfillment)',
    zodiac: 'Pisces (spiritual seeking, letting go)',
    yesNo: 'YES, it is time to walk away and seek something more',
    bestAdvice: 'Have courage to leave what no longer serves you, seek deeper fulfillment',
  },
  '9-of-cups-tarot-card-meaning': {
    cardName: 'Nine of Cups',
    coreMeaning: 'Contentment, satisfaction, gratitude, and wishes fulfilled',
    upright: 'Contentment, satisfaction, gratitude, wish come true, achievement',
    reversed: 'Inner happiness, materialism, dissatisfaction, overindulgence',
    element: 'Water (emotional satisfaction, fulfilled desires)',
    zodiac: 'Pisces (spiritual contentment, dreams realized)',
    yesNo: 'YES, your wish will be granted, satisfaction awaits',
    bestAdvice: 'Count your blessings, enjoy your achievements, wishes can come true',
  },
  '10-of-cups-tarot-card-meaning': {
    cardName: 'Ten of Cups',
    coreMeaning: 'Harmony, marriage, happiness, and emotional fulfillment',
    upright: 'Divine love, blissful relationships, harmony, alignment, family',
    reversed: 'Disconnection, misaligned values, struggling relationships',
    element: 'Water (complete emotional fulfillment, lasting happiness)',
    zodiac: 'Pisces (spiritual union, unconditional love)',
    yesNo: 'YES, lasting happiness and emotional fulfillment are yours',
    bestAdvice: 'Cherish your loved ones, create harmony, this is the emotional rainbow',
  },
  'page-of-cups-tarot-card-meaning': {
    cardName: 'Page of Cups',
    coreMeaning: 'Creative beginnings, intuitive messages, and emotional curiosity',
    upright: 'Creative opportunities, intuitive messages, curiosity, possibility',
    reversed: 'Emotional immaturity, creative blocks, oversensitivity',
    element: 'Water (youthful emotion, intuitive spark)',
    zodiac: 'Cancer, Scorpio, Pisces (Water signs - learning)',
    yesNo: 'YES, follow your intuition and creative impulses',
    bestAdvice:
      'Stay open to intuitive messages, embrace your creative side, be emotionally curious',
  },
  'knight-of-cups-tarot-card-meaning': {
    cardName: 'Knight of Cups',
    coreMeaning: 'Romance, charm, imagination, and following the heart',
    upright: 'Creativity, romance, charm, imagination, beauty, following the heart',
    reversed: 'Overactive imagination, unrealistic, jealousy, moodiness',
    element: 'Water (romantic pursuit, emotional action)',
    zodiac: 'Cancer, Scorpio, Pisces (Water signs - action)',
    yesNo: 'YES, follow your heart and romantic dreams',
    bestAdvice: 'Pursue your heart desires, let romance guide you, but stay grounded',
  },
  'queen-of-cups-tarot-card-meaning': {
    cardName: 'Queen of Cups',
    coreMeaning: 'Compassion, emotional security, intuition, and nurturing',
    upright: 'Compassion, calm, comfort, intuitive, nurturing, emotional security',
    reversed: 'Inner feelings, self-care, codependency, emotional manipulation',
    element: 'Water (emotional mastery, intuitive wisdom)',
    zodiac: 'Cancer, Scorpio, Pisces (Water signs - mastery)',
    yesNo: 'YES, trust your intuition and nurture with compassion',
    bestAdvice:
      'Lead with your heart, trust your intuition, offer compassion to yourself and others',
  },
  'king-of-cups-tarot-card-meaning': {
    cardName: 'King of Cups',
    coreMeaning: 'Emotional balance, diplomacy, compassion, and control',
    upright: 'Emotional balance, compassion, diplomacy, calm, wise counsel',
    reversed: 'Self-compassion, inner feelings, moodiness, emotionally manipulative',
    element: 'Water (supreme emotional intelligence, mastery of feelings)',
    zodiac: 'Cancer, Scorpio, Pisces (Water signs - authority)',
    yesNo: 'YES, lead with emotional wisdom and balanced compassion',
    bestAdvice: 'Master your emotions, lead with compassion, offer wise and balanced counsel',
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
  console.log('Starting Suit of Cups format update...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: {
      cardType: 'SUIT_OF_CUPS',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: { id: true, title: true, slug: true, content: true },
  });

  console.log(`Found ${articles.length} Suit of Cups articles to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    const data = cupsData[article.slug];

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
