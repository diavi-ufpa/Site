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
  if (campus) scopeWhere.push(`LOWER(TRIM(campus.nome)) = LOWER(TRIM(${add(campus)}::text))`);
  if (course) scopeWhere.push(`LOWER(TRIM(curso.nome)) = LOWER(TRIM(${add(course)}::text))`);

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

async function getSemestres() {
  const { rows } = await queryAvaliaGraph(`
    SELECT codigo
    FROM ${SCHEMA}.semestre
    ORDER BY ano, periodo
  `);
  return uniqueSorted(rows.map((row) => row.codigo));
}

async function getCampusFilters(ano) {
  const { year, period } = parseSemester(ano);
  if (!year) {
    const { rows } = await queryAvaliaGraph(`
      SELECT DISTINCT campus.nome AS campus
      FROM ${SCHEMA}.recorte r
      JOIN ${SCHEMA}.campus campus ON campus.campus_id = r.campus_id
      WHERE r.nivel IN ('CAMPUS', 'CAMPUS_CURSO')
      ORDER BY campus.nome
    `);
    return uniqueSorted(rows.map((row) => row.campus));
  }

  const params = [];
  const add = (v) => {
    params.push(v);
    return `$${params.length}`;
  };
  const where = [`r.nivel IN ('CAMPUS', 'CAMPUS_CURSO')`];
  if (year) where.push(`s.ano = ${add(year)}::smallint`);
  if (period) where.push(`s.periodo = ${add(period)}::smallint`);

  const { rows } = await queryAvaliaGraph(
    `
      SELECT DISTINCT campus.nome AS campus
      FROM ${SCHEMA}.recorte r
      JOIN ${SCHEMA}.semestre s ON s.semestre_id = r.semestre_id
      JOIN ${SCHEMA}.campus campus ON campus.campus_id = r.campus_id
      WHERE ${where.join('\n        AND ')}
      ORDER BY campus.nome
    `,
    params
  );
  return uniqueSorted(rows.map((row) => row.campus));
}

async function getCursoFilters(ano, campus) {
  const { year, period } = parseSemester(ano);
  const campusNorm = normalizeFilter(campus);

  const params = [];
  const add = (v) => {
    params.push(v);
    return `$${params.length}`;
  };
  const where = [`r.nivel = 'CAMPUS_CURSO'`];
  if (year) where.push(`s.ano = ${add(year)}::smallint`);
  if (period) where.push(`s.periodo = ${add(period)}::smallint`);
  if (campusNorm) where.push(`LOWER(TRIM(campus.nome)) = LOWER(TRIM(${add(campusNorm)}::text))`);

  const { rows } = await queryAvaliaGraph(
    `
      SELECT DISTINCT curso.nome AS curso
      FROM ${SCHEMA}.recorte r
      JOIN ${SCHEMA}.semestre s ON s.semestre_id = r.semestre_id
      JOIN ${SCHEMA}.campus campus ON campus.campus_id = r.campus_id
      JOIN ${SCHEMA}.curso curso ON curso.curso_id = r.curso_id
      WHERE ${where.join('\n        AND ')}
      ORDER BY curso.nome
    `,
    params
  );
  return uniqueSorted(rows.map((row) => row.curso));
}

