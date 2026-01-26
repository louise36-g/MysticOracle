import { SpreadConfig, InterpretationStyle } from '../types';

/**
 * Transform SpreadConfig to API-compatible spread params
 * Eliminates duplication between regenerateReading and startReading
 */
export function toAPISpreadParams(spread: SpreadConfig) {
  return {
    id: spread.id,
    nameEn: spread.nameEn,
    nameFr: spread.nameFr,
    positions: spread.positions,
    positionMeaningsEn: spread.positionMeaningsEn,
    positionMeaningsFr: spread.positionMeaningsFr,
    creditCost: spread.cost,
  };
}

/**
 * Convert interpretation style selection to API-compatible string array
 */
export function toStyleStrings(
  isAdvanced: boolean,
  selectedStyles: InterpretationStyle[]
): string[] {
  return isAdvanced
    ? selectedStyles.map(s => s.toString())
    : [InterpretationStyle.CLASSIC.toString()];
}
