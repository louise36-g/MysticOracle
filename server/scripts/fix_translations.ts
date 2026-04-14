/**
 * fix_translations.ts
 *
 * Reads translation_issues.csv and uses Claude to automatically correct each
 * flagged content block, then writes the fixes back to JSON files or the database.
 *
 * Strategy:
 *   - Groups all flags by content block (same source + slug + field)
 *   - Skips "missing_content" issues (requires manual judgment)
 *   - Sends the full EN original + current FR text + specific issues to Claude
 *   - Claude returns a corrected full French text
 *   - Writes fixes back to the original source (JSON file or BlogPost table)
 *
 * Usage:
 *   # Preview what would be processed (no API calls, no writes):
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_translations.ts
 *
 *   # Apply all fixes (JSON + DB):
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_translations.ts --apply
 *
 *   # Test with first 5 blocks only:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_translations.ts --apply --limit=5
 *
 *   # JSON files only:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_translations.ts --apply --json-only
 *
 *   # Database only:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_translations.ts --apply --db-only
 *
 *   # Resume after interruption:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_translations.ts --apply --resume
 *
 * Output:
 *   scripts/fix_progress.json  — checkpoint for --resume
 *   scripts/fix_log.csv        — log of all changes made
 */

import Anthropic from '@anthropic-ai/sdk';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────

const MODEL = 'claude-haiku-4-5-20251001';

/** Max chars of EN + FR text to send per block (tokens stay reasonable) */
const MAX_CHARS_PER_SIDE = 10000;

/** Pause between API calls */
const RATE_LIMIT_MS = 1500;

const CSV_FILE = path.resolve(__dirname, 'translation_issues.csv');
const PROGRESS_FILE = path.resolve(__dirname, 'fix_progress.json');
const LOG_FILE = path.resolve(__dirname, 'fix_log.csv');
const JSON_ROOT = path.resolve(__dirname, '../../constants/birthCards');

/** Which issue types to skip (too risky to auto-insert) */
const SKIP_TYPES = new Set(['missing_content']);

/** ID field name for each JSON file */
const JSON_ID_FIELD: Record<string, string> = {
  'personalityCards.json': 'cardName',
  'soulCards.json': 'cardName',
  'unifiedBirthCards.json': 'cardName',
  'birthCardPairs.json': 'pairId',
  'yearEnergyCycle.json': 'year',
};

const DB_SOURCES = new Set(['BLOG_POST', 'TAROT_ARTICLE']);

// ─── Types ────────────────────────────────────────────────────────────────────

interface IssueRow {
  source: string;
  slug: string;
  label: string;
  field: string; // e.g. "descriptionEn/descriptionFr"
  issueType: string;
  english: string;
  french: string;
  note: string;
}

