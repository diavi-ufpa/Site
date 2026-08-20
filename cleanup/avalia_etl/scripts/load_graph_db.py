from __future__ import annotations

import argparse
import hashlib
import re
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.catalog import EntityCatalog, load_questionnaire
from src.db.graph_connection import get_graph_connection
from src.db.graph_repository import assert_semester_missing, persist_semester
from src.graph_calculator import calculate_graphs, read_source
from src.utils.logger import info, section, success


CALCULATION_VERSION = "graph-v1"
SEMESTER_PATTERN = re.compile(r"^(\d{4})[-_](\d+)$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Pré-calcula e persiste os resultados dos gráficos do Avalia Presencial."
    )
    parser.add_argument(
        "--semester", required=True,
        help="Semestre imutável no formato AAAA-P, por exemplo 2024-2.",
    )
    parser.add_argument("--disc", type=Path, help="Arquivo DISC CSV ou XLSX.")
    parser.add_argument("--doc", type=Path, help="Arquivo DOC CSV ou XLSX.")
    parser.add_argument(
        "--data-dir", type=Path, default=PROJECT_ROOT / "data",
        help="Diretório usado para descobrir DISC/DOC quando os caminhos não forem informados.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Calcula e valida tudo localmente, sem conectar nem gravar no PostgreSQL.",
    )
    return parser.parse_args()


def parse_semester(value: str) -> tuple[int, int]:
    match = SEMESTER_PATTERN.fullmatch(value.strip())
    if not match:
        raise ValueError("Semestre inválido. Use o formato AAAA-P, por exemplo 2024-2.")
    return int(match.group(1)), int(match.group(2))


def discover_file(data_dir: Path, instrument: str, year: int, period: int) -> Path:
    prefix = f"{instrument}_{year}_{period}"
    candidates = [
        path for path in data_dir.rglob("*")
        if path.is_file()
        and path.suffix.lower() in {".csv", ".xlsx"}
        and path.stem.upper() == prefix
    ]
    if len(candidates) != 1:
        found = ", ".join(str(path) for path in candidates) or "nenhum"
        raise ValueError(
            f"Esperado exatamente um arquivo {prefix}.csv/xlsx; encontrados: {found}."
        )
    return candidates[0]


def resolve_file(
    explicit: Path | None, data_dir: Path, instrument: str, year: int, period: int
) -> Path:
    path = explicit if explicit else discover_file(data_dir, instrument, year, period)
    path = path.resolve()
    if not path.is_file():
        raise FileNotFoundError(f"Arquivo não encontrado: {path}")
    if path.stem.upper().endswith("_SNTZD"):
        raise ValueError(
            f"{path.name} é um arquivo derivado. Informe a planilha bruta oficial."
        )
    expected_prefix = f"{instrument}_{year}_{period}"
    if not path.stem.upper().startswith(expected_prefix):
        from src.utils.logger import warn
        warn(
            f"{path.name} não segue o padrão de nome {expected_prefix}. "
            "O semestre selecionado na interface será utilizado."
        )
    return path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_doc_semester(doc: object, year: int, period: int) -> None:
    """Verifica se as colunas ANO/PERIODO do DOC coincidem com a execução.

    Se as colunas estiverem ausentes ou vazias, aceita silenciosamente — o
    semestre selecionado na interface prevalece.  Se os valores existirem e
    divergirem, emite um aviso sem interromper a carga.
    """
    has_year = "ANO" in doc.columns
    has_period = "PERIODO" in doc.columns

    if not has_year and not has_period:
        # Nenhuma declaração na planilha; o semestre da interface prevalece.
        return

    source_years = set()
    source_periods = set()
    if has_year:
        source_years = set(doc["ANO"].astype(str).str.strip()) - {""}
    if has_period:
        source_periods = set(doc["PERIODO"].astype(str).str.strip()) - {""}

    if not source_years and not source_periods:
        # Colunas existem, mas estão todas vazias; aceita normalmente.
        return

    mismatches: list[str] = []
    if source_years and source_years != {str(year)}:
        mismatches.append(
            f"ANO na planilha = {sorted(source_years)}, esperado = {year}"
        )
    if source_periods and source_periods != {str(period)}:
        mismatches.append(
            f"PERIODO na planilha = {sorted(source_periods)}, esperado = {period}"
        )

    if mismatches:
        from src.utils.logger import warn
        warn(
            "A base DOC declara ano/período diferente do selecionado na interface: "
            + "; ".join(mismatches) + ". "
            "O semestre da interface será utilizado."
        )


def print_result_counts(results: object) -> None:
    section("Resultados pré-calculados")
    for label, attribute in (
        ("recortes", "scopes"),
        ("resumos", "summaries"),
        ("médias", "means"),
        ("proporções", "proportions"),
        ("boxplots", "boxplots"),
        ("outliers", "outliers"),
        ("atividades", "activities"),
        ("rankings de média", "mean_rankings"),
        ("rankings de atividade", "activity_rankings"),
    ):
        info(f"{label}: {len(getattr(results, attribute))}")


def main() -> None:
    args = parse_args()
    year, period = parse_semester(args.semester)
    disc_file = resolve_file(args.disc, args.data_dir.resolve(), "DISC", year, period)
    doc_file = resolve_file(args.doc, args.data_dir.resolve(), "DOC", year, period)
    entities_path = PROJECT_ROOT / "config" / "entidades.json"
    questionnaires_path = PROJECT_ROOT / "config" / "questionarios.json"

    section(f"Avalia Presencial {year}-{period}")
    info(f"DISC: {disc_file}")
    info(f"DOC: {doc_file}")
    entities = EntityCatalog(entities_path)
    questionnaire = load_questionnaire(questionnaires_path, year, period)
    info(f"Questionário: {questionnaire.code}")

    if not args.dry_run:
        preflight_connection = get_graph_connection()
        try:
            assert_semester_missing(preflight_connection, year, period)
        finally:
            preflight_connection.close()

    sha_disc = sha256_file(disc_file)
    sha_doc = sha256_file(doc_file)
    disc = read_source(disc_file)
    doc = read_source(doc_file)
    validate_doc_semester(doc, year, period)
    results = calculate_graphs(disc, doc, questionnaire, entities)
    print_result_counts(results)

    if sha256_file(disc_file) != sha_disc or sha256_file(doc_file) != sha_doc:
        raise RuntimeError("Uma fonte foi alterada durante o cálculo; carga cancelada.")

    if args.dry_run:
        success("Cálculo e validações concluídos; banco não alterado (--dry-run).")
        return

    connection = get_graph_connection()
    try:
        semester_id = persist_semester(
            connection,
            year=year,
            period=period,
            calculation_version=CALCULATION_VERSION,
            disc_file=disc_file,
            doc_file=doc_file,
            sha256_disc=sha_disc,
            sha256_doc=sha_doc,
            questionnaire=questionnaire,
            entities=entities,
            results=results,
        )
    finally:
        connection.close()
    success(f"Semestre {year}-{period} inserido com semestre_id={semester_id}.")


if __name__ == "__main__":
    main()
