from __future__ import annotations

from pathlib import Path
from typing import Any

from psycopg2.extras import execute_values

from src.catalog import EntityCatalog, Questionnaire
from src.graph_calculator import GraphResults, GroupKey, Scope
from src.utils.normalizer import normalize_text


SCHEMA = "avalia_presencial_graph"


def _ensure_schema(cursor: Any) -> None:
    cursor.execute("SELECT to_regclass(%s)", (f"{SCHEMA}.semestre",))
    if cursor.fetchone()[0] is None:
        raise RuntimeError(
            "Esquema do banco de gráficos não encontrado. Execute sql/schema.sql primeiro."
        )


def _insert_questionnaire(cursor: Any, questionnaire: Questionnaire) -> int:
    cursor.execute(
        f"""
        SELECT questionario_versao_id, catalogo_sha256
        FROM {SCHEMA}.questionario_versao
        WHERE codigo = %s
        """,
        (questionnaire.code,),
    )
    existing = cursor.fetchone()
    if existing:
        if existing[1].strip() != questionnaire.sha256:
            raise RuntimeError(
                f"O questionário {questionnaire.code} já existe com outro hash. "
                "Crie uma nova versão em config/questionarios.json."
            )
        return int(existing[0])

    cursor.execute(
        f"""
        INSERT INTO {SCHEMA}.questionario_versao (
            codigo, descricao, vigente_desde_ano, vigente_desde_periodo, catalogo_sha256
        ) VALUES (%s, %s, %s, %s, %s)
        RETURNING questionario_versao_id
        """,
        (
            questionnaire.code, questionnaire.description,
            questionnaire.valid_from_year, questionnaire.valid_from_period,
            questionnaire.sha256,
        ),
    )
    return int(cursor.fetchone()[0])


def _insert_entities(
    cursor: Any, entities: EntityCatalog
) -> tuple[dict[str, int], dict[str, int]]:
    campuses_to_insert = [(normalize_text(name), name) for name in entities.campuses]
    for code, name in entities.discovered_campuses.items():
        campuses_to_insert.append((code, name))
        
    execute_values(
        cursor,
        f"""
        INSERT INTO {SCHEMA}.campus (codigo, nome) VALUES %s
        ON CONFLICT (codigo) DO NOTHING
        """,
        campuses_to_insert,
    )
    
    courses_to_insert = [(normalize_text(name), name) for name in entities.courses]
    for code, name in entities.discovered_courses.items():
        courses_to_insert.append((code, name))
        
    execute_values(
        cursor,
        f"""
        INSERT INTO {SCHEMA}.curso (codigo, nome) VALUES %s
        ON CONFLICT (codigo) DO NOTHING
        """,
        courses_to_insert,
    )
    cursor.execute(f"SELECT codigo, campus_id FROM {SCHEMA}.campus")
    campus_ids = {row[0]: int(row[1]) for row in cursor.fetchall()}
    cursor.execute(f"SELECT codigo, curso_id FROM {SCHEMA}.curso")
    course_ids = {row[0]: int(row[1]) for row in cursor.fetchall()}
    return campus_ids, course_ids


def _insert_catalog(
    cursor: Any, questionnaire_id: int, questionnaire: Questionnaire
) -> dict[GroupKey, int]:
    execute_values(
        cursor,
        f"""
        INSERT INTO {SCHEMA}.agrupador (
            questionario_versao_id, instrumento, familia, nivel, codigo,
            rotulo, ordem_bloco, ordem_item
        ) VALUES %s
        ON CONFLICT (questionario_versao_id, instrumento, familia, nivel, codigo)
        DO NOTHING
        """,
        [
            (
                questionnaire_id, group.instrument, group.family, group.level,
                group.code, group.label, group.block_order, group.item_order,
            )
            for group in questionnaire.groups
        ],
    )
    execute_values(
        cursor,
        f"""
        INSERT INTO {SCHEMA}.item_questionario (
            questionario_versao_id, instrumento, familia, coluna_origem,
            coluna_media_origem, codigo, enunciado, dimensao_codigo,
            subdimensao_codigo, ordem_bloco, ordem_item
        ) VALUES %s
        ON CONFLICT (questionario_versao_id, instrumento, familia, coluna_origem)
        DO NOTHING
        """,
        [
            (
                questionnaire_id, item.instrument, item.family, item.source_column,
                item.media_column, item.code, item.label, item.dimension_code,
                item.subdimension_code, item.dimension_order, item.item_order,
            )
            for item in questionnaire.items
        ],
    )
    cursor.execute(
        f"""
        SELECT instrumento, familia, nivel, codigo, agrupador_id
        FROM {SCHEMA}.agrupador
        WHERE questionario_versao_id = %s
        """,
        (questionnaire_id,),
    )
    return {
        (row[0], row[1], row[2], row[3]): int(row[4])
        for row in cursor.fetchall()
    }


