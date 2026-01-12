/**
 * IReadingRepository - Reading data access interface
 * Abstracts database operations for Reading and FollowUpQuestion entities
 */

import type { Reading, FollowUpQuestion, SpreadType, InterpretationStyle } from '@prisma/client';
import type { PaginationOptions } from './IUserRepository.js';

// Card position stored in JSON
export interface CardPosition {
  cardId: string;
  position: number;
  isReversed?: boolean;
}

// DTOs for creating readings
export interface CreateReadingDTO {
  userId: string;
  spreadType: SpreadType;
  interpretationStyle: InterpretationStyle;
  question?: string;
  cards: CardPosition[];
  interpretation: string;
  creditCost: number;
}

export interface UpdateReadingDTO {
  summary?: string;
  userReflection?: string;
  themes?: string[];
}

// DTOs for follow-up questions
export interface CreateFollowUpDTO {
  readingId: string;
  question: string;
  answer: string;
  creditCost: number;
}

// Reading with follow-ups
export interface ReadingWithFollowUps extends Reading {
  followUps: FollowUpQuestion[];
}

/**
 * Reading Repository Interface
 * Defines all reading-related database operations
 */
export interface IReadingRepository {
  // Basic CRUD
  findById(id: string): Promise<Reading | null>;
  findByIdWithFollowUps(id: string): Promise<ReadingWithFollowUps | null>;

  create(data: CreateReadingDTO): Promise<Reading>;
  update(id: string, data: UpdateReadingDTO): Promise<Reading>;
  delete(id: string): Promise<boolean>;

  // User's readings
  findByUser(userId: string, options?: PaginationOptions): Promise<ReadingWithFollowUps[]>;
  countByUser(userId: string): Promise<number>;

  // Ownership check
  findByIdAndUser(id: string, userId: string): Promise<Reading | null>;

  // Follow-up questions
  addFollowUp(data: CreateFollowUpDTO): Promise<FollowUpQuestion>;
  findFollowUpsByReading(readingId: string): Promise<FollowUpQuestion[]>;

  // Statistics
  countAll(): Promise<number>;
  countToday(): Promise<number>;
  getRecentReadings(limit?: number): Promise<(Reading & { user: { username: string } })[]>;
}

export default IReadingRepository;
