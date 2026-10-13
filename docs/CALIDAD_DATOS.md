# Calidad de datos

_Generado con `python db/calidad.py` el 13/10/2026 15:17. No editar a mano._

**2045 puntos** en la BD. Visibles en la app: no cerrados, no duplicados, con coordenadas.

## Por fuente y tipo

| Fuente | Tipo | Puntos | Cerrados | Duplicados | Última carga |
|---|---|---|---|---|---|
| datos.madrid.es/200284 | punto_limpio_fijo | 16 | 0 | 0 | 2026-10-13 |
| datos.madrid.es/300198 | punto_limpio_proximidad | 95 | 0 | 0 | 2026-10-13 |
| datos.madrid.es/300384 | contenedor_pilas | 400 | 0 | 0 | 2026-10-13 |
| datos.madrid.es/900003 | contenedor_pilas | 1492 | 0 | 3 | 2026-10-13 |
| datos.madrid.es/900026 | punto_limpio_movil | 42 | 0 | 0 | 2026-10-13 |

## Visibles por distrito

| Distrito | Fijo | Proximidad | Móvil | Tienda | Contenedor SCRAP | Pilas | Total |
|---|---|---|---|---|---|---|---|
| Centro | 0 | 9 | 1 | 0 | 0 | 63 | 73 |
| Arganzuela | 1 | 4 | 0 | 0 | 0 | 81 | 86 |
| Retiro | 0 | 6 | 0 | 0 | 0 | 74 | 80 |
| Salamanca | 0 | 6 | 0 | 0 | 0 | 110 | 116 |
| Chamartín | 1 | 5 | 1 | 0 | 0 | 99 | 106 |
| Tetuán | 0 | 6 | 1 | 0 | 0 | 67 | 74 |
| Chamberí | 0 | 6 | 0 | 0 | 0 | 93 | 99 |
| Fuencarral-El Pardo | 1 | 4 | 6 | 0 | 0 | 145 | 156 |
| Moncloa-Aravaca | 1 | 5 | 1 | 0 | 0 | 82 | 89 |
| Latina | 1 | 3 | 1 | 0 | 0 | 143 | 148 |
| Carabanchel | 1 | 4 | 3 | 0 | 0 | 139 | 147 |
| Usera | 1 | 3 | 2 | 0 | 0 | 72 | 78 |
| Puente de Vallecas | 1 | 3 | 3 | 0 | 0 | 150 | 157 |
| Moratalaz | 1 | 3 | 0 | 0 | 0 | 76 | 80 |
| Ciudad Lineal | 1 | 3 | 2 | 0 | 0 | 127 | 133 |
| Hortaleza | 1 | 6 | 7 | 0 | 0 | 109 | 123 |
| Villaverde | 1 | 4 | 4 | 0 | 0 | 66 | 75 |
| Villa de Vallecas | 1 | 5 | 3 | 0 | 0 | 55 | 64 |
| Vicálvaro | 1 | 3 | 5 | 0 | 0 | 36 | 45 |
| San Blas-Canillejas | 1 | 4 | 1 | 0 | 0 | 75 | 81 |
| Barajas | 1 | 3 | 1 | 0 | 0 | 27 | 32 |

## Duplicados fusionados (3)

Mismo tipo de punto, fuentes distintas, a menos de 15 m. Se oculta el duplicado.

| Id | Fuente | Nombre | Duplicado de | Fuente original | Distancia (m) |
|---|---|---|---|---|---|
| 761 | datos.madrid.es/900003 | Contenedor de pilas (marquesina de autobús) | 195 | datos.madrid.es/300384 | 12 |
| 1759 | datos.madrid.es/900003 | Contenedor de pilas (marquesina de autobús) | 445 | datos.madrid.es/300384 | 13 |
| 1864 | datos.madrid.es/900003 | Contenedor de pilas (marquesina de autobús) | 221 | datos.madrid.es/300384 | 10 |

## Para revisar a mano (6)

| Id | Tipo | Nombre | Distrito | Motivo | Horario (fuente) |
|---|---|---|---|---|---|
| 48 | punto_limpio_proximidad | Centro Cultural Fernando de los Ríos | Latina | horario parcial | Lunes a viernes de 9:00 a 14:00 y de 16:00 a 18:00. Julio de lunes a v |
| 69 | punto_limpio_proximidad | Centro Cultural Eduardo Úrculo | Tetuán | horario parcial | Lunes a viernes, de 9:30 a 13:30. Lunes a jueves 16:30 a 18:00. Julio  |
| 70 | punto_limpio_proximidad | Biblioteca Municipal "Manuel Vázquez Montalbán" | Tetuán | horario parcial | Lunes a viernes de 9:30 a 14:00 y de 15:30 a 20:00. Del 15 de junio al |
| 84 | punto_limpio_proximidad | Centro Socio-Cultural Marconi (Acceso a Colonia Marconi, 4) | Villaverde | horario parcial | Lunes a jueves de 9:30 a 13:30 y de 16:30 a 19:30. Viernes de 9:30 a 1 |
| 36 | punto_limpio_proximidad | Centro Municipal de Mayores Manuel Alexandre | Ciudad Lineal | horario sin estructurar | Invierno de 9:00 a 21:00. Verano de 9:00 a 21:00. |
| 63 | punto_limpio_proximidad | Parque Eva Duarte | Salamanca | horario sin estructurar | de 7:00 a 24:00 horas. |

## Últimas cargas

| Fuente | Inicio | Leídos | Nuevos | Actualizados | Cerrados | Error |
|---|---|---|---|---|---|---|
| datos.madrid.es/900026 | 2026-10-13 13:17:12 | 42 | 0 | 42 | 0 |  |
| datos.madrid.es/900003 | 2026-10-13 13:17:12 | 1492 | 0 | 1492 | 0 |  |
| datos.madrid.es/300384 | 2026-10-13 13:17:12 | 400 | 0 | 400 | 0 |  |
| datos.madrid.es/300198 | 2026-10-13 13:17:12 | 95 | 0 | 95 | 0 |  |
| datos.madrid.es/200284 | 2026-10-13 13:17:12 | 16 | 0 | 16 | 0 |  |
| datos.madrid.es/900026 | 2026-10-13 13:16:52 | 42 | 0 | 42 | 0 |  |
| datos.madrid.es/900003 | 2026-10-13 13:16:52 | 1492 | 0 | 1492 | 0 |  |
| datos.madrid.es/300384 | 2026-10-13 13:16:52 | 400 | 0 | 400 | 0 |  |
| datos.madrid.es/300198 | 2026-10-13 13:16:52 | 95 | 0 | 95 | 0 |  |
| datos.madrid.es/200284 | 2026-10-13 13:16:52 | 16 | 0 | 16 | 0 |  |
