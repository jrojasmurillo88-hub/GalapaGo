"""
Aplica las migraciones de db/migrations/ en orden, una sola vez cada una.

Uso:
  python db/migrar.py            # aplica las pendientes
  python db/migrar.py --estado   # lista aplicadas / pendientes

002 (semillas) y 003 (funciones) son idempotentes: si cambian, se vuelven a
aplicar automáticamente (se compara un hash del contenido).
"""

import argparse
import hashlib
from pathlib import Path

from config import conectar

MIGRACIONES = Path(__file__).parent / "migrations"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--estado", action="store_true")
    args = parser.parse_args()

    with conectar() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                nombre      TEXT PRIMARY KEY,
                hash        TEXT NOT NULL,
                aplicada_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """)
        conn.execute("ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY")
        aplicadas = dict(conn.execute("SELECT nombre, hash FROM schema_migrations").fetchall())

        for ruta in sorted(MIGRACIONES.glob("*.sql")):
            sql = ruta.read_text(encoding="utf-8")
            h = hashlib.sha256(sql.encode()).hexdigest()[:16]
            if aplicadas.get(ruta.name) == h:
                print(f"  ok        {ruta.name}")
                continue
            estado = "cambiada" if ruta.name in aplicadas else "pendiente"
            if args.estado:
                print(f"  {estado:<9} {ruta.name}")
                continue
            print(f"  aplicando {ruta.name} ({estado})…")
            with conn.transaction():
                conn.execute(sql)
                conn.execute(
                    "INSERT INTO schema_migrations (nombre, hash) VALUES (%s, %s) "
                    "ON CONFLICT (nombre) DO UPDATE SET hash = EXCLUDED.hash, aplicada_at = NOW()",
                    (ruta.name, h),
                )
    print("Listo.")


if __name__ == "__main__":
    main()
