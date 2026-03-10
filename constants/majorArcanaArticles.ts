// Mapping from Major Arcana card ID to blog article slug
// Update these slugs to match your actual article URLs at /blog/{slug}

export const MAJOR_ARCANA_ARTICLE_SLUGS: Record<number, string> = {
  0: 'the-fool-tarot-card-meaning',
  1: 'the-magician-tarot-card-meaning',
  2: 'the-high-priestess-tarot-card-meaning',
  3: 'the-empress-tarot-card-meaning',
  4: 'the-emperor-tarot-card-meaning',
  5: 'the-hierophant-tarot-card-meaning',
  6: 'the-lovers-tarot-card-meaning',
  7: 'the-chariot-tarot-card-meaning',
  8: 'strength-tarot-card-meaning',
  9: 'the-hermit-tarot-card-meaning',
  10: 'wheel-of-fortune-tarot-card-meaning',
  11: 'justice-tarot-card-meaning',
  12: 'the-hanged-man-tarot-card-meaning',
  13: 'death-tarot-card-meaning',
  14: 'temperance-tarot-card-meaning',
  15: 'the-devil-tarot-card-meaning',
  16: 'the-tower-tarot-card-meaning',
  17: 'the-star-tarot-card-meaning',
  18: 'the-moon-tarot-card-meaning',
  19: 'the-sun-tarot-card-meaning',
  20: 'judgement-tarot-card-meaning',
  21: 'the-world-tarot-card-meaning',
};

/**
 * Get the article URL path for a Major Arcana card
 * Returns /blog/{slug} or null if no article exists
 */
export function getArticleUrl(cardId: number): string | null {
  const slug = MAJOR_ARCANA_ARTICLE_SLUGS[cardId];
  return slug ? `/blog/${slug}` : null;
}
