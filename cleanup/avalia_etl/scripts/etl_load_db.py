from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd
from psycopg2.extras import execute_values

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
for path in (SCRIPT_DIR, PROJECT_ROOT):
    if str(path) not in sys.path:
        sys.path.append(str(path))

from sanitize_csvs import iter_raw_csv_files, sanitize_file
from src.db.connection import get_connection
from src.utils.logger import error, info, section, success, warning
from src.utils.normalizer import is_nullish, normalize_header, normalize_text


LIKERT_DISC_PATTERN = re.compile(r"^P(\d{3})$")
LIKERT_DOC_PATTERN = re.compile(r"^(\d{3})$")
MEDIA_DISC_PATTERN = re.compile(r"^MEDIAP(\d{3})$")
ATIVIDADE_PATTERN = re.compile(r"^4_1_1_[A-Z]$")
SEMESTER_FILE_PATTERN = re.compile(r"^(DISC|DOC)_(\d{4})_(\d+)_SNTZD$", re.IGNORECASE)
SEMESTER_FILTER_PATTERN = re.compile(r"^(\d{4})[-_](\d+)$")

DISC_REQUIRED_CONTEXT = (
    "DEPARTAMENTO",
    "DOCENTE",
    "CODIGO",
    "DISCIPLINA",
    "CURSO",
    "UND_ACAD_CURSO",
    "CAMPUS",
    "MATRICULA",
)

DOC_REQUIRED_CONTEXT = (
    "DEPARTAMENTO",
    "DOCENTE",
    "CODIGO",
    "DISCIPLINA",
    "CURSO",
    "UND_ACAD_CURSO",
    "CAMPUS",
)

UPSERT_PERIODO_SQL = """
INSERT INTO avalia.dim_periodo (ano, periodo)
VALUES (%s, %s)
ON CONFLICT (ano, periodo)
DO UPDATE SET ano = EXCLUDED.ano
RETURNING periodo_id;
"""

SELECT_ITEMS_SQL = """
SELECT tipo_item::text, codigo_item_origem, item_id
FROM avalia.dim_item
WHERE instrumento = %s AND ativo = TRUE;
"""

INSERT_ETL_CARGA_SQL = """
INSERT INTO avalia.etl_carga (semestre_ref, arquivo_disc, arquivo_doc, status)
VALUES (%s, %s, %s, 'PENDENTE')
RETURNING carga_id;
"""

UPDATE_ETL_CARGA_STATUS_SQL = """
UPDATE avalia.etl_carga
SET status = %s,
    finalizado_em = NOW(),
    mensagem_erro = %s
WHERE carga_id = %s;
"""

UPSERT_OFERTA_SQL = """
INSERT INTO avalia.dim_oferta (
    oferta_nk,
    periodo_id,
    departamento,
    docente,
    codigo_disciplina,
    disciplina,
    codigo_turma,
    horario,
    local,
    curso,
    und_acad_curso,
    campus,
    turno,
    id_legacy,
    contagem
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (oferta_nk)
DO UPDATE SET
    periodo_id = EXCLUDED.periodo_id,
    departamento = EXCLUDED.departamento,
    docente = EXCLUDED.docente,
    codigo_disciplina = EXCLUDED.codigo_disciplina,
    disciplina = EXCLUDED.disciplina,
    codigo_turma = COALESCE(EXCLUDED.codigo_turma, avalia.dim_oferta.codigo_turma),
    horario = COALESCE(EXCLUDED.horario, avalia.dim_oferta.horario),
    local = COALESCE(EXCLUDED.local, avalia.dim_oferta.local),
    curso = EXCLUDED.curso,
    und_acad_curso = EXCLUDED.und_acad_curso,
    campus = EXCLUDED.campus,
    turno = COALESCE(EXCLUDED.turno, avalia.dim_oferta.turno),
    id_legacy = COALESCE(EXCLUDED.id_legacy, avalia.dim_oferta.id_legacy),
    contagem = COALESCE(EXCLUDED.contagem, avalia.dim_oferta.contagem)
RETURNING oferta_id;
"""

