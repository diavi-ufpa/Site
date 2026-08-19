import { queryAvaliaGraph } from '@/lib/avalia-graph-db';

const SCHEMA = 'avalia_presencial_graph';

const CONCEITOS = {
  4: 'Excelente',
  3: 'Bom',
  2: 'Regular',
  1: 'Insuficiente',
};

const DIMENSOES = {
  AUTOAVALIACAO_DISCENTE: 'AUTOAVALIACAO_DISCENTE',
  ACAO_DOCENTE: 'ACAO_DOCENTE',
  AVALIACAO_TURMA: 'AVALIACAO_TURMA',
  AUTOAVALIACAO_ACAO_DOCENTE: 'AUTOAVALIACAO_ACAO_DOCENTE',
  INSTALACOES: 'INSTALACOES_FISICAS',
};

const SUBDIMENSOES = {
  atitudeprofissional: 'ATITUDE_PROFISSIONAL',
  gestaodidatica: 'GESTAO_DIDATICA',
  processoavaliativo: 'PROCESSO_AVALIATIVO',
};

function normalizeFilter(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return ['todos', 'todas', 'all'].includes(raw.toLowerCase()) ? null : raw;
}

function parseSemester(value) {
  const match = String(value ?? '').trim().match(/^(\d{4})(?:[-/.](\d+))?$/);
  if (!match) return { year: null, period: null };
  return {
    year: Number(match[1]),
    period: match[2] ? Number(match[2]) : null,
  };
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

function endpointInstrument(endpoint) {
  return endpoint.startsWith('/docente') ? 'DOC' : 'DISC';
}

function endpointLevel(endpoint) {
  if (endpoint.includes('/dimensoes/')) {
    return { level: 'DIMENSAO', outputKey: 'dimensao' };
  }
  if (endpoint.includes('/subdimensoes/')) {
    return { level: 'SUBDIMENSAO', outputKey: 'subdimensao' };
  }
  return { level: 'ITEM', outputKey: 'item' };
}

function isDocDimensionCompatibilityEndpoint(endpoint) {
  return endpoint.startsWith('/docente/avaliacaoturma/dimensoes/');
}

function endpointOptions(endpoint) {
  const options = {
    instrument: endpointInstrument(endpoint),
    ...endpointLevel(endpoint),
  };

  if (endpoint.includes('/autoavaliacao/') && options.level === 'ITEM') {
    options.dimensionCode = options.instrument === 'DOC'
      ? DIMENSOES.AUTOAVALIACAO_ACAO_DOCENTE
      : DIMENSOES.AUTOAVALIACAO_DISCENTE;
  }
  if (endpoint.includes('/avaliacaoturma/') && !isDocDimensionCompatibilityEndpoint(endpoint)) {
    options.dimensionCode = DIMENSOES.AVALIACAO_TURMA;
  }
  if (endpoint.includes('/instalacoes/')) options.dimensionCode = DIMENSOES.INSTALACOES;

  for (const [pathPart, code] of Object.entries(SUBDIMENSOES)) {
    if (endpoint.includes(`/${pathPart}/`)) options.subdimensionCode = code;
  }

  return options;
}

function buildContext(filters = {}, options = {}) {
  const { year, period } = parseSemester(filters.ano);
  const campus = normalizeFilter(filters.campus);
  const course = options.ignoreCourse ? null : normalizeFilter(filters.curso);
  const params = [];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  const scopeWhere = [];
  if (year) scopeWhere.push(`s.ano = ${add(year)}::smallint`);
  if (period) scopeWhere.push(`s.periodo = ${add(period)}::smallint`);

  let scopeLevel = 'SEMESTRE';
  if (campus && course) scopeLevel = 'CAMPUS_CURSO';
  else if (campus) scopeLevel = 'CAMPUS';
  else if (course) scopeLevel = 'CURSO';

  scopeWhere.push(`r.nivel = ${add(scopeLevel)}::text`);
  if (campus) scopeWhere.push(`campus.nome = ${add(campus)}::text`);
  if (course) scopeWhere.push(`curso.nome = ${add(course)}::text`);

  const groupWhere = [];
  if (options.instrument) groupWhere.push(`a.instrumento = ${add(options.instrument)}::text`);
  if (options.family) groupWhere.push(`a.familia = ${add(options.family)}::text`);
  if (options.level) groupWhere.push(`a.nivel = ${add(options.level)}::text`);
  if (options.dimensionCode) {
    const field = options.level === 'ITEM' ? 'iq.dimensao_codigo' : 'a.codigo';
    groupWhere.push(`${field} = ${add(options.dimensionCode)}::text`);
  }
  if (options.subdimensionCode) {
    const field = options.level === 'ITEM' ? 'iq.subdimensao_codigo' : 'a.codigo';
    groupWhere.push(`${field} = ${add(options.subdimensionCode)}::text`);
  }

  return {
    params,
    scopeSql: `
      SELECT r.recorte_id, s.questionario_versao_id
      FROM ${SCHEMA}.recorte r
      JOIN ${SCHEMA}.semestre s ON s.semestre_id = r.semestre_id
      LEFT JOIN ${SCHEMA}.campus campus ON campus.campus_id = r.campus_id
      LEFT JOIN ${SCHEMA}.curso curso ON curso.curso_id = r.curso_id
      WHERE ${scopeWhere.join('\n        AND ')}
      LIMIT 1
    `,
    groupWhereSql: groupWhere.length ? `WHERE ${groupWhere.join('\n        AND ')}` : '',
  };
}

function groupLabel(row, outputKey) {
  return outputKey === 'item' ? row.codigo : row.rotulo;
}

async function getFilterPayload(filters = {}) {
  const { year, period } = parseSemester(filters.ano);
  const campus = normalizeFilter(filters.campus);
  const course = normalizeFilter(filters.curso);

  const { rows: semesterRows } = await queryAvaliaGraph(`
    SELECT codigo
    FROM ${SCHEMA}.semestre
    ORDER BY ano, periodo
  `);

  const params = [];
  const where = [`r.nivel = 'CAMPUS_CURSO'`];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  if (year) where.push(`s.ano = ${add(year)}::smallint`);
  if (period) where.push(`s.periodo = ${add(period)}::smallint`);
  if (campus) where.push(`campus.nome = ${add(campus)}::text`);
  if (course) where.push(`curso.nome = ${add(course)}::text`);

  const { rows } = await queryAvaliaGraph(
    `
      SELECT DISTINCT campus.nome AS campus, curso.nome AS curso
      FROM ${SCHEMA}.recorte r
      JOIN ${SCHEMA}.semestre s ON s.semestre_id = r.semestre_id
      JOIN ${SCHEMA}.campus campus ON campus.campus_id = r.campus_id
      JOIN ${SCHEMA}.curso curso ON curso.curso_id = r.curso_id
      WHERE ${where.join('\n        AND ')}
      ORDER BY campus.nome, curso.nome
    `,
    params
  );

  return {
    anos: uniqueSorted(semesterRows.map((row) => row.codigo)),
    campus: uniqueSorted(rows.map((row) => row.campus)),
    cursos: uniqueSorted(rows.map((row) => row.curso)),
  };
}

async function getSummary(filters) {
  const context = buildContext(filters);
  const { rows } = await queryAvaliaGraph(
    `
      WITH alvo AS (${context.scopeSql})
      SELECT
        resumo.total_respondentes,
        melhor.nome AS melhor_campus,
        resumo.melhor_campus_media,
        pior.nome AS pior_campus,
        resumo.pior_campus_media
      FROM alvo
      LEFT JOIN ${SCHEMA}.resultado_resumo resumo ON resumo.recorte_id = alvo.recorte_id
      LEFT JOIN ${SCHEMA}.campus melhor ON melhor.campus_id = resumo.melhor_campus_id
      LEFT JOIN ${SCHEMA}.campus pior ON pior.campus_id = resumo.pior_campus_id
    `,
    context.params
  );
  const row = rows[0] ?? {};
  return {
    total_respondentes: Number(row.total_respondentes ?? 0),
    campus_melhor_avaliado: row.melhor_campus
      ? [{ campus: row.melhor_campus, media: Number(row.melhor_campus_media) }]
      : [],
    campus_pior_avaliado: row.pior_campus
      ? [{ campus: row.pior_campus, media: Number(row.pior_campus_media) }]
      : [],
  };
}

function groupCte(context) {
  return `
    grupos AS (
      SELECT a.agrupador_id, a.codigo, a.rotulo, a.ordem_bloco, a.ordem_item
      FROM ${SCHEMA}.agrupador a
      JOIN alvo ON alvo.questionario_versao_id = a.questionario_versao_id
      LEFT JOIN ${SCHEMA}.item_questionario iq
        ON iq.questionario_versao_id = a.questionario_versao_id
       AND iq.instrumento = a.instrumento
       AND iq.familia = a.familia
       AND iq.codigo = a.codigo
      ${context.groupWhereSql}
    )
  `;
}

async function getMeans(filters, options) {
  const context = buildContext(filters, { ...options, family: 'LIKERT' });
  const { rows } = await queryAvaliaGraph(
    `
      WITH alvo AS (${context.scopeSql}),
      ${groupCte(context)}
      SELECT grupos.*, resultado.soma, resultado.quantidade, resultado.media
      FROM alvo
      JOIN ${SCHEMA}.resultado_media_likert resultado ON resultado.recorte_id = alvo.recorte_id
      JOIN grupos ON grupos.agrupador_id = resultado.agrupador_id
      ORDER BY grupos.ordem_bloco, grupos.ordem_item, grupos.codigo
    `,
    context.params
  );
  return rows.map((row) => ({
    [options.outputKey]: groupLabel(row, options.outputKey),
    media: Number(row.media),
    respondentes: Number(row.quantidade),
    ordem_bloco: Number(row.ordem_bloco),
    ordem_item: Number(row.ordem_item),
  }));
}

async function getProportions(filters, options) {
  const context = buildContext(filters, { ...options, family: 'LIKERT' });
  const { rows } = await queryAvaliaGraph(
    `
      WITH alvo AS (${context.scopeSql}),
      ${groupCte(context)}
      SELECT grupos.*, resultado.valor_likert, resultado.quantidade,
             resultado.total, resultado.percentual
      FROM alvo
      JOIN ${SCHEMA}.resultado_proporcao_likert resultado
        ON resultado.recorte_id = alvo.recorte_id
      JOIN grupos ON grupos.agrupador_id = resultado.agrupador_id
      ORDER BY grupos.ordem_bloco, grupos.ordem_item, grupos.codigo,
               resultado.valor_likert DESC
    `,
    context.params
  );
  return rows.map((row) => ({
    [options.outputKey]: groupLabel(row, options.outputKey),
    conceito: CONCEITOS[Number(row.valor_likert)] ?? String(row.valor_likert),
    valor: Number(row.percentual),
    respostas: Number(row.quantidade),
    total_respostas: Number(row.total),
    ordem_bloco: Number(row.ordem_bloco),
    ordem_item: Number(row.ordem_item),
  }));
}

async function getBoxplot(filters, options) {
  const context = buildContext(filters, { ...options, family: 'LIKERT' });
  const { rows } = await queryAvaliaGraph(
    `
      WITH alvo AS (${context.scopeSql}),
      ${groupCte(context)}
      SELECT grupos.*, box.minimo, box.q1, box.mediana, box.media, box.q3,
             box.maximo, box.quantidade,
             COALESCE(
               json_agg(outlier.valor ORDER BY outlier.sequencia)
                 FILTER (WHERE outlier.sequencia IS NOT NULL),
               '[]'::json
             ) AS outliers
      FROM alvo
      JOIN ${SCHEMA}.resultado_boxplot box ON box.recorte_id = alvo.recorte_id
      JOIN grupos ON grupos.agrupador_id = box.agrupador_id
      LEFT JOIN ${SCHEMA}.resultado_boxplot_outlier outlier
        ON outlier.recorte_id = box.recorte_id
       AND outlier.agrupador_id = box.agrupador_id
      GROUP BY grupos.agrupador_id, grupos.codigo, grupos.rotulo,
               grupos.ordem_bloco, grupos.ordem_item,
               box.minimo, box.q1, box.mediana, box.media, box.q3,
               box.maximo, box.quantidade
      ORDER BY grupos.ordem_bloco, grupos.ordem_item, grupos.codigo
    `,
    context.params
  );

  const mapped = rows.map((row) => ({
    label: groupLabel(row, options.outputKey),
    min: Number(row.minimo),
    q1: Number(row.q1),
    mediana: Number(row.mediana),
    media: Number(row.media),
    q3: Number(row.q3),
    max: Number(row.maximo),
    n: Number(row.quantidade),
    outliers: Array.isArray(row.outliers) ? row.outliers.map(Number) : [],
  }));
  const tabela2 = mapped.map((row) => ({
    Item: row.label,
    item: row.label,
    Min: row.min,
    Q1: row.q1,
    Mediana: row.mediana,
    Media: row.media,
    Q3: row.q3,
    Max: row.max,
    N: row.n,
  }));

  return {
    boxplot_data: mapped.map((row) => ({
      x: row.label,
      y: [row.min, row.q1, row.mediana, row.q3, row.max],
    })),
    outliers_data: mapped.flatMap((row) => row.outliers.map((value) => ({
      x: row.label,
      y: value,
    }))),
    tabela: tabela2,
    tabela2,
    tabela_items: tabela2,
    rows: mapped,
  };
}

async function getActivities(filters, instrument) {
  const context = buildContext(filters, {
    instrument,
    family: 'ATIVIDADE',
    level: 'ITEM',
  });
  const { rows } = await queryAvaliaGraph(
    `
      WITH alvo AS (${context.scopeSql}),
      ${groupCte(context)}
      SELECT grupos.*, resultado.quantidade_positiva, resultado.total,
             resultado.percentual
      FROM alvo
      JOIN ${SCHEMA}.resultado_atividade resultado ON resultado.recorte_id = alvo.recorte_id
      JOIN grupos ON grupos.agrupador_id = resultado.agrupador_id
      ORDER BY grupos.ordem_bloco, grupos.ordem_item, grupos.codigo
    `,
    context.params
  );
  return rows.map((row) => ({
    atividade: row.codigo,
    percentual: Number(row.percentual),
    respondentes: Number(row.total),
    respostas: Number(row.quantidade_positiva),
    ordem_bloco: Number(row.ordem_bloco),
    ordem_item: Number(row.ordem_item),
  }));
}

async function getRankingMean(filters, options) {
  const context = buildContext(filters, {
    ...options,
    family: 'LIKERT',
    ignoreCourse: true,
  });
  const { rows } = await queryAvaliaGraph(
    `
      WITH alvo AS (${context.scopeSql}),
      ${groupCte(context)}
      SELECT ranking.posicao, curso.nome AS curso, ranking.media,
             ranking.quantidade
      FROM alvo
      JOIN ${SCHEMA}.ranking_media_curso ranking ON ranking.recorte_id = alvo.recorte_id
      JOIN grupos ON grupos.agrupador_id = ranking.agrupador_id
      JOIN ${SCHEMA}.curso curso ON curso.curso_id = ranking.curso_id
      ORDER BY ranking.posicao
    `,
    context.params
  );
  return rows.map((row) => ({
    ranking: Number(row.posicao),
    curso: row.curso,
    media: Number(row.media),
    respondentes: Number(row.quantidade),
  }));
}

async function getRankingActivities(filters, instrument) {
  const context = buildContext(filters, { ignoreCourse: true });
  const params = [...context.params, instrument];
  const instrumentParam = `$${params.length}`;
  const { rows } = await queryAvaliaGraph(
    `
      WITH alvo AS (${context.scopeSql})
      SELECT ranking.posicao, curso.nome AS curso, ranking.percentual,
             ranking.total
      FROM alvo
      JOIN ${SCHEMA}.ranking_atividade_curso ranking
        ON ranking.recorte_id = alvo.recorte_id
       AND ranking.instrumento = ${instrumentParam}::text
      JOIN ${SCHEMA}.curso curso ON curso.curso_id = ranking.curso_id
      ORDER BY ranking.posicao
    `,
    params
  );
  return rows.map((row) => ({
    ranking: Number(row.posicao),
    curso: row.curso,
    percentual: Number(row.percentual),
    respondentes: Number(row.total),
  }));
}

async function getRankings(endpoint, filters) {
  const dimension = (instrument, dimensionCode) => ({
    instrument,
    level: 'DIMENSAO',
    dimensionCode,
  });
  const subdimension = (instrument, subdimensionCode) => ({
    instrument,
    level: 'SUBDIMENSAO',
    subdimensionCode,
  });

  if (endpoint === '/ranking/cursos/dimensoes-gerais') {
    return {
      autoavaliacao_discente: await getRankingMean(filters, dimension('DISC', DIMENSOES.AUTOAVALIACAO_DISCENTE)),
      acao_docente_discente: await getRankingMean(filters, dimension('DISC', DIMENSOES.ACAO_DOCENTE)),
      instalacoes_discente: await getRankingMean(filters, dimension('DISC', DIMENSOES.INSTALACOES)),
      avaliacao_turma_docente: await getRankingMean(filters, dimension('DOC', DIMENSOES.AVALIACAO_TURMA)),
      autoavaliacao_acao_docente: await getRankingMean(filters, dimension('DOC', DIMENSOES.AUTOAVALIACAO_ACAO_DOCENTE)),
      instalacoes_docente: await getRankingMean(filters, dimension('DOC', DIMENSOES.INSTALACOES)),
    };
  }
  if (endpoint === '/ranking/cursos/autoavaliacao-discente') {
    return {
      autoavaliacao_discente: await getRankingMean(filters, dimension('DISC', DIMENSOES.AUTOAVALIACAO_DISCENTE)),
      atitude_profissional: await getRankingMean(filters, subdimension('DISC', SUBDIMENSOES.atitudeprofissional)),
      gestao_didatica: await getRankingMean(filters, subdimension('DISC', SUBDIMENSOES.gestaodidatica)),
      processo_avaliativo: await getRankingMean(filters, subdimension('DISC', SUBDIMENSOES.processoavaliativo)),
    };
  }
  if (endpoint === '/ranking/cursos/acao-docente') {
    return {
      avaliacao_turma_docente: await getRankingMean(filters, dimension('DOC', DIMENSOES.AVALIACAO_TURMA)),
      autoavaliacao_acao_docente: await getRankingMean(filters, dimension('DOC', DIMENSOES.AUTOAVALIACAO_ACAO_DOCENTE)),
      atitude_profissional_docente: await getRankingMean(filters, subdimension('DOC', SUBDIMENSOES.atitudeprofissional)),
      gestao_didatica_docente: await getRankingMean(filters, subdimension('DOC', SUBDIMENSOES.gestaodidatica)),
      processo_avaliativo_docente: await getRankingMean(filters, subdimension('DOC', SUBDIMENSOES.processoavaliativo)),
    };
  }
  if (endpoint === '/ranking/cursos/instalacoes') {
    return {
      instalacoes_discente: await getRankingMean(filters, dimension('DISC', DIMENSOES.INSTALACOES)),
      instalacoes_docente: await getRankingMean(filters, dimension('DOC', DIMENSOES.INSTALACOES)),
    };
  }
  if (endpoint === '/ranking/cursos/atividades') {
    return {
      atividades_discente: await getRankingActivities(filters, 'DISC'),
      atividades_docente: await getRankingActivities(filters, 'DOC'),
    };
  }
  return null;
}

export async function queryAvaliaGraphEndpoint(endpoint, filters = {}) {
  if (endpoint === '/ping') {
    const { rows } = await queryAvaliaGraph('SELECT 1 AS ok');
    return rows[0] ?? { ok: 1 };
  }
  if (endpoint === '/filters') return getFilterPayload(filters);
  if (endpoint === '/filters/campus') {
    const payload = await getFilterPayload({ ano: filters.ano });
    return { anos: payload.anos, campus: payload.campus };
  }
  if (endpoint === '/filters/cursos') {
    const payload = await getFilterPayload({ ano: filters.ano, campus: filters.campus });
    return { cursos: payload.cursos };
  }
  if (endpoint === '/resumo' || endpoint === '/discente/geral/summary') {
    return getSummary(filters);
  }
  if (endpoint.includes('/atividades/percentual')) {
    return getActivities(filters, endpointInstrument(endpoint));
  }
  if (endpoint.startsWith('/ranking/')) return getRankings(endpoint, filters);

  const options = endpointOptions(endpoint);
  if (
    endpoint.includes('/boxplot') ||
    endpoint.includes('/descritivas') ||
    endpoint.includes('/estatisticas')
  ) {
    return getBoxplot(filters, options);
  }
  if (endpoint.includes('/medias')) return getMeans(filters, options);
  if (endpoint.includes('/proporcoes')) return getProportions(filters, options);
  return null;
}
