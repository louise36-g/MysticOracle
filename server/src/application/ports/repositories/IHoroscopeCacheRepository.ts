/**
 * IHoroscopeCacheRepository - Horoscope cache data access interface
 * Abstracts database operations for HoroscopeCache entity
 */

import type { HoroscopeCache } from '@prisma/client';

// DTO for creating a cached horoscope
export interface CreateHoroscopeCacheDTO {
  sign: string;
  language: string;
  date: Date;
  horoscope: string;
  userId?: string;
}

/**
 * Horoscope Cache Repository Interface
 * Defines operations for caching daily horoscopes
 */
export interface IHoroscopeCacheRepository {
  /**
   * Find a cached horoscope by sign, language, and date
   */
  findBySignAndDate(sign: string, language: string, date: Date): Promise<HoroscopeCache | null>;

  /**
   * Create a new cached horoscope
   */
  create(data: CreateHoroscopeCacheDTO): Promise<HoroscopeCache>;

  /**
   * Delete horoscopes older than a given date
   * Returns the count of deleted records
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Count all cached horoscopes
   */
  count(): Promise<number>;

  /**
   * Count horoscopes for a specific date
   */
  countByDate(date: Date): Promise<number>;
}

export default IHoroscopeCacheRepository;