INSERT_FATO_AVALIACAO_SQL = """
INSERT INTO avalia.fato_avaliacao (
    carga_id,
    instrumento,
    periodo_id,
    oferta_id,
    matricula,
    arquivo_origem,
    linha_origem,
    hash_linha
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT DO NOTHING
RETURNING avaliacao_id;
"""

SELECT_FATO_AVALIACAO_BY_HASH_SQL = """
SELECT avaliacao_id
FROM avalia.fato_avaliacao
WHERE instrumento = %s
  AND hash_linha = %s;
"""

SELECT_FATO_AVALIACAO_DISC_SQL = """
SELECT avaliacao_id
FROM avalia.fato_avaliacao
WHERE instrumento = 'DISC'
  AND periodo_id = %s
  AND oferta_id = %s
  AND matricula = %s;
"""

SELECT_FATO_AVALIACAO_DOC_SQL = """
SELECT avaliacao_id
FROM avalia.fato_avaliacao
WHERE instrumento = 'DOC'
  AND periodo_id = %s
  AND oferta_id = %s;
"""

INSERT_LIKERT_SQL = """
INSERT INTO avalia.fato_resposta_likert (avaliacao_id, item_id, valor)
VALUES %s
ON CONFLICT (avaliacao_id, item_id)
DO UPDATE SET valor = EXCLUDED.valor;
"""

INSERT_MEDIA_SQL = """
INSERT INTO avalia.fato_media_item (avaliacao_id, item_id, media)
VALUES %s
ON CONFLICT (avaliacao_id, item_id)
DO UPDATE SET media = EXCLUDED.media;
"""

INSERT_ATIVIDADE_SQL = """
INSERT INTO avalia.fato_atividade (
    avaliacao_id,
    item_id,
    valor_binario,
    valor_bruto,
    regra_conversao
)
VALUES %s
ON CONFLICT (avaliacao_id, item_id)
DO UPDATE SET
    valor_binario = EXCLUDED.valor_binario,
    valor_bruto = EXCLUDED.valor_bruto,
    regra_conversao = EXCLUDED.regra_conversao;
"""

CHECK_SCHEMA_SQL = """
SELECT to_regclass('avalia.dim_periodo') IS NOT NULL
   AND to_regclass('avalia.dim_oferta') IS NOT NULL
   AND to_regclass('avalia.dim_item') IS NOT NULL
   AND to_regclass('avalia.fato_avaliacao') IS NOT NULL
   AND to_regclass('avalia.fato_resposta_likert') IS NOT NULL
   AND to_regclass('avalia.fato_media_item') IS NOT NULL
   AND to_regclass('avalia.fato_atividade') IS NOT NULL
   AND to_regclass('avalia.etl_carga') IS NOT NULL;
"""


@dataclass
class SemesterFiles:
    year: int
    period: int
    disc_file: Path | None = None
    doc_file: Path | None = None

    @property
    def ref(self) -> str:
        return f"{self.year}-{self.period}"


@dataclass
class InstrumentStats:
    instrument: str
    file_path: Path
    rows_read: int = 0
    rows_skipped_context: int = 0
    rows_loaded: int = 0
    likert_records: int = 0
    media_records: int = 0
    atividade_records: int = 0
    unknown_likert_codes: set[str] | None = None
    unknown_media_codes: set[str] | None = None
    unknown_atividade_codes: set[str] | None = None

    def __post_init__(self) -> None:
        if self.unknown_likert_codes is None:
            self.unknown_likert_codes = set()
        if self.unknown_media_codes is None:
            self.unknown_media_codes = set()
        if self.unknown_atividade_codes is None:
            self.unknown_atividade_codes = set()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Sanitiza os CSVs DISC/DOC e carrega as respostas para o schema avalia no PostgreSQL."
        )
    )
    parser.add_argument(
        "--data-dir",
        default="data",
        type=Path,
        help="Diretorio base com os semestres (padrao: data).",
    )
    parser.add_argument(
        "--overwrite-sanitized",
        action="store_true",
        help="Sobrescreve arquivos *_SNTZD.csv existentes durante a sanitizacao.",
    )
    parser.add_argument(
        "--semester",
        type=str,
        help="Filtra um semestre especifico no formato AAAA-P (ex: 2024-2).",
    )
    return parser.parse_args()


