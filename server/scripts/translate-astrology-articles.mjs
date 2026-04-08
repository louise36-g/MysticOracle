/**
 * Translate missing astrology daily-energy articles to French.
 * Uses the Anthropic API (Claude Sonnet 4.6) for high-quality translation.
 */
import pg from 'pg';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const SYSTEM_PROMPT = `You are an expert translator translating English tarot and astrology blog content into French.

ABSOLUTE RULES:
1. Preserve HTML structure EXACTLY. Every <p>, <h2>, <strong>, <em>, <a>, <img>, <br>, class name, id, style attribute, and data-* attribute must be preserved verbatim.
2. Only translate the visible text content between tags. Never translate tag names, attribute names, class values, URLs, or image sources.
3. REWRITE internal links: any href="https://celestiarcana.com/..." must become href="https://celestiarcana.com/fr/..." — for example /blog/something becomes /fr/blog/something, and /tarot/card-name becomes /fr/tarot/card-name. Do NOT rewrite external URLs.
4. NEVER use em dashes (—) or en dashes (–). Use commas, periods, semicolons, or parentheses instead. This is strictly forbidden.
5. Use proper French typography: guillemets « » instead of " ", French punctuation spacing (narrow non-breaking space before : ; ! ?), curly apostrophes ', and non-breaking space in common expressions like « mille et une ».
6. Translate into natural, fluent French prose. Do not be literal or stiff. Capture the warm, conversational tone of the original.
7. Card names: use established French tarot names (Le Fou, Le Magicien, La Papesse, L'Impératrice, L'Empereur, Le Pape/Hiérophante, Les Amoureux, Le Chariot, La Force, L'Ermite, La Roue de Fortune, La Justice, Le Pendu, La Mort, Tempérance, Le Diable, La Tour, L'Étoile, La Lune, Le Soleil, Le Jugement, Le Monde).
8. Zodiac signs and planets keep their French equivalents (Bélier, Taureau, Gémeaux, Cancer, Lion, Vierge, Balance, Scorpion, Sagittaire, Capricorne, Verseau, Poissons; Mercure, Vénus, Mars, Jupiter, Saturne, Uranus, Neptune, Pluton, la Lune, le Soleil).
9. Output ONLY the translated JSON object, nothing else. No preamble, no explanation, no code fences.

You will receive a JSON object with fields to translate. Return a JSON object with the same keys and the French translations as values.`;

async function translateArticle(article) {
  const input = {
    titleEn: article.titleEn,
    excerptEn: article.excerptEn || '',
    metaTitleEn: article.metaTitleEn || '',
    metaDescEn: article.metaDescEn || '',
    contentEn: article.contentEn,
  };

  const userMessage = `Translate the following article fields to French. Return only a JSON object with keys: titleFr, excerptFr, metaTitleFr, metaDescFr, contentFr.

${JSON.stringify(input, null, 2)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim();

  // Extract JSON (in case there's any wrapping)
  let jsonStr = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse JSON response:', text.substring(0, 500));
    throw e;
  }
}

async function main() {
  await client.connect();
  console.log('Connected\n');

  // Get all astrology daily-energy articles missing French content
  const result = await client.query(`
    SELECT id, slug, "titleEn", "excerptEn", "metaTitleEn", "metaDescEn", "contentEn"
    FROM "BlogPost"
    WHERE slug LIKE 'tarot-astrology-%-daily-energy'
      AND status = 'PUBLISHED'
      AND ("contentFr" IS NULL OR "contentFr" = '')
    ORDER BY slug
  `);

  console.log(`Found ${result.rows.length} articles missing French content:\n`);
  for (const r of result.rows) console.log(`  ${r.slug}`);
  console.log('');

  let done = 0;
  for (const article of result.rows) {
    process.stdout.write(`[${done + 1}/${result.rows.length}] ${article.slug}... `);
    try {
      const translated = await translateArticle(article);

      // Validate the response has the expected keys
      if (!translated.titleFr || !translated.contentFr) {
        console.log('FAIL (missing keys)');
        continue;
      }

      // Sanity check: no em dashes
      const allText = JSON.stringify(translated);
      if (allText.includes('—') || allText.includes('–')) {
        console.log('WARN: contains em/en dashes, cleaning...');
        for (const key of Object.keys(translated)) {
          translated[key] = translated[key].replace(/ — /g, ', ').replace(/—/g, ', ').replace(/–/g, '-');
        }
      }

      await client.query(`
        UPDATE "BlogPost"
        SET "titleFr" = $1,
            "excerptFr" = $2,
            "metaTitleFr" = $3,
            "metaDescFr" = $4,
            "contentFr" = $5
        WHERE id = $6
      `, [
        translated.titleFr,
        translated.excerptFr || '',
        translated.metaTitleFr || '',
        translated.metaDescFr || '',
        translated.contentFr,
        article.id,
      ]);

      console.log(`OK (${translated.contentFr.length} chars)`);
      done++;
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  console.log(`\nDone! ${done}/${result.rows.length} articles translated`);
  await client.end();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
