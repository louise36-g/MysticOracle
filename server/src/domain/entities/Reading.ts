/**
 * Reading Entity
 * Domain entity representing a tarot reading
 * Contains business logic related to readings
 */

import { SpreadType } from '../value-objects/SpreadType.js';
import { CreditAmount } from '../value-objects/CreditAmount.js';
import { ValidationError } from '../errors/index.js';
import { InterpretationStyle, SpreadType as PrismaSpreadType } from '@prisma/client';

// Card position in a reading
export interface CardPosition {
  cardId: string;
  position: number;
  isReversed: boolean;
}

// Follow-up question
export interface FollowUpQuestion {
  id: string;
  question: string;
  answer: string;
  createdAt: Date;
}

// Reading properties for reconstruction
export interface ReadingProps {
  id: string;
  userId: string;
  spreadType: PrismaSpreadType;
  interpretationStyle: InterpretationStyle;
  question: string | null;
  cards: CardPosition[];
  interpretation: string;
  summary: string | null;
  userReflection: string | null;
  themes: string[];
  creditCost: number;
  createdAt: Date;
  followUps?: FollowUpQuestion[];
}

// Data for creating a new reading
export interface CreateReadingData {
  userId: string;
  spreadType: SpreadType;
  interpretationStyle: InterpretationStyle;
  question?: string;
  cards: CardPosition[];
  interpretation: string;
}

export class Reading {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _spreadType: SpreadType;
  private readonly _interpretationStyle: InterpretationStyle;
  private readonly _question: string | null;
  private readonly _cards: CardPosition[];
  private readonly _interpretation: string;
  private _summary: string | null;
  private _userReflection: string | null;
  private _themes: string[];
  private readonly _creditCost: CreditAmount;
  private readonly _createdAt: Date;
  private _followUps: FollowUpQuestion[];

  private constructor(props: ReadingProps & { followUps?: FollowUpQuestion[] }) {
    this._id = props.id;
    this._userId = props.userId;
    this._spreadType = SpreadType.fromPrisma(props.spreadType);
    this._interpretationStyle = props.interpretationStyle;
    this._question = props.question;
    this._cards = props.cards;
    this._interpretation = props.interpretation;
    this._summary = props.summary;
    this._userReflection = props.userReflection;
    this._themes = props.themes;
    this._creditCost = CreditAmount.fromTrusted(props.creditCost);
    this._createdAt = props.createdAt;
    this._followUps = props.followUps || [];
  }

  /**
   * Create a new reading (for new readings)
   */
  static create(data: CreateReadingData): Reading {
    // Validate cards match spread type
    if (data.cards.length !== data.spreadType.cardCount) {
      throw ValidationError.fromField(
        'cards',
        `Expected ${data.spreadType.cardCount} cards for ${data.spreadType.name}, got ${data.cards.length}`
      );
    }

    // Validate interpretation is not empty
    if (!data.interpretation || data.interpretation.trim().length === 0) {
      throw ValidationError.fromField('interpretation', 'Interpretation cannot be empty');
    }

    // Validate question length if provided
    if (data.question && data.question.length > 1000) {
      throw ValidationError.fromField('question', 'Question cannot exceed 1000 characters');
    }

    return new Reading({
      id: '', // Will be assigned by repository
      userId: data.userId,
      spreadType: data.spreadType.value,
      interpretationStyle: data.interpretationStyle,
      question: data.question || null,
      cards: data.cards,
      interpretation: data.interpretation,
      summary: null,
      userReflection: null,
      themes: [],
      creditCost: data.spreadType.costValue,
      createdAt: new Date(),
    });
  }

  /**
   * Reconstruct a reading from persistence
   */
  static fromPersistence(props: ReadingProps): Reading {
    return new Reading(props);
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get spreadType(): SpreadType {
    return this._spreadType;
  }

  get interpretationStyle(): InterpretationStyle {
    return this._interpretationStyle;
  }

  get question(): string | null {
    return this._question;
  }

  get cards(): CardPosition[] {
    return [...this._cards]; // Return copy to preserve immutability
  }

  get interpretation(): string {
    return this._interpretation;
  }

  get summary(): string | null {
    return this._summary;
  }

  get userReflection(): string | null {
    return this._userReflection;
  }

  get themes(): string[] {
    return [...this._themes];
  }

  get creditCost(): CreditAmount {
    return this._creditCost;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get followUps(): FollowUpQuestion[] {
    return [...this._followUps];
  }

  /**
   * Check if this reading belongs to a specific user
   */
  belongsTo(userId: string): boolean {
    return this._userId === userId;
  }

  /**
   * Check if the reading has a summary
   */
  hasSummary(): boolean {
    return this._summary !== null && this._summary.length > 0;
  }

  /**
   * Check if the reading has a user reflection
   */
  hasReflection(): boolean {
    return this._userReflection !== null && this._userReflection.length > 0;
  }

  /**
   * Update the user reflection
   */
  setReflection(reflection: string): void {
    if (reflection.length > 1000) {
      throw ValidationError.fromField('userReflection', 'Reflection cannot exceed 1000 characters');
    }
    this._userReflection = reflection;
  }

  /**
   * Set the summary (AI-generated)
   */
  setSummary(summary: string): void {
    this._summary = summary;
  }

  /**
   * Set themes extracted from the reading
   */
  setThemes(themes: string[]): void {
    this._themes = themes;
  }

  /**
   * Add a follow-up question
   */
  addFollowUp(followUp: FollowUpQuestion): void {
    this._followUps.push(followUp);
  }

  /**
   * Get follow-up count
   */
  getFollowUpCount(): number {
    return this._followUps.length;
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): Omit<ReadingProps, 'followUps'> {
    return {
      id: this._id,
      userId: this._userId,
      spreadType: this._spreadType.value,
      interpretationStyle: this._interpretationStyle,
      question: this._question,
      cards: this._cards,
      interpretation: this._interpretation,
      summary: this._summary,
      userReflection: this._userReflection,
      themes: this._themes,
      creditCost: this._creditCost.value,
      createdAt: this._createdAt,
    };
  }
}

export default Reading;
