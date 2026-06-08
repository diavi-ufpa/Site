export const AVALIA_DATA_SOURCE = {
  DATABASE: 'database',
  LEGACY_API: 'legacy-api',
};

export const AVALIA_DATA_SOURCE_ROUTES = {
  [AVALIA_DATA_SOURCE.DATABASE]: '/api/avalia-db',
  [AVALIA_DATA_SOURCE.LEGACY_API]: '/api/dashboard-cache',
};

export const DEFAULT_AVALIA_DATA_SOURCE = AVALIA_DATA_SOURCE.LEGACY_API;

export function normalizeAvaliaFilterValue(value, fallback = 'todos') {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  if (!s) return fallback;

  const lower = s.toLowerCase();
  if (
    ['all', 'todos', 'todas', 'todo', 'qualquer', 'none', 'null', 'undefined'].includes(
      lower
    )
  ) {
    return 'todos';
  }

  return s;
}

export function getAvaliaDataSourceRoute(source = DEFAULT_AVALIA_DATA_SOURCE) {
  return AVALIA_DATA_SOURCE_ROUTES[source] ?? AVALIA_DATA_SOURCE_ROUTES[DEFAULT_AVALIA_DATA_SOURCE];
}

export function buildAvaliaApiUrl(endpoint, filters = {}, options = {}) {
  const qs = new URLSearchParams();
  qs.set('endpoint', endpoint);

  if (options.fresh) qs.set('fresh', '1');
  if (filters?.ano) qs.set('ano', String(filters.ano).trim());

  if (endpoint !== '/filters') {
    qs.set('campus', normalizeAvaliaFilterValue(filters?.campus, 'todos'));
    qs.set('curso', normalizeAvaliaFilterValue(filters?.curso, 'todos'));
  } else {
    if (filters?.campus) {
      qs.set('campus', normalizeAvaliaFilterValue(filters.campus, 'todos'));
    }
    if (filters?.curso) {
      qs.set('curso', normalizeAvaliaFilterValue(filters.curso, 'todos'));
    }
  }

  return `${getAvaliaDataSourceRoute(options.source)}?${qs.toString()}`;
}

export function avaliaSourceFromDatabaseFlag(consultarBanco = false) {
  return consultarBanco ? AVALIA_DATA_SOURCE.DATABASE : DEFAULT_AVALIA_DATA_SOURCE;
}
