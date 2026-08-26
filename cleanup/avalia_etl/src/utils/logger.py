from __future__ import annotations

import sys
from typing import Iterable


RESET = "\033[0m"
COLORS = {
    "blue": "\033[94m",
    "green": "\033[92m",
    "yellow": "\033[93m",
    "red": "\033[91m",
    "magenta": "\033[95m",
}


USE_COLOR = sys.stdout.isatty()


def paint(message: str, color: str) -> str:
    if not USE_COLOR:
        return message
    color_code = COLORS.get(color, "")
    return f"{color_code}{message}{RESET}"


def info(message: str) -> None:
    print(paint(f"[INFO] {message}", "blue"))


def success(message: str) -> None:
    print(paint(f"[OK] {message}", "green"))


def warning(message: str) -> None:
    print(paint(f"[WARN] {message}", "yellow"))


# Alias para conveniência
warn = warning


def error(message: str) -> None:
    print(paint(f"[ERRO] {message}", "red"))


def section(title: str) -> None:
    print(paint(f"\n=== {title} ===", "magenta"))


def preview_list(label: str, values: Iterable[str], limit: int = 15) -> None:
    values_list = list(values)
    count = len(values_list)
    if count == 0:
        print(f"- {label}: 0")
        return

    print(f"- {label}: {count}")
    for item in values_list[:limit]:
        print(f"  - {item}")
    if count > limit:
        print(f"  - ... ({count - limit} adicionais)")
