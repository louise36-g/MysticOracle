import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { logger } from '../lib/logger.js';

// Prevent multiple instances during development hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Append statement_timeout to the connection string so PostgreSQL enforces it
// at the session level. This prevents queries from hanging on stale/dead TCP
// connections (~11 min OS-level keepalive wait). Using connection options instead
// of pool.on('connect') avoids the deprecated "query during query" conflict
// with PrismaPg adapter.
const dbUrl = new URL(process.env.DATABASE_URL || '');
dbUrl.searchParams.set('statement_timeout', '15000');

const pool = new pg.Pool({
  connectionString: dbUrl.toString(),
  ssl: { rejectUnauthorized: false },
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,
  // Prevent Render from silently dropping idle connections
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Log pool errors — prevents silent connection leaks.
// Without this handler, a disconnected client stays in the pool and
// causes subsequent queries to hang.
pool.on('error', err => {
  logger.error('[DB Pool] Unexpected error on idle client:', err.message);
});

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Keep the connection pool warm — Render suspends idle connections,
// causing 3+ second cold starts on the first query after inactivity.
// A lightweight ping every 30 seconds prevents this.
// Also validates connections are still alive (dead ones trigger pool 'error' event).
setInterval(() => {
  pool.query('SELECT 1').catch(err => {
    logger.warn('[DB Pool] Keep-alive ping failed:', err.message);
  });
}, 30_000);

export default prisma;
