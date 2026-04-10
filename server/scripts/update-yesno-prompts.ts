/**
 * Force-upserts Yes/No spread guidance prompts to the DB so the new
 * verdict token logic and mixed-card narrative take effect immediately.
 *
 * Run with: npx tsx scripts/update-yesno-prompts.ts
 */

import prisma from '../src/db/prisma.js';
import { DEFAULT_PROMPTS } from '../src/shared/constants/prompts.js';

const KEYS_TO_UPDATE = ['SPREAD_GUIDANCE_SINGLE_YES_NO', 'SPREAD_GUIDANCE_THREE_CARD_YES_NO'];

for (const key of KEYS_TO_UPDATE) {
  const prompt = DEFAULT_PROMPTS.find(p => p.key === key);
  if (!prompt) {
    console.error(`  ✗ Not found in DEFAULT_PROMPTS: ${key}`);
    continue;
  }

  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: prompt.defaultValue },
    update: { value: prompt.defaultValue },
  });

  console.log(`  ✓ Upserted: ${key} (${prompt.defaultValue.length} chars)`);
}

console.log('\nDone. Restart the server (or wait 5 min for cache TTL) for changes to take effect.');
await prisma.$disconnect();