interface ContentBlock {
  key: string; // source::slug::field
  source: string;
  slug: string;
  label: string;
  enField: string; // e.g. "descriptionEn"
  frField: string; // e.g. "descriptionFr"
  issues: IssueRow[];
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        if (ch === '\r') i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function loadIssues(): IssueRow[] {
  const raw = fs.readFileSync(CSV_FILE, 'utf-8');
  const rows = parseCSV(raw);
  // Skip header row
  return rows
    .slice(1)
    .map(cols => ({
      source: cols[0] || '',
      slug: cols[1] || '',
      label: cols[2] || '',
      field: cols[3] || '',
      issueType: cols[4] || '',
      english: cols[5] || '',
      french: cols[6] || '',
      note: cols[7] || '',
    }))
    .filter(r => r.source && r.slug && r.field);
}

// ─── Group into blocks ────────────────────────────────────────────────────────

function groupIntoBlocks(issues: IssueRow[]): ContentBlock[] {
  const map = new Map<string, ContentBlock>();

  for (const issue of issues) {
    if (SKIP_TYPES.has(issue.issueType)) continue;

    const [enField, frField] = issue.field.split('/');
    if (!enField || !frField) continue;

    const key = `${issue.source}::${issue.slug}::${issue.field}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        source: issue.source,
        slug: issue.slug,
        label: issue.label,
        enField,
        frField,
        issues: [],
      });
    }
    map.get(key)!.issues.push(issue);
  }

  return [...map.values()];
}

// ─── Fetch content ────────────────────────────────────────────────────────────

function fetchJsonContent(
  block: ContentBlock
): { textEn: string; textFr: string; jsonPath: string; records: any[]; recordIdx: number } | null {
  const idField = JSON_ID_FIELD[block.source];
  if (!idField) {
    console.warn(`  Unknown JSON source: ${block.source}`);
    return null;
  }

  const filePath = path.join(JSON_ROOT, block.source);
  if (!fs.existsSync(filePath)) {
    console.warn(`  File not found: ${filePath}`);
    return null;
  }

  let data: any;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    console.warn(`  Failed to parse ${block.source}`);
    return null;
  }

  const records: any[] = Array.isArray(data) ? data : Object.values(data);
  const idx = records.findIndex(
    r => String(r[idField] || r.cardId || r.year || r.pairId || '') === block.slug
  );

  if (idx === -1) {
    console.warn(`  Record not found in ${block.source} for slug: ${block.slug}`);
    return null;
  }

  const record = records[idx];
  const textEn = String(record[block.enField] || '');
  const textFr = String(record[block.frField] || '');

  return { textEn, textFr, jsonPath: filePath, records, recordIdx: idx };
}

async function fetchDbContent(
  pool: pg.Pool,
  block: ContentBlock
): Promise<{ textEn: string; textFr: string } | null> {
  const enCol = `"${block.enField}"`;
  const frCol = `"${block.frField}"`;

  const { rows } = await pool.query(
    `SELECT ${enCol}, ${frCol} FROM "BlogPost" WHERE slug = $1 AND "deletedAt" IS NULL LIMIT 1`,
    [block.slug]
  );

  if (rows.length === 0) {
    console.warn(`  DB record not found for slug: ${block.slug}`);
    return null;
  }

  return {
    textEn: String(rows[0][block.enField] || ''),
    textFr: String(rows[0][block.frField] || ''),
  };
}

// ─── Claude fix call ──────────────────────────────────────────────────────────

/** Truncates text and returns both the truncated string and the remainder */
function truncateWithRemainder(
  text: string,
  maxChars: number
): { truncated: string; remainder: string; wasTruncated: boolean } {
  if (text.length <= maxChars) {
    return { truncated: text, remainder: '', wasTruncated: false };
  }
  const cutPoint = text.lastIndexOf('.', maxChars);
  const actualCut = cutPoint > maxChars * 0.7 ? cutPoint + 1 : maxChars;
  return {
    truncated: text.substring(0, actualCut) + '\n[... truncated ...]',
    remainder: text.substring(actualCut),
    wasTruncated: true,
  };
}

async function fixTranslation(
  client: Anthropic,
  block: ContentBlock,
  textEn: string,
  textFr: string
): Promise<string | null> {
  const enInfo = truncateWithRemainder(textEn, MAX_CHARS_PER_SIDE);
  const frInfo = truncateWithRemainder(textFr, MAX_CHARS_PER_SIDE);
  const en = enInfo.truncated;
  const fr = frInfo.truncated;

  if (!en.trim() || !fr.trim()) return null;

  // Build the issue list for the prompt
  const issueList = block.issues
    .map(
      (issue, i) =>
        `${i + 1}. [${issue.issueType}]\n   EN: "${issue.english}"\n   FR: "${issue.french}"\n   NOTE: ${issue.note}`
    )
    .join('\n\n');

  const prompt = `You are a professional French/English bilingual editor correcting translation errors in a tarot website.

Below is the English original and its current French translation. Specific errors have been identified and listed. Your task is to return a corrected French translation that fixes ONLY these listed errors.

IMPORTANT RULES:
- Preserve ALL HTML tags exactly as they appear (do not add, remove, or change any tags)
- Fix ONLY the listed errors — do not rephrase or restructure anything else
- Maintain the same tone, register (formal/informal), and paragraph structure
- Return ONLY the corrected French text — no explanations, no markdown, no commentary

SPECIFIC ISSUES TO FIX:
${issueList}

ENGLISH ORIGINAL:
${en}

CURRENT FRENCH TRANSLATION (contains the errors above):
${fr}

Return the corrected French translation only.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  if (!text) {
    console.warn(`  Claude returned empty response for ${block.slug}`);
    return null;
  }

  // Sanity check: corrected text should be similar length to the truncated portion sent
  // (not the full article — for long articles only the first MAX_CHARS_PER_SIDE was sent)
  const truncMarker = '\n[... truncated ...]';
  const sentLength = frInfo.wasTruncated
    ? frInfo.truncated.length - truncMarker.length
    : textFr.length;
  const ratio = text.length / sentLength;
  if (ratio < 0.4 || ratio > 2.0) {
    console.warn(`  Suspicious length ratio ${ratio.toFixed(2)} for ${block.slug} — skipping`);
    return null;
  }

  // For truncated articles, splice the corrected portion with the untouched remainder
  return text + frInfo.remainder;
}

// ─── Write fixes back ─────────────────────────────────────────────────────────

function applyJsonFix(
  records: any[],
  recordIdx: number,
  frField: string,
  correctedFr: string,
  jsonPath: string
): void {
  records[recordIdx][frField] = correctedFr;
  fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf-8');
}

async function applyDbFix(
  pool: pg.Pool,
  slug: string,
  frField: string,
  correctedFr: string
): Promise<void> {
  await pool.query(
    `UPDATE "BlogPost" SET "${frField}" = $1 WHERE slug = $2 AND "deletedAt" IS NULL`,
    [correctedFr, slug]
  );
}

// ─── Progress / log ───────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadProgress(): Set<string> {
  if (!fs.existsSync(PROGRESS_FILE)) return new Set();
  try {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    return new Set(data.completed || []);
  } catch {
    return new Set();
  }
}

function saveProgress(completed: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: [...completed] }, null, 2));
}

