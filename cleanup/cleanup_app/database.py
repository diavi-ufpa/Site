from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QThread, Signal


SCHEMA_NAME = "avalia_presencial_graph"


def _protected_error(error: Exception, database_url: str) -> str:
    message = str(error).strip() or error.__class__.__name__
    if database_url:
        message = message.replace(database_url, "[URL protegida]")
    return message


class DatabaseWorker(QThread):
    completed = Signal(dict)
    failed = Signal(str)

    def __init__(
        self,
        database_url: str,
        *,
        schema_file: Path,
        initialize_schema: bool = False,
        parent=None,
    ) -> None:
        super().__init__(parent)
        self.database_url = database_url.strip()
        self.schema_file = schema_file
        self.initialize_schema = initialize_schema

    def run(self) -> None:
        connection = None
        try:
            import psycopg2

            connection = psycopg2.connect(self.database_url, connect_timeout=10)
            if self.initialize_schema:
                schema_sql = self.schema_file.read_text(encoding="utf-8")
                connection.autocommit = True
                with connection.cursor() as cursor:
                    cursor.execute(schema_sql)
                connection.autocommit = False

            with connection.cursor() as cursor:
                cursor.execute("SELECT current_database()")
                database_name = str(cursor.fetchone()[0])
                cursor.execute(
                    "SELECT to_regclass(%s)",
                    (f"{SCHEMA_NAME}.semestre",),
                )
                schema_ready = cursor.fetchone()[0] is not None
                periods: list[str] = []
                if schema_ready:
                    cursor.execute(
                        f"""
                        SELECT codigo
                        FROM {SCHEMA_NAME}.semestre
                        ORDER BY ano DESC, periodo DESC
                        """
                    )
                    periods = [str(row[0]) for row in cursor.fetchall()]

            self.completed.emit(
                {
                    "database_name": database_name,
                    "schema_ready": schema_ready,
                    "periods": periods,
                    "initialized": self.initialize_schema,
                }
            )
        except Exception as error:
            self.failed.emit(_protected_error(error, self.database_url))
        finally:
            if connection is not None:
                connection.close()

