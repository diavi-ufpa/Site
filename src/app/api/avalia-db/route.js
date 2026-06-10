import { queryAvaliaApi } from '@/lib/neon-api';

export const dynamic = 'force-dynamic';

const SCHEMA = 'avalia';

const CONCEITOS = {
  4: 'Excelente',
  3: 'Bom',
  2: 'Regular',
  1: 'Insuficiente',
};

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

function toNullableParam(value) {
  if (!value || value === 'todos') return null;
  return value;
}

function parsePeriodoParam(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return { ano: null, periodo: null };

  const match = raw.match(/^(\d{4})(?:[-/.](\d+))?$/);
  if (!match) return { ano: Number(raw) || null, periodo: null };

  return {
    ano: Number(match[1]) || null,
    periodo: match[2] ? Number(match[2]) || null : null,
  };
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

function endpointInstrumento(endpoint) {
  if (endpoint.startsWith('/docente') || endpoint.startsWith('/docente_base')) {
    return 'DOC';
  }
  return 'DISC';
}

function endpointLevel(endpoint) {
  if (endpoint.includes('/dimensoes/')) {
    return { nivel: 'eixo', outputKey: 'dimensao', labelField: 'eixo' };
  }

  if (endpoint.includes('/subdimensoes/')) {
    return { nivel: 'subdimensao', outputKey: 'subdimensao', labelField: 'subdimensao' };
  }

  return { nivel: 'item', outputKey: 'item', labelField: 'codigo_item' };
}

function endpointLikertOptions(endpoint) {
  const options = {
    instrumento: endpointInstrumento(endpoint),
    ...endpointLevel(endpoint),
  };

  if (endpoint.includes('/autoavaliacao/')) options.eixo = 'Autoavalia\u00e7\u00e3o';
  if (endpoint.includes('/acaodocente/')) options.eixo = 'A\u00e7\u00e3o Docente';
  if (endpoint.includes('/avaliacaoturma/')) options.eixo = 'Avalia\u00e7\u00e3o da Turma';
  if (endpoint.includes('/atitudeprofissional/')) options.subdimensao = 'Atitude Profissional';
  if (endpoint.includes('/gestaodidatica/')) options.subdimensao = 'Gest\u00e3o Did\u00e1tica';
  if (endpoint.includes('/processoavaliativo/')) options.subdimensao = 'Processo Avaliativo';
  if (endpoint.includes('/instalacoes/')) options.eixo = 'Instala\u00e7\u00f5es F\u00edsicas';

  return options;
}

function normalizeQuestionCode(codeLike) {
  const raw = String(codeLike ?? '').trim();
  if (!raw) return '';
  if (/^\d+\.\d+\.\d+$/.test(raw)) return raw;

  const dottedTwoPart = raw.match(/^(\d+)\.(\d{2})$/);
  if (dottedTwoPart) {
    const [, a, bc] = dottedTwoPart;
    return `${a}.${bc[0]}.${bc[1]}`;
  }

  const compact = raw.match(/^(\d{3,})$/);
  if (compact) {
    const s = compact[1];
    return s.length === 3
      ? `${s[0]}.${s[1]}.${s[2]}`
      : `${s.slice(0, -2)}.${s.slice(-2, -1)}.${s.slice(-1)}`;
  }

  return raw;
}

function sortRowsByOrder(rows, key) {
  return [...rows].sort((a, b) => (
    Number(a.ordem_bloco ?? 999) - Number(b.ordem_bloco ?? 999) ||
    Number(a.ordem_item ?? 999) - Number(b.ordem_item ?? 999) ||
    String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'pt-BR')
  ));
}

function normalizedSql(expr) {
  const accents = 'ÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇáàãâäéèêëíìîïóòõôöúùûüç';
  const plain = 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc';
  return `lower(translate(${expr}, '${accents}', '${plain}'))`;
}

