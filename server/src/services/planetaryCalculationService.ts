/**
 * Planetary position at a specific degree in the zodiac
 */
export interface PlanetPosition {
  longitude: number; // 0-360 degrees in ecliptic coordinates
  sign: string; // Zodiac sign name (e.g., "Aries", "Taurus")
  degrees: number; // Degrees within the sign (0-30)
  retrograde?: boolean; // True if planet is in retrograde motion
}

/**
 * Moon-specific data including phase information
 */
export interface MoonData extends PlanetPosition {
  phase: string; // e.g., "New Moon", "Waxing Gibbous", "Full Moon"
  illumination: number; // 0-100 percentage
}

/**
 * Aspect between two planets
 */
export interface PlanetaryAspect {
  planet1: string;
  planet2: string;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  angle: number; // Actual angle between planets
  orb: number; // Deviation from exact aspect
}

/**
 * Complete planetary data for a given date
 */
export interface PlanetaryData {
  date: Date;
  sun: PlanetPosition;
  moon: MoonData;
  mercury: PlanetPosition;
  venus: PlanetPosition;
  mars: PlanetPosition;
  jupiter: PlanetPosition;
  saturn: PlanetPosition;
  aspects: PlanetaryAspect[];
}

/**
 * Service for calculating planetary positions using astronomy-engine
 */
export class PlanetaryCalculationService {
  /**
   * Calculate planetary positions for a given date
   * @param date Date to calculate positions for
   * @returns Complete planetary data
   * @throws Error if calculations fail
   */
  async calculatePlanetaryData(date: Date): Promise<PlanetaryData> {
    throw new Error('Not implemented');
  }

  /**
   * Format planetary data into human-readable text for AI prompts
   * @param data Planetary data to format
   * @returns Formatted string ready for prompt injection
   */
  formatForPrompt(data: PlanetaryData): string {
    throw new Error('Not implemented');
  }
}
