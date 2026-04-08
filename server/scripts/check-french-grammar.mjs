/**
 * French spelling & grammar checker for all published blog articles.
 * Uses LanguageTool public API. Rate-limited to stay under the free tier limits.
 *
 * Outputs /tmp/french-grammar-report.txt with errors grouped by article.
 */
import pg from 'pg';
import fs from 'fs';

const DATABASE_URL = 'postgresql://mysticoracle_user:azupXhkeI4Nd08DZiyMCTo6fMRxJJiy1@dpg-d55r99shg0os73a9seag-a.frankfurt-postgres.render.com/mysticoracle';
const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const LT_URL = 'https://api.languagetool.org/v2/check';
const RATE_LIMIT_MS = 3500; // ~17 req/min, under the 20/min limit
const MAX_CHUNK_SIZE = 18000; // characters per request (API max is 20k)
const REPORT_PATH = '/tmp/french-grammar-report.txt';

// Rules to ignore (too noisy or not relevant for blog prose)
const IGNORED_RULES = new Set([
  'WHITESPACE_RULE',
  'FRENCH_WHITESPACE',
  'APOS_TYP', // typographic apostrophe suggestions
  'FRENCH_OLD_APOSTROPHE',
  'UPPERCASE_SENTENCE_START',
  'COMMA_PARENTHESIS_WHITESPACE',
  'TIMEZONE_FULL', // no timezones in this content
]);

const IGNORED_CATEGORIES = new Set([
  'TYPOGRAPHY', // style-only apostrophe/quote suggestions
]);

/** Strip HTML tags and decode common entities to plain text */
function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&hellip;/g, '…')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Split text into chunks under the API limit, preferring paragraph boundaries */
function chunkText(text, maxSize) {
  if (text.length <= maxSize) return [text];
  const chunks = [];
  const paragraphs = text.split('\n\n');
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > maxSize) {
      if (current) chunks.push(current);
      if (p.length > maxSize) {
        // Paragraph alone is too long, split by sentence
        const sentences = p.split(/(?<=[.!?])\s+/);
        let sub = '';
        for (const s of sentences) {
          if ((sub + ' ' + s).length > maxSize) {
            if (sub) chunks.push(sub);
            sub = s;
          } else {
            sub = sub ? sub + ' ' + s : s;
          }
        }
        if (sub) chunks.push(sub);
        current = '';
      } else {
        current = p;
      }
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function checkText(text) {
  const params = new URLSearchParams({
    text,
    language: 'fr',
    enabledOnly: 'false',
    level: 'picky',
  });
  const res = await fetch(LT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`LanguageTool API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  await client.connect();
  console.log('Connected to database\n');

  const result = await client.query(`
    SELECT slug, "titleFr", "contentFr"
    FROM "BlogPost"
    WHERE status = 'PUBLISHED' AND slug NOT LIKE '_deleted%'
      AND "contentFr" IS NOT NULL AND "contentFr" != ''
    ORDER BY slug
  `);
  const articles = result.rows;
  console.log(`Found ${articles.length} French articles to check\n`);

  const report = [];
  const summary = { articles: 0, errors: 0, withErrors: 0 };

  let startTime = Date.now();
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const plainText = stripHtml(article.contentFr);
    const chunks = chunkText(plainText, MAX_CHUNK_SIZE);
    const errors = [];

    process.stdout.write(`[${i + 1}/${articles.length}] ${article.slug} (${chunks.length} chunk${chunks.length > 1 ? 's' : ''})... `);

    for (const chunk of chunks) {
      try {
        const data = await checkText(chunk);
        for (const match of data.matches) {
          if (IGNORED_RULES.has(match.rule.id)) continue;
          if (IGNORED_CATEGORIES.has(match.rule.category.id)) continue;
          errors.push({
            category: match.rule.category.name,
            message: match.message,
            context: match.context.text,
            errorText: match.context.text.substring(match.context.offset, match.context.offset + match.context.length),
            suggestions: (match.replacements || []).slice(0, 3).map(r => r.value),
          });
        }
      } catch (err) {
        console.error(`\n  Error checking chunk: ${err.message}`);
        await sleep(5000); // longer wait on error
      }
      await sleep(RATE_LIMIT_MS);
    }

    summary.articles++;
    summary.errors += errors.length;
    if (errors.length > 0) {
      summary.withErrors++;
      report.push({ slug: article.slug, title: article.titleFr, errors });
    }
    console.log(`${errors.length} issues`);

    // Save incremental progress every 10 articles
    if ((i + 1) % 10 === 0) {
      saveReport(report, summary, articles.length);
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = (i + 1) / elapsed;
      const eta = (articles.length - i - 1) / rate;
      console.log(`  (progress saved, ETA ${Math.round(eta / 60)} min)`);
    }
  }

  saveReport(report, summary, articles.length);
  console.log(`\nDone! ${summary.errors} issues found across ${summary.withErrors} articles`);
  console.log(`Report saved to ${REPORT_PATH}`);

  await client.end();
}

function saveReport(report, summary, total) {
  let out = `French Grammar & Spelling Report\n`;
  out += `================================\n`;
  out += `Generated: ${new Date().toISOString()}\n`;
  out += `Articles checked: ${summary.articles}/${total}\n`;
  out += `Articles with errors: ${summary.withErrors}\n`;
  out += `Total issues: ${summary.errors}\n\n`;

  // Group errors by category across all articles
  const categoryCount = {};
  for (const a of report) {
    for (const e of a.errors) {
      categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
    }
  }
  out += `Issues by category:\n`;
  for (const [cat, cnt] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
    out += `  ${cat}: ${cnt}\n`;
  }
  out += `\n`;

  // Detailed per-article report
  out += `=========================================\n`;
  out += `PER-ARTICLE ISSUES\n`;
  out += `=========================================\n\n`;

  // Sort by error count descending
  const sorted = report.slice().sort((a, b) => b.errors.length - a.errors.length);

  for (const article of sorted) {
    out += `\n${article.slug} (${article.errors.length} issues)\n`;
    out += `Title: ${article.title}\n`;
    out += `${'-'.repeat(60)}\n`;
    for (const e of article.errors) {
      out += `  [${e.category}] ${e.message}\n`;
      out += `    Error: "${e.errorText}"\n`;
      out += `    Context: "${e.context.replace(/\s+/g, ' ').substring(0, 120)}"\n`;
      if (e.suggestions.length > 0) {
        out += `    Suggested: ${e.suggestions.join(' | ')}\n`;
      }
      out += `\n`;
    }
  }
  fs.writeFileSync(REPORT_PATH, out);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