def parse_semester_filter(value: str | None) -> tuple[int, int] | None:
    if not value:
        return None
    match = SEMESTER_FILTER_PATTERN.fullmatch(value.strip())
    if not match:
        raise ValueError(
            "Parametro --semester invalido. Use o formato AAAA-P, por exemplo: 2024-2."
        )
    return int(match.group(1)), int(match.group(2))


def to_optional_text(value: Any) -> str | None:
    normalized = normalize_text(value)
    return normalized or None


def to_optional_int(value: Any) -> int | None:
    if is_nullish(value):
        return None
    text = str(value).strip()
    text = text.replace(",", ".")
    try:
        number = float(text)
    except ValueError:
        return None
    integer = int(number)
    if abs(number - integer) > 1e-9:
        return None
    return integer


def to_optional_float(value: Any) -> float | None:
    if is_nullish(value):
        return None
    text = str(value).strip()
    text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def parse_likert_value(value: Any) -> int | None:
    numeric = to_optional_float(value)
    if numeric is None:
        return None
    integer = int(numeric)
    if abs(numeric - integer) > 1e-9:
        return None
    if integer not in (1, 2, 3, 4):
        return None
    return integer


def parse_media_value(value: Any) -> float | None:
    numeric = to_optional_float(value)
    if numeric is None:
        return None
    if numeric < 0 or numeric > 4:
        return None
    return round(numeric, 2)


def convert_atividade_value(value: Any, item_code: str) -> tuple[int | None, str | None, str | None]:
    if is_nullish(value):
        return 0, None, "VAZIO_PARA_ZERO"

    normalized = normalize_text(value)
    if normalized in {"0", "1"}:
        return int(normalized), normalized, None

    numeric = to_optional_float(normalized)
    if numeric is not None:
        integer = int(numeric)
        if abs(numeric - integer) < 1e-9 and integer in (0, 1):
            return integer, normalized, "NUMERICO_NORMALIZADO"

    if item_code == "4_1_1_P":
        return 1, normalized, "REGRA_LEGADA_4_1_1_P"

    return None, normalized, "NAO_CONVERSIVEL"


def hash_payload(payload: dict[str, Any]) -> str:
    serialized = json.dumps(payload, sort_keys=True, ensure_ascii=True, separators=(",", ":"))
    return hashlib.sha1(serialized.encode("utf-8")).hexdigest()


def build_oferta_nk(
    instrument: str,
    period_id: int,
    context: dict[str, Any],
) -> str:
    payload = {
        "instrument": instrument,
        "period_id": period_id,
        "departamento": context["departamento"],
        "docente": context["docente"],
        "codigo_disciplina": context["codigo_disciplina"],
        "disciplina": context["disciplina"],
        "codigo_turma": context["codigo_turma"],
        "horario": context["horario"],
        "local": context["local"],
        "curso": context["curso"],
        "und_acad_curso": context["und_acad_curso"],
        "campus": context["campus"],
        "turno": context["turno"],
        "id_legacy": context["id_legacy"],
        "contagem": context["contagem"],
    }
    return hash_payload(payload)


def read_csv_safely(path: Path) -> pd.DataFrame:
    encodings = ("utf-8-sig", "utf-8", "latin1", "cp1252")
    for encoding in encodings:
        try:
            return pd.read_csv(
                path,
                sep=";",
                dtype=str,
                keep_default_na=False,
                na_filter=False,
                encoding=encoding,
                low_memory=False,
            )
        except UnicodeDecodeError:
            continue
    return pd.read_csv(
        path,
        sep=";",
        dtype=str,
        keep_default_na=False,
        na_filter=False,
        low_memory=False,
    )


