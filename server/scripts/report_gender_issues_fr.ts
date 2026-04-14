/**
 * report_gender_issues_fr.ts
 *
 * Reads fix_gender_log.csv to find which fields were flagged in the last
 * gender-fix pass, fetches the CURRENT French text for each, and asks Claude
 * to identify the specific gender errors remaining — for human review.
 *
 * Output: scripts/gender_issues_report.md  (human-readable)
 *
 * Usage:
 *   ANTHROPIC_API_KEY="..." DATABASE_URL="..." npx tsx scripts/report_gender_issues_fr.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODEL = 'claude-haiku-4-5-20251001';
const RATE_LIMIT_MS = 1500;
const MAX_CHARS = 12000;

const LOG_FILE = path.resolve(__dirname, 'fix_gender_log.csv');
const REPORT_FILE = path.resolve(__dirname, 'gender_issues_report.md');
const JSON_ROOT = path.resolve(__dirname, '../../constants/birthCards');

const JSON_ID_FIELD: Record<string, string> = {
  'personalityCards.json': 'cardName',
  'soulCards.json': 'cardName',
  'unifiedBirthCards.json': 'cardName',
  'birthCardPairs.json': 'pairId',
  'yearEnergyCycle.json': 'year',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  source: string;
  slug: string;
  frField: string;
}

interface GenderIssue {
  error: string; // the problematic phrase
  corrected: string; // what it should be
  context: string; // surrounding sentence
  explanation: string; // why it's wrong
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    inQ = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i],
      next = content[i + 1];
    if (inQ) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQ = true;
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
  if (row.length > 0 || cell.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ─── Load flagged fields from log ────────────────────────────────────────────

function loadFlaggedFields(): LogEntry[] {
  const raw = fs.readFileSync(LOG_FILE, 'utf-8');
  const rows = parseCSV(raw).slice(1); // skip header
  return rows.filter(r => r[4] === 'fixed').map(r => ({ source: r[0], slug: r[1], frField: r[2] }));
}

// ─── Fetch French text ────────────────────────────────────────────────────────

function fetchJsonFr(source: string, slug: string, frField: string): string {
  const idField = JSON_ID_FIELD[source];
  if (!idField) return '';
  const fp = path.join(JSON_ROOT, source);
  if (!fs.existsSync(fp)) return '';
  try {
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const records: any[] = Array.isArray(data) ? data : Object.values(data);
    const rec = records.find(
      r => String(r[idField] || r.cardId || r.year || r.pairId || '') === slug
    );
    return rec ? String(rec[frField] || '') : '';
  } catch {
    return '';
  }
}

async function fetchDbFr(pool: pg.Pool, slug: string, frField: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT "${frField}" FROM "BlogPost" WHERE slug = $1 AND "deletedAt" IS NULL LIMIT 1`,
    [slug]
  );
  return rows.length > 0 ? String(rows[0][frField] || '') : '';
}

// ─── Claude detection ─────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function detectGenderIssues(
  client: Anthropic,
  frText: string,
  slug: string
): Promise<GenderIssue[]> {
  const clean = stripHtml(frText);
  const text =
    clean.length > MAX_CHARS ? clean.substring(0, clean.lastIndexOf('.', MAX_CHARS) + 1) : clean;

  const prompt = `Tu es un expert en grammaire française. Identifie UNIQUEMENT les erreurs d'accord de genre dans ce texte.

Pour chaque erreur, donne le contexte (la phrase complète où elle apparaît) afin qu'un humain puisse la retrouver facilement.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON uniquement, rien d'autre) :
[
  {
    "error": "la phrase exacte erronée (3-6 mots)",
    "corrected": "la correction",
    "context": "la phrase complète contenant l'erreur",
    "explanation": "brève explication en français"
  }
]

Si aucune erreur : []

TEXTE :
${text}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
  let cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  if (!cleaned.startsWith('[')) {
    const match = cleaned.match(/\[[\s\S]*\]/);
    cleaned = match ? match[0] : '[]';
  }

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(`  ⚠ Parse failed for ${slug}`);
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const flagged = loadFlaggedFields();
  // Deduplicate (same field may appear multiple times across passes)
  const seen = new Set<string>();
  const unique = flagged.filter(e => {
    const k = `${e.source}::${e.slug}::${e.frField}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`Fields to review: ${unique.length}`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let pool: pg.Pool | null = null;
  if (process.env.DATABASE_URL) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  const report: string[] = [
    '# French Gender Issues — Human Review Required\n',
    `Generated: ${new Date().toISOString().split('T')[0]}\n`,
    '---\n',
  ];

  let totalIssues = 0;
  let checked = 0;

  for (const entry of unique) {
    checked++;
    process.stdout.write(
      `[${checked}/${unique.length}] ${entry.source} / ${entry.slug} (${entry.frField})... `
    );

    // Fetch current French text
    let frText = '';
    if (entry.source.endsWith('.json')) {
      frText = fetchJsonFr(entry.source, entry.slug, entry.frField);
    } else if (pool) {
      frText = await fetchDbFr(pool, entry.slug, entry.frField);
    }

    if (!frText.trim()) {
      console.log('skip (empty)');
      continue;
    }

    const issues = await detectGenderIssues(client, frText, entry.slug);

    if (issues.length === 0) {
      console.log('✓ clean');
    } else {
      console.log(`⚠  ${issues.length} issue(s)`);
      totalIssues += issues.length;

      // Format for report
      const sourceLabel = entry.source.endsWith('.json')
        ? entry.source.replace('.json', '')
        : entry.source;
      const fieldLabel = entry.frField
        .replace('Fr', '')
        .replace('description', 'Description')
        .replace('soulReading', 'Soul Reading')
        .replace('dynamic', 'Dynamic')
        .replace('title', 'Title')
        .replace('excerpt', 'Excerpt')
        .replace('content', 'Body content');

      report.push(`## ${entry.slug} — ${fieldLabel} (${sourceLabel})\n`);

      issues.forEach((issue, i) => {
        report.push(`**Issue ${i + 1}:** \`${issue.error}\` → \`${issue.corrected}\``);
        report.push(`\n> ${issue.context}\n`);
        report.push(`*${issue.explanation}*\n`);
      });

      report.push('---\n');
    }

    await sleep(RATE_LIMIT_MS);
  }

  if (pool) await pool.end();

  // Write report
  fs.writeFileSync(REPORT_FILE, report.join('\n'), 'utf-8');

  console.log('\n══════════════════════════════════════════');
  console.log(`Fields checked:  ${checked}`);
  console.log(`Issues found:    ${totalIssues}`);
  console.log(`Report saved to: scripts/gender_issues_report.md`);
  console.log('══════════════════════════════════════════\n');
}

main().catch(console.error);
