import { queryAvaliaApi } from '@/lib/neon-api';

export const dynamic = 'force-dynamic';

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeParam(value, fallback = 'todos') {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;

  const normalized = normalizeText(raw);
  if (['all', 'todos', 'todas', 'todo', 'qualquer', 'none', 'null'].includes(normalized)) {
    return 'todos';
  }

  return raw;
}

function pick(row, keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return null;
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

function matchesFilter(row, keys, selected) {
  if (!selected || selected === 'todos') return true;

  const rowValue = pick(row, keys);
  if (rowValue === null || rowValue === undefined || String(rowValue).trim() === '') {
    return true;
  }

  return normalizeText(rowValue) === normalizeText(selected);
}

function applyFilters(rows, { ano, campus, curso }) {
  return rows.filter((row) => (
    matchesFilter(row, ['ano', 'periodo', 'periodo_letivo', 'periodo_nome'], ano) &&
    matchesFilter(row, ['campus', 'nome_campus', 'unidade'], campus) &&
    matchesFilter(row, ['curso', 'nome_curso'], curso)
  ));
}

function rowsFromFacet(rows, facetNames) {
  const wanted = facetNames.map(normalizeText);

  return rows
    .filter((row) => wanted.includes(normalizeText(row?.facet)))
    .map((row) => row?.valor)
    .filter((value) => value !== null && value !== undefined);
}

async function getFilterRows() {
  const { rows } = await queryAvaliaApi('SELECT * FROM api.filtros()');
  return rows;
}

async function getPeriodRows() {
  try {
    const { rows } = await queryAvaliaApi('SELECT * FROM api.periodos');
    return rows;
  } catch (err) {
    console.error('[avalia-db] periodos fallback error:', err);
    return [];
  }
}

async function getResumoRows(filters) {
  const { rows } = await queryAvaliaApi('SELECT * FROM api.resumo()');
  return applyFilters(rows, filters);
}

async function getLikertRows(filters) {
  const { rows } = await queryAvaliaApi('SELECT * FROM api.likert_distribuicao()');
  return applyFilters(rows, filters);
}

function toFiltersPayload(filterRows, periodRows = []) {
  const anosFromFacets = rowsFromFacet(filterRows, ['ano', 'periodo', 'periodos']);
  const anosFromPeriods = periodRows.map((row) =>
    pick(row, ['ano', 'periodo', 'periodo_letivo', 'periodo_nome', 'valor'])
  );

  return {
    anos: uniqueSorted([...anosFromFacets, ...anosFromPeriods]),
    campus: uniqueSorted(rowsFromFacet(filterRows, ['campus', 'campi'])),
    cursos: uniqueSorted(rowsFromFacet(filterRows, ['curso', 'cursos'])),
    raw: filterRows,
  };
}

function toCampusPayload(filterRows, periodRows) {
  const filters = toFiltersPayload(filterRows, periodRows);
  return {
    anos: filters.anos,
    campus: filters.campus,
  };
}

function toCoursePayload(filterRows) {
  return {
    cursos: uniqueSorted(rowsFromFacet(filterRows, ['curso', 'cursos'])),
  };
}

function getNumber(row, keys) {
  const value = pick(row, keys);
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function summarizeRows(rows) {
  if (rows.length === 1 && Object.prototype.hasOwnProperty.call(rows[0], 'total_respondentes')) {
    return rows[0];
  }

  const totalFromRows = rows
    .map((row) => getNumber(row, ['total_respondentes', 'respondentes', 'n', 'total', 'qtd']))
    .filter((value) => value !== null);

  const total = totalFromRows.length
    ? totalFromRows.reduce((sum, value) => sum + value, 0)
    : rows.length;

  const rowsWithCampusMedia = rows
    .map((row) => ({
      campus: pick(row, ['campus', 'nome_campus', 'unidade']),
      media: getNumber(row, ['media_geral', 'media', 'mean', 'valor']),
    }))
    .filter((row) => row.campus && row.media !== null);

  const byCampus = new Map();
  for (const row of rowsWithCampusMedia) {
    const key = normalizeText(row.campus);
    const current = byCampus.get(key) ?? { campus: row.campus, soma: 0, n: 0 };
    current.soma += row.media;
    current.n += 1;
    byCampus.set(key, current);
  }

  const campusStats = [...byCampus.values()].map((row) => ({
    campus: row.campus,
    media: row.n ? row.soma / row.n : null,
  }));

  campusStats.sort((a, b) => Number(b.media ?? -Infinity) - Number(a.media ?? -Infinity));

  return {
    total_respondentes: total,
    campus_melhor_avaliado: campusStats[0] ? [campusStats[0]] : [],
    campus_pior_avaliado: campusStats.at(-1) ? [campusStats.at(-1)] : [],
    rows,
  };
}

function json(payload, init = {}) {
  return Response.json(payload, {
    ...init,
    headers: {
      'X-Data-Source': 'neon-api',
      ...(init.headers ?? {}),
    },
  });
}

async function routeEndpoint(endpoint, filters) {
  if (endpoint === '/ping') {
    const { rows } = await queryAvaliaApi('SELECT * FROM api.ping LIMIT 1');
    return rows[0] ?? { ok: true };
  }

  if (endpoint === '/periodos') {
    const { rows } = await queryAvaliaApi('SELECT * FROM api.periodos');
    return rows;
  }

  if (endpoint === '/itens') {
    const { rows } = await queryAvaliaApi('SELECT * FROM api.itens');
    return rows;
  }

  if (endpoint === '/ofertas') {
    const { rows } = await queryAvaliaApi('SELECT * FROM api.ofertas');
    return rows;
  }

  if (endpoint === '/filters') {
    const [filterRows, periodRows] = await Promise.all([getFilterRows(), getPeriodRows()]);
    return toFiltersPayload(filterRows, periodRows);
  }

  if (endpoint === '/filters/campus') {
    const [filterRows, periodRows] = await Promise.all([getFilterRows(), getPeriodRows()]);
    return toCampusPayload(filterRows, periodRows);
  }

  if (endpoint === '/filters/cursos') {
    const filterRows = await getFilterRows();
    return toCoursePayload(filterRows);
  }

  if (endpoint === '/resumo' || endpoint === '/discente/geral/summary') {
    const rows = await getResumoRows(filters);
    return summarizeRows(rows);
  }

  if (endpoint.includes('/proporcoes') || endpoint === '/likert-distribuicao') {
    return getLikertRows(filters);
  }

  if (endpoint.includes('/medias')) {
    return getResumoRows(filters);
  }

  return [];
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return json({ error: 'Parametro "endpoint" e obrigatorio.' }, { status: 400 });
    }

    const filters = {
      ano: normalizeParam(searchParams.get('ano'), null),
      campus: normalizeParam(searchParams.get('campus'), 'todos'),
      curso: normalizeParam(searchParams.get('curso'), 'todos'),
    };

    const payload = await routeEndpoint(endpoint, filters);
    return json(payload);
  } catch (err) {
    console.error('[avalia-db] fatal:', err);

    return json(
      {
        error: 'Erro ao consultar o banco Neon.',
        details: err?.message ?? 'Erro desconhecido',
      },
      { status: err?.status ?? 500 }
    );
  }
}
