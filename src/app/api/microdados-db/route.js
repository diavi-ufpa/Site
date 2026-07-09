import {
  isMicrodadosDatabaseConfigured,
  queryMicrodados,
} from '@/lib/microdados-db';
import { requireIdentityUser } from '@/lib/require-identity-user';

export const dynamic = 'force-dynamic';

const SCHEMA = 'microdados';

function normalizeParam(value, fallback = null) {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  if (['todos', 'todas', 'all', 'null', 'none'].includes(raw.toLowerCase())) return fallback;
  return raw;
}

function toInt(value, fallback = null) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function json(payload, init = {}) {
  return Response.json(payload, {
    ...init,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Data-Source': 'neon-microdados',
      ...(init.headers ?? {}),
    },
  });
}

async function getFilters(searchParams) {
  const ano = toInt(searchParams.get('ano'));
  const municipio = normalizeParam(searchParams.get('municipio'));

  const { rows: years } = await queryMicrodados(
    `SELECT DISTINCT ano FROM ${SCHEMA}.dim_curso_ufpa ORDER BY ano DESC`
  );

  const year = ano ?? Number(years[0]?.ano ?? 2023);

  const { rows: municipios } = await queryMicrodados(
    `
      SELECT DISTINCT municipio
      FROM ${SCHEMA}.dim_curso_ufpa
      WHERE ano = $1
      ORDER BY municipio
    `,
    [year]
  );

  const selectedMunicipio = municipio ?? municipios[0]?.municipio ?? null;

  const { rows: cursos } = await queryMicrodados(
    `
      SELECT co_curso, nome_curso, municipio
      FROM ${SCHEMA}.dim_curso_ufpa
      WHERE ano = $1
        AND ($2::text IS NULL OR municipio = $2::text)
      ORDER BY nome_curso
    `,
    [year, selectedMunicipio]
  );

  return {
    anos: years.map((row) => Number(row.ano)),
    municipios: municipios.map((row) => row.municipio),
    cursos,
    defaultAno: year,
    defaultMunicipio: selectedMunicipio,
    defaultCurso: cursos[0]?.co_curso ?? null,
  };
}

async function getDashboard(searchParams) {
  const ano = toInt(searchParams.get('ano'), 2023);
  const coCurso = toInt(searchParams.get('co_curso'));
  if (!coCurso) {
    return {
      curso: null,
      comparativo: [],
      ranking: [],
      qe: [],
    };
  }

  const { rows: cursoRows } = await queryMicrodados(
    `
      SELECT *
      FROM ${SCHEMA}.dim_curso_ufpa
      WHERE ano = $1 AND co_curso = $2
      LIMIT 1
    `,
    [ano, coCurso]
  );

  const { rows: comparativo } = await queryMicrodados(
    `
      SELECT
        tema,
        participantes_ufpa,
        participantes_brasil,
        nota_ufpa_percentual::float AS nota_ufpa_percentual,
        nota_brasil_percentual::float AS nota_brasil_percentual,
        razao_ufpa_brasil::float AS razao_ufpa_brasil
      FROM ${SCHEMA}.fato_ce_comparativo
      WHERE ano = $1 AND co_curso = $2
      ORDER BY tema
    `,
    [ano, coCurso]
  );

  const { rows: ranking } = await queryMicrodados(
    `
      SELECT
        tema,
        recorte,
        co_curso_top1,
        co_ies_top1,
        nome_ies_top1,
        participantes_top1,
        nota_top1_percentual::float AS nota_top1_percentual,
        nota_ufpa_percentual::float AS nota_ufpa_percentual
      FROM ${SCHEMA}.fato_ce_ranking_top1
      WHERE ano = $1 AND co_curso_ufpa = $2
      ORDER BY tema, recorte
    `,
    [ano, coCurso]
  );

  const { rows: qe } = await queryMicrodados(
    `
      SELECT
        dimensao,
        questao,
        ordem,
        media_1_6::float AS media_1_6,
        respostas_1_2,
        respostas_3_4,
        respostas_5_6,
        respostas_7_8,
        total_respostas
      FROM ${SCHEMA}.fato_qe_resumo
      WHERE ano = $1 AND co_curso = $2
      ORDER BY dimensao, ordem
    `,
    [ano, coCurso]
  );

  return {
    curso: cursoRows[0] ?? null,
    comparativo,
    ranking,
    qe,
  };
}

export async function GET(req) {
  let endpoint = null;

  try {
    const auth = await requireIdentityUser(req);
    if (!auth.ok) {
      return json({ error: auth.error }, { status: auth.status });
    }

    if (!isMicrodadosDatabaseConfigured()) {
      return json(
        {
          error: 'Banco de Microdados indisponivel.',
          details: 'MICRODADOS_DATABASE_URL nao esta carregada no ambiente server-side.',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    endpoint = normalizeParam(searchParams.get('endpoint'), 'dashboard');

    if (endpoint === 'filters') {
      return json(await getFilters(searchParams));
    }

    if (endpoint === 'dashboard') {
      return json(await getDashboard(searchParams));
    }

    return json({ error: 'Endpoint invalido.' }, { status: 400 });
  } catch (err) {
    console.error('[microdados-db] fatal:', {
      endpoint,
      message: err?.message,
      stack: err?.stack,
    });

    return json(
      {
        error: 'Erro ao consultar microdados.',
        details: err?.message ?? 'Erro desconhecido',
      },
      { status: err?.status ?? 500 }
    );
  }
}