function sqlFilters(filters = {}, options = {}) {
  const { ano, periodo } = parsePeriodoParam(filters.ano);
  const params = [];
  const where = [];

  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (ano) where.push(`v.ano = ${add(ano)}::smallint`);
  if (periodo) where.push(`v.periodo = ${add(periodo)}::smallint`);
  if (toNullableParam(filters.campus)) {
    where.push(`o.campus = ${add(toNullableParam(filters.campus))}::text`);
  }
  if (!options.ignoreCurso && toNullableParam(filters.curso)) {
    where.push(`o.curso = ${add(toNullableParam(filters.curso))}::text`);
  }
  if (options.tipoMedida) where.push(`v.tipo_medida = ${add(options.tipoMedida)}::${SCHEMA}.tipo_medida_t`);
  if (options.eixo) {
    where.push(`${normalizedSql('v.eixo')} = ${normalizedSql(`${add(options.eixo)}::text`)}`);
  }
  if (options.subdimensao) {
    where.push(`${normalizedSql('v.subdimensao')} = ${normalizedSql(`${add(options.subdimensao)}::text`)}`);
  }

  return {
    params,
    whereSql: where.length ? `WHERE ${where.join('\n        AND ')}` : '',
  };
}

function viewForInstrumento(instrumento) {
  return instrumento === 'DOC'
    ? `${SCHEMA}.vw_doc_resposta_long`
    : `${SCHEMA}.vw_disc_resposta_long`;
}

async function getFilterPayload(filters = {}) {
  const { ano, periodo } = parsePeriodoParam(filters.ano);
  const params = [];
  const where = [];

  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (ano) where.push(`p.ano = ${add(ano)}::smallint`);
  if (periodo) where.push(`p.periodo = ${add(periodo)}::smallint`);
  if (toNullableParam(filters.campus)) {
    where.push(`o.campus = ${add(toNullableParam(filters.campus))}::text`);
  }
  if (toNullableParam(filters.curso)) {
    where.push(`o.curso = ${add(toNullableParam(filters.curso))}::text`);
  }

  const { rows: periodoRows } = await queryAvaliaApi(
    `
      SELECT codigo_periodo
      FROM ${SCHEMA}.dim_periodo
      ORDER BY ano, periodo
    `
  );

  const { rows } = await queryAvaliaApi(
    `
      SELECT DISTINCT
        o.campus,
        o.curso
      FROM ${SCHEMA}.dim_oferta o
      JOIN ${SCHEMA}.dim_periodo p ON p.periodo_id = o.periodo_id
      ${where.length ? `WHERE ${where.join('\n        AND ')}` : ''}
      ORDER BY o.campus, o.curso
    `,
    params
  );

  return {
    anos: uniqueSorted(periodoRows.map((row) => row.codigo_periodo)),
    campus: uniqueSorted(rows.map((row) => row.campus)),
    cursos: uniqueSorted(rows.map((row) => row.curso)),
    raw: rows,
  };
}

async function getSummary(filters = {}) {
  const responseFilters = sqlFilters(filters, { tipoMedida: 'LIKERT' });
  const { rows: totalRows } = await queryAvaliaApi(
    `
      SELECT COUNT(DISTINCT v.matricula_hash)::int AS total_respondentes
      FROM ${SCHEMA}.vw_disc_resposta_long v
      JOIN ${SCHEMA}.dim_oferta o ON o.oferta_id = v.oferta_id
      ${responseFilters.whereSql}
    `,
    responseFilters.params
  );

  const campusFilters = sqlFilters(filters, { tipoMedida: 'LIKERT' });
  const { rows: campusRows } = await queryAvaliaApi(
    `
      SELECT
        o.campus,
        ROUND(AVG(v.valor)::numeric, 2)::float AS media
      FROM ${SCHEMA}.vw_disc_resposta_long v
      JOIN ${SCHEMA}.dim_oferta o ON o.oferta_id = v.oferta_id
      ${campusFilters.whereSql}
      GROUP BY o.campus
      HAVING COUNT(*) > 0
      ORDER BY media DESC, o.campus
    `,
    campusFilters.params
  );

  return {
    total_respondentes: Number(totalRows[0]?.total_respondentes ?? 0),
    campus_melhor_avaliado: campusRows[0] ? [campusRows[0]] : [],
    campus_pior_avaliado: campusRows.at(-1) ? [campusRows.at(-1)] : [],
  };
}

