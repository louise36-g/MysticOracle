/**
 * fix_missing_content.ts
 *
 * Reads translation_issues.csv, picks up ONLY "missing_content" issues,
 * groups them by content block, and uses Claude to insert the missing
 * translated sentences into the French text.
 *
 * This is purely additive — it only adds absent content, never rewrites
 * what is already there.
 *
 * Usage:
 *   # Preview (no API calls, no writes):
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_missing_content.ts
 *
 *   # Apply all fixes:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_missing_content.ts --apply
 *
 *   # Test with first 5 blocks:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_missing_content.ts --apply --limit=5
 *
 *   # Resume after interruption:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/fix_missing_content.ts --apply --resume
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
const MAX_CHARS_PER_SIDE = 10000;
const RATE_LIMIT_MS = 1500;

const CSV_FILE = path.resolve(__dirname, 'translation_issues.csv');
const PROGRESS_FILE = path.resolve(__dirname, 'fix_missing_progress.json');
const LOG_FILE = path.resolve(__dirname, 'fix_missing_log.csv');
const JSON_ROOT = path.resolve(__dirname, '../../constants/birthCards');

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
  field: string;
  issueType: string;
  english: string;
  french: string;
  note: string;
}

interface ContentBlock {
  key: string;
  source: string;
  slug: string;
  label: string;
  enField: string;
  frField: string;
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
    .filter(r => r.source && r.slug && r.field && r.issueType === 'missing_content');
}

function groupIntoBlocks(issues: IssueRow[]): ContentBlock[] {
  const map = new Map<string, ContentBlock>();
  for (const issue of issues) {
    const [enField, frField] = issue.field.split('/');
    if (!enField || !frField) continue;
    const key = `MC::${issue.source}::${issue.slug}::${issue.field}`;
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
  if (!idField) return null;

  const filePath = path.join(JSON_ROOT, block.source);
  if (!fs.existsSync(filePath)) return null;

  let data: any;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }

  const records: any[] = Array.isArray(data) ? data : Object.values(data);
  const idx = records.findIndex(
    r => String(r[idField] || r.cardId || r.year || r.pairId || '') === block.slug
  );
  if (idx === -1) return null;

  return {
    textEn: String(records[idx][block.enField] || ''),
    textFr: String(records[idx][block.frField] || ''),
    jsonPath: filePath,
    records,
    recordIdx: idx,
  };
}

async function fetchDbContent(
  pool: pg.Pool,
  block: ContentBlock
): Promise<{ textEn: string; textFr: string } | null> {
  const { rows } = await pool.query(
    `SELECT "${block.enField}", "${block.frField}" FROM "BlogPost" WHERE slug = $1 AND "deletedAt" IS NULL LIMIT 1`,
    [block.slug]
  );
  if (rows.length === 0) return null;
  return {
    textEn: String(rows[0][block.enField] || ''),
    textFr: String(rows[0][block.frField] || ''),
  };
}

// ─── Claude call ──────────────────────────────────────────────────────────────

function truncateWithRemainder(
  text: string,
  maxChars: number
): { truncated: string; remainder: string; wasTruncated: boolean } {
  if (text.length <= maxChars) return { truncated: text, remainder: '', wasTruncated: false };
  const cutPoint = text.lastIndexOf('.', maxChars);
  const actualCut = cutPoint > maxChars * 0.7 ? cutPoint + 1 : maxChars;
  return {
    truncated: text.substring(0, actualCut) + '\n[... truncated ...]',
    remainder: text.substring(actualCut),
    wasTruncated: true,
  };
}

async function insertMissingContent(
  client: Anthropic,
  block: ContentBlock,
  textEn: string,
  textFr: string
): Promise<string | null> {
  const enInfo = truncateWithRemainder(textEn, MAX_CHARS_PER_SIDE);
  const frInfo = truncateWithRemainder(textFr, MAX_CHARS_PER_SIDE);

  if (!enInfo.truncated.trim() || !frInfo.truncated.trim()) return null;

  const missingList = block.issues
    .map(
      (issue, i) =>
        `${i + 1}. MISSING ENGLISH CONTENT: "${issue.english}"\n   CONTEXT: ${issue.note}`
    )
    .join('\n\n');

  const prompt = `You are a professional French/English bilingual translator working on a tarot website.

The French translation below is missing some content that exists in the English original. Your task is to translate the missing English content into French and insert it in the correct location within the French text.

IMPORTANT RULES:
- Preserve ALL existing French text exactly as-is — only ADD the missing content
- Preserve ALL HTML tags exactly as they appear
- Translate the missing content in the same tone and register (formal "vous") as the surrounding text
- Insert each missing piece in the most natural location relative to the surrounding context
- Return ONLY the complete corrected French text — no explanations, no commentary

MISSING CONTENT TO ADD:
${missingList}

ENGLISH ORIGINAL (for context and tone reference):
${enInfo.truncated}

CURRENT FRENCH TRANSLATION (missing the content listed above):
${frInfo.truncated}

Return the complete French text with the missing content inserted.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  if (!text) return null;

  // Sanity check against truncated portion length
  // Since we're adding content, the result should be slightly longer than the input
  const sentLength = frInfo.wasTruncated
    ? frInfo.truncated.length - '\n[... truncated ...]'.length
    : textFr.length;
  const ratio = text.length / sentLength;

  // Allow up to 3x longer (we're adding content) but flag if shorter or way too long
  if (ratio < 0.7 || ratio > 3.0) {
    console.warn(`  Suspicious length ratio ${ratio.toFixed(2)} for ${block.slug} — skipping`);
    return null;
  }

  return text + frInfo.remainder;
}

// ─── Write back ───────────────────────────────────────────────────────────────

function applyJsonFix(
  records: any[],
  idx: number,
  frField: string,
  corrected: string,
  jsonPath: string
) {
  records[idx][frField] = corrected;
  fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf-8');
}

async function applyDbFix(pool: pg.Pool, slug: string, frField: string, corrected: string) {
  await pool.query(
    `UPDATE "BlogPost" SET "${frField}" = $1 WHERE slug = $2 AND "deletedAt" IS NULL`,
    [corrected, slug]
  );
}

// ─── Progress / log ───────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function loadProgress(): Set<string> {
  if (!fs.existsSync(PROGRESS_FILE)) return new Set();
  try {
    return new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')).completed || []);
  } catch {
    return new Set();
  }
}

function saveProgress(completed: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: [...completed] }, null, 2));
}

function initLog() {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, 'Source,Slug,Field,MissingCount,Status\n');
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
    console.log('Add --apply to insert the missing content.\n');
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const issues = loadIssues();
  const allBlocks = groupIntoBlocks(issues);

  const blocks = allBlocks.filter(b => {
    if (jsonOnly && !b.source.endsWith('.json')) return false;
    if (dbOnly && b.source.endsWith('.json')) return false;
    return true;
  });

  const completed = resume ? loadProgress() : new Set<string>();
  const toProcess = blocks.filter(b => !completed.has(b.key)).slice(0, limit);
  const totalMissing = blocks.reduce((n, b) => n + b.issues.length, 0);

  console.log(`Missing-content issues: ${issues.length}`);
  console.log(`Content blocks:         ${blocks.length}`);
  console.log(`Already done:           ${completed.size}`);
  console.log(
    `To process now:         ${toProcess.length}${isFinite(limit) ? ` (--limit=${limit})` : ''}`
  );
  console.log(`Sentences to insert:    ${totalMissing}`);
  console.log(`Model:                  ${MODEL}`);
  console.log(`Est. cost:              ~$${(toProcess.length * 0.003).toFixed(2)}\n`);

  if (!apply) {
    console.log('First 10 blocks that would be processed:');
    for (const b of toProcess.slice(0, 10)) {
      console.log(
        `  [${b.source}] ${b.slug} (${b.frField}) — ${b.issues.length} missing sentence(s):`
      );
      for (const i of b.issues) {
        console.log(`    • "${i.english.substring(0, 80)}"`);
      }
    }
    if (toProcess.length > 10) console.log(`  ... and ${toProcess.length - 10} more`);
    console.log('\nRun with --apply to insert the missing content.\n');
    return;
  }

  console.log('Starting in 3 seconds... (Ctrl+C to cancel)\n');
  await sleep(3000);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let pool: pg.Pool | null = null;
  if (!jsonOnly && process.env.DATABASE_URL) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  initLog();
  let fixedCount = 0,
    errorCount = 0,
    processed = 0;

  for (const block of toProcess) {
    processed++;
    process.stdout.write(
      `[${processed}/${toProcess.length}] ${block.source} / ${block.slug} (${block.frField}) [${block.issues.length} missing]... `
    );

    try {
      let textEn = '',
        textFr = '';
      let jsonCtx: ReturnType<typeof fetchJsonContent> | null = null;

      if (block.source.endsWith('.json')) {
        jsonCtx = fetchJsonContent(block);
        if (!jsonCtx) {
          console.log('SKIP (not found)');
          errorCount++;
          continue;
        }
        textEn = jsonCtx.textEn;
        textFr = jsonCtx.textFr;
      } else if (DB_SOURCES.has(block.source)) {
        if (!pool) {
          console.log('SKIP (no DB)');
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
        console.log('SKIP (empty)');
        continue;
      }

      const corrected = await insertMissingContent(client, block, textEn, textFr);
      if (!corrected) {
        console.log('SKIP (Claude returned nothing useful)');
        errorCount++;
        appendLog(block, 'skipped');
        continue;
      }

      if (block.source.endsWith('.json') && jsonCtx) {
        applyJsonFix(
          jsonCtx.records,
          jsonCtx.recordIdx,
          block.frField,
          corrected,
          jsonCtx.jsonPath
        );
      } else if (pool) {
        await applyDbFix(pool, block.slug, block.frField, corrected);
      }

      fixedCount++;
      completed.add(block.key);
      saveProgress(completed);
      appendLog(block, 'fixed');
      console.log('✓ inserted');
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      errorCount++;
      appendLog(block, `error: ${err.message}`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  if (pool) await pool.end();

  console.log('\n══════════════════════════════════════════');
  console.log(`COMPLETED:    ${processed} blocks processed`);
  console.log(`INSERTED:     ${fixedCount}`);
  console.log(`ERRORS/SKIPS: ${errorCount}`);
  if (fixedCount > 0) console.log(`Log: scripts/fix_missing_log.csv`);
  console.log('══════════════════════════════════════════\n');
}

main().catch(console.error);
