from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from src.utils.normalizer import normalize_header, normalize_text, normalize_course


@dataclass(frozen=True)
class QuestionItem:
    instrument: str
    family: str
    source_column: str
    media_column: str | None
    code: str
    label: str
    dimension_code: str
    dimension_label: str
    dimension_order: int
    subdimension_code: str | None
    subdimension_label: str | None
    subdimension_order: int | None
    item_order: int


@dataclass(frozen=True)
class OutputGroup:
    instrument: str
    family: str
    level: str
    code: str
    label: str
    block_order: int
    item_order: int

    @property
    def key(self) -> tuple[str, str, str, str]:
        return self.instrument, self.family, self.level, self.code


@dataclass(frozen=True)
class Questionnaire:
    code: str
    description: str
    valid_from_year: int
    valid_from_period: int
    sha256: str
    items: tuple[QuestionItem, ...]
    groups: tuple[OutputGroup, ...]


class EntityCatalog:
    def __init__(self, path: Path) -> None:
        payload = json.loads(path.read_text(encoding="utf-8"))
        canonical_bytes = json.dumps(
            payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
        self.sha256 = hashlib.sha256(canonical_bytes).hexdigest()
        self.version = int(payload["versao"])
        self.campuses = tuple(str(value).strip() for value in payload["campi"])
        self.courses = ()
        aliases = payload.get("aliases", {})
        self._campus_lookup = self._build_lookup(
            self.campuses, aliases.get("campi", {}), "campus"
        )
        self._course_lookup = {}
        self.discovered_campuses: dict[str, str] = {}
        self.discovered_courses: dict[str, str] = {}

    @staticmethod
    def _build_lookup(
        canonical_values: tuple[str, ...], aliases: dict[str, str], entity_name: str
    ) -> dict[str, str]:
        lookup: dict[str, str] = {}
        canonical_by_code: dict[str, str] = {}
        for display_name in canonical_values:
            code = normalize_text(display_name)
            if not code:
                raise ValueError(f"Nome vazio no catálogo de {entity_name}.")
            if code in canonical_by_code and canonical_by_code[code] != display_name:
                raise ValueError(
                    f"Valores canônicos colidem no catálogo de {entity_name}: "
                    f"{canonical_by_code[code]!r} e {display_name!r}."
                )
            canonical_by_code[code] = display_name
            lookup[code] = display_name

        for source, target in aliases.items():
            source_code = normalize_text(source)
            target_code = normalize_text(target)
            if target_code not in canonical_by_code:
                raise ValueError(
                    f"Alias de {entity_name} aponta para valor inexistente: {target!r}."
                )
            lookup[source_code] = canonical_by_code[target_code]
        return lookup

    def campus(self, raw_value: Any) -> tuple[str, str]:
        return self._resolve(raw_value, self._campus_lookup, "campus")

    def course(self, raw_value: Any) -> tuple[str, str]:
        code = normalize_course(raw_value)
        if not code:
            raise ValueError("Curso vazio na fonte.")
        display_name = code
        self.discovered_courses[code] = display_name
        return code, display_name

    def _resolve(self, raw_value: Any, lookup: dict[str, str], entity_name: str) -> tuple[str, str]:
        code = normalize_text(raw_value)
        if not code:
            raise ValueError(f"{entity_name.capitalize()} vazio na fonte.")
        display_name = lookup.get(code)
        if display_name is None:
            # Novo campus (não cadastrado em entidades.json)
            display_name = str(raw_value).strip()
            lookup[code] = display_name
            if entity_name == "campus":
                self.discovered_campuses[code] = display_name
        return normalize_text(display_name), display_name


def _parse_semester(value: str) -> tuple[int, int]:
    year_text, period_text = value.split("-", maxsplit=1)
    return int(year_text), int(period_text)


def _append_likert(
    instrument: str,
    dimensions: list[dict[str, Any]],
    items: list[QuestionItem],
    groups: dict[tuple[str, str, str, str], OutputGroup],
) -> None:
    for dimension in dimensions:
        dim_code = str(dimension["codigo"])
        dim_label = str(dimension["rotulo"])
        dim_order = int(dimension["ordem"])
        group = OutputGroup(
            instrument, "LIKERT", "DIMENSAO", dim_code, dim_label, dim_order, 1
        )
        groups[group.key] = group
        sections = dimension.get("subdimensoes") or [{
            "codigo": None, "rotulo": None, "ordem": None,
            "itens": dimension.get("itens", []),
        }]
        for section in sections:
            sub_code = section.get("codigo")
            sub_label = section.get("rotulo")
            sub_order = section.get("ordem")
            if sub_code:
                group = OutputGroup(
                    instrument, "LIKERT", "SUBDIMENSAO", str(sub_code),
                    str(sub_label), dim_order, int(sub_order),
                )
                groups[group.key] = group
            for item_order, raw_item in enumerate(section.get("itens", []), start=1):
                source, media_source, code, label = raw_item
                item = QuestionItem(
                    instrument, "LIKERT", normalize_header(source),
                    normalize_header(media_source) if media_source else None,
                    str(code), str(label), dim_code, dim_label, dim_order,
                    str(sub_code) if sub_code else None,
                    str(sub_label) if sub_label else None,
                    int(sub_order) if sub_order else None, item_order,
                )
                items.append(item)
                group = OutputGroup(
                    instrument, "LIKERT", "ITEM", item.code, item.label,
                    dim_order, item_order,
                )
                groups[group.key] = group


def _append_activities(
    instrument: str,
    letters: list[str],
    items: list[QuestionItem],
    groups: dict[tuple[str, str, str, str], OutputGroup],
) -> None:
    for order, letter in enumerate(letters, start=1):
        code = f"4.1.1.{letter}"
        item = QuestionItem(
            instrument, "ATIVIDADE", normalize_header(code), None, code, code,
            "ATIVIDADES_ACADEMICAS", "Atividades Acadêmicas", 4,
            None, None, None, order,
        )
        items.append(item)
        group = OutputGroup(
            instrument, "ATIVIDADE", "ITEM", code, code, 4, order
        )
        groups[group.key] = group


def load_questionnaire(path: Path, year: int, period: int) -> Questionnaire:
    payload = json.loads(path.read_text(encoding="utf-8"))
    candidates: list[tuple[tuple[int, int], dict[str, Any]]] = []
    for version in payload["versoes"]:
        valid_from = _parse_semester(version["vigente_desde"])
        if valid_from <= (year, period):
            candidates.append((valid_from, version))
    if not candidates:
        raise ValueError(f"Não existe questionário vigente para {year}-{period}.")

    (valid_year, valid_period), selected = max(candidates, key=lambda pair: pair[0])
    items: list[QuestionItem] = []
    groups: dict[tuple[str, str, str, str], OutputGroup] = {}
    for instrument, definition in selected["instrumentos"].items():
        _append_likert(instrument, definition["dimensoes"], items, groups)
        _append_activities(instrument, definition["atividades"], items, groups)

    selected_bytes = json.dumps(
        selected, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    return Questionnaire(
        selected["codigo"], selected["descricao"], valid_year, valid_period,
        hashlib.sha256(selected_bytes).hexdigest(), tuple(items), tuple(groups.values())
    )
