/**
 * Structured Logger
 *
 * Production: JSON lines (parseable by log aggregators)
 * Development: human-readable colored output
 *
 * API is backwards-compatible with the previous simple logger:
 *   debug.log(...)  — dev-only, suppressed in production
 *   logger.info(...) — always logs
 *   logger.warn(...) — always logs
 *   logger.error(...) — always logs
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Format a structured log entry.
 * In production: single-line JSON for log aggregators.
 * In development: human-readable with the original args.
 */
function formatLog(level: LogLevel, args: unknown[]): void {
  if (isProduction) {
    // Extract a service tag if the first arg looks like "[ServiceName] ..."
    let service: string | undefined;
    let message: string;
    const rest: Record<string, unknown> = {};

    const first = args[0];
    if (typeof first === 'string') {
      const tagMatch = first.match(/^\[([^\]]+)\]\s*(.*)/);
      if (tagMatch) {
        service = tagMatch[1];
        message = tagMatch[2];
      } else {
        message = first;
      }
      // Collect remaining args as context
      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg && typeof arg === 'object' && !Array.isArray(arg) && !(arg instanceof Error)) {
          Object.assign(rest, arg);
        } else if (arg instanceof Error) {
          rest.error = arg.message;
          rest.stack = arg.stack;
        } else if (i === 1 && typeof arg === 'string' && args.length === 2) {
          // Common pattern: logger.info('[Service] message', value)
          message = `${message} ${arg}`;
        } else {
          rest[`arg${i}`] = arg;
        }
      }
    } else {
      message = String(first);
    }

    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      msg: message,
    };
    if (service) entry.svc = service;
    if (Object.keys(rest).length > 0) Object.assign(entry, rest);

    const line = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  } else {
    // Development: keep the original colorized output
    const consoleFn =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(...args);
  }
}

/**
 * Debug logger — only logs in development.
 * Use for verbose debugging output that shouldn't appear in production.
 */
export const debug = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      formatLog('debug', args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      formatLog('debug', args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      formatLog('warn', args);
    }
  },
};

/**
 * Production logger — always logs.
 * Use for important operational messages that should appear in production.
 */
export const logger = {
  info: (...args: unknown[]): void => {
    formatLog('info', args);
  },
  warn: (...args: unknown[]): void => {
    formatLog('warn', args);
  },
  error: (...args: unknown[]): void => {
    formatLog('error', args);
  },
};

export default { debug, logger };
