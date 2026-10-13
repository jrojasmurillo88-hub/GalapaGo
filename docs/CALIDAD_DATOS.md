# Calidad de datos

_Generado con `python db/calidad.py` el 13/10/2026 15:33. No editar a mano._

**3290 puntos** en la BD. Visibles en la app: no cerrados, no duplicados, con coordenadas.

## Por fuente y tipo

| Fuente | Tipo | Puntos | Cerrados | Duplicados | Última carga |
|---|---|---|---|---|---|
| ambilamp-arcgis | contenedor_scrap | 1189 | 0 | 0 | 2026-10-13 |
| datos.madrid.es/200284 | punto_limpio_fijo | 16 | 0 | 0 | 2026-10-13 |
| datos.madrid.es/300198 | punto_limpio_proximidad | 95 | 0 | 0 | 2026-10-13 |
| datos.madrid.es/300384 | contenedor_pilas | 400 | 0 | 0 | 2026-10-13 |
| datos.madrid.es/900003 | contenedor_pilas | 1492 | 0 | 3 | 2026-10-13 |
| datos.madrid.es/900026 | punto_limpio_movil | 42 | 0 | 0 | 2026-10-13 |
| openstreetmap | tienda | 56 | 0 | 0 | 2026-10-13 |

## Visibles por distrito

| Distrito | Fijo | Proximidad | Móvil | Tienda | Contenedor SCRAP | Pilas | Total |
|---|---|---|---|---|---|---|---|
| Centro | 0 | 9 | 1 | 7 | 23 | 63 | 103 |
| Arganzuela | 1 | 4 | 0 | 0 | 33 | 81 | 119 |
| Retiro | 0 | 6 | 0 | 0 | 17 | 74 | 97 |
| Salamanca | 0 | 6 | 0 | 7 | 46 | 110 | 169 |
| Chamartín | 1 | 5 | 1 | 0 | 31 | 99 | 137 |
| Tetuán | 0 | 6 | 1 | 4 | 37 | 67 | 115 |
| Chamberí | 0 | 6 | 0 | 3 | 36 | 93 | 138 |
| Fuencarral-El Pardo | 1 | 4 | 6 | 2 | 30 | 145 | 188 |
| Moncloa-Aravaca | 1 | 5 | 1 | 0 | 17 | 82 | 106 |
| Latina | 1 | 3 | 1 | 0 | 36 | 143 | 184 |
| Carabanchel | 1 | 4 | 3 | 2 | 41 | 139 | 190 |
| Usera | 1 | 3 | 2 | 1 | 19 | 72 | 98 |
| Puente de Vallecas | 1 | 3 | 3 | 1 | 34 | 150 | 192 |
| Moratalaz | 1 | 3 | 0 | 0 | 13 | 76 | 93 |
| Ciudad Lineal | 1 | 3 | 2 | 0 | 38 | 127 | 171 |
| Hortaleza | 1 | 6 | 7 | 1 | 27 | 109 | 151 |
| Villaverde | 1 | 4 | 4 | 0 | 19 | 66 | 94 |
| Villa de Vallecas | 1 | 5 | 3 | 1 | 14 | 55 | 79 |
| Vicálvaro | 1 | 3 | 5 | 0 | 9 | 36 | 54 |
| San Blas-Canillejas | 1 | 4 | 1 | 2 | 23 | 75 | 106 |
| Barajas | 1 | 3 | 1 | 0 | 5 | 27 | 37 |
| (fuera de Madrid ciudad) | 0 | 0 | 0 | 25 | 641 | 0 | 666 |

## Duplicados fusionados (3)

Mismo tipo de punto, fuentes distintas, a menos de 15 m. Se oculta el duplicado.

| Id | Fuente | Nombre | Duplicado de | Fuente original | Distancia (m) |
|---|---|---|---|---|---|
| 761 | datos.madrid.es/900003 | Contenedor de pilas (marquesina de autobús) | 195 | datos.madrid.es/300384 | 12 |
| 1759 | datos.madrid.es/900003 | Contenedor de pilas (marquesina de autobús) | 445 | datos.madrid.es/300384 | 13 |
| 1864 | datos.madrid.es/900003 | Contenedor de pilas (marquesina de autobús) | 221 | datos.madrid.es/300384 | 10 |

