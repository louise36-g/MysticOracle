/**
 * CreditAmount Value Object
 * Represents a non-negative credit amount
 * Immutable - operations return new instances
 */

import { ValidationError } from '../errors/index.js';

export class CreditAmount {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * Create a new CreditAmount
   * @throws ValidationError if amount is negative or not an integer
   */
  static create(value: number): CreditAmount {
    if (!Number.isInteger(value)) {
      throw ValidationError.fromField('credits', 'Credit amount must be an integer');
    }
    if (value < 0) {
      throw ValidationError.fromField('credits', 'Credit amount cannot be negative');
    }
    return new CreditAmount(value);
  }

  /**
   * Create a zero credit amount
   */
  static zero(): CreditAmount {
    return new CreditAmount(0);
  }

  /**
   * Create from an existing number (trusted source)
   * Use when loading from database where value is already validated
   */
  static fromTrusted(value: number): CreditAmount {
    return new CreditAmount(value);
  }

  /**
   * Get the numeric value
   */
  get value(): number {
    return this._value;
  }

  /**
   * Check if this is zero credits
   */
  isZero(): boolean {
    return this._value === 0;
  }

  /**
   * Check if we have at least the required amount
   */
  isAtLeast(required: CreditAmount): boolean {
    return this._value >= required._value;
  }

  /**
   * Check if we have more than the specified amount
   */
  isGreaterThan(other: CreditAmount): boolean {
    return this._value > other._value;
  }

  /**
   * Add credits (returns new instance)
   */
  add(amount: CreditAmount): CreditAmount {
    return new CreditAmount(this._value + amount._value);
  }

  /**
   * Subtract credits (returns new instance)
   * @throws ValidationError if result would be negative
   */
  subtract(amount: CreditAmount): CreditAmount {
    const newValue = this._value - amount._value;
    if (newValue < 0) {
      throw ValidationError.fromField(
        'credits',
        `Cannot subtract ${amount._value} from ${this._value}: would result in negative balance`
      );
    }
    return new CreditAmount(newValue);
  }

  /**
   * Check equality with another CreditAmount
   */
  equals(other: CreditAmount): boolean {
    return this._value === other._value;
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this._value} credits`;
  }

  /**
   * JSON representation
   */
  toJSON(): number {
    return this._value;
  }
}

export default CreditAmount;