def sanitize_inputs(data_dir: Path, overwrite: bool) -> int:
    raw_files = iter_raw_csv_files(data_dir)
    if not raw_files:
        warning(f"Nenhum CSV bruto encontrado em {data_dir}.")
        return 0

    processed = 0
    section("Sanitizacao")
    for csv_path in raw_files:
        result = sanitize_file(csv_path, overwrite=overwrite)
        if result is None:
            continue

        output_path, row_count, column_count, removed_columns = result
        removed = ", ".join(removed_columns) if removed_columns else "nenhuma"
        info(
            f"{csv_path.name} -> {output_path.name} | linhas={row_count} | "
            f"colunas={column_count} | removidas={removed}"
        )
        processed += 1

    if processed == 0:
        info("Nenhum arquivo novo foi sanitizado (use --overwrite-sanitized para regenerar).")
    else:
        success(f"Sanitizacao concluida para {processed} arquivo(s).")
    return processed


def discover_sanitized_semesters(
    data_dir: Path, semester_filter: tuple[int, int] | None
) -> list[SemesterFiles]:
    grouped: dict[tuple[int, int], SemesterFiles] = {}

    for csv_path in sorted(data_dir.rglob("*_SNTZD.csv")):
        stem = csv_path.stem.upper()
        match = SEMESTER_FILE_PATTERN.fullmatch(stem)
        if not match:
            continue

        kind = match.group(1).upper()
        year = int(match.group(2))
        period = int(match.group(3))

        if semester_filter and (year, period) != semester_filter:
            continue

        key = (year, period)
        if key not in grouped:
            grouped[key] = SemesterFiles(year=year, period=period)

        if kind == "DISC":
            grouped[key].disc_file = csv_path
        elif kind == "DOC":
            grouped[key].doc_file = csv_path

    semesters = sorted(grouped.values(), key=lambda item: (item.year, item.period))
    return semesters


def ensure_schema(cursor: Any) -> None:
    cursor.execute(CHECK_SCHEMA_SQL)
    row = cursor.fetchone()
    if not row or not bool(row[0]):
        raise RuntimeError(
            "Schema/tabelas esperadas nao encontradas. Rode o DDL de avalia em db_model.md antes da carga."
        )


def get_or_create_period_id(cursor: Any, year: int, period: int) -> int:
    cursor.execute(UPSERT_PERIODO_SQL, (year, period))
    return int(cursor.fetchone()[0])


def load_item_lookup(cursor: Any, instrument: str) -> dict[str, dict[str, int]]:
    cursor.execute(SELECT_ITEMS_SQL, (instrument,))
    rows = cursor.fetchall()
    lookup: dict[str, dict[str, int]] = {"LIKERT": {}, "ATIVIDADE": {}}
    for tipo_item, codigo_item_origem, item_id in rows:
        lookup.setdefault(tipo_item, {})
        lookup[tipo_item][str(codigo_item_origem)] = int(item_id)
    return lookup


def get_or_create_oferta_id(
    cursor: Any,
    cache: dict[str, int],
    instrument: str,
    period_id: int,
    context: dict[str, Any],
) -> int:
    oferta_nk = build_oferta_nk(instrument, period_id, context)
    if oferta_nk in cache:
        return cache[oferta_nk]

    cursor.execute(
        UPSERT_OFERTA_SQL,
        (
            oferta_nk,
            period_id,
            context["departamento"],
            context["docente"],
            context["codigo_disciplina"],
            context["disciplina"],
            context["codigo_turma"],
            context["horario"],
            context["local"],
            context["curso"],
            context["und_acad_curso"],
            context["campus"],
            context["turno"],
            context["id_legacy"],
            context["contagem"],
        ),
    )
    oferta_id = int(cursor.fetchone()[0])
    cache[oferta_nk] = oferta_id
    return oferta_id