def _insert_semester(
    cursor: Any,
    year: int,
    period: int,
    questionnaire_id: int,
    calculation_version: str,
    entity_catalog_version: int,
    entity_catalog_sha256: str,
    disc_file: Path,
    doc_file: Path,
    sha256_disc: str,
    sha256_doc: str,
    results: GraphResults,
) -> int:
    cursor.execute(
        f"SELECT semestre_id FROM {SCHEMA}.semestre WHERE ano = %s AND periodo = %s",
        (year, period),
    )
    if cursor.fetchone():
        raise RuntimeError(
            f"O semestre {year}-{period} já existe. Semestres publicados são imutáveis."
        )
    cursor.execute(
        f"""
        INSERT INTO {SCHEMA}.semestre (
            ano, periodo, questionario_versao_id, versao_calculo,
            entidades_versao, entidades_sha256,
            arquivo_disc, arquivo_doc, sha256_disc, sha256_doc,
            linhas_disc, linhas_doc
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING semestre_id
        """,
        (
            year, period, questionnaire_id, calculation_version,
            entity_catalog_version, entity_catalog_sha256,
            disc_file.name, doc_file.name, sha256_disc, sha256_doc,
            results.rows_disc, results.rows_doc,
        ),
    )
    return int(cursor.fetchone()[0])


def _insert_scopes(
    cursor: Any,
    semester_id: int,
    scopes: set[Scope],
    campus_ids: dict[str, int],
    course_ids: dict[str, int],
) -> dict[Scope, int]:
    scope_ids: dict[Scope, int] = {}
    for scope in sorted(scopes, key=lambda value: tuple(part or "" for part in value)):
        level, campus, course = scope
        cursor.execute(
            f"""
            INSERT INTO {SCHEMA}.recorte (semestre_id, nivel, campus_id, curso_id)
            VALUES (%s, %s, %s, %s)
            RETURNING recorte_id
            """,
            (
                semester_id, level,
                campus_ids[campus] if campus else None,
                course_ids[course] if course else None,
            ),
        )
        scope_ids[scope] = int(cursor.fetchone()[0])
    return scope_ids


def _bulk_insert(cursor: Any, table: str, columns: str, rows: list[tuple[Any, ...]]) -> None:
    if rows:
        execute_values(
            cursor,
            f"INSERT INTO {SCHEMA}.{table} ({columns}) VALUES %s",
            rows,
            page_size=5_000,
        )


