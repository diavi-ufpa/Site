import { Pool } from 'pg';

const globalForDb = globalThis;

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

const connectionString = sanitizeDatabaseUrl(process.env.DATABASE_URL);

export function assertDatabaseConfigured() {
  if (!connectionString) {
    const error = new Error('DATABASE_URL nao configurada no ambiente server-side.');
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
    query_timeout: 15000,
    statement_timeout: 15000,
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
