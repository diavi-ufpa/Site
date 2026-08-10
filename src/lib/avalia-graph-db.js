import { Pool } from 'pg';

const globalForGraphDb = globalThis;
const GRAPH_DATABASE_URL_ENV = 'AVALIA_PRESENCIAL_GRAPH_DATABASE_URL';
const DEFAULT_QUERY_TIMEOUT_MS = 15000;

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
    url.searchParams.delete('channel_binding');
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const connectionString = sanitizeDatabaseUrl(process.env[GRAPH_DATABASE_URL_ENV]);
const queryTimeoutMillis = positiveInteger(
  process.env.AVALIA_PRESENCIAL_GRAPH_QUERY_TIMEOUT_MS,
  DEFAULT_QUERY_TIMEOUT_MS
);

export function isAvaliaGraphDatabaseConfigured() {
  return Boolean(connectionString);
}

export function assertAvaliaGraphDatabaseConfigured() {
  if (!connectionString) {
    const error = new Error(`${GRAPH_DATABASE_URL_ENV} não configurada no ambiente server-side.`);
    error.status = 503;
    throw error;
  }
}

export const avaliaGraphPool =
  globalForGraphDb.__avaliaGraphPool ??
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

if (!globalForGraphDb.__avaliaGraphPool) {
  globalForGraphDb.__avaliaGraphPool = avaliaGraphPool;
  avaliaGraphPool.on('error', (error) => {
    console.error('[avalia-graph-db] pool error:', error);
  });
}

export async function queryAvaliaGraph(sql, params = []) {
  assertAvaliaGraphDatabaseConfigured();
  return avaliaGraphPool.query(sql, params);
}