async function getFilterTreePayload() {
  const { rows } = await queryAvaliaGraph(`
    SELECT DISTINCT
      s.codigo AS semestre,
      campus.nome AS campus,
      curso.nome AS curso
    FROM ${SCHEMA}.recorte r
    JOIN ${SCHEMA}.semestre s ON s.semestre_id = r.semestre_id
    LEFT JOIN ${SCHEMA}.campus campus ON campus.campus_id = r.campus_id
    LEFT JOIN ${SCHEMA}.curso curso ON curso.curso_id = r.curso_id
    WHERE r.nivel IN ('SEMESTRE', 'CAMPUS', 'CAMPUS_CURSO')
    ORDER BY s.codigo, campus.nome, curso.nome
  `);

  const tree = {};

  for (const row of rows) {
    const semestre = String(row.semestre ?? '').trim();
    if (!semestre) continue;

    if (!tree[semestre]) {
      tree[semestre] = {
        campi: [],
        cursosPorCampus: {},
      };
    }

    const campus = String(row.campus ?? '').trim();
    if (campus) {
      if (!tree[semestre].campi.includes(campus)) {
        tree[semestre].campi.push(campus);
      }
      if (!tree[semestre].cursosPorCampus[campus]) {
        tree[semestre].cursosPorCampus[campus] = [];
      }

      const curso = String(row.curso ?? '').trim();
      if (curso) {
        if (!tree[semestre].cursosPorCampus[campus].includes(curso)) {
          tree[semestre].cursosPorCampus[campus].push(curso);
        }
      }
    }
  }

  const allAnos = await getSemestres();
  const anos = allAnos.length > 0 ? allAnos : uniqueSorted(Object.keys(tree));

  for (const sem of Object.keys(tree)) {
    tree[sem].campi = uniqueSorted(tree[sem].campi);
    for (const campusKey of Object.keys(tree[sem].cursosPorCampus)) {
      tree[sem].cursosPorCampus[campusKey] = uniqueSorted(tree[sem].cursosPorCampus[campusKey]);
    }
  }

  return { anos, tree };
}

async function getFilterPayload(filters = {}) {
  const anos = await getSemestres();
  const campus = filters.ano ? await getCampusFilters(filters.ano) : [];
  const cursos = filters.ano && filters.campus ? await getCursoFilters(filters.ano, filters.campus) : [];

  return { anos, campus, cursos };
}

