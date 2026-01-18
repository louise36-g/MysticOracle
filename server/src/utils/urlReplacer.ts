/**
 * Utility to replace placeholder URLs in blog content with actual tarot article URLs
 *
 * Patterns matched:
 * - [INSERT THE EMPEROR URL]
 * - [INSERT ACE OF SWORDS URL]
 * - [INSERT KING OF WANDS URL]
 *
 * Replacements:
 * - /tarot/articles/the-emperor-tarot-card-meaning
 * - /tarot/articles/ace-of-swords-tarot-card-meaning
 * - /tarot/articles/king-of-wands-tarot-card-meaning
 */

/**
 * Converts a card name to a URL-friendly slug
 * @param cardName - The card name (e.g., "THE EMPEROR", "ACE OF SWORDS")
 * @returns The slug (e.g., "the-emperor-tarot-card-meaning")
 */
function cardNameToSlug(cardName: string): string {
  return cardName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .concat('-tarot-card-meaning'); // Add suffix
}

/**
 * Replaces all placeholder URLs in content with actual tarot article URLs
 * @param content - HTML content with placeholders
 * @returns Content with replaced URLs
 */
export function replaceArticleUrls(content: string): string {
  if (!content) return content;

  let processedContent = content;

  // Pattern 1: [INSERT CARD_NAME CARD URL] - e.g., [INSERT HIGH PRIESTESS CARD URL]
  const cardUrlPattern = /\[INSERT\s+([A-Z\s]+?)\s+CARD\s+URL\]/gi;
  processedContent = processedContent.replace(cardUrlPattern, (match, cardName) => {
    const slug = cardNameToSlug(cardName.trim());
    const url = `/tarot/articles/${slug}`;
    console.log(`📝 Replacing placeholder: "${match}" → "${url}"`);
    return url;
  });

  // Pattern 2: [INSERT URL FOR CARD_NAME CARD] - e.g., [INSERT URL FOR MOON CARD]
  const urlForCardPattern = /\[INSERT\s+URL\s+FOR\s+([A-Z\s]+?)\s+CARD\]/gi;
  processedContent = processedContent.replace(urlForCardPattern, (match, cardName) => {
    const slug = cardNameToSlug(cardName.trim());
    const url = `/tarot/articles/${slug}`;
    console.log(`📝 Replacing placeholder: "${match}" → "${url}"`);
    return url;
  });

  // Pattern 2b: [INSERT CARD_NAME ARTICLE URL] - e.g., [INSERT 4 OF WANDS ARTICLE URL]
  const articleUrlPattern = /\[INSERT\s+([A-Z0-9\s]+?)\s+ARTICLE\s+URL\]/gi;
  processedContent = processedContent.replace(articleUrlPattern, (match, cardName) => {
    const slug = cardNameToSlug(cardName.trim());
    const url = `/tarot/articles/${slug}`;
    console.log(`📝 Replacing placeholder: "${match}" → "${url}"`);
    return url;
  });

  // Pattern 3: [INSERT CARD_NAME URL] - e.g., [INSERT THE EMPEROR URL] (original format)
  const simplePattern = /\[INSERT\s+([A-Z\s]+)\s+URL\]/gi;
  processedContent = processedContent.replace(simplePattern, (match, cardName) => {
    const cleanName = cardName.trim();

    // Skip if it's not a card (contains MAJOR ARCANA, GUIDE, READING, etc.)
    if (
      cleanName.includes('MAJOR ARCANA') ||
      cleanName.includes('GUIDE') ||
      cleanName.includes('READING') ||
      cleanName.includes('IMAGE')
    ) {
      console.log(`⏭️  Skipping non-card placeholder: "${match}"`);
      return match; // Return unchanged
    }

    const slug = cardNameToSlug(cleanName);
    const url = `/tarot/articles/${slug}`;
    console.log(`📝 Replacing placeholder: "${match}" → "${url}"`);
    return url;
  });

  // Pattern 2: Fix existing relative/absolute URLs missing /tarot/articles/ prefix
  // Matches: href="magician-tarot-card-meaning" or href="/magician-tarot-card-meaning"
  // But NOT: href="/tarot/articles/..." (already correct)
  const incorrectUrlPattern = /href=["'](\/?([a-z0-9-]+)-tarot-card-meaning)["']/gi;
  processedContent = processedContent.replace(incorrectUrlPattern, (match, fullUrl, cardSlug) => {
    // Skip if URL already has /tarot/articles/ prefix
    if (fullUrl.startsWith('/tarot/articles/')) {
      return match;
    }

    const correctedUrl = `/tarot/articles/${cardSlug}-tarot-card-meaning`;
    console.log(`🔧 Fixing incorrect URL: "${fullUrl}" → "${correctedUrl}"`);
    return `href="${correctedUrl}"`;
  });

  return processedContent;
}

/**
 * Processes blog post content fields to replace placeholder URLs
 * @param contentEn - English content
 * @param contentFr - French content (optional)
 * @returns Object with processed content
 */
export function processBlogContent(
  contentEn: string,
  contentFr?: string
): { contentEn: string; contentFr: string | undefined } {
  return {
    contentEn: replaceArticleUrls(contentEn),
    contentFr: contentFr ? replaceArticleUrls(contentFr) : undefined,
  };
}
