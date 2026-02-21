/**
 * Update Suit of Swords articles to new format with Key Takeaways
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

// Key Takeaways data for all Suit of Swords cards
const swordsData: Record<string, KeyTakeaways> = {
  'ace-of-swords-tarot-card-meaning': {
    cardName: 'Ace of Swords',
    coreMeaning: 'Mental clarity, breakthrough, truth, and new ideas',
    upright: 'Clarity, breakthrough, new ideas, truth, mental force, justice',
    reversed: 'Confusion, brutality, chaos, miscommunication, hostility',
    element: 'Air (intellect, thought, communication)',
    zodiac: 'Gemini, Libra, Aquarius (Air signs)',
    yesNo: 'YES, truth and clarity will prevail',
    bestAdvice: 'Cut through confusion with clarity, embrace truth, act on new insights',
  },
  '2-of-swords-tarot-card-meaning': {
    cardName: 'Two of Swords',
    coreMeaning: 'Difficult choices, stalemate, denial, and blocked emotions',
    upright: 'Difficult decisions, weighing options, stalemate, avoidance',
    reversed: 'Indecision, confusion, information overload, no right choice',
    element: 'Air (mental conflict, deliberation)',
    zodiac: 'Libra (balance, indecision, weighing options)',
    yesNo: 'UNCLEAR, more information needed before deciding',
    bestAdvice: 'Face the decision you have been avoiding, trust your intuition',
  },
  '3-of-swords-tarot-card-meaning': {
    cardName: 'Three of Swords',
    coreMeaning: 'Heartbreak, grief, sorrow, and painful truth',
    upright: 'Heartbreak, emotional pain, sorrow, grief, hurt, separation',
    reversed: 'Recovery, forgiveness, moving on, releasing pain',
    element: 'Air (mental anguish, painful thoughts)',
    zodiac: 'Libra (relationships, balance disrupted)',
    yesNo: 'NO, painful circumstances surround this matter',
    bestAdvice: 'Allow yourself to grieve, healing comes through acknowledging pain',
  },
  '4-of-swords-tarot-card-meaning': {
    cardName: 'Four of Swords',
    coreMeaning: 'Rest, recovery, contemplation, and mental restoration',
    upright: 'Rest, relaxation, meditation, contemplation, recuperation',
    reversed: 'Exhaustion, burnout, restlessness, lack of progress',
    element: 'Air (mental rest, quiet contemplation)',
    zodiac: 'Libra (seeking balance through rest)',
    yesNo: 'WAIT, take time to rest and reflect before acting',
    bestAdvice: 'Prioritize rest, recover your mental energy, meditate on next steps',
  },
  '5-of-swords-tarot-card-meaning': {
    cardName: 'Five of Swords',
    coreMeaning: 'Conflict, defeat, winning at all costs, and hollow victory',
    upright: 'Conflict, disagreements, competition, defeat, winning at all costs',
    reversed: 'Reconciliation, making amends, past resentment, forgiveness',
    element: 'Air (mental warfare, sharp words)',
    zodiac: 'Aquarius (detachment, unconventional conflict)',
    yesNo: 'NO, victory here comes at too high a price',
    bestAdvice: 'Choose your battles wisely, consider if winning is worth the cost',
  },
  '6-of-swords-tarot-card-meaning': {
    cardName: 'Six of Swords',
    coreMeaning: 'Transition, moving on, leaving behind, and mental shift',
    upright: 'Transition, change, rite of passage, releasing baggage',
    reversed: 'Resistance to change, unfinished business, stuck in the past',
    element: 'Air (mental journey, changing perspective)',
    zodiac: 'Aquarius (moving toward the future)',
    yesNo: 'YES, moving forward is the right choice',
    bestAdvice: 'Accept the transition, leave troubled waters behind, calmer seas await',
  },
  '7-of-swords-tarot-card-meaning': {
    cardName: 'Seven of Swords',
    coreMeaning: 'Deception, strategy, cunning, and acting alone',
    upright: 'Deception, trickery, tactics, strategy, resourcefulness',
    reversed: 'Imposter syndrome, self-deceit, coming clean, confession',
    element: 'Air (mental cunning, strategic thinking)',
    zodiac: 'Aquarius (unconventional methods, independence)',
    yesNo: 'NO, something is not as it seems',
    bestAdvice: 'Be strategic but honest, watch for deception, trust your instincts',
  },
  '8-of-swords-tarot-card-meaning': {
    cardName: 'Eight of Swords',
    coreMeaning: 'Restriction, imprisonment, self-limiting beliefs, and victimhood',
    upright: 'Imprisonment, entrapment, self-victimization, limiting beliefs',
    reversed: 'Self-acceptance, new perspective, freedom, release',
    element: 'Air (mental imprisonment, trapped thoughts)',
    zodiac: 'Gemini (dual thinking, mental blocks)',
    yesNo: 'NO, you are more trapped by beliefs than circumstances',
    bestAdvice: 'Recognize your power, the bonds that hold you are of your own making',
  },
  '9-of-swords-tarot-card-meaning': {
    cardName: 'Nine of Swords',
    coreMeaning: 'Anxiety, worry, fear, and nightmares',
    upright: 'Anxiety, worry, fear, depression, nightmares, despair',
    reversed: 'Hope, reaching out, overcoming fears, recovery from anxiety',
    element: 'Air (mental torment, racing thoughts)',
    zodiac: 'Gemini (overthinking, mental anguish)',
    yesNo: 'NO, fear and worry cloud this situation',
    bestAdvice: 'Face your fears, seek support, the night is darkest before dawn',
  },
  '10-of-swords-tarot-card-meaning': {
    cardName: 'Ten of Swords',
    coreMeaning: 'Painful endings, defeat, crisis, and rock bottom',
    upright: 'Painful endings, deep wounds, betrayal, loss, crisis',
    reversed: 'Recovery, regeneration, resisting inevitable end, fear of ruin',
    element: 'Air (mental devastation, final blow)',
    zodiac: 'Gemini (duality of endings and beginnings)',
    yesNo: 'NO, but this ending allows for new beginnings',
    bestAdvice: 'Accept the ending, rock bottom is a foundation to rebuild upon',
  },
  'page-of-swords-tarot-card-meaning': {
    cardName: 'Page of Swords',
    coreMeaning: 'Curiosity, new ideas, thirst for knowledge, and vigilance',
    upright: 'New ideas, curiosity, thirst for knowledge, new communication',
    reversed: 'Self-expression issues, scattered energy, all talk no action',
    element: 'Air (youthful intellect, eager mind)',
    zodiac: 'Gemini, Libra, Aquarius (Air signs - learning)',
    yesNo: 'YES, pursue your curiosity and gather information',
    bestAdvice: 'Stay curious, gather facts, speak your truth with courage',
  },
  'knight-of-swords-tarot-card-meaning': {
    cardName: 'Knight of Swords',
    coreMeaning: 'Ambition, action, drive, and determined pursuit of goals',
    upright: 'Ambition, action, drive, determination, fast thinking',
    reversed: 'Restlessness, unfocused, reckless, tactless, aggressive',
    element: 'Air (swift action, mental drive)',
    zodiac: 'Gemini, Libra, Aquarius (Air signs - action)',
    yesNo: 'YES, charge forward with determination',
    bestAdvice: 'Act decisively, pursue your goals, but temper speed with wisdom',
  },
  'queen-of-swords-tarot-card-meaning': {
    cardName: 'Queen of Swords',
    coreMeaning: 'Mental clarity, truth-seeking, independence, and clear perception',
    upright: 'Honest communication, intellectual independence, objective truth, healthy detachment',
    reversed: 'Gossip, harsh judgment, isolation, unprocessed grief, bitter thoughts',
    element: 'Air (mental realm, thought, perception)',
    zodiac: 'Libra, Aquarius, Gemini (Air signs - mastery)',
    yesNo: 'YES (with caveats), honesty requires difficult conversations',
    bestAdvice: 'Trust your perceptions, speak your truth, balance logic with compassion',
  },
  'king-of-swords-tarot-card-meaning': {
    cardName: 'King of Swords',
    coreMeaning: 'Intellectual power, authority, truth, and ethical leadership',
    upright: 'Mental clarity, intellectual power, authority, truth, ethics',
    reversed: 'Manipulation, cruelty, abuse of power, coldness, irrational',
    element: 'Air (supreme intellect, mastery of mind)',
    zodiac: 'Libra, Aquarius, Gemini (Air signs - authority)',
    yesNo: 'YES, truth and fair judgment will prevail',
    bestAdvice: 'Lead with integrity, use intellect wisely, uphold truth and justice',
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
  console.log('Starting Suit of Swords format update...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: {
      cardType: 'SUIT_OF_SWORDS',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: { id: true, title: true, slug: true, content: true },
  });

  console.log(`Found ${articles.length} Suit of Swords articles to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    const data = swordsData[article.slug];

    if (!data) {
      console.log(`SKIPPED: ${article.title} - No data found for slug: ${article.slug}`);
      skipped++;
      continue;
    }

    // Check if Key Takeaways already exists
    if (
      article.content.includes('class="key-takeaways"') ||
      article.content.includes('Key Takeaways:')
    ) {
      console.log(`SKIPPED: ${article.title} - Already has Key Takeaways`);
      skipped++;
      continue;
    }

    // Generate Key Takeaways HTML
    const keyTakeawaysHTML = generateKeyTakeawaysHTML(data);

    // Prepend Key Takeaways to content
    const updatedContent = keyTakeawaysHTML + article.content;

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