def get_or_create_avaliacao_id(
    cursor: Any,
    carga_id: int,
    instrument: str,
    period_id: int,
    oferta_id: int,
    matricula: str | None,
    file_path: Path,
    line_number: int,
    row_hash: str,
) -> int:
    cursor.execute(
        INSERT_FATO_AVALIACAO_SQL,
        (
            carga_id,
            instrument,
            period_id,
            oferta_id,
            matricula,
            file_path.as_posix(),
            line_number,
            row_hash,
        ),
    )
    inserted = cursor.fetchone()
    if inserted:
        return int(inserted[0])

    cursor.execute(SELECT_FATO_AVALIACAO_BY_HASH_SQL, (instrument, row_hash))
    by_hash = cursor.fetchone()
    if by_hash:
        return int(by_hash[0])

    if instrument == "DISC":
        cursor.execute(SELECT_FATO_AVALIACAO_DISC_SQL, (period_id, oferta_id, matricula))
    else:
        cursor.execute(SELECT_FATO_AVALIACAO_DOC_SQL, (period_id, oferta_id))

    row = cursor.fetchone()
    if not row:
        raise RuntimeError(
            f"Nao foi possivel recuperar avaliacao existente para {instrument} "
            f"(periodo_id={period_id}, oferta_id={oferta_id})."
        )
    return int(row[0])


def flush_fact_batches(
    cursor: Any,
    likert_batch: list[tuple[int, int, int]],
    media_batch: list[tuple[int, int, float]],
    atividade_batch: list[tuple[int, int, int | None, str | None, str | None]],
) -> tuple[int, int, int]:
    likert_count = len(likert_batch)
    media_count = len(media_batch)
    atividade_count = len(atividade_batch)

    if likert_batch:
        execute_values(cursor, INSERT_LIKERT_SQL, likert_batch, page_size=10_000)
        likert_batch.clear()

    if media_batch:
        execute_values(cursor, INSERT_MEDIA_SQL, media_batch, page_size=10_000)
        media_batch.clear()

    if atividade_batch:
        execute_values(cursor, INSERT_ATIVIDADE_SQL, atividade_batch, page_size=10_000)
        atividade_batch.clear()

    return likert_count, media_count, atividade_count


def build_context_from_row(
    instrument: str,
    row: dict[str, Any],
) -> tuple[dict[str, Any] | None, str | None]:
    if instrument == "DISC":
        required = DISC_REQUIRED_CONTEXT
    else:
        required = DOC_REQUIRED_CONTEXT

    context = {
        "departamento": to_optional_text(row.get("DEPARTAMENTO")),
        "docente": to_optional_text(row.get("DOCENTE")),
        "codigo_disciplina": to_optional_text(row.get("CODIGO")),
        "disciplina": to_optional_text(row.get("DISCIPLINA")),
        "codigo_turma": to_optional_text(row.get("CODIGO_TURMA")) if instrument == "DOC" else None,
        "horario": to_optional_text(row.get("HORARIO")) if instrument == "DOC" else None,
        "local": to_optional_text(row.get("LOCAL")),
        "curso": to_optional_text(row.get("CURSO")),
        "und_acad_curso": to_optional_text(row.get("UND_ACAD_CURSO")),
        "campus": to_optional_text(row.get("CAMPUS")),
        "turno": to_optional_text(row.get("TURNO")) if instrument == "DISC" else None,
        "id_legacy": to_optional_text(row.get("ID")) if instrument == "DISC" else None,
        "contagem": to_optional_int(row.get("CONTAGEM")) if instrument == "DISC" else None,
    }

    for column in required:
        value = to_optional_text(row.get(column))
        if not value:
            return None, f"Coluna obrigatoria ausente/vazia: {column}"

    if context["contagem"] is not None and context["contagem"] < 0:
        context["contagem"] = None

    if instrument == "DISC":
        matricula = to_optional_text(row.get("MATRICULA"))
        if not matricula:
            return None, "MATRICULA ausente/vazia"
        context["matricula"] = matricula
    else:
        context["matricula"] = None

    return context, None


