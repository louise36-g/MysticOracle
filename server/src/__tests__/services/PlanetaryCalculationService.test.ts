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
});
