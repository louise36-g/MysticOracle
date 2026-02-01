/**
 * useReadingCards Hook
 * Manages deck shuffling and card drawing logic for tarot readings
 */

import { useState, useEffect, useCallback } from 'react';
import { TarotCard } from '../types';
import { FULL_DECK } from '../constants';
import { shuffleDeck } from '../utils/shuffle';

export interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

interface UseReadingCardsResult {
  deck: TarotCard[];
  drawnCards: DrawnCard[];
  reshuffleDeck: () => void;
  drawCard: (reversalChance?: number) => DrawnCard | null;
  resetCards: () => void;
  isComplete: (positions: number) => boolean;
}

export function useReadingCards(): UseReadingCardsResult {
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);

  // Initialize deck on mount
  useEffect(() => {
    setDeck(shuffleDeck(FULL_DECK));
  }, []);

  // Reshuffle the deck and reset drawn cards
  const reshuffleDeck = useCallback(() => {
    setDeck(shuffleDeck(FULL_DECK));
    setDrawnCards([]);
  }, []);

  // Draw the next card from the deck
  const drawCard = useCallback(
    (reversalChance = 0.1): DrawnCard | null => {
      if (drawnCards.length >= deck.length) return null;

      const newCard = deck[drawnCards.length];
      const isReversed = Math.random() < reversalChance;
      const drawnCard: DrawnCard = { card: newCard, isReversed };

      setDrawnCards(prev => [...prev, drawnCard]);
      return drawnCard;
    },
    [deck, drawnCards.length]
  );

  // Reset cards without reshuffling
  const resetCards = useCallback(() => {
    setDrawnCards([]);
  }, []);

  // Check if all cards for the spread have been drawn
  const isComplete = useCallback(
    (positions: number): boolean => {
      return drawnCards.length >= positions;
    },
    [drawnCards.length]
  );

  return {
    deck,
    drawnCards,
    reshuffleDeck,
    drawCard,
    resetCards,
    isComplete,
  };
}

export default useReadingCards;
