"""
Informe de calidad de datos -> docs/CALIDAD_DATOS.md

Uso: python db/calidad.py
"""

from datetime import datetime
from pathlib import Path

from config import conectar

SALIDA = Path(__file__).parent.parent / "docs" / "CALIDAD_DATOS.md"


def _tabla(cabecera: list[str], filas: list[tuple]) -> str:
    lineas = ["| " + " | ".join(cabecera) + " |", "|" + "---|" * len(cabecera)]
    lineas += ["| " + " | ".join("" if v is None else str(v) for v in f) + " |" for f in filas]
    return "\n".join(lineas)


def main():
    with conectar() as c:
        q = lambda sql: c.execute(sql).fetchall()

        por_fuente = q("""
            SELECT fuente, tipo_punto, COUNT(*),
                   COUNT(*) FILTER (WHERE estado = 'cerrado'),
                   COUNT(*) FILTER (WHERE duplicado_de IS NOT NULL),
                   MAX(scraped_at)::date
            FROM puntos GROUP BY 1, 2 ORDER BY 1, 2""")

        por_distrito = q("""
            SELECT COALESCE(d.nombre, '(fuera de Madrid ciudad)'),
                   COUNT(*) FILTER (WHERE v.tipo_punto = 'punto_limpio_fijo'),
                   COUNT(*) FILTER (WHERE v.tipo_punto = 'punto_limpio_proximidad'),
                   COUNT(*) FILTER (WHERE v.tipo_punto = 'punto_limpio_movil'),
                   COUNT(*) FILTER (WHERE v.tipo_punto = 'tienda'),
                   COUNT(*) FILTER (WHERE v.tipo_punto = 'contenedor_scrap'),
                   COUNT(*) FILTER (WHERE v.tipo_punto = 'contenedor_pilas'),
                   COUNT(*)
            FROM v_puntos v LEFT JOIN distritos d ON d.id = v.distrito_id
            GROUP BY d.id, d.nombre ORDER BY d.id NULLS LAST""")

        duplicados = q("""
            SELECT d.id, d.fuente, d.nombre, o.id, o.fuente,
                   ROUND(ST_Distance(d.coordenadas, o.coordenadas))::int
            FROM puntos d JOIN puntos o ON o.id = d.duplicado_de ORDER BY d.id""")

        revisar = q("""
            SELECT p.id, p.tipo_punto, p.nombre, d.nombre,
                   CASE WHEN p.coordenadas IS NULL THEN 'sin coordenadas'
                        WHEN p.confianza_coords = 1 THEN 'coordenadas geocodificadas'
                        WHEN NOT EXISTS (SELECT 1 FROM horarios_punto h WHERE h.punto_id = p.id)
                             THEN 'horario sin estructurar'
                        WHEN p.notas LIKE 'horario estructurado parcial%%' THEN 'horario parcial'
                        WHEN p.estado = 'pendiente_verificar' THEN 'pendiente de verificar' END,
                   REPLACE(LEFT(p.horario_texto, 70), E'\\n', ' ')
            FROM puntos p LEFT JOIN distritos d ON d.id = p.distrito_id
            WHERE p.estado <> 'cerrado' AND p.duplicado_de IS NULL
              AND (p.coordenadas IS NULL OR p.confianza_coords = 1
                   OR NOT EXISTS (SELECT 1 FROM horarios_punto h WHERE h.punto_id = p.id)
                   OR p.notas LIKE 'horario estructurado parcial%%'
                   OR (p.estado = 'pendiente_verificar' AND p.tipo_punto <> 'contenedor_pilas'))
            ORDER BY 5, p.tipo_punto, p.id""")

        runs = q("""
            SELECT fuente, inicio::timestamp(0), leidos, nuevos, actualizados, desactivados, error
            FROM scraping_runs ORDER BY id DESC LIMIT 10""")

    total = sum(f[2] for f in por_fuente)
    md = [
        "# Calidad de datos",
        "",
        f"_Generado con `python db/calidad.py` el {datetime.now():%d/%m/%Y %H:%M}. No editar a mano._",
        "",
        f"**{total} puntos** en la BD. Visibles en la app: no cerrados, no duplicados, con coordenadas.",
        "",
        "## Por fuente y tipo",
        "",
        _tabla(["Fuente", "Tipo", "Puntos", "Cerrados", "Duplicados", "Última carga"], por_fuente),
        "",
        "## Visibles por distrito",
        "",
        _tabla(["Distrito", "Fijo", "Proximidad", "Móvil", "Tienda", "Contenedor SCRAP", "Pilas", "Total"],
               por_distrito),
        "",
        f"## Duplicados fusionados ({len(duplicados)})",
        "",
        "Mismo tipo de punto, fuentes distintas, a menos de 15 m. Se oculta el duplicado.",
        "",
        _tabla(["Id", "Fuente", "Nombre", "Duplicado de", "Fuente original", "Distancia (m)"], duplicados)
        if duplicados else "Ninguno.",
        "",
        f"## Para revisar a mano ({len(revisar)})",
        "",
        _tabla(["Id", "Tipo", "Nombre", "Distrito", "Motivo", "Horario (fuente)"], revisar)
        if revisar else "Nada pendiente.",
        "",
        "## Últimas cargas",
        "",
        _tabla(["Fuente", "Inicio", "Leídos", "Nuevos", "Actualizados", "Cerrados", "Error"], runs),
        "",
    ]
    SALIDA.write_text("\n".join(md), encoding="utf-8")
    print(f"Informe: {SALIDA} ({total} puntos, {len(duplicados)} duplicados, {len(revisar)} para revisar)")


if __name__ == "__main__":
    main()