async function getMeanRows(filters = {}, options = {}) {
  const filtersSql = sqlFilters(filters, { ...options, tipoMedida: 'LIKERT' });
  const view = viewForInstrumento(options.instrumento);
  const labelExpr = options.labelField === 'codigo_item'
    ? 'v.codigo_item'
    : `COALESCE(v.${options.labelField}, v.eixo, v.codigo_item)`;

  const { rows } = await queryAvaliaApi(
    `
      SELECT
        ${labelExpr} AS label,
        MIN(v.ordem_bloco) AS ordem_bloco,
        MIN(v.ordem_item) AS ordem_item,
        ROUND(AVG(v.valor)::numeric, 2)::float AS media,
        COUNT(*)::int AS respondentes
      FROM ${view} v
      JOIN ${SCHEMA}.dim_oferta o ON o.oferta_id = v.oferta_id
      ${filtersSql.whereSql}
      GROUP BY ${labelExpr}
      ORDER BY ordem_bloco, ordem_item, label
    `,
    filtersSql.params
  );

  return sortRowsByOrder(
    rows.map((row) => ({
      [options.outputKey]: options.outputKey === 'item'
        ? normalizeQuestionCode(row.label)
        : row.label,
      media: Number(row.media ?? 0),
      respondentes: Number(row.respondentes ?? 0),
      ordem_bloco: row.ordem_bloco,
      ordem_item: row.ordem_item,
    })),
    options.outputKey
  );
}

async function getProportionRows(filters = {}, options = {}) {
  const filtersSql = sqlFilters(filters, { ...options, tipoMedida: 'LIKERT' });
  const view = viewForInstrumento(options.instrumento);
  const labelExpr = options.labelField === 'codigo_item'
    ? 'v.codigo_item'
    : `COALESCE(v.${options.labelField}, v.eixo, v.codigo_item)`;

  const { rows } = await queryAvaliaApi(
    `
      WITH base AS (
        SELECT
          ${labelExpr} AS label,
          v.valor::int AS valor_likert,
          MIN(v.ordem_bloco) OVER (PARTITION BY ${labelExpr}) AS ordem_bloco,
          MIN(v.ordem_item) OVER (PARTITION BY ${labelExpr}) AS ordem_item
        FROM ${view} v
        JOIN ${SCHEMA}.dim_oferta o ON o.oferta_id = v.oferta_id
        ${filtersSql.whereSql}
      ),
      grouped AS (
        SELECT
          label,
          valor_likert,
          MIN(ordem_bloco) AS ordem_bloco,
          MIN(ordem_item) AS ordem_item,
          COUNT(*)::int AS respostas,
          SUM(COUNT(*)) OVER (PARTITION BY label)::int AS total_respostas
        FROM base
        GROUP BY label, valor_likert
      )
      SELECT
        label,
        valor_likert,
        ordem_bloco,
        ordem_item,
        respostas,
        total_respostas,
        ROUND((respostas::numeric / NULLIF(total_respostas, 0)) * 100, 2)::float AS percentual
      FROM grouped
      ORDER BY ordem_bloco, ordem_item, label, valor_likert DESC
    `,
    filtersSql.params
  );

  return sortRowsByOrder(
    rows.map((row) => ({
      [options.outputKey]: options.outputKey === 'item'
        ? normalizeQuestionCode(row.label)
        : row.label,
      conceito: CONCEITOS[Number(row.valor_likert)] ?? String(row.valor_likert ?? ''),
      valor: Number(row.percentual ?? 0),
      respostas: Number(row.respostas ?? 0),
      total_respostas: Number(row.total_respostas ?? 0),
      ordem_bloco: row.ordem_bloco,
      ordem_item: row.ordem_item,
    })),
    options.outputKey
  );
}

async function getAtividadesRows(filters = {}, instrumento = 'DISC', options = {}) {
  const filtersSql = sqlFilters(filters, { tipoMedida: 'ATIVIDADE' });
  const view = viewForInstrumento(instrumento);

  const { rows } = await queryAvaliaApi(
    `
      SELECT
        COALESCE(v.codigo_item, v.subdimensao, v.eixo) AS atividade,
        MIN(v.ordem_bloco) AS ordem_bloco,
        MIN(v.ordem_item) AS ordem_item,
        ROUND((AVG(v.valor)::numeric * 100), 2)::float AS percentual,
        COUNT(*)::int AS respondentes
      FROM ${view} v
      JOIN ${SCHEMA}.dim_oferta o ON o.oferta_id = v.oferta_id
      ${filtersSql.whereSql}
      GROUP BY COALESCE(v.codigo_item, v.subdimensao, v.eixo)
      ORDER BY ordem_bloco, ordem_item, atividade
    `,
    filtersSql.params
  );

  const data = rows.map((row) => ({
    atividade: row.atividade,
    percentual: Number(row.percentual ?? 0),
    respondentes: Number(row.respondentes ?? 0),
    ordem_bloco: row.ordem_bloco,
    ordem_item: row.ordem_item,
  }));

  if (options.ranking) return data;
  return sortRowsByOrder(data, 'atividade');
}

