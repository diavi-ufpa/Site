from __future__ import annotations

import os
from typing import Any

import psycopg2
from dotenv import load_dotenv


load_dotenv()


def get_graph_connection() -> Any:
    database_url = os.getenv("AVALIA_PRESENCIAL_GRAPH_DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError(
            "Variável AVALIA_PRESENCIAL_GRAPH_DATABASE_URL ausente no .env."
        )
    return psycopg2.connect(database_url)