def load_instrument_file(
    cursor: Any,
    carga_id: int,
    period_id: int,
    instrument: str,
    csv_path: Path,
) -> InstrumentStats:
    stats = InstrumentStats(instrument=instrument, file_path=csv_path)
    df = read_csv_safely(csv_path)
    df.columns = [normalize_header(column) for column in df.columns]
    stats.rows_read = len(df)

    item_lookup = load_item_lookup(cursor, instrument)
    likert_item_ids = item_lookup.get("LIKERT", {})
    atividade_item_ids = item_lookup.get("ATIVIDADE", {})

    all_columns = list(df.columns)
    if instrument == "DISC":
        likert_columns = [col for col in all_columns if LIKERT_DISC_PATTERN.match(col)]
        media_columns = [col for col in all_columns if MEDIA_DISC_PATTERN.match(col)]
    else:
        likert_columns = [col for col in all_columns if LIKERT_DOC_PATTERN.match(col)]
        media_columns = []
    atividade_columns = [col for col in all_columns if ATIVIDADE_PATTERN.match(col)]

    oferta_cache: dict[str, int] = {}
    likert_batch: list[tuple[int, int, int]] = []
    media_batch: list[tuple[int, int, float]] = []
    atividade_batch: list[tuple[int, int, int | None, str | None, str | None]] = []

    total_likert = 0
    total_media = 0
    total_atividade = 0

    for line_number, values in enumerate(df.itertuples(index=False, name=None), start=2):
        row = dict(zip(all_columns, values))

        context, context_error = build_context_from_row(instrument, row)
        if context_error:
            stats.rows_skipped_context += 1
            continue

        oferta_id = get_or_create_oferta_id(
            cursor=cursor,
            cache=oferta_cache,
            instrument=instrument,
            period_id=period_id,
            context=context,
        )

        row_hash = hash_payload({"instrumento": instrument, "row": row})
        avaliacao_id = get_or_create_avaliacao_id(
            cursor=cursor,
            carga_id=carga_id,
            instrument=instrument,
            period_id=period_id,
            oferta_id=oferta_id,
            matricula=context["matricula"],
            file_path=csv_path,
            line_number=line_number,
            row_hash=row_hash,
        )
        stats.rows_loaded += 1

        for column in likert_columns:
            item_id = likert_item_ids.get(column)
            if item_id is None:
                stats.unknown_likert_codes.add(column)
                continue

            parsed = parse_likert_value(row.get(column))
            if parsed is None:
                continue
            likert_batch.append((avaliacao_id, item_id, parsed))

        if instrument == "DISC":
            for column in media_columns:
                match = MEDIA_DISC_PATTERN.match(column)
                if not match:
                    continue
                origin_code = f"P{match.group(1)}"
                item_id = likert_item_ids.get(origin_code)
                if item_id is None:
                    stats.unknown_media_codes.add(origin_code)
                    continue

                parsed_media = parse_media_value(row.get(column))
                if parsed_media is None:
                    continue
                media_batch.append((avaliacao_id, item_id, parsed_media))

        for column in atividade_columns:
            item_id = atividade_item_ids.get(column)
            if item_id is None:
                stats.unknown_atividade_codes.add(column)
                continue

            valor_binario, valor_bruto, regra = convert_atividade_value(row.get(column), column)
            if valor_binario is None and not valor_bruto:
                continue
            atividade_batch.append((avaliacao_id, item_id, valor_binario, valor_bruto, regra))

        if len(likert_batch) >= 30_000 or len(media_batch) >= 20_000 or len(atividade_batch) >= 20_000:
            inserted_likert, inserted_media, inserted_atividade = flush_fact_batches(
                cursor,
                likert_batch,
                media_batch,
                atividade_batch,
            )
            total_likert += inserted_likert
            total_media += inserted_media
            total_atividade += inserted_atividade

    inserted_likert, inserted_media, inserted_atividade = flush_fact_batches(
        cursor,
        likert_batch,
        media_batch,
        atividade_batch,
    )
    total_likert += inserted_likert
    total_media += inserted_media
    total_atividade += inserted_atividade

    stats.likert_records = total_likert
    stats.media_records = total_media
    stats.atividade_records = total_atividade
    return stats


