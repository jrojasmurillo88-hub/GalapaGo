"""
Carga en Postgres los JSON que genera scraper/main.py.

Uso:
  python db/loader.py                      # último archivo de cada fuente en scraper/output/
  python db/loader.py --archivo ruta.json

Reglas:
- Upsert por (fuente, fuente_id). Solo se actualizan los campos que vienen de la
  fuente: sponsor, verificación, duplicados y estado puestos por un admin se respetan.
- Qué acepta cada punto: se rehace salvo las filas con origen='manual'.
- Horarios: se reemplazan con lo que trae la fuente.
- Puntos que ya no aparecen en la fuente pasan a estado 'cerrado' (con nota).
- Al final marca duplicados entre fuentes distintas (mismo tipo, < 15 m).
- Cada fuente queda registrada en scraping_runs. Todo va en una transacción.
"""

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from config import conectar

OUTPUT = Path(__file__).parent.parent / "scraper" / "output"
NOTA_DESAPARECIDO = "Desaparecido de la fuente"
RADIO_DUPLICADO_M = 15

SQL_UPSERT = """
INSERT INTO puntos (
    fuente, fuente_id, fuente_url, nombre, tipo_punto, operador_id, direccion,
    detalle_ubicacion, distrito_id, barrio, municipio, codigo_postal, coordenadas,
    confianza_coords, horario_texto, estado, notas, scraped_at, updated_at
) VALUES (
    %(fuente)s, %(fuente_id)s, %(fuente_url)s, %(nombre)s, %(tipo_punto)s, %(operador_id)s,
    %(direccion)s, %(detalle_ubicacion)s, %(distrito_id)s, %(barrio)s, %(municipio)s,
    %(codigo_postal)s,
    CASE WHEN %(lat)s::float IS NULL THEN NULL
         ELSE ST_SetSRID(ST_MakePoint(%(lng)s::float, %(lat)s::float), 4326)::geography END,
    %(confianza_coords)s, %(horario_texto)s, %(estado)s, %(notas)s, %(scraped_at)s, NOW()
)
ON CONFLICT (fuente, fuente_id) DO UPDATE SET
    fuente_url        = EXCLUDED.fuente_url,
    nombre            = EXCLUDED.nombre,
    tipo_punto        = EXCLUDED.tipo_punto,
    operador_id       = EXCLUDED.operador_id,
    direccion         = EXCLUDED.direccion,
    detalle_ubicacion = EXCLUDED.detalle_ubicacion,
    distrito_id       = EXCLUDED.distrito_id,
    barrio            = EXCLUDED.barrio,
    municipio         = EXCLUDED.municipio,
    codigo_postal     = EXCLUDED.codigo_postal,
    -- unas coordenadas verificadas a mano (3) no se pisan
    coordenadas       = CASE WHEN puntos.confianza_coords >= 3 THEN puntos.coordenadas
                             ELSE EXCLUDED.coordenadas END,
    confianza_coords  = GREATEST(puntos.confianza_coords, EXCLUDED.confianza_coords),
    horario_texto     = EXCLUDED.horario_texto,
    -- reabrir solo si lo cerró este loader; un cierre manual se respeta
    estado            = CASE WHEN puntos.notas LIKE %(nota_desaparecido)s THEN EXCLUDED.estado
                             ELSE puntos.estado END,
    notas             = EXCLUDED.notas,
    scraped_at        = EXCLUDED.scraped_at,
    updated_at        = NOW()
RETURNING id, (xmax = 0) AS insertado
"""


def _ultimos_archivos() -> list[Path]:
    por_fuente: dict[str, Path] = {}
    # Solo salidas de scraper/main.py: <fuente>_<AAAAMMDD>_<HHMMSS>.json
    for ruta in sorted(OUTPUT.glob("*_????????_??????.json")):
        por_fuente[ruta.stem.rsplit("_", 2)[0]] = ruta   # el último por orden de fecha gana
    return list(por_fuente.values())