function initLog() {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, 'Source,Slug,Field,IssuesFixed,Status\n');
  }
}

function appendLog(block: ContentBlock, status: string) {
  const row = [block.source, block.slug, block.frField, String(block.issues.length), status]
    .map(v => `"${v.replace(/"/g, '""')}"`)
    .join(',');
  fs.appendFileSync(LOG_FILE, row + '\n');
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
    console.log('DRY RUN — showing what would be processed (no writes).');
    console.log('Add --apply to actually fix the translations.\n');
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  // Load and group issues
  const issues = loadIssues();
  const allBlocks = groupIntoBlocks(issues);

  // Count skipped issues
  const skippedCount = issues.filter(i => SKIP_TYPES.has(i.issueType)).length;

  // Filter by scope
  const blocks = allBlocks.filter(b => {
    if (jsonOnly && !b.source.endsWith('.json')) return false;
    if (dbOnly && b.source.endsWith('.json')) return false;
    return true;
  });

  // Load progress
  const completed = resume ? loadProgress() : new Set<string>();
  const toProcess = blocks.filter(b => !completed.has(b.key)).slice(0, limit);

  // Summary
  const totalIssues = blocks.reduce((n, b) => n + b.issues.length, 0);
  console.log(`Issues in CSV:   ${issues.length} (${skippedCount} missing_content skipped)`);
  console.log(
    `Content blocks:  ${blocks.length} (${allBlocks.length - blocks.length} excluded by scope)`
  );
  console.log(`Already done:    ${completed.size}`);
  console.log(
    `To process now:  ${toProcess.length}${isFinite(limit) ? ` (--limit=${limit})` : ''}`
  );
  console.log(`Issues to fix:   ${totalIssues}`);
  console.log(`Model:           ${MODEL}`);
  console.log(`Est. cost:       ~$${(toProcess.length * 0.003).toFixed(2)}\n`);

  // Breakdown by issue type
  const byType = new Map<string, number>();
  for (const b of blocks) {
    for (const i of b.issues) {
      byType.set(i.issueType, (byType.get(i.issueType) || 0) + 1);
    }
  }
  console.log('Issue types in scope:');
  for (const [type, count] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log();

  if (!apply) {
    console.log('First 10 blocks that would be processed:');
    for (const b of toProcess.slice(0, 10)) {
      console.log(`  [${b.source}] ${b.slug} (${b.frField}) — ${b.issues.length} issue(s):`);
      for (const i of b.issues) {
        console.log(`    • [${i.issueType}] ${i.note.substring(0, 80)}`);
      }
    }
    if (toProcess.length > 10) console.log(`  ... and ${toProcess.length - 10} more`);
    console.log('\nRun with --apply to start fixing.\n');
    return;
  }

  console.log('Starting in 3 seconds... (Ctrl+C to cancel)\n');
  await sleep(3000);

  // Set up API client and DB pool
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let pool: pg.Pool | null = null;
  if (!jsonOnly && process.env.DATABASE_URL) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  initLog();

  let fixedCount = 0;
  let errorCount = 0;
  let processedCount = 0;

  for (const block of toProcess) {
    processedCount++;
    process.stdout.write(
      `[${processedCount}/${toProcess.length}] ${block.source} / ${block.slug} (${block.frField}) [${block.issues.length} issues]... `
    );

    try {
      // Fetch content
      let textEn = '';
      let textFr = '';
      let jsonContext: ReturnType<typeof fetchJsonContent> | null = null;

      if (block.source.endsWith('.json')) {
        jsonContext = fetchJsonContent(block);
        if (!jsonContext) {
          console.log('SKIP (not found)');
          errorCount++;
          continue;
        }
        textEn = jsonContext.textEn;
        textFr = jsonContext.textFr;
      } else if (DB_SOURCES.has(block.source)) {
        if (!pool) {
          console.log('SKIP (no DB connection)');
          continue;
        }
        const dbContent = await fetchDbContent(pool, block);
        if (!dbContent) {
          console.log('SKIP (not found)');
          errorCount++;
          continue;
        }
        textEn = dbContent.textEn;
        textFr = dbContent.textFr;
      } else {
        console.log('SKIP (unknown source)');
        continue;
      }

      if (!textEn.trim() || !textFr.trim()) {
        console.log('SKIP (empty content)');
        continue;
      }

      // Call Claude
      const corrected = await fixTranslation(client, block, textEn, textFr);
      if (!corrected) {
        console.log('SKIP (Claude returned nothing useful)');
        errorCount++;
        appendLog(block, 'skipped');
        continue;
      }

      // Write fix
      if (block.source.endsWith('.json') && jsonContext) {
        applyJsonFix(
          jsonContext.records,
          jsonContext.recordIdx,
          block.frField,
          corrected,
          jsonContext.jsonPath
        );
      } else if (pool) {
        await applyDbFix(pool, block.slug, block.frField, corrected);
      }

      fixedCount++;
      completed.add(block.key);
      saveProgress(completed);
      appendLog(block, 'fixed');
      console.log(`✓ fixed`);
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      errorCount++;
      appendLog(block, `error: ${err.message}`);
      // Don't mark completed — will retry on --resume
    }

    await sleep(RATE_LIMIT_MS);
  }

  if (pool) await pool.end();

  console.log('\n══════════════════════════════════════════');
  console.log(`COMPLETED:    ${processedCount} blocks processed`);
  console.log(`FIXED:        ${fixedCount}`);
  console.log(`ERRORS/SKIPS: ${errorCount}`);
  if (fixedCount > 0) console.log(`Log: scripts/fix_log.csv`);
  console.log('══════════════════════════════════════════\n');
}

main().catch(console.error);
