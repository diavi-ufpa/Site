from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import re
from typing import Any

import pandas as pd

from src.catalog import EntityCatalog, QuestionItem, Questionnaire
from src.utils.normalizer import normalize_header, normalize_text


Scope = tuple[str, str | None, str | None]
GroupKey = tuple[str, str, str, str]
SCOPE_SPECS = (
    ("SEMESTRE", []),
    ("CAMPUS", ["__campus"]),
    ("CURSO", ["__curso"]),
    ("CAMPUS_CURSO", ["__campus", "__curso"]),
)


@dataclass
class GraphResults:
    scopes: set[Scope] = field(default_factory=set)
    summaries: list[dict[str, Any]] = field(default_factory=list)
    means: list[dict[str, Any]] = field(default_factory=list)
    proportions: list[dict[str, Any]] = field(default_factory=list)
    boxplots: list[dict[str, Any]] = field(default_factory=list)
    outliers: list[dict[str, Any]] = field(default_factory=list)
    activities: list[dict[str, Any]] = field(default_factory=list)
    mean_rankings: list[dict[str, Any]] = field(default_factory=list)
    activity_rankings: list[dict[str, Any]] = field(default_factory=list)
    rows_disc: int = 0
    rows_doc: int = 0


def read_source(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        frame = pd.read_csv(
            path, sep=";", dtype=str, keep_default_na=False,
            na_filter=False, encoding="utf-8-sig",
        )
    elif suffix == ".xlsx":
        sheets = pd.read_excel(path, sheet_name=None, dtype=str, keep_default_na=False)
        if len(sheets) != 1:
            names = ", ".join(sheets)
            raise ValueError(
                f"[{path.name}] Deve conter exatamente uma planilha; encontradas "
                f"{len(sheets)} ({names})."
            )
        frame = next(iter(sheets.values()))
    else:
        raise ValueError(f"[{path.name}] Formato não suportado: {path.suffix}. Use CSV ou XLSX.")

    normalized_columns = [normalize_header(column) for column in frame.columns]
    duplicates = pd.Series(normalized_columns)[pd.Series(normalized_columns).duplicated()].unique()
    if len(duplicates):
        raise ValueError(f"[{path.name}] Colunas duplicadas após normalização: {', '.join(duplicates)}.")
    frame.columns = normalized_columns
    frame = frame.fillna("")
    non_empty_rows = frame.astype(str).apply(
        lambda column: column.str.strip().ne("")
    ).any(axis=1)
    return frame.loc[non_empty_rows].copy()


def _instrument_items(
    questionnaire: Questionnaire, instrument: str, family: str
) -> list[QuestionItem]:
    return [
        item for item in questionnaire.items
        if item.instrument == instrument and item.family == family
    ]


def _prepare_source(
    frame: pd.DataFrame,
    instrument: str,
    questionnaire: Questionnaire,
    entities: EntityCatalog,
) -> pd.DataFrame:
    likert_items = _instrument_items(questionnaire, instrument, "LIKERT")
    activity_items = _instrument_items(questionnaire, instrument, "ATIVIDADE")
    required = {"CAMPUS", "CURSO"}
    required.update(item.source_column for item in likert_items + activity_items)
    if instrument == "DISC":
        required.update({"MATRICULA", "ID"})
        required.update(item.media_column for item in likert_items if item.media_column)
    missing = sorted(required.difference(frame.columns))
    if missing:
        raise ValueError(
            f"Base {instrument} sem colunas obrigatórias: {', '.join(missing)}."
        )

    known_likert = {item.source_column for item in likert_items}
    known_media = {item.media_column for item in likert_items if item.media_column}
    known_activities = {item.source_column for item in activity_items}
    if instrument == "DISC":
        found_likert = {column for column in frame.columns if re.fullmatch(r"P\d{3}", column)}
        found_media = {column for column in frame.columns if re.fullmatch(r"MEDIAP\d{3}", column)}
    else:
        found_likert = {column for column in frame.columns if re.fullmatch(r"\d{3}", column)}
        found_media = set()
    found_activities = {
        column for column in frame.columns if re.fullmatch(r"4_1_1_[A-Z]", column)
    }
    unknown = sorted(
        (found_likert - known_likert)
        | (found_media - known_media)
        | (found_activities - known_activities)
    )
    if unknown:
        raise ValueError(
            f"Base {instrument} contém itens fora da versão do questionário: "
            f"{', '.join(unknown)}."
        )

    result = frame.copy()
    campus_cache: dict[str, tuple[str, str]] = {}
    course_cache: dict[str, tuple[str, str]] = {}
    for raw in result["CAMPUS"].unique():
        campus_cache[str(raw)] = entities.campus(raw)
    for raw in result["CURSO"].unique():
        course_cache[str(raw)] = entities.course(raw)
    result["__campus"] = result["CAMPUS"].map(lambda value: campus_cache[str(value)][0])
    result["__campus_name"] = result["CAMPUS"].map(lambda value: campus_cache[str(value)][1])
    result["__curso"] = result["CURSO"].map(lambda value: course_cache[str(value)][0])
    result["__curso_name"] = result["CURSO"].map(lambda value: course_cache[str(value)][1])

    if instrument == "DISC":
        result["__matricula"] = result["MATRICULA"].map(normalize_text)
        if (result["__matricula"] == "").any():
            raise ValueError("Base DISC contém matrícula vazia.")
        result["__oferta"] = result["ID"].map(normalize_text)
        if (result["__oferta"] == "").any():
            raise ValueError("Base DISC contém ID de oferta vazio.")
    else:
        offer_columns = [
            column for column in (
                "DEPARTAMENTO", "DOCENTE", "CODIGO", "DISCIPLINA",
                "CODIGO_TURMA", "HORARIO", "LOCAL",
            )
            if column in result.columns
        ]
        if not offer_columns:
            raise ValueError("Base DOC não possui colunas suficientes para identificar a oferta.")
        result["__oferta"] = result.apply(
            lambda row: "|".join(
                [row["__campus"], row["__curso"]]
                + [normalize_text(row[column]) for column in offer_columns]
            ),
            axis=1,
        )
    return result


def _numeric_values(series: pd.Series, minimum: float, maximum: float, label: str) -> pd.Series:
    raw = series.astype(str).str.strip()
    numeric = pd.to_numeric(raw.str.replace(",", ".", regex=False), errors="coerce")
    invalid = raw.ne("") & (numeric.isna() | numeric.lt(minimum) | numeric.gt(maximum))
    if invalid.any():
        examples = ", ".join(raw[invalid].drop_duplicates().head(5))
        raise ValueError(f"Valores inválidos em {label}: {examples}.")
    return numeric


def _scope_from_row(level: str, row: pd.Series) -> Scope:
    campus = str(row["__campus"]) if "__campus" in row.index else None
    course = str(row["__curso"]) if "__curso" in row.index else None
    return level, campus, course


def _likert_long(
    frame: pd.DataFrame, instrument: str, questionnaire: Questionnaire
) -> pd.DataFrame:
    items = _instrument_items(questionnaire, instrument, "LIKERT")
    id_vars = ["__campus", "__curso", "__oferta"]
    if instrument == "DISC":
        id_vars.append("__matricula")
    long = frame.melt(
        id_vars=id_vars,
        value_vars=[item.source_column for item in items],
        var_name="__source", value_name="__raw",
    )
    long["__value"] = _numeric_values(long["__raw"], 1, 4, f"Likert {instrument}")
    invalid_scale = long["__value"].notna() & ~long["__value"].isin([1, 2, 3, 4])
    if invalid_scale.any():
        examples = ", ".join(
            long.loc[invalid_scale, "__raw"].astype(str).drop_duplicates().head(5)
        )
        raise ValueError(f"Likert {instrument} fora da escala inteira 1..4: {examples}.")
    long = long.dropna(subset=["__value"]).copy()
    long["__value"] = long["__value"].astype("int8")
    item_by_source = {item.source_column: item for item in items}
    long["__item"] = long["__source"].map(lambda source: item_by_source[source].code)
    long["__dimension"] = long["__source"].map(
        lambda source: item_by_source[source].dimension_code
    )
    long["__subdimension"] = long["__source"].map(
        lambda source: item_by_source[source].subdimension_code
    )
    return long


def _append_likert_results(
    results: GraphResults, long: pd.DataFrame, instrument: str
) -> None:
    for level, group_column in (
        ("DIMENSAO", "__dimension"),
        ("SUBDIMENSAO", "__subdimension"),
        ("ITEM", "__item"),
    ):
        level_data = long.dropna(subset=[group_column])
        for scope_level, scope_columns in SCOPE_SPECS:
            keys = scope_columns + [group_column]
            aggregate = level_data.groupby(keys, dropna=False)["__value"].agg(
                soma="sum", quantidade="count"
            ).reset_index()
            counts = level_data.groupby(
                keys + ["__value"], dropna=False
            ).size().to_dict()
            for _, row in aggregate.iterrows():
                scope = _scope_from_row(scope_level, row)
                group_code = str(row[group_column])
                group_key: GroupKey = (instrument, "LIKERT", level, group_code)
                total = int(row["quantidade"])
                total_sum = int(row["soma"])
                results.scopes.add(scope)
                results.means.append({
                    "scope": scope, "group": group_key, "sum": total_sum,
                    "count": total, "mean": round(total_sum / total, 4),
                })
                count_prefix = tuple(row[column] for column in keys)
                for value in (1, 2, 3, 4):
                    quantity = int(counts.get(count_prefix + (value,), 0))
                    results.proportions.append({
                        "scope": scope, "group": group_key, "value": value,
                        "count": quantity, "total": total,
                        "percentage": round(quantity / total * 100, 4),
                    })


def _append_activity_results(
    results: GraphResults,
    frame: pd.DataFrame,
    instrument: str,
    questionnaire: Questionnaire,
) -> None:
    items = _instrument_items(questionnaire, instrument, "ATIVIDADE")
    long = frame.melt(
        id_vars=["__campus", "__curso"],
        value_vars=[item.source_column for item in items],
        var_name="__source", value_name="__raw",
    )
    raw = long["__raw"].astype(str).str.strip()
    numeric = pd.to_numeric(raw.str.replace(",", ".", regex=False), errors="coerce")

    checkbox_marked = raw.str.upper().eq("X")
    numeric.loc[checkbox_marked] = 1

    text_activity_columns = {
        "DISC": normalize_header("4.1.1.R"),
        "DOC": normalize_header("4.1.1.P"),
    }
    text_activity = (
        long["__source"].eq(text_activity_columns[instrument])
        & raw.ne("")
        & ~numeric.isin([0, 1])
    )
    numeric.loc[text_activity] = 1

    invalid_parse = raw.ne("") & numeric.isna()
    if invalid_parse.any():
        examples = ", ".join(raw[invalid_parse].drop_duplicates().head(5))
        raise ValueError(f"Atividades {instrument} com valores não numéricos: {examples}.")
    numeric = numeric.fillna(0)
    invalid = ~numeric.isin([0, 1])
    if invalid.any():
        examples = ", ".join(raw[invalid].drop_duplicates().head(5))
        raise ValueError(f"Atividades {instrument} com valores inválidos: {examples}.")
    long["__value"] = numeric.astype("int8")
    item_by_source = {item.source_column: item for item in items}
    long["__item"] = long["__source"].map(lambda source: item_by_source[source].code)

    for scope_level, scope_columns in SCOPE_SPECS:
        keys = scope_columns + ["__item"]
        aggregate = long.groupby(keys, dropna=False)["__value"].agg(
            positive="sum", total="count"
        ).reset_index()
        for _, row in aggregate.iterrows():
            scope = _scope_from_row(scope_level, row)
            positive = int(row["positive"])
            total = int(row["total"])
            group_key: GroupKey = (instrument, "ATIVIDADE", "ITEM", str(row["__item"]))
            results.scopes.add(scope)
            results.activities.append({
                "scope": scope, "group": group_key, "instrument": instrument,
                "positive": positive, "total": total,
                "percentage": round(positive / total * 100, 4),
            })


def _append_summaries(results: GraphResults, disc_long: pd.DataFrame) -> None:
    for scope_level, scope_columns in SCOPE_SPECS:
        participant_lookup: dict[tuple[Any, ...], int] = {}
        if scope_columns:
            participants = disc_long.groupby(scope_columns)["__matricula"].nunique()
            participant_lookup = {
                key if isinstance(key, tuple) else (key,): int(value)
                for key, value in participants.items()
            }
        else:
            participant_lookup[()] = int(disc_long["__matricula"].nunique())

        campus_keys = list(scope_columns)
        if "__campus" not in campus_keys:
            campus_keys.append("__campus")
        campus_means = disc_long.groupby(campus_keys)["__value"].mean().reset_index()
        grouped_campus: dict[tuple[Any, ...], list[tuple[str, float]]] = {}
        for _, row in campus_means.iterrows():
            scope_values = tuple(row[column] for column in scope_columns)
            grouped_campus.setdefault(scope_values, []).append(
                (str(row["__campus"]), float(row["__value"]))
            )

        for scope_values, total in participant_lookup.items():
            row_values = pd.Series(dict(zip(scope_columns, scope_values)))
            scope = _scope_from_row(scope_level, row_values)
            campus_rows = grouped_campus.get(scope_values, [])
            best = sorted(campus_rows, key=lambda pair: (-pair[1], pair[0]))[0] if campus_rows else None
            campus_rows_desc = sorted(campus_rows, key=lambda pair: pair[0], reverse=True)
            worst = min(campus_rows_desc, key=lambda pair: pair[1]) if campus_rows else None
            results.scopes.add(scope)
            results.summaries.append({
                "scope": scope,
                "participants": total,
                "best_campus": best[0] if best else None,
                "best_mean": round(best[1], 4) if best else None,
                "worst_campus": worst[0] if worst else None,
                "worst_mean": round(worst[1], 4) if worst else None,
            })


def _disc_media_long(
    frame: pd.DataFrame, questionnaire: Questionnaire
) -> pd.DataFrame:
    items = _instrument_items(questionnaire, "DISC", "LIKERT")
    media_columns = [item.media_column for item in items if item.media_column]
    long = frame.melt(
        id_vars=["__campus", "__curso", "__oferta"],
        value_vars=media_columns,
        var_name="__source", value_name="__raw",
    )
    long["__value"] = _numeric_values(long["__raw"], 0, 4, "médias DISC")
    long = long.dropna(subset=["__value"]).copy()
    item_by_media = {item.media_column: item for item in items}
    long["__item"] = long["__source"].map(lambda source: item_by_media[source].code)
    long["__dimension"] = long["__source"].map(
        lambda source: item_by_media[source].dimension_code
    )
    long["__subdimension"] = long["__source"].map(
        lambda source: item_by_media[source].subdimension_code
    )
    keys = ["__campus", "__curso", "__oferta", "__item"]
    conflicts = long.groupby(keys)["__value"].nunique()
    if (conflicts > 1).any():
        raise ValueError("Uma oferta DISC possui médias divergentes para o mesmo item.")
    return long.drop_duplicates(keys)


def _append_boxplots(
    results: GraphResults, observations: pd.DataFrame, instrument: str
) -> None:
    for level, group_column in (
        ("DIMENSAO", "__dimension"),
        ("SUBDIMENSAO", "__subdimension"),
        ("ITEM", "__item"),
    ):
        level_data = observations.dropna(subset=[group_column])
        if instrument == "DOC" and level == "ITEM":
            level_data = level_data[
                level_data["__dimension"] != "INSTALACOES_FISICAS"
            ]
        offer_keys = ["__campus", "__curso", "__oferta", group_column]
        per_offer = level_data.groupby(offer_keys, dropna=False)["__value"].mean().reset_index()
        for scope_level, scope_columns in SCOPE_SPECS:
            keys = scope_columns + [group_column]
            for group_values, values in per_offer.groupby(keys, dropna=False)["__value"]:
                group_values = group_values if isinstance(group_values, tuple) else (group_values,)
                row = pd.Series(dict(zip(keys, group_values)))
                scope = _scope_from_row(scope_level, row)
                group_code = str(row[group_column])
                group_key: GroupKey = (instrument, "LIKERT", level, group_code)
                values = values.dropna().astype(float).sort_values()
                if values.empty:
                    continue
                q1 = float(values.quantile(0.25, interpolation="linear"))
                median = float(values.quantile(0.50, interpolation="linear"))
                q3 = float(values.quantile(0.75, interpolation="linear"))
                iqr = q3 - q1
                outlier_values = values[(values < q1 - 1.5 * iqr) | (values > q3 + 1.5 * iqr)]
                results.scopes.add(scope)
                results.boxplots.append({
                    "scope": scope, "group": group_key,
                    "min": round(float(values.min()), 4), "q1": round(q1, 4),
                    "median": round(median, 4), "mean": round(float(values.mean()), 4),
                    "q3": round(q3, 4), "max": round(float(values.max()), 4),
                    "count": int(values.count()),
                })
                for sequence, value in enumerate(outlier_values, start=1):
                    results.outliers.append({
                        "scope": scope, "group": group_key,
                        "sequence": sequence, "value": round(float(value), 4),
                    })


def _append_rankings(results: GraphResults) -> None:
    mean_buckets: dict[tuple[Scope, GroupKey], list[dict[str, Any]]] = {}
    for row in results.means:
        scope_level, campus, course = row["scope"]
        if row["group"][2] == "ITEM" or scope_level not in {"CURSO", "CAMPUS_CURSO"}:
            continue
        target_scope: Scope = (
            ("SEMESTRE", None, None) if scope_level == "CURSO"
            else ("CAMPUS", campus, None)
        )
        ranked = dict(row)
        ranked["course"] = course
        mean_buckets.setdefault((target_scope, row["group"]), []).append(ranked)

    for (scope, group_key), rows in mean_buckets.items():
        ordered = sorted(
            rows, key=lambda row: (-row["mean"], -row["count"], str(row["course"]))
        )[:20]
        for position, row in enumerate(ordered, start=1):
            results.mean_rankings.append({
                "scope": scope, "group": group_key, "position": position,
                "course": row["course"], "sum": row["sum"],
                "count": row["count"], "mean": row["mean"],
            })

    activity_buckets: dict[tuple[Scope, str, str], list[dict[str, Any]]] = {}
    for row in results.activities:
        scope_level, campus, course = row["scope"]
        if scope_level not in {"CURSO", "CAMPUS_CURSO"}:
            continue
        target_scope = (
            ("SEMESTRE", None, None) if scope_level == "CURSO"
            else ("CAMPUS", campus, None)
        )
        activity_buckets.setdefault((target_scope, row["instrument"], str(course)), []).append(row)

    ranking_rows: dict[tuple[Scope, str], list[dict[str, Any]]] = {}
    for (scope, instrument, course), rows in activity_buckets.items():
        positive = sum(row["positive"] for row in rows)
        total = sum(row["total"] for row in rows)
        ranking_rows.setdefault((scope, instrument), []).append({
            "course": course, "positive": positive, "total": total,
            "percentage": round(positive / total * 100, 4),
        })
    for (scope, instrument), rows in ranking_rows.items():
        ordered = sorted(
            rows, key=lambda row: (-row["percentage"], -row["total"], row["course"])
        )[:20]
        for position, row in enumerate(ordered, start=1):
            results.activity_rankings.append({
                "scope": scope, "instrument": instrument, "position": position,
                **row,
            })


def validate_results(results: GraphResults) -> None:
    if not results.means or not results.proportions:
        raise ValueError("Nenhum resultado Likert foi calculado.")
    if not results.activities:
        raise ValueError("Nenhum resultado de atividade foi calculado.")
    if not results.boxplots:
        raise ValueError("Nenhuma estatística de boxplot foi calculada.")
    proportion_groups: dict[tuple[Scope, GroupKey], list[dict[str, Any]]] = {}
    for row in results.proportions:
        proportion_groups.setdefault((row["scope"], row["group"]), []).append(row)
    for key, rows in proportion_groups.items():
        if {row["value"] for row in rows} != {1, 2, 3, 4}:
            raise ValueError(f"Proporção sem as quatro opções Likert: {key}.")
        if sum(row["count"] for row in rows) != rows[0]["total"]:
            raise ValueError(f"Contagens de proporção inconsistentes: {key}.")
        if abs(sum(row["percentage"] for row in rows) - 100) > 0.02:
            raise ValueError(f"Percentuais de proporção inconsistentes: {key}.")
    for row in results.boxplots:
        if not (row["min"] <= row["q1"] <= row["median"] <= row["q3"] <= row["max"]):
            raise ValueError(f"Estatística de boxplot inconsistente: {row}.")
    if not results.summaries:
        raise ValueError("Nenhum resumo discente foi calculado.")
    global_summary = next(
        (row for row in results.summaries if row["scope"] == ("SEMESTRE", None, None)),
        None,
    )
    if not global_summary or global_summary["participants"] <= 0:
        raise ValueError("A fonte DISC não possui participante com resposta Likert válida.")


def _check_similar_entities(
    names: set[str],
    entity_type: str,
    disc_df: pd.DataFrame,
    doc_df: pd.DataFrame,
    disc_label: str,
    doc_label: str,
    registered_names: set[str],
) -> None:
    import re
    import difflib
    from src.utils.logger import warn
    from src.utils.normalizer import normalize_text, normalize_course
    
    def get_tokens(text: str) -> set[str]:
        return set(w for w in re.findall(r'\w+', str(text).lower()) if len(w) > 2)
        
    registered_lower = {n.lower() for n in registered_names}
    names_list = sorted(list(names))
    for i in range(len(names_list)):
        for j in range(i + 1, len(names_list)):
            n1, n2 = names_list[i], names_list[j]
            
            # Se ambos os nomes forem entidades oficiais já cadastradas, não consideramos erro
            if n1.lower() in registered_lower and n2.lower() in registered_lower:
                continue
                
            t1, t2 = get_tokens(n1), get_tokens(n2)
            if not t1 or not t2:
                continue
            
            matching_tokens = 0
            for w1 in t1:
                for w2 in t2:
                    if w1 == w2 or difflib.SequenceMatcher(None, w1, w2).ratio() >= 0.88:
                        matching_tokens += 1
                        break
            
            union_size = len(t1) + len(t2) - matching_tokens
            jaccard = matching_tokens / union_size if union_size > 0 else 0
            
            if jaccard >= 0.8:
                if entity_type == "curso":
                    # Encontrar campuses onde eles aparecem
                    campuses_n1 = set()
                    campuses_n2 = set()
                    for df in [disc_df, doc_df]:
                        if df is not None and "CAMPUS" in df.columns and "CURSO" in df.columns:
                            mask_n1 = df["CURSO"].map(normalize_course) == n1
                            mask_n2 = df["CURSO"].map(normalize_course) == n2
                            campuses_n1.update(df[mask_n1]["CAMPUS"].unique())
                            campuses_n2.update(df[mask_n2]["CAMPUS"].unique())
                    
                    common_campuses = campuses_n1.intersection(campuses_n2)
                    if not common_campuses:
                        continue
                        
                    for campus in sorted(list(common_campuses)):
                        campus_norm = normalize_text(campus)
                        n1_info = []
                        n2_info = []
                        for df, label in [(disc_df, disc_label), (doc_df, doc_label)]:
                            if df is not None and "CAMPUS" in df.columns and "CURSO" in df.columns:
                                mask_campus = df["CAMPUS"].map(normalize_text) == campus_norm
                                
                                mask_n1 = mask_campus & (df["CURSO"].map(normalize_course) == n1)
                                if mask_n1.any():
                                    count = len(df[mask_n1])
                                    originals = sorted(df[mask_n1]["CURSO"].unique())
                                    orig_str = ", ".join(f"'{o}'" for o in originals)
                                    n1_info.append(f"{count}x em {label} ({orig_str})")
                                    
                                mask_n2 = mask_campus & (df["CURSO"].map(normalize_course) == n2)
                                if mask_n2.any():
                                    count = len(df[mask_n2])
                                    originals = sorted(df[mask_n2]["CURSO"].unique())
                                    orig_str = ", ".join(f"'{o}'" for o in originals)
                                    n2_info.append(f"{count}x em {label} ({orig_str})")
                                    
                        n1_details = "; ".join(n1_info)
                        n2_details = "; ".join(n2_info)
                        
                        warn(
                            f"Aviso: Possível duplicidade ou divergência de nomes para curso no mesmo período:\n"
                            f"  • Campus: {campus}\n"
                            f"    - '{n1}': {n1_details}\n"
                            f"    - '{n2}': {n2_details}\n"
                            f"  A carga prosseguirá, mas verifique se a grafia está correta na planilha de origem."
                        )
                else:
                    # entity_type == "campus"
                    n1_info = []
                    n2_info = []
                    for df, label in [(disc_df, disc_label), (doc_df, doc_label)]:
                        if df is not None and "CAMPUS" in df.columns:
                            mask_n1 = df["CAMPUS"].map(normalize_text) == normalize_text(n1)
                            if mask_n1.any():
                                count = len(df[mask_n1])
                                originals = sorted(df[mask_n1]["CAMPUS"].unique())
                                orig_str = ", ".join(f"'{o}'" for o in originals)
                                n1_info.append(f"{count}x em {label} ({orig_str})")
                                
                            mask_n2 = df["CAMPUS"].map(normalize_text) == normalize_text(n2)
                            if mask_n2.any():
                                count = len(df[mask_n2])
                                originals = sorted(df[mask_n2]["CAMPUS"].unique())
                                orig_str = ", ".join(f"'{o}'" for o in originals)
                                n2_info.append(f"{count}x em {label} ({orig_str})")
                                
                    n1_details = "; ".join(n1_info)
                    n2_details = "; ".join(n2_info)
                    
                    warn(
                        f"Aviso: Possível duplicidade ou divergência de nomes para campus no mesmo período:\n"
                        f"  - '{n1}': {n1_details}\n"
                        f"  - '{n2}': {n2_details}\n"
                        f"  A carga prosseguirá, mas verifique se a grafia está correta na planilha de origem."
                    )


def calculate_graphs(
    disc_source: pd.DataFrame,
    doc_source: pd.DataFrame,
    questionnaire: Questionnaire,
    entities: EntityCatalog,
    disc_label: str = "DISC",
    doc_label: str = "DOC",
) -> GraphResults:
    try:
        disc = _prepare_source(disc_source, "DISC", questionnaire, entities)
    except ValueError as e:
        raise ValueError(f"[{disc_label}] {e}") from e

    try:
        doc = _prepare_source(doc_source, "DOC", questionnaire, entities)
    except ValueError as e:
        raise ValueError(f"[{doc_label}] {e}") from e
    
    # Validação de similaridade entre entidades do mesmo período
    _check_similar_entities(
        set(disc["__curso_name"].unique()).union(doc["__curso_name"].unique()),
        "curso",
        disc,
        doc,
        disc_label,
        doc_label,
        set(entities.courses),
    )
    _check_similar_entities(
        set(disc["__campus_name"].unique()).union(doc["__campus_name"].unique()),
        "campus",
        disc,
        doc,
        disc_label,
        doc_label,
        set(entities.campuses),
    )

    results = GraphResults(rows_disc=len(disc), rows_doc=len(doc))

    try:
        disc_long = _likert_long(disc, "DISC", questionnaire)
    except ValueError as e:
        raise ValueError(f"[{disc_label}] {e}") from e

    try:
        doc_long = _likert_long(doc, "DOC", questionnaire)
    except ValueError as e:
        raise ValueError(f"[{doc_label}] {e}") from e

    try:
        _append_likert_results(results, disc_long, "DISC")
    except ValueError as e:
        raise ValueError(f"[{disc_label}] {e}") from e

    try:
        _append_likert_results(results, doc_long, "DOC")
    except ValueError as e:
        raise ValueError(f"[{doc_label}] {e}") from e

    try:
        _append_activity_results(results, disc, "DISC", questionnaire)
    except ValueError as e:
        raise ValueError(f"[{disc_label}] {e}") from e

    try:
        _append_activity_results(results, doc, "DOC", questionnaire)
    except ValueError as e:
        raise ValueError(f"[{doc_label}] {e}") from e

    _append_summaries(results, disc_long)

    try:
        disc_media = _disc_media_long(disc, questionnaire)
    except ValueError as e:
        raise ValueError(f"[{disc_label}] {e}") from e

    _append_boxplots(results, disc_media, "DISC")
    _append_boxplots(results, doc_long, "DOC")
    _append_rankings(results)
    validate_results(results)
    return results
