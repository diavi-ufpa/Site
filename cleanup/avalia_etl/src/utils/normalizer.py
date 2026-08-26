from __future__ import annotations

import math
import re
import unicodedata
from typing import Any


NULL_TOKENS = {"", "NAN", "NONE", "NULL", "N/A", "NA"}


def is_nullish(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    text = str(value).strip()
    return text.upper() in NULL_TOKENS


def remove_accents(value: str) -> str:
    return "".join(
        char
        for char in unicodedata.normalize("NFD", value)
        if unicodedata.category(char) != "Mn"
    )


def normalize_text(value: Any) -> str:
    if is_nullish(value):
        return ""
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    text = remove_accents(text)
    return text.upper()


def normalize_course(value: Any) -> str:
    if is_nullish(value):
        return ""
    text = str(value).strip()
    text = remove_accents(text)
    text = text.upper()
    text = re.sub(r"[^A-Z0-9]+", "-", text)
    return text.strip("-")



def normalize_header(value: Any) -> str:
    normalized = normalize_text(value)
    normalized = normalized.replace("-", "_")
    normalized = normalized.replace(".", "_")
    normalized = re.sub(r"[^A-Z0-9_]", "", normalized)
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return normalized


def build_normalized_mapping(raw_mapping: dict[str, str]) -> dict[str, str]:
    normalized_mapping: dict[str, str] = {}
    for source, target in raw_mapping.items():
        source_key = normalize_text(source)
        target_value = normalize_text(target)
        if source_key:
            normalized_mapping[source_key] = target_value
    return normalized_mapping


def apply_mapping(value: Any, normalized_mapping: dict[str, str]) -> str:
    normalized_value = normalize_text(value)
    if not normalized_value:
        return ""
    return normalized_mapping.get(normalized_value, normalized_value)
