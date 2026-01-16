import { describe, it, expect } from 'vitest';
import { PlanetaryCalculationService } from '../../services/planetaryCalculationService.js';

describe('PlanetaryCalculationService', () => {
  const service = new PlanetaryCalculationService();

  describe('calculatePlanetaryData', () => {
    it('should calculate Sun position for January 16, 2026', async () => {
      const date = new Date('2026-01-16T12:00:00Z');
      const data = await service.calculatePlanetaryData(date);

      // Sun should be in Capricorn in mid-January
      expect(data.sun.sign).toBe('Capricorn');
      // Approximate range - Sun moves ~1° per day
      expect(data.sun.longitude).toBeGreaterThan(270); // After Capricorn start
      expect(data.sun.longitude).toBeLessThan(300); // Before Aquarius
    });

    it('should calculate positions for all major planets', async () => {
      const date = new Date('2026-01-16T12:00:00Z');
      const data = await service.calculatePlanetaryData(date);

      // Verify all planets have valid data (not stub values)
      expect(data.mercury.sign).toBeTruthy();
      expect(data.venus.sign).toBeTruthy();
      expect(data.mars.sign).toBeTruthy();
      expect(data.jupiter.sign).toBeTruthy();
      expect(data.saturn.sign).toBeTruthy();

      // Verify longitudes are in valid range (not 0 which is stub)
      expect(data.mercury.longitude).toBeGreaterThanOrEqual(0);
      expect(data.mercury.longitude).toBeLessThan(360);
      expect(data.mercury.longitude).not.toBe(0); // Not stub value

      expect(data.venus.longitude).toBeGreaterThanOrEqual(0);
      expect(data.venus.longitude).toBeLessThan(360);
      expect(data.venus.longitude).not.toBe(0); // Not stub value

      expect(data.mars.longitude).not.toBe(0); // Not stub value
      expect(data.jupiter.longitude).not.toBe(0); // Not stub value
      expect(data.saturn.longitude).not.toBe(0); // Not stub value
    });
  });

  describe('formatForPrompt', () => {
    it('should throw not implemented error', () => {
      const mockData = {
        date: new Date(),
        sun: { longitude: 0, sign: 'Aries', degrees: 0 },
        moon: { longitude: 0, sign: 'Aries', degrees: 0, phase: 'New Moon', illumination: 0 },
        mercury: { longitude: 0, sign: 'Aries', degrees: 0 },
        venus: { longitude: 0, sign: 'Aries', degrees: 0 },
        mars: { longitude: 0, sign: 'Aries', degrees: 0 },
        jupiter: { longitude: 0, sign: 'Aries', degrees: 0 },
        saturn: { longitude: 0, sign: 'Aries', degrees: 0 },
        aspects: [],
      };
      expect(() => service.formatForPrompt(mockData)).toThrow('Not implemented');
    });
  });

  describe('calculatePlanetaryData - Moon', () => {
    it('should calculate Moon position and phase', async () => {
      const date = new Date('2026-01-16T12:00:00Z');
      const data = await service.calculatePlanetaryData(date);

      // Moon should have valid position
      expect(data.moon.sign).toBeTruthy();
      expect(data.moon.longitude).toBeGreaterThanOrEqual(0);
      expect(data.moon.longitude).toBeLessThan(360);

      // Moon should have phase information
      expect(data.moon.phase).not.toBe('Unknown');
      expect(data.moon.illumination).toBeGreaterThanOrEqual(0);
      expect(data.moon.illumination).toBeLessThanOrEqual(100);
    });

    it('should identify Moon phase correctly', async () => {
      const date = new Date('2026-01-16T12:00:00Z');
      const data = await service.calculatePlanetaryData(date);

      // Phase should be one of the valid values
      const validPhases = [
        'New Moon',
        'Waxing Crescent',
        'First Quarter',
        'Waxing Gibbous',
        'Full Moon',
        'Waning Gibbous',
        'Last Quarter',
        'Waning Crescent',
      ];
      expect(validPhases).toContain(data.moon.phase);
    });
  });

  describe('isRetrograde', () => {
    it('should detect retrograde status for planets', async () => {
      const date = new Date('2026-01-16T12:00:00Z');
      const data = await service.calculatePlanetaryData(date);

      // Verify retrograde is a boolean for inner planets
      expect(typeof data.mercury.retrograde).toBe('boolean');
      expect(typeof data.venus.retrograde).toBe('boolean');
      expect(typeof data.mars.retrograde).toBe('boolean');
      expect(typeof data.jupiter.retrograde).toBe('boolean');
      expect(typeof data.saturn.retrograde).toBe('boolean');
    });
  });

  describe('calculateAspects', () => {
    it('should detect conjunction when planets are close together', () => {
      const planets = {
        sun: 100,    // 100°
        moon: 105,   // 105° - 5° orb (conjunction)
      };

      const aspects = service['calculateAspects'](planets);

      const conjunction = aspects.find(
        a => a.planet1 === 'sun' && a.planet2 === 'moon' && a.type === 'conjunction'
      );
      expect(conjunction).toBeDefined();
      expect(conjunction?.orb).toBeLessThan(8); // Within orb tolerance
    });

    it('should detect opposition (180° apart)', () => {
      const planets = {
        sun: 0,      // 0°
        mars: 180,   // 180° - exact opposition
      };

      const aspects = service['calculateAspects'](planets);

      const opposition = aspects.find(
        a => a.type === 'opposition'
      );
      expect(opposition).toBeDefined();
      expect(opposition?.angle).toBeCloseTo(180, 1);
    });

    it('should detect trine (120° apart)', () => {
      const planets = {
        venus: 0,
        jupiter: 120,
      };

      const aspects = service['calculateAspects'](planets);

      const trine = aspects.find(a => a.type === 'trine');
      expect(trine).toBeDefined();
    });

    it('should not detect aspects outside orb tolerance', () => {
      const planets = {
        sun: 0,
        moon: 50, // No major aspect at 50°
      };

      const aspects = service['calculateAspects'](planets);
      expect(aspects.length).toBe(0);
    });
  });

  describe('getZodiacSign', () => {
    it('should return Aries for longitude 0-30°', () => {
      expect(service['getZodiacSign'](0)).toBe('Aries');
      expect(service['getZodiacSign'](15)).toBe('Aries');
      expect(service['getZodiacSign'](29.9)).toBe('Aries');
    });

    it('should return Taurus for longitude 30-60°', () => {
      expect(service['getZodiacSign'](30)).toBe('Taurus');
      expect(service['getZodiacSign'](45)).toBe('Taurus');
      expect(service['getZodiacSign'](59.9)).toBe('Taurus');
    });

    it('should return Gemini for longitude 60-90°', () => {
      expect(service['getZodiacSign'](60)).toBe('Gemini');
      expect(service['getZodiacSign'](75)).toBe('Gemini');
      expect(service['getZodiacSign'](89.9)).toBe('Gemini');
    });

    it('should return Cancer for longitude 90-120°', () => {
      expect(service['getZodiacSign'](90)).toBe('Cancer');
      expect(service['getZodiacSign'](105)).toBe('Cancer');
      expect(service['getZodiacSign'](119.9)).toBe('Cancer');
    });

    it('should return Leo for longitude 120-150°', () => {
      expect(service['getZodiacSign'](120)).toBe('Leo');
      expect(service['getZodiacSign'](135)).toBe('Leo');
      expect(service['getZodiacSign'](149.9)).toBe('Leo');
    });

    it('should return Virgo for longitude 150-180°', () => {
      expect(service['getZodiacSign'](150)).toBe('Virgo');
      expect(service['getZodiacSign'](165)).toBe('Virgo');
      expect(service['getZodiacSign'](179.9)).toBe('Virgo');
    });

    it('should return Libra for longitude 180-210°', () => {
      expect(service['getZodiacSign'](180)).toBe('Libra');
      expect(service['getZodiacSign'](195)).toBe('Libra');
      expect(service['getZodiacSign'](209.9)).toBe('Libra');
    });

    it('should return Scorpio for longitude 210-240°', () => {
      expect(service['getZodiacSign'](210)).toBe('Scorpio');
      expect(service['getZodiacSign'](225)).toBe('Scorpio');
      expect(service['getZodiacSign'](239.9)).toBe('Scorpio');
    });

    it('should return Sagittarius for longitude 240-270°', () => {
      expect(service['getZodiacSign'](240)).toBe('Sagittarius');
      expect(service['getZodiacSign'](255)).toBe('Sagittarius');
      expect(service['getZodiacSign'](269.9)).toBe('Sagittarius');
    });

    it('should return Capricorn for longitude 270-300°', () => {
      expect(service['getZodiacSign'](270)).toBe('Capricorn');
      expect(service['getZodiacSign'](285)).toBe('Capricorn');
      expect(service['getZodiacSign'](299.9)).toBe('Capricorn');
    });

    it('should return Aquarius for longitude 300-330°', () => {
      expect(service['getZodiacSign'](300)).toBe('Aquarius');
      expect(service['getZodiacSign'](315)).toBe('Aquarius');
      expect(service['getZodiacSign'](329.9)).toBe('Aquarius');
    });

    it('should return Pisces for longitude 330-360°', () => {
      expect(service['getZodiacSign'](330)).toBe('Pisces');
      expect(service['getZodiacSign'](345)).toBe('Pisces');
      expect(service['getZodiacSign'](359.9)).toBe('Pisces');
    });

    it('should handle longitude exactly at sign boundaries', () => {
      expect(service['getZodiacSign'](30)).toBe('Taurus');
      expect(service['getZodiacSign'](60)).toBe('Gemini');
      expect(service['getZodiacSign'](90)).toBe('Cancer');
    });
  });
});
