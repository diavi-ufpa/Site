from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from src.utils.normalizer import normalize_header, normalize_text

DISC_UNUSED_COLUMNS = {
    normalize_header("OBSERVACOES"),
    normalize_header("QUANTIDADE_TRANCAMENTOS"),
    normalize_header("CURSO2"),
    normalize_header("UND-ACAD-CURSO3"),
    normalize_header("MOD4"),
    normalize_header("COD_INEP"),
}

DOC_UNUSED_COLUMNS = {
    normalize_header("OBSERVACOES_DOCENTE_TURMA"),
    normalize_header("OBSERVACOES_GERAIS"),
    normalize_header("CODIGO_copy"),
    normalize_header("MATRIZ"),
}


def get_csv_kind(csv_path: Path) -> str | None:
    name = csv_path.name.upper()
    if name.startswith("DISC_"):
        return "DISC"
    if name.startswith("DOC_"):
        return "DOC"
    return None


def output_path_for(csv_path: Path) -> Path:
    stem = csv_path.stem
    return csv_path.with_name(f"{stem}_SNTZD{csv_path.suffix}")


def sanitize_dataframe(df: pd.DataFrame, kind: str) -> tuple[pd.DataFrame, list[str]]:
    df = df.copy()
    df.columns = [normalize_header(column) for column in df.columns]

    if kind == "DISC":
        to_drop = [column for column in DISC_UNUSED_COLUMNS if column in df.columns]
    else:
        to_drop = [column for column in DOC_UNUSED_COLUMNS if column in df.columns]

    if to_drop:
        df = df.drop(columns=to_drop)

    for column in df.columns:
        df[column] = df[column].map(normalize_text)

    return df, sorted(to_drop)


def iter_raw_csv_files(data_dir: Path) -> list[Path]:
    csv_files = sorted(data_dir.rglob("*.csv"))
    return [path for path in csv_files if not path.name.upper().endswith("_SNTZD.CSV")]


def sanitize_file(csv_path: Path, overwrite: bool) -> tuple[Path, int, int, list[str]] | None:
    kind = get_csv_kind(csv_path)
    if kind is None:
        return None

    output_path = output_path_for(csv_path)
    if output_path.exists() and not overwrite:
        return None

    df = pd.read_csv(
        csv_path,
        sep=";",
        dtype=str,
        keep_default_na=False,
        na_filter=False,
        encoding="utf-8-sig",
    )

    sanitized_df, removed_columns = sanitize_dataframe(df, kind)
    sanitized_df.to_csv(output_path, sep=";", index=False, encoding="utf-8-sig")

    return output_path, len(df), len(sanitized_df.columns), removed_columns


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sanitiza CSVs DISC_/DOC_ criando arquivos *_SNTZD.csv no mesmo diretorio."
    )
    parser.add_argument(
        "--data-dir",
        default="data",
        type=Path,
        help="Diretorio base com as pastas de semestre (padrao: data).",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Sobrescreve arquivos *_SNTZD.csv existentes.",
    )
    args = parser.parse_args()

    data_dir = args.data_dir.resolve()
    if not data_dir.exists() or not data_dir.is_dir():
        raise FileNotFoundError(f"Diretorio de dados nao encontrado: {data_dir}")

    raw_csv_files = iter_raw_csv_files(data_dir)
    if not raw_csv_files:
        print(f"Nenhum CSV bruto encontrado em {data_dir}.")
        return

    processed = 0
    for csv_path in raw_csv_files:
        result = sanitize_file(csv_path, overwrite=args.overwrite)
        if result is None:
            continue

        output_path, row_count, column_count, removed_columns = result
        removed = ", ".join(removed_columns) if removed_columns else "nenhuma"
        print(
            f"[OK] {csv_path.name} -> {output_path.name} | linhas={row_count} | "
            f"colunas={column_count} | removidas={removed}"
        )
        processed += 1

    if processed == 0:
        print("Nenhum arquivo foi processado (verifique --overwrite se os _SNTZD ja existem).")


if __name__ == "__main__":
    main()
