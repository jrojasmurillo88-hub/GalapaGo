"""
Configuración compartida de db/: lee db/.env y abre la conexión a Postgres.

db/.env (no se sube a git):
  SUPABASE_URL=https://<ref>.supabase.co
  SUPABASE_SERVICE_KEY=eyJ...
  DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres
"""

import os
import sys
from pathlib import Path

# Proyecto Supabase de RAEEconecta (Colombia). GalapaGo nunca debe escribir ahí.
REF_COLOMBIA = "ujmetjpaayflmfgyescn"


def leer_env() -> dict[str, str]:
    config: dict[str, str] = {}
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        for linea in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in linea and not linea.lstrip().startswith("#"):
                k, v = linea.split("=", 1)
                config[k.strip()] = v.strip()
    for k in ("SUPABASE_URL", "SUPABASE_SERVICE_KEY", "DATABASE_URL"):
        if os.environ.get(k):
            config[k] = os.environ[k]
    return config


def conectar():
    import psycopg

    url = leer_env().get("DATABASE_URL", "")
    if not url:
        sys.exit("ERROR: falta DATABASE_URL en db/.env (ver README, sección 'Base de datos').")
    if REF_COLOMBIA in url:
        sys.exit("ERROR: DATABASE_URL apunta al proyecto de Colombia. GalapaGo usa su propio proyecto.")
    return psycopg.connect(url)
