/**
 * Simple Logger Utility
 * Suppresses debug logs in production while maintaining important logs
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Debug logger - only logs in development
 * Use for verbose debugging output that shouldn't appear in production
 */
export const debug = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
};

/**
 * Production logger - always logs
 * Use for important operational messages that should appear in production
 */
export const logger = {
  info: (...args: unknown[]): void => {
    console.log(...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};

export default { debug, logger };
