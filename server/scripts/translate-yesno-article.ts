/**
 * Translate the yes-or-no-tarot blog article to French using Claude API.
 *
 * Splits the large article (~59K chars) into chunks by suit section,
 * translates each chunk, then reassembles and saves to the database.
 *
 * Usage:
 *   cd server
 *   npx tsx scripts/translate-yesno-article.ts              # dry run
 *   npx tsx scripts/translate-yesno-article.ts --apply       # save to DB
 *
 * Requires ANTHROPIC_API_KEY in .env
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '../src/db/prisma.js';

const DRY_RUN = !process.argv.includes('--apply');
const SLUG = 'yes-or-no-tarot';
const DELAY_MS = 3000;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const SYSTEM_PROMPT = `You are a professional French translator specialising in tarot and spirituality content for a French audience in France (not Canadian French).

TASK: Translate the following HTML content from English to French.

CRITICAL RULES — PRESERVE EXACTLY:
- All HTML tags, attributes, and structure
- All CSS classes (e.g. class="answer-label yes", class="suit-nav")
- All href URLs — keep them exactly as-is (the system auto-rewrites /fr/ for French pages)
- All id attributes on headings (e.g. id="major-arcana", id="wands")
- All anchor href="#..." links — keep the anchors unchanged
- All target, rel attributes on links
- All [[cta:yes-no]] shortcodes — keep exactly as-is
- Star dividers: ✦ ✦ ✦ — keep as-is
- Empty paragraphs <p></p> or <p><br></p> — keep as-is

ANSWER LABEL TRANSLATIONS (keep CSS class unchanged, translate visible text only):
- YES → OUI
- NO → NON
- CONDITIONAL YES → OUI CONDITIONNEL
- NOT YET → PAS ENCORE

SUIT-NAV LABELS (keep href anchors unchanged):
- Major Arcana → Arcanes Majeurs
- Wands → Bâtons
- Cups → Coupes
- Swords → Épées
- Pentacles → Pentacles

CARD NAME TRANSLATIONS (translate visible link text, keep href unchanged):
Major Arcana:
The Fool → Le Mat, The Magician → Le Bateleur, The High Priestess → La Papesse,
The Empress → L'Impératrice, The Emperor → L'Empereur, The Hierophant → Le Pape,
The Lovers → Les Amoureux, The Chariot → Le Chariot, Strength → La Force,
The Hermit → L'Ermite, Wheel of Fortune → La Roue de Fortune, Justice → La Justice,
The Hanged Man → Le Pendu, Death → La Mort, Temperance → La Tempérance,
The Devil → Le Diable, The Tower → La Maison Dieu, The Star → L'Étoile,
The Moon → La Lune, The Sun → Le Soleil, Judgement → Le Jugement, The World → Le Monde

Minor Arcana naming:
Ace → As, Two → Deux, Three → Trois, Four → Quatre, Five → Cinq, Six → Six,
Seven → Sept, Eight → Huit, Nine → Neuf, Ten → Dix,
Page → Valet, Knight → Cavalier, Queen → Reine, King → Roi
Wands → Bâtons, Cups → Coupes, Swords → Épées, Pentacles → Pentacles
Example: "Ace of Wands" → "As de Bâtons", "Queen of Cups" → "Reine de Coupes"

SECTION HEADINGS:
- "Yes / No (Overview)" → "Oui / Non (Aperçu)"
- "Draw a Card Now" → "Tirez une Carte"
- "How Yes/No Tarot Actually Works" → "Comment Fonctionne le Tirage Oui/Non"
- "The Major Arcana" → "Les Arcanes Majeurs"
- "Wands Tarot Yes or No Meanings" → "Bâtons : Significations Oui ou Non"
- "Cups Tarot Yes or No Meanings" → "Coupes : Significations Oui ou Non"
- "Swords Tarot Yes or No Meanings" → "Épées : Significations Oui ou Non"
- "Pentacles Tarot Yes or No Meanings" → "Pentacles : Significations Oui ou Non"
- "Reading Your Answer: What Comes Next" → "Lire Votre Réponse : Et Après ?"
- "Frequently Asked Questions" → "Questions Fréquentes"

TONE AND STYLE:
- Write as if a French native tarot reader wrote this — natural, flowing French
- Use vocabulary French tarot readers search for: "tirage oui ou non", "signification des cartes", "arcanes majeurs"
- Warm, wise, grounded tone — not mystical fluff, not clinical
- Use "tu/ton/ta" (informal) to match the English "you/your"
- Preserve the directness and honesty of interpretations — do NOT soften YES into MAYBE
- Weave in SEO keywords naturally: "tarot oui ou non gratuit", "tirage de tarot en ligne"

OUTPUT: Return ONLY the translated HTML. No explanation, no markdown code blocks, no extra text.`;

/**
 * Split article content into chunks at H2 boundaries
 */
