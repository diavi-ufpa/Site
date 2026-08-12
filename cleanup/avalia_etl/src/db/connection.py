from __future__ import annotations

import os
from typing import Any

import psycopg2
from dotenv import load_dotenv


load_dotenv()


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if value is None:
        return None
    value = value.strip()
    return value if value else None


def get_connection() -> Any:
    database_url = _env("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url)

    params = {
        "host": _env("DB_HOST"),
        "port": _env("DB_PORT", "5432"),
        "dbname": _env("DB_NAME"),
        "user": _env("DB_USER"),
        "password": _env("DB_PASSWORD"),
        "sslmode": _env("DB_SSLMODE", "require"),
    }

    missing = [key for key, value in params.items() if key != "sslmode" and not value]
    if missing:
        missing_vars = ", ".join(missing)
        raise RuntimeError(
            f"Variaveis de conexao ausentes no .env: {missing_vars}. "
            "Defina DATABASE_URL ou DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD."
        )

    return psycopg2.connect(**params)
