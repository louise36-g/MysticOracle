import { TarotCard } from '../types';

/**
 * Fisher-Yates shuffle algorithm - produces an unbiased permutation
 * Much better than the sort(() => Math.random() - 0.5) approach
 */
export function shuffleDeck<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffle tarot deck and optionally assign reversed status to each card
 */
export function shuffleTarotDeck(
  deck: TarotCard[],
  reverseChance: number = 0.5
): Array<TarotCard & { isReversed: boolean }> {
  const shuffled = shuffleDeck(deck);
  return shuffled.map(card => ({
    ...card,
    isReversed: Math.random() < reverseChance
  }));
}