async function getBoxplotPayload(filters = {}, options = {}) {
  const sourceSql = options.instrumento === 'DOC'
    ? `
      SELECT
        v.oferta_id,
        ${options.labelField === 'codigo_item' ? 'v.codigo_item' : `COALESCE(v.${options.labelField}, v.eixo, v.codigo_item)`} AS label,
        MIN(v.ordem_bloco) AS ordem_bloco,
        MIN(v.ordem_item) AS ordem_item,
        AVG(v.valor)::numeric AS value
      FROM ${SCHEMA}.vw_doc_resposta_long v
      JOIN ${SCHEMA}.dim_oferta o ON o.oferta_id = v.oferta_id
      __WHERE__
      GROUP BY v.oferta_id, label
    `
    : `
      SELECT
        v.oferta_id,
        ${options.labelField === 'codigo_item' ? 'v.codigo_item' : `COALESCE(v.${options.labelField}, v.eixo, v.codigo_item)`} AS label,
        MIN(v.ordem_bloco) AS ordem_bloco,
        MIN(v.ordem_item) AS ordem_item,
        AVG(v.media)::numeric AS value
      FROM ${SCHEMA}.vw_disc_media_long v
      JOIN ${SCHEMA}.dim_oferta o ON o.oferta_id = v.oferta_id
      __WHERE__
      GROUP BY v.oferta_id, label
    `;

  const filtersSql = sqlFilters(filters, options.instrumento === 'DOC'
    ? { ...options, tipoMedida: 'LIKERT' }
    : options);

  const baseSql = sourceSql.replace('__WHERE__', filtersSql.whereSql);
  const { rows } = await queryAvaliaApi(
    `
      WITH base AS (
        ${baseSql}
      ),
      stats AS (
        SELECT
          label,
          MIN(ordem_bloco) AS ordem_bloco,
          MIN(ordem_item) AS ordem_item,
          MIN(value)::float AS min,
          percentile_cont(0.25) WITHIN GROUP (ORDER BY value)::float AS q1,
          percentile_cont(0.50) WITHIN GROUP (ORDER BY value)::float AS mediana,
          AVG(value)::float AS media,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY value)::float AS q3,
          MAX(value)::float AS max,
          COUNT(*)::int AS n
        FROM base
        WHERE value IS NOT NULL
        GROUP BY label
      )
      SELECT *
      FROM stats
      ORDER BY ordem_bloco, ordem_item, label
    `,
    filtersSql.params
  );

  const mapped = sortRowsByOrder(
    rows.map((row) => {
      const label = options.outputKey === 'item' ? normalizeQuestionCode(row.label) : row.label;
      return {
        label,
        ordem_bloco: row.ordem_bloco,
        ordem_item: row.ordem_item,
        min: Number(row.min ?? 0),
        q1: Number(row.q1 ?? 0),
        mediana: Number(row.mediana ?? 0),
        media: Number(row.media ?? 0),
        q3: Number(row.q3 ?? 0),
        max: Number(row.max ?? 0),
        n: Number(row.n ?? 0),
      };
    }),
    'label'
  );

  const tabela2 = mapped.map((row) => ({
    Item: row.label,
    item: row.label,
    Min: Number(row.min.toFixed(2)),
    Q1: Number(row.q1.toFixed(2)),
    Mediana: Number(row.mediana.toFixed(2)),
    Media: Number(row.media.toFixed(2)),
    Q3: Number(row.q3.toFixed(2)),
    Max: Number(row.max.toFixed(2)),
    N: row.n,
  }));

  return {
    boxplot_data: mapped.map((row) => ({
      x: row.label,
      y: [
        Number(row.min.toFixed(2)),
        Number(row.q1.toFixed(2)),
        Number(row.mediana.toFixed(2)),
        Number(row.q3.toFixed(2)),
        Number(row.max.toFixed(2)),
      ],
    })),
    outliers_data: [],
    tabela: tabela2,
    tabela2,
    tabela_items: tabela2,
    rows: mapped,
  };
}

