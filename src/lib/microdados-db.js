import { Pool } from 'pg';

const globalForDb = globalThis;
const MICRODADOS_DATABASE_URL_ENV = 'MICRODADOS_DATABASE_URL';

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

const connectionString = sanitizeDatabaseUrl(process.env[MICRODADOS_DATABASE_URL_ENV]);

export function isMicrodadosDatabaseConfigured() {
  return Boolean(connectionString);
}

export function assertMicrodadosDatabaseConfigured() {
  if (!connectionString) {
    const error = new Error(`${MICRODADOS_DATABASE_URL_ENV} nao configurada no ambiente server-side.`);
    error.status = 503;
    throw error;
  }
}

export const microdadosPool =
  globalForDb.__microdadosPool ??
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

if (!globalForDb.__microdadosPool) {
  globalForDb.__microdadosPool = microdadosPool;

  microdadosPool.on('error', (err) => {
    console.error('[microdados-db] pool error:', err);
  });
}

export async function queryMicrodados(sql, params = []) {
  assertMicrodadosDatabaseConfigured();
  return microdadosPool.query(sql, params);
}