## Verificación por fuente

Los datos oficiales del Ayuntamiento entran como `activo`; el resto como `pendiente_verificar` hasta que alguien los compruebe.

| Fuente | Estado | Coordenadas | Puntos |
|---|---|---|---|
| ambilamp-arcgis | pendiente_verificar | de la fuente / geocodificadas | 1189 |
| datos.madrid.es/200284 | activo | oficiales | 16 |
| datos.madrid.es/300198 | activo | oficiales | 95 |
| datos.madrid.es/300384 | activo | oficiales | 400 |
| datos.madrid.es/900003 | activo | oficiales | 1489 |
| datos.madrid.es/900026 | activo | oficiales | 42 |
| openstreetmap | pendiente_verificar | de la fuente / geocodificadas | 56 |

## Para revisar a mano (11)

| Id | Tipo | Nombre | Distrito | Motivo | Horario (fuente) |
|---|---|---|---|---|---|
| 36 | punto_limpio_proximidad | Centro Municipal de Mayores Manuel Alexandre | Ciudad Lineal | horario parcial | Invierno de 9:00 a 21:00. Verano de 9:00 a 21:00. |
| 48 | punto_limpio_proximidad | Centro Cultural Fernando de los Ríos | Latina | horario parcial | Lunes a viernes de 9:00 a 14:00 y de 16:00 a 18:00. Julio de lunes a v |
| 63 | punto_limpio_proximidad | Parque Eva Duarte | Salamanca | horario parcial | de 7:00 a 24:00 horas. |
| 69 | punto_limpio_proximidad | Centro Cultural Eduardo Úrculo | Tetuán | horario parcial | Lunes a viernes, de 9:30 a 13:30. Lunes a jueves 16:30 a 18:00. Julio  |
| 70 | punto_limpio_proximidad | Biblioteca Municipal "Manuel Vázquez Montalbán" | Tetuán | horario parcial | Lunes a viernes de 9:30 a 14:00 y de 15:30 a 20:00. Del 15 de junio al |
| 84 | punto_limpio_proximidad | Centro Socio-Cultural Marconi (Acceso a Colonia Marconi, 4) | Villaverde | horario parcial | Lunes a jueves de 9:30 a 13:30 y de 16:30 a 19:30. Viernes de 9:30 a 1 |
| 10332 | contenedor_scrap | Ahorramas 1059 |  | sin distrito | Horario del comercio |
| 10362 | contenedor_scrap | Foreverled |  | sin distrito | Horario del comercio |
| 10423 | contenedor_scrap | Ahorramas 1364 |  | sin distrito | Horario del comercio |
| 10524 | contenedor_scrap | Ahorramas 1072 |  | sin distrito | Horario del comercio |
| 10528 | contenedor_scrap | Ceis Sl Centro De Ensayos Innovacion Y Servicios |  | sin distrito | Horario del comercio |

## Últimas cargas

| Fuente | Inicio | Leídos | Nuevos | Actualizados | Cerrados | Error |
|---|---|---|---|---|---|---|
| openstreetmap | 2026-10-13 13:32:17 | 56 | 56 | 0 | 0 |  |
| datos.madrid.es/900026 | 2026-10-13 13:32:17 | 42 | 0 | 42 | 0 |  |
| datos.madrid.es/900003 | 2026-10-13 13:32:17 | 1492 | 0 | 1492 | 0 |  |
| datos.madrid.es/300384 | 2026-10-13 13:32:17 | 400 | 0 | 400 | 0 |  |
| datos.madrid.es/300198 | 2026-10-13 13:32:17 | 95 | 0 | 95 | 0 |  |
| datos.madrid.es/200284 | 2026-10-13 13:32:17 | 16 | 0 | 16 | 0 |  |
| ambilamp-arcgis | 2026-10-13 13:32:17 | 1192 | 0 | 1192 | 0 |  |
| datos.madrid.es/900026 | 2026-10-13 13:21:55 | 42 | 0 | 42 | 0 |  |
| datos.madrid.es/900003 | 2026-10-13 13:21:55 | 1492 | 0 | 1492 | 0 |  |
| datos.madrid.es/300384 | 2026-10-13 13:21:55 | 400 | 0 | 400 | 0 |  |
