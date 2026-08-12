from pathlib import Path


APP_ROOT = Path(__file__).resolve().parent.parent
SITE_ROOT = APP_ROOT.parent
ETL_ROOT = APP_ROOT / "avalia_etl"
ETL_SCRIPT = ETL_ROOT / "scripts" / "load_graph_db.py"
SCHEMA_FILE = ETL_ROOT / "sql" / "schema.sql"