function splitIntoChunks(content: string): { label: string; html: string }[] {
  const chunks: { label: string; html: string }[] = [];

  // Find all H2 positions
  const h2Regex = /<h2[^>]*>/g;
  const h2Positions: number[] = [];
  let match;
  while ((match = h2Regex.exec(content)) !== null) {
    h2Positions.push(match.index);
  }

  if (h2Positions.length === 0) {
    return [{ label: 'full', html: content }];
  }

  // Chunk 1: everything before first H2 (overview + suit-nav + intro)
  chunks.push({
    label: 'Overview & Intro',
    html: content.substring(0, h2Positions[0]),
  });

  // Split remaining by H2s, grouping some together
  // H2s: Draw a Card, How It Works, Major Arcana, Wands, Cups, Swords, Pentacles, Reading Your Answer, FAQ
  for (let i = 0; i < h2Positions.length; i++) {
    const start = h2Positions[i];
    const end = i + 1 < h2Positions.length ? h2Positions[i + 1] : content.length;
    const chunkHtml = content.substring(start, end);

    // Extract heading text for label
    const headingMatch = chunkHtml.match(/<h2[^>]*>(.*?)<\/h2>/);
    const heading = headingMatch
      ? headingMatch[1].replace(/<[^>]+>/g, '').trim()
      : `Section ${i + 1}`;

    chunks.push({ label: heading, html: chunkHtml });
  }

  return chunks;
}

async function translateChunk(
  anthropic: Anthropic,
  chunk: string,
  chunkLabel: string,
  index: number,
  total: number
): Promise<string> {
  console.log(`  [${index + 1}/${total}] Translating: ${chunkLabel} (${chunk.length} chars)...`);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Translate this HTML section to French:\n\n${chunk}`,
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`No text in response for chunk: ${chunkLabel}`);
  }

  const translated = textBlock.text.trim();
  console.log(
    `  ✓ ${chunkLabel}: ${translated.length} chars (${response.usage.input_tokens} in / ${response.usage.output_tokens} out)`
  );
  return translated;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not found in .env');
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });

  console.log(DRY_RUN ? '=== DRY RUN (add --apply to save) ===' : '=== APPLYING TO DATABASE ===');
  console.log('');

  // Fetch the article
  const post = await prisma.blogPost.findUnique({
    where: { slug: SLUG },
    select: { id: true, contentEn: true, contentFr: true, titleEn: true },
  });

  if (!post) {
    console.error(`Post "${SLUG}" not found`);
    process.exit(1);
  }

  console.log(`Article: ${post.titleEn}`);
  console.log(`EN content: ${post.contentEn.length} chars`);
  console.log(`FR content: ${post.contentFr?.length || 0} chars (existing)`);
  console.log('');

  // Split into chunks
  const chunks = splitIntoChunks(post.contentEn);
  console.log(`Split into ${chunks.length} chunks:`);
  for (const c of chunks) {
    console.log(`  - ${c.label}: ${c.html.length} chars`);
  }
  console.log('');

  // Translate each chunk
  const translatedChunks: string[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < chunks.length; i++) {
    const translated = await translateChunk(
      anthropic,
      chunks[i].html,
      chunks[i].label,
      i,
      chunks.length
    );
    translatedChunks.push(translated);

    if (i < chunks.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Reassemble
  const contentFr = translatedChunks.join('');
  console.log('');
  console.log(`Total French content: ${contentFr.length} chars`);

  // Translate metadata
  console.log('');
  console.log('Translating metadata...');
  await sleep(DELAY_MS);

  const metaResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system:
      'You are a French SEO translator for a tarot website. Return ONLY a JSON object, no markdown.',
    messages: [
      {
        role: 'user',
        content: `Translate these fields to French (France). Natural, SEO-optimized French for tarot searches. Return as JSON with keys: titleFr, excerptFr, metaTitleFr, metaDescFr.

titleEn: "Yes or No Tarot: Every Card Answered"
excerptEn: "A warm, clear guide to yes or no tarot with honest answers for every card. Draw a card now or browse all 78 meanings."
metaTitleEn: "Yes or No Tarot: Every Card Answered (+ Free Card Draw)"
metaDescEn: "Yes or no tarot guide with every card explained and a free card draw. Get a clear answer and explore all 78 tarot cards."`,
      },
    ],
  });

  const metaText = metaResponse.content.find(b => b.type === 'text');
  let metadata: Record<string, string> = {};
  try {
    const jsonStr = metaText?.type === 'text' ? metaText.text : '';
    // Extract JSON from potential markdown code blocks
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    metadata = JSON.parse(jsonMatch?.[0] || '{}');
    console.log('Metadata translations:');
    for (const [k, v] of Object.entries(metadata)) {
      console.log(`  ${k}: ${v}`);
    }
  } catch {
    console.error('Failed to parse metadata JSON, will skip metadata update');
    console.error('Raw response:', metaText);
  }

  // Save to database
  if (!DRY_RUN) {
    const updateData: Record<string, string> = { contentFr };
    if (metadata.titleFr) updateData.titleFr = metadata.titleFr;
    if (metadata.excerptFr) updateData.excerptFr = metadata.excerptFr;
    if (metadata.metaTitleFr) updateData.metaTitleFr = metadata.metaTitleFr;
    if (metadata.metaDescFr) updateData.metaDescFr = metadata.metaDescFr;

    await prisma.blogPost.update({
      where: { id: post.id },
      data: updateData,
    });

    console.log('');
    console.log('✅ Saved French translation to database!');
  } else {
    console.log('');
    console.log('DRY RUN — nothing saved. Run with --apply to save to database.');
    // Write to file for review
    const fs = await import('fs');
    fs.writeFileSync(
      '/Users/louisegriffin/Development/MysticOracle/docs/yesno-content-fr-preview.html',
      contentFr
    );
    console.log('Preview saved to docs/yesno-content-fr-preview.html');
  }
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