async function getRankingMean(filters = {}, options = {}) {
  const filtersSql = sqlFilters(filters, {
    ...options,
    tipoMedida: 'LIKERT',
    ignoreCurso: true,
  });
  const view = viewForInstrumento(options.instrumento);

  const { rows } = await queryAvaliaApi(
    `
      SELECT
        o.curso,
        ROUND(AVG(v.valor)::numeric, 2)::float AS media,
        COUNT(*)::int AS respondentes
      FROM ${view} v
      JOIN ${SCHEMA}.dim_oferta o ON o.oferta_id = v.oferta_id
      ${filtersSql.whereSql}
      GROUP BY o.curso
      ORDER BY media DESC, respondentes DESC, o.curso
      LIMIT 20
    `,
    filtersSql.params
  );

  return rows.map((row, index) => ({
    ranking: index + 1,
    curso: row.curso,
    media: Number(row.media ?? 0),
    respondentes: Number(row.respondentes ?? 0),
  }));
}

async function getRankingAtividades(filters = {}, instrumento = 'DISC') {
  const filtersSql = sqlFilters(filters, {
    tipoMedida: 'ATIVIDADE',
    ignoreCurso: true,
  });
  const view = viewForInstrumento(instrumento);

  const { rows } = await queryAvaliaApi(
    `
      SELECT
        o.curso,
        ROUND((AVG(v.valor)::numeric * 100), 2)::float AS percentual,
        COUNT(*)::int AS respondentes
      FROM ${view} v
      JOIN ${SCHEMA}.dim_oferta o ON o.oferta_id = v.oferta_id
      ${filtersSql.whereSql}
      GROUP BY o.curso
      ORDER BY percentual DESC, respondentes DESC, o.curso
      LIMIT 20
    `,
    filtersSql.params
  );

  return rows.map((row, index) => ({
    ranking: index + 1,
    curso: row.curso,
    percentual: Number(row.percentual ?? 0),
    respondentes: Number(row.respondentes ?? 0),
  }));
}

async function getRankingPayload(endpoint, filters = {}) {
  if (endpoint === '/ranking/cursos/dimensoes-gerais') {
    return {
      autoavaliacao_discente: await getRankingMean(filters, {
        instrumento: 'DISC',
        eixo: 'Autoavalia\u00e7\u00e3o',
      }),
      acao_docente_discente: await getRankingMean(filters, {
        instrumento: 'DISC',
        eixo: 'A\u00e7\u00e3o Docente',
      }),
      instalacoes_discente: await getRankingMean(filters, {
        instrumento: 'DISC',
        eixo: 'Instala\u00e7\u00f5es F\u00edsicas',
      }),
      avaliacao_turma_docente: await getRankingMean(filters, {
        instrumento: 'DOC',
        eixo: 'Avalia\u00e7\u00e3o da Turma',
      }),
      autoavaliacao_acao_docente: await getRankingMean(filters, {
        instrumento: 'DOC',
        eixo: 'Autoavalia\u00e7\u00e3o',
      }),
      instalacoes_docente: await getRankingMean(filters, {
        instrumento: 'DOC',
        eixo: 'Instala\u00e7\u00f5es F\u00edsicas',
      }),
    };
  }

  if (endpoint === '/ranking/cursos/autoavaliacao-discente') {
    return {
      autoavaliacao_discente: await getRankingMean(filters, {
        instrumento: 'DISC',
        eixo: 'Autoavalia\u00e7\u00e3o',
      }),
      atitude_profissional: await getRankingMean(filters, {
        instrumento: 'DISC',
        subdimensao: 'Atitude Profissional',
      }),
      gestao_didatica: await getRankingMean(filters, {
        instrumento: 'DISC',
        subdimensao: 'Gest\u00e3o Did\u00e1tica',
      }),
      processo_avaliativo: await getRankingMean(filters, {
        instrumento: 'DISC',
        subdimensao: 'Processo Avaliativo',
      }),
    };
  }

  if (endpoint === '/ranking/cursos/acao-docente') {
    return {
      avaliacao_turma_docente: await getRankingMean(filters, {
        instrumento: 'DOC',
        eixo: 'Avalia\u00e7\u00e3o da Turma',
      }),
      autoavaliacao_acao_docente: await getRankingMean(filters, {
        instrumento: 'DOC',
        eixo: 'Autoavalia\u00e7\u00e3o',
      }),
      atitude_profissional_docente: await getRankingMean(filters, {
        instrumento: 'DOC',
        subdimensao: 'Atitude Profissional',
      }),
      gestao_didatica_docente: await getRankingMean(filters, {
        instrumento: 'DOC',
        subdimensao: 'Gest\u00e3o Did\u00e1tica',
      }),
      processo_avaliativo_docente: await getRankingMean(filters, {
        instrumento: 'DOC',
        subdimensao: 'Processo Avaliativo',
      }),
    };
  }

  if (endpoint === '/ranking/cursos/instalacoes') {
    return {
      instalacoes_discente: await getRankingMean(filters, {
        instrumento: 'DISC',
        eixo: 'Instala\u00e7\u00f5es F\u00edsicas',
      }),
      instalacoes_docente: await getRankingMean(filters, {
        instrumento: 'DOC',
        eixo: 'Instala\u00e7\u00f5es F\u00edsicas',
      }),
    };
  }

  if (endpoint === '/ranking/cursos/atividades') {
    return {
      atividades_discente: await getRankingAtividades(filters, 'DISC'),
      atividades_docente: await getRankingAtividades(filters, 'DOC'),
    };
  }

  return null;
}

