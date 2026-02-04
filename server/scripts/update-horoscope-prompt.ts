/**
 * Update the horoscope prompt in the database
 */
import prisma from '../src/db/prisma.js';
import { DEFAULT_PROMPTS } from '../src/shared/constants/prompts.js';

async function updatePrompt() {
  const horoscopePrompt = DEFAULT_PROMPTS.find(p => p.key === 'PROMPT_HOROSCOPE');
  if (!horoscopePrompt) {
    console.log('Prompt not found in constants');
    return;
  }

  await prisma.systemSetting.upsert({
    where: { key: 'PROMPT_HOROSCOPE' },
    update: { value: horoscopePrompt.defaultValue },
    create: { key: 'PROMPT_HOROSCOPE', value: horoscopePrompt.defaultValue },
  });

  console.log('✅ Updated PROMPT_HOROSCOPE in database');
  await prisma.$disconnect();
}

updatePrompt().catch(console.error);
