/**
 * fix_gender_fr.ts
 *
 * Scans all French content and corrects gender agreement errors using Claude.
 * Works on French text ONLY — no English comparison needed.
 *
 * What it fixes:
 *   - Article-noun agreement: le/la/un/une/ce/cette/mon/ma etc.
 *   - Adjective-noun agreement: grand/grande, beau/belle, etc.
 *   - Past participle agreement with être: elle est parti → partie
 *   - Pronoun-antecedent agreement: la carte... il → elle
 *
 * What it does NOT touch:
 *   - Word choices or synonyms
 *   - Sentence structure or style
 *   - Anything not a clear gender error
 *
 * Usage:
 *   # Preview (no writes):
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_gender_fr.ts
 *
 *   # Apply fixes:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_gender_fr.ts --apply
 *
 *   # Test first 5 blocks:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_gender_fr.ts --apply --limit=5
 *
 *   # Resume after interruption:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_gender_fr.ts --apply --resume
 *
 *   # Scope filters:
 *   ... --apply --json-only
 *   ... --apply --db-only
 */

import Anthropic from '@anthropic-ai/sdk';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_CHARS = 12000; // French text only, so we can afford more
const RATE_LIMIT_MS = 1500;

const PROGRESS_FILE = path.resolve(__dirname, 'fix_gender_progress.json');
const LOG_FILE = path.resolve(__dirname, 'fix_gender_log.csv');
const JSON_ROOT = path.resolve(__dirname, '../../constants/birthCards');

const JSON_SOURCES: Array<{ file: string; frFields: string[]; idField: string }> = [
  { file: 'personalityCards.json', frFields: ['descriptionFr'], idField: 'cardName' },
  { file: 'soulCards.json', frFields: ['descriptionFr', 'soulReadingFr'], idField: 'cardName' },
  { file: 'unifiedBirthCards.json', frFields: ['descriptionFr'], idField: 'cardName' },
  { file: 'birthCardPairs.json', frFields: ['dynamicFr'], idField: 'pairId' },
  { file: 'yearEnergyCycle.json', frFields: ['descriptionFr'], idField: 'year' },
];

const DB_FR_FIELDS = ['titleFr', 'excerptFr', 'contentFr'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentBlock {
  key: string;
  source: string; // filename or contentType
  slug: string;
  frField: string;
  // For JSON sources:
  jsonPath?: string;
  records?: any[];
  recordIdx?: number;
}

interface ClaudeResult {
  count: number; // number of errors fixed
  corrected: string | null; // null if no errors found
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function truncate(text: string, maxChars: number): { text: string; remainder: string } {
  if (text.length <= maxChars) return { text, remainder: '' };
  const cut = text.lastIndexOf('.', maxChars);
  const at = cut > maxChars * 0.7 ? cut + 1 : maxChars;
  return { text: text.substring(0, at), remainder: text.substring(at) };
}

function loadProgress(): Set<string> {
  if (!fs.existsSync(PROGRESS_FILE)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')).completed || []);
  } catch {
    return new Set();
  }
}

function saveProgress(done: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: [...done] }, null, 2));
}

function initLog() {
  if (!fs.existsSync(LOG_FILE))
    fs.writeFileSync(LOG_FILE, 'Source,Slug,Field,ErrorsFixed,Status\n');
}

function appendLog(b: ContentBlock, errorsFixed: number, status: string) {
  const row = [b.source, b.slug, b.frField, String(errorsFixed), status]
    .map(v => `"${v.replace(/"/g, '""')}"`)
    .join(',');
  fs.appendFileSync(LOG_FILE, row + '\n');
}

// ─── Load content blocks ──────────────────────────────────────────────────────

function loadJsonBlocks(): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  for (const src of JSON_SOURCES) {
    const filePath = path.join(JSON_ROOT, src.file);
    if (!fs.existsSync(filePath)) continue;

    let data: any;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      continue;
    }
    const records: any[] = Array.isArray(data) ? data : Object.values(data);

    records.forEach((record, idx) => {
      const slug = String(
        record[src.idField] || record.cardId || record.year || record.pairId || idx
      );
      for (const frField of src.frFields) {
        if (!record[frField]?.trim()) continue;
        blocks.push({
          key: `${src.file}::${slug}::${frField}`,
          source: src.file,
          slug,
          frField,
          jsonPath: filePath,
          records,
          recordIdx: idx,
        });
      }
    });
  }

  return blocks;
}