def _cargar_fuente(conn, fuente: str, puntos: list[dict], archivo: str,
                   operadores: dict, tipos: dict) -> dict:
    run_id = conn.execute(
        "INSERT INTO scraping_runs (fuente, archivo, leidos) VALUES (%s, %s, %s) RETURNING id",
        (fuente, archivo, len(puntos)),
    ).fetchone()[0]

    filas = []
    for p in puntos:
        operador_id = operadores.get(p["operador_slug"])
        if operador_id is None:
            raise ValueError(f"Operador desconocido: {p['operador_slug']} (añádelo en 002_semillas.sql)")
        filas.append({**p, "operador_id": operador_id, "nota_desaparecido": f"{NOTA_DESAPARECIDO}%"})

    with conn.cursor() as cur:
        cur.executemany(SQL_UPSERT, filas, returning=True)
        resultados = []
        while True:
            resultados.append(cur.fetchone())
            if not cur.nextset():
                break
    ids = [r[0] for r in resultados]
    nuevos = sum(1 for r in resultados if r[1])

    # Qué acepta cada punto (respetando filas manuales)
    conn.execute(
        "DELETE FROM puntos_tipos WHERE punto_id = ANY(%s) AND origen IS DISTINCT FROM 'manual'", (ids,)
    )
    filas_tipos, desconocidos = [], set()
    for punto_id, p in zip(ids, puntos):
        for slug in p["tipos"]:
            if slug not in tipos:
                desconocidos.add(slug)
                continue
            tipo_id, stream = tipos[slug]
            filas_tipos.append((punto_id, tipo_id, stream, p["origen_tipos"]))
    if desconocidos:
        raise ValueError(f"Tipos de dispositivo desconocidos: {sorted(desconocidos)}")
    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO puntos_tipos (punto_id, tipo_dispositivo_id, waste_stream, origen) "
            "VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING",
            filas_tipos,
        )

    # Horarios
    conn.execute("DELETE FROM horarios_punto WHERE punto_id = ANY(%s)", (ids,))
    filas_horarios = [
        (punto_id, h["dia_semana"], h["fecha"], h["hora_inicio"], h["hora_fin"], h["ubicacion_texto"], h["nota"])
        for punto_id, p in zip(ids, puntos)
        for h in p["horarios"]
    ]
    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO horarios_punto (punto_id, dia_semana, fecha, hora_inicio, hora_fin, ubicacion_texto, nota) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            filas_horarios,
        )

    # Puntos que ya no publica la fuente
    hoy = datetime.now(timezone.utc).date().isoformat()
    desactivados = conn.execute(
        "UPDATE puntos SET estado = 'cerrado', notas = %s, updated_at = NOW() "
        "WHERE fuente = %s AND NOT (id = ANY(%s)) AND estado <> 'cerrado'",
        (f"{NOTA_DESAPARECIDO} el {hoy}", fuente, ids),
    ).rowcount

    stats = {"leidos": len(puntos), "nuevos": nuevos, "actualizados": len(ids) - nuevos,
             "desactivados": desactivados, "tipos": len(filas_tipos), "horarios": len(filas_horarios)}
    conn.execute(
        "UPDATE scraping_runs SET fin = NOW(), nuevos = %s, actualizados = %s, desactivados = %s WHERE id = %s",
        (stats["nuevos"], stats["actualizados"], stats["desactivados"], run_id),
    )
    return stats


def asignar_distritos(conn) -> int:
    """Puntos de Madrid ciudad sin distrito (fuentes que no lo traen): toma el del
    punto oficial con distrito más cercano, si está a menos de 1,5 km. Aproximado
    en los bordes entre distritos; se puede corregir a mano."""
    return conn.execute("""
        UPDATE puntos p SET distrito_id = (
            SELECT o.distrito_id FROM puntos o
            WHERE o.distrito_id IS NOT NULL AND o.fuente LIKE 'datos.madrid.es/%%'
              AND ST_DWithin(o.coordenadas, p.coordenadas, 1500)
            ORDER BY o.coordenadas <-> p.coordenadas LIMIT 1
        )
        WHERE p.distrito_id IS NULL AND p.municipio = 'Madrid' AND p.coordenadas IS NOT NULL
    """).rowcount


def marcar_duplicados(conn) -> int:
    """Mismo tipo de punto, fuentes distintas, a menos de RADIO_DUPLICADO_M metros:
    se queda el de más confianza (verificado > coords oficiales > id más antiguo)."""
    conn.execute("UPDATE puntos SET duplicado_de = NULL WHERE duplicado_de IS NOT NULL")
    return conn.execute(f"""
        WITH pares AS (
            SELECT DISTINCT ON (b.id) b.id AS duplicado, a.id AS original
            FROM puntos a
            JOIN puntos b
              ON a.tipo_punto = b.tipo_punto
             AND a.fuente <> b.fuente
             AND a.estado <> 'cerrado' AND b.estado <> 'cerrado'
             AND ST_DWithin(a.coordenadas, b.coordenadas, {RADIO_DUPLICADO_M})
             AND (a.verificado_at IS NOT NULL, a.confianza_coords, -a.id)
               > (b.verificado_at IS NOT NULL, b.confianza_coords, -b.id)
            ORDER BY b.id, ST_Distance(a.coordenadas, b.coordenadas)
        )
        UPDATE puntos p SET duplicado_de = pares.original
        FROM pares WHERE p.id = pares.duplicado
    """).rowcount


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archivo", metavar="PATH")
    args = parser.parse_args()

    archivos = [Path(args.archivo)] if args.archivo else _ultimos_archivos()
    if not archivos:
        sys.exit("No hay archivos en scraper/output/. Corre antes: python scraper/main.py")

    with conectar() as conn:
        operadores = dict(conn.execute("SELECT slug, id FROM operadores").fetchall())
        tipos = {slug: (i, s) for slug, i, s in
                 conn.execute("SELECT slug, id, waste_stream FROM tipos_dispositivo").fetchall()}

        with conn.transaction():
            for ruta in archivos:
                puntos = json.loads(ruta.read_text(encoding="utf-8"))
                por_fuente = defaultdict(list)
                for p in puntos:
                    por_fuente[p["fuente"]].append(p)
                print(f"{ruta.name}")
                for fuente, lista in sorted(por_fuente.items()):
                    s = _cargar_fuente(conn, fuente, lista, ruta.name, operadores, tipos)
                    print(f"  {fuente:<26} leídos {s['leidos']:>5} · nuevos {s['nuevos']:>5} · "
                          f"actualizados {s['actualizados']:>5} · cerrados {s['desactivados']:>3} · "
                          f"horarios {s['horarios']:>5}")
            print(f"Distritos asignados por cercanía: {asignar_distritos(conn)}")
            print(f"Duplicados marcados: {marcar_duplicados(conn)}")
    print("Carga completada.")


if __name__ == "__main__":
    main()
