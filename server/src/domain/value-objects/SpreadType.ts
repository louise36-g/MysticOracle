/**
 * SpreadType Value Object
 * Represents a valid tarot spread type with its associated properties
 * Immutable value object
 */

import { InvalidSpreadTypeError } from '../errors/index.js';
import { CreditAmount } from './CreditAmount.js';
import { SpreadType as PrismaSpreadType } from '@prisma/client';

// Spread type configuration
interface SpreadConfig {
  name: string;
  cardCount: number;
  cost: number;
  description: string;
}

const SPREAD_CONFIGS: Record<PrismaSpreadType, SpreadConfig> = {
  SINGLE: {
    name: 'Single Card',
    cardCount: 1,
    cost: 1,
    description: 'A quick answer to a specific question',
  },
  TWO_CARD: {
    name: 'Two Card',
    cardCount: 2,
    cost: 2,
    description: 'A quick pair for focused insight',
  },
  THREE_CARD: {
    name: 'Three Card',
    cardCount: 3,
    cost: 3,
    description: 'Past, present, and future insights',
  },
  FIVE_CARD: {
    name: 'Five Card',
    cardCount: 5,
    cost: 5,
    description: 'Deep exploration of a situation or theme',
  },
  LOVE: {
    name: 'Love Spread',
    cardCount: 5,
    cost: 5,
    description: 'Deep insights into romantic relationships',
  },
  CAREER: {
    name: 'Career Spread',
    cardCount: 5,
    cost: 5,
    description: 'Guidance for professional matters',
  },
  HORSESHOE: {
    name: 'Horseshoe Spread',
    cardCount: 7,
    cost: 7,
    description: 'Comprehensive overview of a situation',
  },
  CELTIC_CROSS: {
    name: 'Celtic Cross',
    cardCount: 10,
    cost: 10,
    description: 'The most detailed and comprehensive spread',
  },
};

const VALID_SPREAD_TYPES = Object.keys(SPREAD_CONFIGS) as PrismaSpreadType[];

export class SpreadType {
  private readonly _value: PrismaSpreadType;
  private readonly _config: SpreadConfig;

  private constructor(value: PrismaSpreadType) {
    this._value = value;
    this._config = SPREAD_CONFIGS[value];
  }

  /**
   * Create a SpreadType from a string input
   * Accepts both lowercase and uppercase values
   * @throws InvalidSpreadTypeError if the type is invalid
   */
  static create(value: string): SpreadType {
    const normalized = value.toUpperCase() as PrismaSpreadType;

    if (!VALID_SPREAD_TYPES.includes(normalized)) {
      throw new InvalidSpreadTypeError(value, VALID_SPREAD_TYPES);
    }

    return new SpreadType(normalized);
  }

  /**
   * Create from a Prisma enum value (trusted source)
   */
  static fromPrisma(value: PrismaSpreadType): SpreadType {
    return new SpreadType(value);
  }

  /**
   * Get all valid spread types
   */
  static all(): SpreadType[] {
    return VALID_SPREAD_TYPES.map(t => new SpreadType(t));
  }

  /**
   * Get the Prisma enum value
   */
  get value(): PrismaSpreadType {
    return this._value;
  }

  /**
   * Get the display name
   */
  get name(): string {
    return this._config.name;
  }

  /**
   * Get the number of cards in this spread
   */
  get cardCount(): number {
    return this._config.cardCount;
  }

  /**
   * Get the credit cost for this spread
   */
  get cost(): CreditAmount {
    return CreditAmount.create(this._config.cost);
  }

  /**
   * Get the raw cost value
   */
  get costValue(): number {
    return this._config.cost;
  }

  /**
   * Get the description
   */
  get description(): string {
    return this._config.description;
  }

  /**
   * Check equality with another SpreadType
   */
  equals(other: SpreadType): boolean {
    return this._value === other._value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this._value;
  }

  /**
   * JSON representation
   */
  toJSON(): string {
    return this._value;
  }
}

export default SpreadType;