function json(payload, init = {}) {
  return Response.json(payload, {
    ...init,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Data-Source': 'neon-avalia-views',
      ...(init.headers ?? {}),
    },
  });
}

async function routeEndpoint(endpoint, filters) {
  if (endpoint === '/ping') {
    const { rows } = await queryAvaliaApi(`SELECT 1 AS ok`);
    return rows[0] ?? { ok: true };
  }

  if (endpoint === '/periodos') {
    const { rows } = await queryAvaliaApi(
      `SELECT * FROM ${SCHEMA}.dim_periodo ORDER BY ano, periodo`
    );
    return rows;
  }

  if (endpoint === '/itens') {
    const { rows } = await queryAvaliaApi(
      `SELECT * FROM ${SCHEMA}.dim_item_posicao ORDER BY instrumento, ano, periodo, tipo_medida, posicao`
    );
    return rows;
  }

  if (endpoint === '/ofertas') {
    const { rows } = await queryAvaliaApi(
      `SELECT * FROM ${SCHEMA}.dim_oferta ORDER BY periodo_id, campus, curso, disciplina`
    );
    return rows;
  }

  if (endpoint === '/filters') {
    return getFilterPayload(filters);
  }

  if (endpoint === '/filters/campus') {
    const payload = await getFilterPayload({ ano: filters.ano });
    return { anos: payload.anos, campus: payload.campus };
  }

  if (endpoint === '/filters/cursos') {
    const payload = await getFilterPayload({
      ano: filters.ano,
      campus: filters.campus,
    });
    return { cursos: payload.cursos };
  }

  if (endpoint === '/resumo' || endpoint === '/discente/geral/summary') {
    return getSummary(filters);
  }

  if (endpoint === '/likert-distribuicao') {
    return getProportionRows(filters, {
      instrumento: endpointInstrumento(endpoint),
      ...endpointLevel(endpoint),
    });
  }

  if (endpoint.includes('/atividades/percentual')) {
    return getAtividadesRows(filters, endpointInstrumento(endpoint));
  }

  if (endpoint.startsWith('/ranking/')) {
    return getRankingPayload(endpoint, filters);
  }

  if (
    endpoint.includes('/boxplot') ||
    endpoint.includes('/descritivas') ||
    endpoint.includes('/estatisticas')
  ) {
    return getBoxplotPayload(filters, endpointLikertOptions(endpoint));
  }

  if (endpoint.includes('/medias')) {
    const options = endpointLikertOptions(endpoint);
    return getMeanRows(filters, options);
  }

  if (endpoint.includes('/proporcoes')) {
    const options = endpointLikertOptions(endpoint);
    return getProportionRows(filters, options);
  }

  return null;
}

export async function GET(req) {
  let endpoint = null;
  let filters = null;

  try {
    const { searchParams } = new URL(req.url);
    endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return json({ error: 'Parametro "endpoint" e obrigatorio.' }, { status: 400 });
    }

    filters = {
      ano: normalizeParam(searchParams.get('ano'), null),
      campus: normalizeParam(searchParams.get('campus'), 'todos'),
      curso: normalizeParam(searchParams.get('curso'), 'todos'),
    };

    const payload = await routeEndpoint(endpoint, filters);
    return json(payload);
  } catch (err) {
    console.error('[avalia-db] fatal:', {
      endpoint,
      filters,
      message: err?.message,
      stack: err?.stack,
    });

    return json(
      {
        error: 'Erro ao consultar o banco Neon.',
        details: err?.message ?? 'Erro desconhecido',
      },
      { status: err?.status ?? 500 }
    );
  }
}