async function getSummary(filters) {
  const context = buildContext(filters);
  const { rows } = await queryAvaliaGraph(
    `
      WITH alvo AS (${context.scopeSql})
      SELECT
        resumo.total_respondentes,
        COALESCE(resumo.total_docentes, 0) AS total_docentes,
        COALESCE(resumo.total_turmas, 0) AS total_turmas,
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
  const totalRespondentes = Number(row.total_respondentes ?? 0);
  const totalDocentes = Number(row.total_docentes ?? 0);
  const totalTurmas = Number(row.total_turmas ?? 0);

  return {
    total_respondentes: totalRespondentes,
    total_discentes: totalRespondentes,
    total_docentes: totalDocentes,
    total_turmas: totalTurmas,
    n_discente: totalRespondentes,
    n_docente: totalDocentes,
    n_turmas: totalTurmas,
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

async function getDashboardOverviewBundle(filters) {
  const [
    summary,
    medias,
    proporcoes,
    boxplot,
    atividades,
    docDimMedias,
    docDimProporcoes,
    turmaDimBoxplot,
  ] = await Promise.all([
    getSummary(filters),
    getMeans(filters, endpointOptions('/discente/dimensoes/medias')),
    getProportions(filters, endpointOptions('/discente/dimensoes/proporcoes')),
    getBoxplot(filters, endpointOptions('/discente/dimensoes/boxplot')),
    getActivities(filters, 'DISC'),
    getMeans(filters, endpointOptions('/docente/dimensoes/medias')),
    getProportions(filters, endpointOptions('/docente/dimensoes/proporcoes')),
    getBoxplot(filters, endpointOptions('/docente/avaliacaoturma/dimensoes/boxplot')),
  ]);

  return {
    summary,
    medias,
    proporcoes,
    boxplot,
    atividades,
    docDimMedias,
    docDimProporcoes,
    turmaDimBoxplot,
    turmaDimDescritivas: turmaDimBoxplot,
  };
}

async function getAutoavaliacaoBundle(filters) {
  const [
    propItens,
    medItens,
    boxItens,
    acPropSub,
    acMedSub,
    acBoxSub,
    adProp,
    adMed,
    adBox,
    atiProp,
    atiMed,
    atiBox,
    gesProp,
    gesMed,
    gesBox,
    proProp,
    proMed,
    proBox,
    instProp,
    instMed,
    instBox,
  ] = await Promise.all([
    getProportions(filters, endpointOptions('/discente/autoavaliacao/itens/proporcoes')),
    getMeans(filters, endpointOptions('/discente/autoavaliacao/itens/medias')),
    getBoxplot(filters, endpointOptions('/discente/autoavaliacao/itens/boxplot')),
    getProportions(filters, endpointOptions('/discente/acaodocente/subdimensoes/proporcoes')),
    getMeans(filters, endpointOptions('/discente/acaodocente/subdimensoes/medias')),
    getBoxplot(filters, endpointOptions('/discente/acaodocente/subdimensoes/boxplot')),
    getProportions(filters, endpointOptions('/docente/autoavaliacao/subdimensoes/proporcoes')),
    getMeans(filters, endpointOptions('/docente/autoavaliacao/subdimensoes/medias')),
    getBoxplot(filters, endpointOptions('/docente/autoavaliacao/subdimensoes/boxplot')),
    getProportions(filters, endpointOptions('/discente/atitudeprofissional/itens/proporcoes')),
    getMeans(filters, endpointOptions('/discente/atitudeprofissional/itens/medias')),
    getBoxplot(filters, endpointOptions('/discente/atitudeprofissional/itens/boxplot')),
    getProportions(filters, endpointOptions('/discente/gestaodidatica/itens/proporcoes')),
    getMeans(filters, endpointOptions('/discente/gestaodidatica/itens/medias')),
    getBoxplot(filters, endpointOptions('/discente/gestaodidatica/itens/boxplot')),
    getProportions(filters, endpointOptions('/discente/processoavaliativo/itens/proporcoes')),
    getMeans(filters, endpointOptions('/discente/processoavaliativo/itens/medias')),
    getBoxplot(filters, endpointOptions('/discente/processoavaliativo/itens/boxplot')),
    getProportions(filters, endpointOptions('/discente/instalacoes/itens/proporcoes')),
    getMeans(filters, endpointOptions('/discente/instalacoes/itens/medias')),
    getBoxplot(filters, endpointOptions('/discente/instalacoes/itens/boxplot')),
  ]);

  return {
    autoavaliacao: { propItens, medItens, boxItens },
    acao_docente_discente: { propSub: acPropSub, medSub: acMedSub, boxSub: acBoxSub },
    autoavaliacao_docente: { propSub: adProp, medSub: adMed, boxSub: adBox },
    atitude: { discProp: atiProp, discMed: atiMed, discBox: atiBox },
    gestao: { discProp: gesProp, discMed: gesMed, discBox: gesBox },
    processo: { discProp: proProp, discMed: proMed, discBox: proBox },
    instalacoes: { propItens: instProp, medItens: instMed, boxDisc: instBox },
  };
}

async function getBaseDocenteBundle(filters) {
  const [
    turmaMed,
    turmaProp,
    turmaBox,
    subMed,
    subProp,
    subBox,
    dimMed,
    dimProp,
    dimBox,
    atiProp,
    atiMed,
    atiBox,
    gesProp,
    gesMed,
    gesBox,
    proProp,
    proMed,
    proBox,
    instMedDoc,
    instPropDoc,
  ] = await Promise.all([
    getMeans(filters, endpointOptions('/docente/avaliacaoturma/itens/medias')),
    getProportions(filters, endpointOptions('/docente/avaliacaoturma/itens/proporcoes')),
    getBoxplot(filters, endpointOptions('/docente/avaliacaoturma/itens/boxplot')),
    getMeans(filters, endpointOptions('/docente_base/autoavaliacao/subdimensoes/medias')),
    getProportions(filters, endpointOptions('/docente_base/autoavaliacao/subdimensoes/proporcoes')),
    getBoxplot(filters, endpointOptions('/docente_base/autoavaliacao/subdimensoes/boxplot')),
    getMeans(filters, endpointOptions('/docente/dimensoes/medias')),
    getProportions(filters, endpointOptions('/docente/dimensoes/proporcoes')),
    getBoxplot(filters, endpointOptions('/docente/dimensoes/boxplot')),
    getProportions(filters, endpointOptions('/docente/atitudeprofissional/itens/proporcoes')),
    getMeans(filters, endpointOptions('/docente/atitudeprofissional/itens/medias')),
    getBoxplot(filters, endpointOptions('/docente/atitudeprofissional/itens/boxplot')),
    getProportions(filters, endpointOptions('/docente/gestaodidatica/itens/proporcoes')),
    getMeans(filters, endpointOptions('/docente/gestaodidatica/itens/medias')),
    getBoxplot(filters, endpointOptions('/docente/gestaodidatica/itens/boxplot')),
    getProportions(filters, endpointOptions('/docente/processoavaliativo/itens/proporcoes')),
    getMeans(filters, endpointOptions('/docente/processoavaliativo/itens/medias')),
    getBoxplot(filters, endpointOptions('/docente/processoavaliativo/itens/boxplot')),
    getMeans(filters, endpointOptions('/docente/instalacoes/itens/medias')),
    getProportions(filters, endpointOptions('/docente/instalacoes/itens/proporcoes')),
  ]);

  return {
    base_docente: {
      turmaMed,
      turmaProp,
      turmaBox,
      subMed,
      subProp,
      subBox,
      dimMed,
      dimProp,
      dimBox,
    },
    atitude: { docProp: atiProp, docMed: atiMed, docBox: atiBox },
    gestao: { docProp: gesProp, docMed: gesMed, docBox: gesBox },
    processo: { docProp: proProp, docMed: proMed, docBox: proBox },
    instalacoes: { medDoc: instMedDoc, propDoc: instPropDoc },
  };
}

async function getInstalacoesBundle(filters) {
  const [medItens, propItens, boxDisc, medDoc, propDoc] = await Promise.all([
    getMeans(filters, endpointOptions('/discente/instalacoes/itens/medias')),
    getProportions(filters, endpointOptions('/discente/instalacoes/itens/proporcoes')),
    getBoxplot(filters, endpointOptions('/discente/instalacoes/itens/boxplot')),
    getMeans(filters, endpointOptions('/docente/instalacoes/itens/medias')),
    getProportions(filters, endpointOptions('/docente/instalacoes/itens/proporcoes')),
  ]);

  return {
    instalacoes: { medItens, propItens, boxDisc, medDoc, propDoc },
  };
}

async function getAtividadesBundle(filters) {
  const [doc, disc] = await Promise.all([
    getActivities(filters, 'DOC'),
    getActivities(filters, 'DISC'),
  ]);

  return {
    atividades: { doc, disc },
  };
}

export async function queryAvaliaGraphEndpoint(endpoint, filters = {}) {
  if (endpoint === '/ping') {
    const { rows } = await queryAvaliaGraph('SELECT 1 AS ok');
    return rows[0] ?? { ok: 1 };
  }
  if (endpoint === '/filters/tree') return getFilterTreePayload();
  if (endpoint === '/filters') return getFilterPayload(filters);
  if (endpoint === '/filters/campus') {
    const anos = await getSemestres();
    const campus = await getCampusFilters(filters.ano);
    return { anos, campus };
  }
  if (endpoint === '/filters/cursos') {
    const cursos = await getCursoFilters(filters.ano, filters.campus);
    return { cursos };
  }
  if (endpoint === '/discente/geral/bundle' || endpoint === '/bundle/overview') {
    return getDashboardOverviewBundle(filters);
  }
  if (endpoint === '/discente/autoavaliacao/bundle') {
    return getAutoavaliacaoBundle(filters);
  }
  if (endpoint === '/discente/base_docente/bundle') {
    return getBaseDocenteBundle(filters);
  }
  if (endpoint === '/discente/instalacoes/bundle') {
    return getInstalacoesBundle(filters);
  }
  if (endpoint === '/discente/atividades/bundle') {
    return getAtividadesBundle(filters);
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