async function loadDbBlocks(pool: pg.Pool): Promise<ContentBlock[]> {
  const blocks: ContentBlock[] = [];
  let offset = 0;

  while (true) {
    const { rows } = await pool.query(
      `
      SELECT slug, "contentType", "titleFr", "excerptFr", "contentFr"
      FROM "BlogPost"
      WHERE "deletedAt" IS NULL
      ORDER BY "contentType", slug
      LIMIT 50 OFFSET $1
    `,
      [offset]
    );

    if (rows.length === 0) break;

    for (const row of rows) {
      for (const frField of DB_FR_FIELDS) {
        if (!row[frField]?.trim()) continue;
        blocks.push({
          key: `${row.contentType}::${row.slug}::${frField}`,
          source: row.contentType,
          slug: row.slug,
          frField,
        });
      }
    }

    offset += rows.length;
    if (rows.length < 50) break;
  }

  return blocks;
}

// ─── Fetch French text ────────────────────────────────────────────────────────

function getJsonFrText(block: ContentBlock): string {
  return String(block.records![block.recordIdx!][block.frField] || '');
}

async function getDbFrText(pool: pg.Pool, block: ContentBlock): Promise<string> {
  const { rows } = await pool.query(
    `SELECT "${block.frField}" FROM "BlogPost" WHERE slug = $1 AND "deletedAt" IS NULL LIMIT 1`,
    [block.slug]
  );
  return rows.length > 0 ? String(rows[0][block.frField] || '') : '';
}

// ─── Claude gender check ──────────────────────────────────────────────────────

