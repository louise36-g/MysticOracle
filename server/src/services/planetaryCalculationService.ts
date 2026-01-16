import {
  MakeTime,
  GeoVector,
  Body
} from 'astronomy-engine';

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
   * Zodiac signs in order starting from 0° Aries
   */
  private readonly ZODIAC_SIGNS = [
    'Aries',      // 0-30°
    'Taurus',     // 30-60°
    'Gemini',     // 60-90°
    'Cancer',     // 90-120°
    'Leo',        // 120-150°
    'Virgo',      // 150-180°
    'Libra',      // 180-210°
    'Scorpio',    // 210-240°
    'Sagittarius', // 240-270°
    'Capricorn',  // 270-300°
    'Aquarius',   // 300-330°
    'Pisces',     // 330-360°
  ];

  /**
   * Calculate planetary positions for a given date
   * @param date Date to calculate positions for
   * @returns Complete planetary data
   * @throws Error if calculations fail
   */
  async calculatePlanetaryData(date: Date): Promise<PlanetaryData> {
    try {
      const astroTime = MakeTime(date);

      // Calculate positions for all planets
      const sunGeo = GeoVector(Body.Sun, astroTime, false);
      const mercuryGeo = GeoVector(Body.Mercury, astroTime, false);
      const venusGeo = GeoVector(Body.Venus, astroTime, false);
      const marsGeo = GeoVector(Body.Mars, astroTime, false);
      const jupiterGeo = GeoVector(Body.Jupiter, astroTime, false);
      const saturnGeo = GeoVector(Body.Saturn, astroTime, false);

      // Convert to ecliptic longitudes
      const sunLon = this.calculateEclipticLongitude(sunGeo);
      const mercuryLon = this.calculateEclipticLongitude(mercuryGeo);
      const venusLon = this.calculateEclipticLongitude(venusGeo);
      const marsLon = this.calculateEclipticLongitude(marsGeo);
      const jupiterLon = this.calculateEclipticLongitude(jupiterGeo);
      const saturnLon = this.calculateEclipticLongitude(saturnGeo);

      // Create position objects
      const createPosition = (lon: number): PlanetPosition => ({
        longitude: lon,
        sign: this.getZodiacSign(lon),
        degrees: this.getDegreesInSign(lon),
      });

      return {
        date,
        sun: createPosition(sunLon),
        moon: {
          longitude: 0, // Will implement in next task
          sign: 'Aries',
          degrees: 0,
          phase: 'Unknown',
          illumination: 0,
        },
        mercury: createPosition(mercuryLon),
        venus: createPosition(venusLon),
        mars: createPosition(marsLon),
        jupiter: createPosition(jupiterLon),
        saturn: createPosition(saturnLon),
        aspects: [], // Will implement later
      };
    } catch (error) {
      throw new Error(`Failed to calculate planetary positions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format planetary data into human-readable text for AI prompts
   * @param data Planetary data to format
   * @returns Formatted string ready for prompt injection
   */
  formatForPrompt(data: PlanetaryData): string {
    throw new Error('Not implemented');
  }

  /**
   * Convert ecliptic longitude (0-360°) to zodiac sign name
   * @param longitude Ecliptic longitude in degrees
   * @returns Zodiac sign name
   */
  private getZodiacSign(longitude: number): string {
    // Normalize longitude to 0-360 range
    const normalizedLong = ((longitude % 360) + 360) % 360;

    // Each sign is 30 degrees
    const signIndex = Math.floor(normalizedLong / 30);

    return this.ZODIAC_SIGNS[signIndex];
  }

  /**
   * Get degrees within the current zodiac sign (0-30)
   * @param longitude Ecliptic longitude in degrees
   * @returns Degrees within the sign
   */
  private getDegreesInSign(longitude: number): number {
    const normalizedLong = ((longitude % 360) + 360) % 360;
    return normalizedLong % 30;
  }

  /**
   * Calculate ecliptic longitude from geocentric vector
   * @param geoVector Geocentric position vector
   * @returns Ecliptic longitude in degrees (0-360)
   */
  private calculateEclipticLongitude(geoVector: any): number {
    // Convert Cartesian coordinates to ecliptic longitude
    const x = geoVector.x;
    const y = geoVector.y;
    const z = geoVector.z;

    // Calculate longitude in radians, then convert to degrees
    let lon = Math.atan2(y, x) * (180 / Math.PI);

    // Normalize to 0-360 range
    if (lon < 0) lon += 360;

    return lon;
  }
}
