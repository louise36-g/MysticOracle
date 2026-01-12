/**
 * Invalid Spread Type Error
 * Thrown when an invalid spread type is provided
 */

import { DomainError } from './DomainError.js';

export class InvalidSpreadTypeError extends DomainError {
  readonly code = 'INVALID_SPREAD_TYPE';
  readonly providedType: string;
  readonly validTypes: string[];

  constructor(providedType: string, validTypes: string[]) {
    super(`Invalid spread type: "${providedType}". Valid types: ${validTypes.join(', ')}`);
    this.providedType = providedType;
    this.validTypes = validTypes;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      providedType: this.providedType,
      validTypes: this.validTypes,
    };
  }
}

export default InvalidSpreadTypeError;
