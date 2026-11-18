import os
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
from dotenv import load_dotenv
from playhouse.pool import PooledPostgresqlDatabase

# Cargar variables de entorno desde backend/.env (o desde el directorio actual)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)
load_dotenv()


def _crear_conexion_postgres() -> PooledPostgresqlDatabase:
    database_url = (os.getenv("DATABASE_URL") or "").strip()
    default_sslmode = os.getenv("DB_SSLMODE", "require").strip() or "require"
    max_connections = int(os.getenv("DB_MAX_CONNECTIONS", "10"))
    stale_timeout = int(os.getenv("DB_STALE_TIMEOUT", "300"))

    if database_url:
        parsed = urlparse(database_url)
        if parsed.scheme not in ("postgres", "postgresql", "psycopg2"):
            raise RuntimeError(
                f"Esquema de DATABASE_URL no soportado para PostgreSQL: '{parsed.scheme}'"
            )

        query_params = {k: v[-1] for k, v in parse_qs(parsed.query).items()}
        query_params.setdefault("sslmode", default_sslmode)

        db_name = unquote(parsed.path.lstrip("/")) or "postgres"
        user = unquote(parsed.username) if parsed.username else None
        password = unquote(parsed.password) if parsed.password else None
        host = parsed.hostname
        port = parsed.port or 5432

        return PooledPostgresqlDatabase(
            db_name,
            max_connections=max_connections,
            stale_timeout=stale_timeout,
            user=user,
            password=password,
            host=host,
            port=port,
            **query_params,
        )

    host = (os.getenv("DB_HOST") or "").strip()
    name = (os.getenv("DB_NAME") or "").strip()
    user = (os.getenv("DB_USER") or "").strip()
    password = os.getenv("DB_PASSWORD")
    port = int((os.getenv("DB_PORT") or "5432").strip())

    if host and name and user and password is not None and password != "":
        return PooledPostgresqlDatabase(
            name,
            max_connections=max_connections,
            stale_timeout=stale_timeout,
            user=user,
            password=password,
            host=host,
            port=port,
            sslmode=default_sslmode,
        )

    raise RuntimeError(
        "Configuración de base de datos PostgreSQL/Supabase incompleta. "
        "Defina DATABASE_URL o los parámetros (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) en backend/.env."
    )


db = _crear_conexion_postgres()