def _insert_results(
    cursor: Any,
    results: GraphResults,
    scope_ids: dict[Scope, int],
    group_ids: dict[GroupKey, int],
    campus_ids: dict[str, int],
    course_ids: dict[str, int],
) -> None:
    _bulk_insert(
        cursor, "resultado_resumo",
        "recorte_id, total_respondentes, melhor_campus_id, melhor_campus_media, "
        "pior_campus_id, pior_campus_media",
        [
            (
                scope_ids[row["scope"]], row["participants"],
                campus_ids[row["best_campus"]] if row["best_campus"] else None,
                row["best_mean"],
                campus_ids[row["worst_campus"]] if row["worst_campus"] else None,
                row["worst_mean"],
            )
            for row in results.summaries
        ],
    )
    _bulk_insert(
        cursor, "resultado_media_likert",
        "recorte_id, agrupador_id, soma, quantidade, media",
        [
            (scope_ids[row["scope"]], group_ids[row["group"]], row["sum"], row["count"], row["mean"])
            for row in results.means
        ],
    )
    _bulk_insert(
        cursor, "resultado_proporcao_likert",
        "recorte_id, agrupador_id, valor_likert, quantidade, total, percentual",
        [
            (
                scope_ids[row["scope"]], group_ids[row["group"]], row["value"],
                row["count"], row["total"], row["percentage"],
            )
            for row in results.proportions
        ],
    )
    _bulk_insert(
        cursor, "resultado_boxplot",
        "recorte_id, agrupador_id, minimo, q1, mediana, media, q3, maximo, quantidade",
        [
            (
                scope_ids[row["scope"]], group_ids[row["group"]], row["min"],
                row["q1"], row["median"], row["mean"], row["q3"], row["max"], row["count"],
            )
            for row in results.boxplots
        ],
    )
    _bulk_insert(
        cursor, "resultado_boxplot_outlier",
        "recorte_id, agrupador_id, sequencia, valor",
        [
            (
                scope_ids[row["scope"]], group_ids[row["group"]],
                row["sequence"], row["value"],
            )
            for row in results.outliers
        ],
    )
    _bulk_insert(
        cursor, "resultado_atividade",
        "recorte_id, agrupador_id, quantidade_positiva, total, percentual",
        [
            (
                scope_ids[row["scope"]], group_ids[row["group"]],
                row["positive"], row["total"], row["percentage"],
            )
            for row in results.activities
        ],
    )
    _bulk_insert(
        cursor, "ranking_media_curso",
        "recorte_id, agrupador_id, posicao, curso_id, soma, quantidade, media",
        [
            (
                scope_ids[row["scope"]], group_ids[row["group"]], row["position"],
                course_ids[row["course"]], row["sum"], row["count"], row["mean"],
            )
            for row in results.mean_rankings
        ],
    )
    _bulk_insert(
        cursor, "ranking_atividade_curso",
        "recorte_id, instrumento, posicao, curso_id, quantidade_positiva, total, percentual",
        [
            (
                scope_ids[row["scope"]], row["instrument"], row["position"],
                course_ids[row["course"]], row["positive"], row["total"], row["percentage"],
            )
            for row in results.activity_rankings
        ],
    )


def persist_semester(
    connection: Any,
    *,
    year: int,
    period: int,
    calculation_version: str,
    disc_file: Path,
    doc_file: Path,
    sha256_disc: str,
    sha256_doc: str,
    questionnaire: Questionnaire,
    entities: EntityCatalog,
    results: GraphResults,
) -> int:
    with connection:
        with connection.cursor() as cursor:
            _ensure_schema(cursor)
            cursor.execute(
                "SELECT pg_advisory_xact_lock(%s, %s)",
                (731_204, year * 10 + period),
            )
            questionnaire_id = _insert_questionnaire(cursor, questionnaire)
            campus_ids, course_ids = _insert_entities(cursor, entities)
            group_ids = _insert_catalog(cursor, questionnaire_id, questionnaire)
            semester_id = _insert_semester(
                cursor, year, period, questionnaire_id, calculation_version,
                entities.version, entities.sha256,
                disc_file, doc_file, sha256_disc, sha256_doc, results,
            )
            scope_ids = _insert_scopes(
                cursor, semester_id, results.scopes, campus_ids, course_ids
            )
            _insert_results(
                cursor, results, scope_ids, group_ids, campus_ids, course_ids
            )
            cursor.execute("SELECT pg_database_size(current_database())")
            database_size = int(cursor.fetchone()[0])
            if database_size > 500 * 1024 * 1024:
                raise RuntimeError(
                    f"A carga ultrapassaria o limite de 500 MB ({database_size} bytes)."
                )
            return semester_id


def assert_semester_missing(connection: Any, year: int, period: int) -> None:
    with connection.cursor() as cursor:
        _ensure_schema(cursor)
        cursor.execute(
            f"SELECT 1 FROM {SCHEMA}.semestre WHERE ano = %s AND periodo = %s",
            (year, period),
        )
        if cursor.fetchone():
            raise RuntimeError(
                f"O semestre {year}-{period} já existe. Semestres publicados são imutáveis."
            )
