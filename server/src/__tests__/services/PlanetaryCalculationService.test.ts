import { describe, it, expect } from 'vitest';
import { PlanetaryCalculationService } from '../../services/planetaryCalculationService.js';

describe('PlanetaryCalculationService', () => {
  const service = new PlanetaryCalculationService();

  describe('calculatePlanetaryData', () => {
    it('should throw not implemented error', async () => {
      const date = new Date('2026-01-16T12:00:00Z');
      await expect(service.calculatePlanetaryData(date)).rejects.toThrow('Not implemented');
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
