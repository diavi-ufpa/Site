import { Pool } from 'pg';

const globalForDb = globalThis;
const AVALIA_PRESENCIAL_DATABASE_URL_ENV = 'AVALIAPRESENCIAL_DATABASE_URL';
const DEFAULT_QUERY_TIMEOUT_MS = 45000;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sanitizeDatabaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('sslcert');
    url.searchParams.delete('sslkey');
    url.searchParams.delete('sslrootcert');
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const connectionString = sanitizeDatabaseUrl(process.env[AVALIA_PRESENCIAL_DATABASE_URL_ENV]);
const queryTimeoutMillis = positiveInteger(
  process.env.AVALIAPRESENCIAL_QUERY_TIMEOUT_MS,
  DEFAULT_QUERY_TIMEOUT_MS
);

export function isAvaliaApiDatabaseConfigured() {
  return Boolean(connectionString);
}

export function assertDatabaseConfigured() {
  if (!connectionString) {
    const error = new Error(`${AVALIA_PRESENCIAL_DATABASE_URL_ENV} nao configurada no ambiente server-side.`);
    error.status = 503;
    throw error;
  }
}

export const avaliaApiPool =
  globalForDb.__avaliaApiPool ??
  new Pool({
    connectionString,
    ssl: connectionString ? { rejectUnauthorized: false } : undefined,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 12000,
    query_timeout: queryTimeoutMillis,
    statement_timeout: queryTimeoutMillis,
    allowExitOnIdle: true,
  });

if (!globalForDb.__avaliaApiPool) {
  globalForDb.__avaliaApiPool = avaliaApiPool;

  avaliaApiPool.on('error', (err) => {
    console.error('[neon-api] pool error:', err);
  });
}

export async function queryAvaliaApi(sql, params = []) {
  assertDatabaseConfigured();
  return avaliaApiPool.query(sql, params);
}