async function checkAndFixGender(
  client: Anthropic,
  block: ContentBlock,
  frText: string
): Promise<ClaudeResult> {
  const { text: truncated, remainder } = truncate(frText, MAX_CHARS);

  const prompt = `Tu es un expert en grammaire française. Réponds UNIQUEMENT avec du JSON valide — aucun texte avant ou après.

TÂCHE : Corriger les erreurs d'accord de genre dans le texte français ci-dessous.

Corriger uniquement :
- Articles : "un force" → "une force", "le énergie" → "l'énergie"
- Adjectifs : accord en genre avec le nom ("beau" → "belle" si nom féminin)
- Participes passés avec être : "elle est parti" → "elle est partie"
- Pronoms : "la carte... il" → "la carte... elle"
- Démonstratifs : "ce intuition" → "cette intuition"

Ne pas modifier : style, choix de mots, structure, balises HTML.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON uniquement, rien d'autre) :
{"count": 0, "corrected": null}
ou
{"count": 2, "corrected": "texte intégral corrigé ici"}

TEXTE :
${truncated}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  // Strip markdown fences, then try to extract JSON object if Claude wrapped it in prose
  let cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  if (!cleaned.startsWith('{')) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
  }

  try {
    const parsed = JSON.parse(cleaned) as ClaudeResult;
    if (typeof parsed.count !== 'number') return { count: 0, corrected: null };

    // If fixes were made, splice corrected portion back with any untouched remainder
    if (parsed.corrected && parsed.count > 0) {
      parsed.corrected = parsed.corrected + remainder;
    }
    return parsed;
  } catch {
    console.warn(`  ⚠ Could not parse response for ${block.slug}`);
    return { count: 0, corrected: null };
  }
}

// ─── Write fixes back ─────────────────────────────────────────────────────────

function applyJsonFix(block: ContentBlock, corrected: string) {
  block.records![block.recordIdx!][block.frField] = corrected;
  fs.writeFileSync(block.jsonPath!, JSON.stringify(block.records, null, 2), 'utf-8');
}

async function applyDbFix(pool: pg.Pool, block: ContentBlock, corrected: string) {
  await pool.query(
    `UPDATE "BlogPost" SET "${block.frField}" = $1 WHERE slug = $2 AND "deletedAt" IS NULL`,
    [corrected, block.slug]
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const jsonOnly = args.includes('--json-only');
  const dbOnly = args.includes('--db-only');
  const resume = args.includes('--resume');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

  if (!apply) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DRY RUN — showing scope. Add --apply to fix gender errors.\n');
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let pool: pg.Pool | null = null;

  // Collect all blocks
  let allBlocks: ContentBlock[] = [];

  if (!dbOnly) {
    const jsonBlocks = loadJsonBlocks();
    console.log(`JSON files: ${jsonBlocks.length} French fields`);
    allBlocks.push(...jsonBlocks);
  }

  if (!jsonOnly && process.env.DATABASE_URL) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    const dbBlocks = await loadDbBlocks(pool);
    console.log(`Database:   ${dbBlocks.length} French fields`);
    allBlocks.push(...dbBlocks);
  }

  const completed = resume ? loadProgress() : new Set<string>();
  const toProcess = allBlocks.filter(b => !completed.has(b.key)).slice(0, limit);

  console.log(`\nTotal fields:   ${allBlocks.length}`);
  console.log(`Already done:   ${completed.size}`);
  console.log(`To check now:   ${toProcess.length}${isFinite(limit) ? ` (--limit=${limit})` : ''}`);
  console.log(`Model:          ${MODEL} (French-only prompt)`);
  console.log(`Est. cost:      ~$${(toProcess.length * 0.004).toFixed(2)}\n`);

  if (!apply) {
    console.log('Sample blocks that would be checked:');
    for (const b of toProcess.slice(0, 8)) {
      console.log(`  [${b.source}] ${b.slug} → ${b.frField}`);
    }
    if (toProcess.length > 8) console.log(`  ... and ${toProcess.length - 8} more`);
    console.log('\nRun with --apply to start fixing.\n');
    if (pool) await pool.end();
    return;
  }

  console.log('Starting in 3 seconds... (Ctrl+C to cancel)\n');
  await sleep(3000);

  initLog();
  let fixedBlocks = 0,
    totalErrors = 0,
    skipped = 0,
    processed = 0;

  for (const block of toProcess) {
    processed++;
    process.stdout.write(
      `[${processed}/${toProcess.length}] ${block.source} / ${block.slug} (${block.frField})... `
    );

    try {
      // Get French text
      let frText = '';
      if (block.jsonPath) {
        frText = getJsonFrText(block);
      } else if (pool) {
        frText = await getDbFrText(pool, block);
      }

      if (!frText.trim()) {
        console.log('skip (empty)');
        continue;
      }

      // Ask Claude to find and fix gender errors
      const result = await checkAndFixGender(client, block, frText);

      if (result.count === 0 || !result.corrected) {
        console.log('✓ clean');
      } else {
        // Sanity check
        const ratio = result.corrected.length / frText.length;
        if (ratio < 0.8 || ratio > 1.3) {
          console.log(`skip (suspicious ratio ${ratio.toFixed(2)})`);
          skipped++;
          appendLog(block, 0, 'skipped');
          completed.add(block.key);
          saveProgress(completed);
          await sleep(RATE_LIMIT_MS);
          continue;
        }

        // Write fix
        if (block.jsonPath) {
          applyJsonFix(block, result.corrected);
        } else if (pool) {
          await applyDbFix(pool, block, result.corrected);
        }

        fixedBlocks++;
        totalErrors += result.count;
        console.log(`⚡ ${result.count} gender error(s) fixed`);
        appendLog(block, result.count, 'fixed');
      }

      completed.add(block.key);
      saveProgress(completed);
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      skipped++;
      appendLog(block, 0, `error: ${err.message}`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  if (pool) await pool.end();

  console.log('\n══════════════════════════════════════════');
  console.log(`CHECKED:        ${processed} fields`);
  console.log(`FIELDS FIXED:   ${fixedBlocks}`);
  console.log(`ERRORS FIXED:   ${totalErrors}`);
  console.log(`SKIPPED/ERRORS: ${skipped}`);
  if (fixedBlocks > 0) console.log(`Log: scripts/fix_gender_log.csv`);
  console.log('══════════════════════════════════════════\n');
}

main().catch(console.error);
