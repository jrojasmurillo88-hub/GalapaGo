# GalapaGo

Dónde llevar tus aparatos electrónicos (RAEE) y pilas en Madrid. Producto y negocio: [docs/GALAPAGO_BRIEF.md](docs/GALAPAGO_BRIEF.md).

Empezó como copia de RAEEconecta (Colombia), que sigue viva en su propio repo; sus documentos están en [docs/archivo-colombia/](docs/archivo-colombia/) solo como referencia.

## Arquitectura

```
fuentes (datos abiertos, ArcGIS, OSM) ─▶ scraper/main.py ─▶ scraper/output/*.json
                                                              │
                                     db/loader.py ◀───────────┘
                                          │
                     Supabase (Postgres + PostGIS, Frankfurt)
                                          │
                        api/main.py (FastAPI, Render) ─▶ web/ (Next.js 16, Vercel)
```

| Carpeta | Qué hay |
|---|---|
| `db/migrations/` | Esquema, catálogos (categorías RAEE, tipos de dispositivo, distritos, operadores) y funciones de búsqueda |
| `db/` | `migrar.py`, `loader.py`, `calidad.py` |
| `scraper/scrapers/` | Una fuente por archivo |
| `scraper/input/madrid/` | Archivos de datos.madrid.es descargados a mano (ver abajo) |
| `api/` | API pública que usa la web |
| `web/` | App móvil (PWA), es-ES por defecto + inglés |

## Puesta en marcha

Requisitos: Python 3.12+ y Node 20+.

```bash
python -m venv .venv
.venv/Scripts/pip install -r db/requirements.txt -r scraper/requirements.txt -r api/requirements.txt   # Windows
# en macOS/Linux: .venv/bin/pip …
cd web && npm install
```

Secretos: copia `db/.env.example` a `db/.env` y rellena con las claves del proyecto Supabase **de GalapaGo** (nunca las de Colombia: los scripts se niegan a arrancar contra ese proyecto). `db/.env` no se sube a git.

## Base de datos desde cero

```bash
.venv/Scripts/python db/migrar.py            # crea/actualiza tablas, catálogos y funciones
.venv/Scripts/python db/migrar.py --estado   # qué migraciones faltan
```

Las migraciones se aplican una vez cada una. `002_semillas.sql` y `003_funciones.sql` son idempotentes: si cambian, se vuelven a aplicar solas. Un cambio de esquema nuevo va en un archivo nuevo (`004_…sql`).

## Actualizar los puntos (manual en el piloto)

Un solo comando para todo:

```bash
.venv/Scripts/python scraper/main.py && .venv/Scripts/python db/loader.py && .venv/Scripts/python db/calidad.py
```

O por partes:

```bash
.venv/Scripts/python scraper/main.py madrid     # Ayuntamiento (archivos de scraper/input/madrid)
.venv/Scripts/python scraper/main.py ambilamp   # contenedores de lámparas en comercios
.venv/Scripts/python scraper/main.py tiendas    # grandes cadenas (OpenStreetMap)
.venv/Scripts/python db/loader.py               # carga lo último de cada fuente
.venv/Scripts/python db/calidad.py              # regenera docs/CALIDAD_DATOS.md
```

El loader va en una transacción: o carga todo o nada. Respeta lo que haya cambiado un admin (sponsor, verificación, cierres manuales, "qué acepta" con origen `manual`) y cierra los puntos que desaparecen de su fuente.

### Fuentes

| Fuente | Cómo se obtiene | Licencia / condiciones | Estado al cargar |
|---|---|---|---|
| Ayuntamiento de Madrid — puntos limpios fijos (200284), proximidad (300198), móviles 24 h (900026), pilas en mupis (300384) y marquesinas (900003) | **Descarga manual** desde datos.madrid.es a `scraper/input/madrid/` (su robots.txt pide que los bots no descarguen recursos) | CC BY 4.0 — citar "Ayuntamiento de Madrid" | `activo` |
| Ambilamp — "puntos ciudadano" (lámparas en comercios) | Capa pública ArcGIS enlazada desde ambilamp.es | Sin licencia explícita: se cita la fuente | `pendiente_verificar` |
| Grandes cadenas (El Corte Inglés, MediaMarkt, Leroy Merlin…) | OpenStreetMap (Overpass) + Nominatim para dirección | ODbL — "© colaboradores de OpenStreetMap" | `pendiente_verificar` |

**Datos de Madrid — cómo descargarlos.** Abre cada conjunto en datos.madrid.es → *Descargas* y guarda el archivo en `scraper/input/madrid/` con su nombre original:
`200284-0-puntos-limpios-fijos-csv.csv`, `300198-1-puntos-proximidad-csv.csv`, `900026-0-puntos-limpios-residuos-csv.csv`, `300384-0-mupi-pilas-csv.csv`, `900003-0-contenedores-pilas-marquesinas.xlsx`.

Más adelante: una GitHub Action semanal (las fuentes de ArcGIS y OSM sí se pueden automatizar; las de Madrid requieren descarga manual o un acuerdo con el Ayuntamiento).

## Desarrollo local

```bash
cd api && ../.venv/Scripts/python -m uvicorn main:app --reload --port 8000   # http://localhost:8000/docs
cd web && npm run dev                                                         # http://localhost:3000
```

La web usa `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:8000`). Para cambiar textos o añadir idioma: `web/src/lib/i18n.tsx`. Para cambiar colores: los tokens al principio de `web/src/app/globals.css`.

## Despliegue

En producción: web **https://galapa-go-rust.vercel.app** · API **https://galapago-api.onrender.com** (`/docs` para la documentación). Ambos se redesplegan solos con cada push a `main`.


- **API (Render):** servicio nuevo, *Root directory* `api`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`. Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CORS_ORIGINS` (URL de la web). Opcional para push: `VAPID_PRIVATE_KEY`, `VAPID_CLAIM_EMAIL`, `CRON_SECRET`.
- **Web (Vercel):** proyecto nuevo, *Root directory* `web`. Variable: `NEXT_PUBLIC_API_URL` (URL de la API en Render). Opcional: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- El envío programado de notificaciones push (cron) está apagado en esta fase.
