import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { logger } from '../lib/logger.js';

// Prevent multiple instances during development hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
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

// Set statement_timeout on every new connection so queries can't hang forever.
// Without this, a query on a stale/dead TCP connection waits until OS-level
// keepalive detects the failure (~11 minutes on Linux defaults).
pool.on('connect', client => {
  client.query('SET statement_timeout = 15000').catch(() => {});
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
