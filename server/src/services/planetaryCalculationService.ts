import * as Astronomy from 'astronomy-engine';

// Re-export commonly used functions for convenience
const { MakeTime, GeoVector, MoonPhase, Illumination } = Astronomy;

// Use Astronomy.Body directly for type consistency
const Body = Astronomy.Body;

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
    'Aries', // 0-30°
    'Taurus', // 30-60°
    'Gemini', // 60-90°
    'Cancer', // 90-120°
    'Leo', // 120-150°
    'Virgo', // 150-180°
    'Libra', // 180-210°
    'Scorpio', // 210-240°
    'Sagittarius', // 240-270°
    'Capricorn', // 270-300°
    'Aquarius', // 300-330°
    'Pisces', // 330-360°
  ];

  /**
   * Aspect definitions with their angles and orb tolerances
   */
  private readonly ASPECTS = [
    { type: 'conjunction' as const, angle: 0, orb: 8 },
    { type: 'opposition' as const, angle: 180, orb: 8 },
    { type: 'trine' as const, angle: 120, orb: 8 },
    { type: 'square' as const, angle: 90, orb: 8 },
    { type: 'sextile' as const, angle: 60, orb: 6 },
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
      const createPosition = (lon: number, body: Astronomy.Body): PlanetPosition => ({
        longitude: lon,
        sign: this.getZodiacSign(lon),
        degrees: this.getDegreesInSign(lon),
        retrograde: this.isRetrograde(body, astroTime),
      });

      // Calculate aspects between all planets
      const moonData = this.calculateMoonData(astroTime);
      const positions = {
        sun: sunLon,
        moon: moonData.longitude,
        mercury: mercuryLon,
        venus: venusLon,
        mars: marsLon,
        jupiter: jupiterLon,
        saturn: saturnLon,
      };

      const aspects = this.calculateAspects(positions);

      return {
        date,
        sun: {
          longitude: sunLon,
          sign: this.getZodiacSign(sunLon),
          degrees: this.getDegreesInSign(sunLon),
        },
        moon: moonData,
        mercury: createPosition(mercuryLon, Body.Mercury),
        venus: createPosition(venusLon, Body.Venus),
        mars: createPosition(marsLon, Body.Mars),
        jupiter: createPosition(jupiterLon, Body.Jupiter),
        saturn: createPosition(saturnLon, Body.Saturn),
        aspects, // Now includes calculated aspects
      };
    } catch (error) {
      throw new Error(
        `Failed to calculate planetary positions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Format planetary data into human-readable text for AI prompts
   * @param data Planetary data to format
   * @returns Formatted string ready for prompt injection
   */
  formatForPrompt(data: PlanetaryData): string {
    const lines: string[] = [];

    // Helper to format a planet position
    const formatPlanet = (name: string, position: PlanetPosition): string => {
      const degrees = Math.round(position.degrees);
      const retrograde = position.retrograde ? ' (Retrograde)' : '';
      return `- ${name} at ${degrees}° ${position.sign}${retrograde}`;
    };

    // Format Moon with phase information
    const formatMoon = (moon: MoonData): string => {
      const degrees = Math.round(moon.degrees);
      return `- Moon at ${degrees}° ${moon.sign} (${moon.phase}, ${moon.illumination}% illuminated)`;
    };

    // Planetary Positions section
    lines.push('Current Planetary Positions:');
    lines.push(formatPlanet('Sun', data.sun));
    lines.push(formatMoon(data.moon));
    lines.push(formatPlanet('Mercury', data.mercury));
    lines.push(formatPlanet('Venus', data.venus));
    lines.push(formatPlanet('Mars', data.mars));
    lines.push(formatPlanet('Jupiter', data.jupiter));
    lines.push(formatPlanet('Saturn', data.saturn));

    // Aspects section (if any)
    if (data.aspects.length > 0) {
      lines.push('');
      lines.push('Major Aspects:');

      // Sort aspects by orb (tightest first)
      const sortedAspects = [...data.aspects].sort((a, b) => a.orb - b.orb);

      // Add aspect interpretations
      const aspectMeanings: Record<string, string> = {
        conjunction: 'merging of energies',
        opposition: 'tension and awareness between',
        trine: 'harmony between',
        square: 'dynamic tension between',
        sextile: 'opportunity between',
      };

      for (const aspect of sortedAspects.slice(0, 5)) {
        // Show top 5 aspects
        const meaning = aspectMeanings[aspect.type] || aspect.type;
        const orbStr = aspect.orb < 1 ? ' (exact)' : ` (${Math.round(aspect.orb)}° orb)`;
        lines.push(`- ${aspect.planet1} ${aspect.type} ${aspect.planet2}${orbStr} - ${meaning}`);
      }
    }

    return lines.join('\n');
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
   * Calculate Moon phase name from phase angle
   * @param phaseAngle Phase angle in degrees (0-360)
   * @returns Moon phase name
   */
  private getMoonPhaseName(phaseAngle: number): string {
    // Normalize to 0-360
    const normalized = ((phaseAngle % 360) + 360) % 360;

    if (normalized < 22.5 || normalized >= 337.5) return 'New Moon';
    if (normalized < 67.5) return 'Waxing Crescent';
    if (normalized < 112.5) return 'First Quarter';
    if (normalized < 157.5) return 'Waxing Gibbous';
    if (normalized < 202.5) return 'Full Moon';
    if (normalized < 247.5) return 'Waning Gibbous';
    if (normalized < 292.5) return 'Last Quarter';
    return 'Waning Crescent';
  }

  /**
   * Calculate Moon data including position and phase
   * @param astroTime Astronomy engine time object
   * @returns Moon data with phase information
   */
  private calculateMoonData(astroTime: Astronomy.AstroTime): MoonData {
    // Get Moon's geocentric position
    const moonGeo = GeoVector(Body.Moon, astroTime, false);
    const moonLon = this.calculateEclipticLongitude(moonGeo);

    // Calculate phase angle (angle between Sun, Earth, and Moon)
    const phaseAngle = MoonPhase(astroTime);

    // Calculate illumination percentage
    const illum = Illumination(Body.Moon, astroTime);
    const illumination = Math.round(illum.phase_fraction * 100);

    return {
      longitude: moonLon,
      sign: this.getZodiacSign(moonLon),
      degrees: this.getDegreesInSign(moonLon),
      phase: this.getMoonPhaseName(phaseAngle),
      illumination,
    };
  }

  /**
   * Calculate ecliptic longitude from geocentric vector
   * @param geoVector Geocentric position vector
   * @returns Ecliptic longitude in degrees (0-360)
   */
  private calculateEclipticLongitude(geoVector: Astronomy.Vector): number {
    // Convert Cartesian coordinates to ecliptic longitude
    const x = geoVector.x;
    const y = geoVector.y;

    // Calculate longitude in radians, then convert to degrees
    let lon = Math.atan2(y, x) * (180 / Math.PI);

    // Normalize to 0-360 range
    if (lon < 0) lon += 360;

    return lon;
  }

  /**
   * Detect if a planet is in retrograde motion
   * Retrograde = apparent backward motion from Earth's perspective
   * Detected by comparing longitude over a short time period
   *
   * @param body Planet to check
   * @param astroTime Current time
   * @returns True if planet is in retrograde
   */
  private isRetrograde(body: Astronomy.Body, astroTime: Astronomy.AstroTime): boolean {
    try {
      // Get current position
      const currentGeo = GeoVector(body, astroTime, false);
      const currentLon = this.calculateEclipticLongitude(currentGeo);

      // Get position 1 day ahead
      const futureTime = astroTime.AddDays(1);
      const futureGeo = GeoVector(body, futureTime, false);
      const futureLon = this.calculateEclipticLongitude(futureGeo);

      // Calculate change in longitude
      let deltaLon = futureLon - currentLon;

      // Handle wraparound at 0/360 degrees
      if (deltaLon > 180) deltaLon -= 360;
      if (deltaLon < -180) deltaLon += 360;

      // Retrograde if longitude decreases (negative delta)
      return deltaLon < 0;
    } catch (error) {
      // If detection fails, assume direct motion
      return false;
    }
  }

  /**
   * Calculate the shortest angular distance between two longitudes
   * @param lon1 First longitude
   * @param lon2 Second longitude
   * @returns Shortest angle between them (0-180°)
   */
  private getAngularDistance(lon1: number, lon2: number): number {
    let diff = Math.abs(lon2 - lon1);

    // Take shorter path around the circle
    if (diff > 180) diff = 360 - diff;

    return diff;
  }

  /**
   * Calculate aspects between all planetary pairs
   * @param positions Object with planet names and longitudes
   * @returns Array of detected aspects
   */
  private calculateAspects(positions: Record<string, number>): PlanetaryAspect[] {
    const aspects: PlanetaryAspect[] = [];
    const planetNames = Object.keys(positions);

    // Check all planet pairs
    for (let i = 0; i < planetNames.length; i++) {
      for (let j = i + 1; j < planetNames.length; j++) {
        const planet1 = planetNames[i];
        const planet2 = planetNames[j];
        const lon1 = positions[planet1];
        const lon2 = positions[planet2];

        const angle = this.getAngularDistance(lon1, lon2);

        // Check if angle matches any aspect within orb
        for (const aspectDef of this.ASPECTS) {
          const orb = Math.abs(angle - aspectDef.angle);

          if (orb <= aspectDef.orb) {
            aspects.push({
              planet1,
              planet2,
              type: aspectDef.type,
              angle,
              orb,
            });
            break; // Only record one aspect per pair
          }
        }
      }
    }

    return aspects;
  }
}
