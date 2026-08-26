from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import psycopg2
from dotenv import load_dotenv


current = Path(__file__).resolve().parent
for _ in range(7):
    for name in (".env.local", ".env"):
        env_file = current / name
        if env_file.is_file():
            load_dotenv(env_file, override=True)
    current = current.parent
load_dotenv(override=True)


def get_graph_connection() -> Any:
    database_url = os.getenv("AVALIA_PRESENCIAL_GRAPH_DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError(
            "Variável AVALIA_PRESENCIAL_GRAPH_DATABASE_URL ausente no .env."
        )
    return psycopg2.connect(database_url)
