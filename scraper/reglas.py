"""
Qué acepta cada tipo de punto cuando la fuente no lo dice punto a punto.

Se aplican al cargar y quedan en puntos_tipos con origen='regla_tipo_punto', así
que un admin puede corregir punto a punto (origen='manual') sin tocar esto.

Fuentes (a verificar antes del piloto, ver docs/CALIDAD_DATOS.md):
- Puntos limpios fijos: admiten todos los RAEE domésticos — www.madrid.es/puntoslimpios
- Móviles y de proximidad: pequeños aparatos eléctricos y electrónicos, pilas,
  baterías, fluorescentes y bombillas — notas del Ayuntamiento (diario.madrid.es)
- Contenedores de pilas (marquesinas y mupis): solo pilas y baterías portátiles
"""

TODOS_RAEE = [
    "movil", "portatil", "tablet", "ordenador_sobremesa", "cargador_cable", "periferico",
    "auriculares_altavoz", "consola", "monitor", "televisor", "impresora",
    "pequeno_electrodomestico", "microondas", "bombilla", "frigorifico",
    "aire_acondicionado", "lavadora",
]
PILAS = ["pilas", "bateria_movil_portatil"]

PEQUENOS = [
    "movil", "portatil", "tablet", "cargador_cable", "periferico", "auriculares_altavoz",
    "consola", "pequeno_electrodomestico", "bombilla",
]

POR_TIPO_PUNTO: dict[str, list[str]] = {
    "punto_limpio_fijo":       TODOS_RAEE + PILAS,
    "punto_limpio_movil":      PEQUENOS + PILAS,
    "punto_limpio_proximidad": PEQUENOS + PILAS,
    "contenedor_pilas":        PILAS,
}

# waste_stream de cada slug (para puntos_tipos)
STREAM = {slug: "pilas" for slug in PILAS} | {slug: "raee" for slug in TODOS_RAEE}
