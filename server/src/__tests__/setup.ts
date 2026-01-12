/**
 * Test Setup
 * Global test configuration and utilities
 */

import { beforeEach, vi } from 'vitest';

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Suppress console output during tests (optional)
// Uncomment to silence logs during test runs
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});