def execute_semester_load(
    connection: Any,
    semester: SemesterFiles,
) -> tuple[int, list[InstrumentStats]]:
    with connection.cursor() as cursor:
        ensure_schema(cursor)
        cursor.execute(
            INSERT_ETL_CARGA_SQL,
            (
                semester.ref,
                semester.disc_file.as_posix() if semester.disc_file else None,
                semester.doc_file.as_posix() if semester.doc_file else None,
            ),
        )
        carga_id = int(cursor.fetchone()[0])
    connection.commit()

    stats_list: list[InstrumentStats] = []
    try:
        with connection.cursor() as cursor:
            period_id = get_or_create_period_id(cursor, semester.year, semester.period)

            if semester.disc_file:
                stats_list.append(
                    load_instrument_file(
                        cursor=cursor,
                        carga_id=carga_id,
                        period_id=period_id,
                        instrument="DISC",
                        csv_path=semester.disc_file,
                    )
                )
            else:
                warning(f"Sem arquivo DISC sanitizado para {semester.ref}.")

            if semester.doc_file:
                stats_list.append(
                    load_instrument_file(
                        cursor=cursor,
                        carga_id=carga_id,
                        period_id=period_id,
                        instrument="DOC",
                        csv_path=semester.doc_file,
                    )
                )
            else:
                warning(f"Sem arquivo DOC sanitizado para {semester.ref}.")

            cursor.execute(UPDATE_ETL_CARGA_STATUS_SQL, ("SUCESSO", None, carga_id))
        connection.commit()
    except Exception as exc:
        connection.rollback()
        message = str(exc)[:5000]
        with connection.cursor() as cursor:
            cursor.execute(UPDATE_ETL_CARGA_STATUS_SQL, ("ERRO", message, carga_id))
        connection.commit()
        raise

    return carga_id, stats_list


def print_stats(semester_ref: str, carga_id: int, stats_list: list[InstrumentStats]) -> None:
    section(f"Resumo da carga {semester_ref} (carga_id={carga_id})")
    for stats in stats_list:
        info(f"[{stats.instrument}] arquivo: {stats.file_path.name}")
        info(f"[{stats.instrument}] linhas lidas: {stats.rows_read}")
        info(f"[{stats.instrument}] linhas descartadas por contexto: {stats.rows_skipped_context}")
        info(f"[{stats.instrument}] avaliacoes processadas: {stats.rows_loaded}")
        info(f"[{stats.instrument}] fatos likert (upserts): {stats.likert_records}")
        info(f"[{stats.instrument}] fatos media (upserts): {stats.media_records}")
        info(f"[{stats.instrument}] fatos atividade (upserts): {stats.atividade_records}")

        if stats.unknown_likert_codes:
            warning(
                f"[{stats.instrument}] codigos LIKERT sem dim_item: "
                + ", ".join(sorted(stats.unknown_likert_codes))
            )
        if stats.unknown_media_codes:
            warning(
                f"[{stats.instrument}] codigos MEDIA sem dim_item: "
                + ", ".join(sorted(stats.unknown_media_codes))
            )
        if stats.unknown_atividade_codes:
            warning(
                f"[{stats.instrument}] codigos ATIVIDADE sem dim_item: "
                + ", ".join(sorted(stats.unknown_atividade_codes))
            )


def main() -> int:
    args = parse_args()

    try:
        data_dir = args.data_dir.resolve()
        if not data_dir.exists() or not data_dir.is_dir():
            raise FileNotFoundError(f"Diretorio de dados nao encontrado: {data_dir}")

        semester_filter = parse_semester_filter(args.semester)
        sanitize_inputs(data_dir, overwrite=args.overwrite_sanitized)

        semesters = discover_sanitized_semesters(data_dir, semester_filter)
        if not semesters:
            warning("Nenhum arquivo sanitizado *_SNTZD.csv encontrado para carga.")
            return 0

        section("Carga no banco")
        connection = get_connection()
        try:
            for semester in semesters:
                info(f"Processando semestre {semester.ref}...")
                carga_id, stats_list = execute_semester_load(connection, semester)
                print_stats(semester.ref, carga_id, stats_list)
                success(f"Carga finalizada com sucesso para {semester.ref}.")
        finally:
            connection.close()

        success("Processo de ETL concluido.")
        return 0
    except Exception as exc:
        error(str(exc))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
