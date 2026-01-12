/**
 * IReadingCardRepository - Reading card data access interface
 * Abstracts database operations for normalized ReadingCard entity
 * Used for RAG queries and analytics
 */

import type { ReadingCard } from '@prisma/client';

// DTO for creating reading cards
export interface CreateReadingCardDTO {
  readingId: string;
  cardId: number;
  position: number;
  isReversed?: boolean;
}

// Query options for finding cards
export interface ReadingCardQueryOptions {
  cardId?: number;
  isReversed?: boolean;
  limit?: number;
  offset?: number;
}

// Reading card with reading relation
export interface ReadingCardWithReading extends ReadingCard {
  reading?: {
    id: string;
    userId: string;
    spreadType: string;
    question?: string | null;
    interpretation: string;
    createdAt: Date;
  };
}

/**
 * Reading Card Repository Interface
 * Defines operations for normalized card storage (RAG preparation)
 */
export interface IReadingCardRepository {
  /**
   * Find cards by reading ID
   */
  findByReadingId(readingId: string): Promise<ReadingCard[]>;

  /**
   * Find all readings containing a specific card
   * Useful for RAG: "Show me readings where The Fool appeared"
   */
  findReadingsWithCard(
    cardId: number,
    options?: ReadingCardQueryOptions
  ): Promise<ReadingCardWithReading[]>;

  /**
   * Find readings with multiple specific cards
   * Useful for RAG: "Show readings with both The Fool and The Magician"
   */
  findReadingsWithCards(
    cardIds: number[],
    options?: ReadingCardQueryOptions
  ): Promise<ReadingCardWithReading[]>;

  /**
   * Create multiple reading cards (bulk insert)
   */
  createMany(data: CreateReadingCardDTO[]): Promise<number>;

  /**
   * Delete cards by reading ID
   */
  deleteByReadingId(readingId: string): Promise<number>;

  /**
   * Count readings containing a specific card
   */
  countReadingsWithCard(cardId: number): Promise<number>;

  /**
   * Get card frequency statistics
   * Returns array of { cardId, count } ordered by frequency
   */
  getCardFrequencies(limit?: number): Promise<{ cardId: number; count: number }[]>;

  /**
   * Find cards for a user's readings
   * Useful for RAG: user's personal card history
   */
  findByUserId(
    userId: string,
    options?: ReadingCardQueryOptions
  ): Promise<ReadingCardWithReading[]>;
}

export default IReadingCardRepository;
