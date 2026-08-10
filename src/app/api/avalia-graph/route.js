import { queryAvaliaGraphEndpoint } from '@/features/avalia/server/graph-results-repository';
import { isAvaliaGraphDatabaseConfigured } from '@/lib/avalia-graph-db';
import { requireIdentityUser } from '@/lib/require-identity-user';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 300;
const globalForGraphRoute = globalThis;
const responseCache = globalForGraphRoute.__avaliaGraphResponseCache ?? new Map();
const inflightRequests = globalForGraphRoute.__avaliaGraphInflightRequests ?? new Map();

if (!globalForGraphRoute.__avaliaGraphResponseCache) {
  globalForGraphRoute.__avaliaGraphResponseCache = responseCache;
}
if (!globalForGraphRoute.__avaliaGraphInflightRequests) {
  globalForGraphRoute.__avaliaGraphInflightRequests = inflightRequests;
}

function normalizeParam(value, fallback = 'todos') {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  return ['all', 'todos', 'todas', 'todo', 'qualquer', 'none', 'null'].includes(
    raw.toLowerCase()
  )
    ? 'todos'
    : raw;
}

function json(payload, init = {}) {
  return Response.json(payload, {
    ...init,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Data-Source': 'avalia-graph-results',
      ...(init.headers ?? {}),
    },
  });
}

function cacheKey(endpoint, filters) {
  return JSON.stringify({ endpoint, ...filters });
}

function storeCached(key, payload) {
  responseCache.set(key, { payload, updatedAt: Date.now() });
  while (responseCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey === undefined) break;
    responseCache.delete(oldestKey);
  }
}

async function queryCached(endpoint, filters) {
  const key = cacheKey(endpoint, filters);
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) return cached.payload;
  if (inflightRequests.has(key)) return inflightRequests.get(key);

  const request = queryAvaliaGraphEndpoint(endpoint, filters)
    .then((payload) => {
      storeCached(key, payload);
      return payload;
    })
    .finally(() => inflightRequests.delete(key));

  inflightRequests.set(key, request);
  return request;
}

export async function GET(request) {
  let endpoint = null;
  let filters = null;

  try {
    const auth = await requireIdentityUser(request);
    if (!auth.ok) return json({ error: auth.error }, { status: auth.status });

    if (!isAvaliaGraphDatabaseConfigured()) {
      return json(
        {
          error: 'Banco dos gráficos indisponível.',
          details:
            'AVALIA_PRESENCIAL_GRAPH_DATABASE_URL não está configurada no ambiente server-side.',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    endpoint = searchParams.get('endpoint');
    if (!endpoint) {
      return json({ error: 'Parâmetro "endpoint" é obrigatório.' }, { status: 400 });
    }

    filters = {
      ano: normalizeParam(searchParams.get('ano'), null),
      campus: normalizeParam(searchParams.get('campus'), 'todos'),
      curso: normalizeParam(searchParams.get('curso'), 'todos'),
    };

    const payload = await queryCached(endpoint, filters);
    if (payload === null) {
      return json({ error: `Endpoint não suportado: ${endpoint}` }, { status: 404 });
    }
    return json(payload);
  } catch (error) {
    console.error('[avalia-graph] fatal:', {
      endpoint,
      filters,
      message: error?.message,
      stack: error?.stack,
    });
    return json(
      {
        error: 'Erro ao consultar o banco dos gráficos.',
        details: error?.message ?? 'Erro desconhecido',
      },
      { status: error?.status ?? 500 }
    );
  }
}
