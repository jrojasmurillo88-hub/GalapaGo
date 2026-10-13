-- ============================================================
-- GalapaGo — 001 · Esquema base (España)
-- Construye la BD desde cero. Idempotente: se puede volver a correr.
-- Ejecutar con: python db/migrar.py   (o pegar en Supabase → SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Catálogos ──────────────────────────────────────────────────────────────

-- Las 7 categorías de RAEE del RD 110/2015 (anexo III) / Directiva 2012/19/UE
CREATE TABLE IF NOT EXISTS categorias_raee (
    id                  SMALLINT PRIMARY KEY CHECK (id BETWEEN 1 AND 7),
    nombre_es           TEXT NOT NULL,
    nombre_en           TEXT NOT NULL,
    visible_consumidor  BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tipos de dispositivo que ve el usuario ("¿Qué quieres reciclar?")
CREATE TABLE IF NOT EXISTS tipos_dispositivo (
    id            SERIAL PRIMARY KEY,
    slug          TEXT NOT NULL UNIQUE,
    nombre_es     TEXT NOT NULL,
    nombre_en     TEXT NOT NULL,
    categoria_id  SMALLINT REFERENCES categorias_raee(id),   -- NULL para pilas
    waste_stream  TEXT NOT NULL DEFAULT 'raee' CHECK (waste_stream IN ('raee', 'pilas')),
    peso_est_kg   NUMERIC(6,2),
    peso_fuente   TEXT,          -- de dónde sale el peso estimado
    guia_borrado  TEXT,          -- clave de la guía de borrado de datos (frontend), o NULL
    icono         TEXT,
    orden         SMALLINT NOT NULL DEFAULT 100,
    activo        BOOLEAN NOT NULL DEFAULT TRUE
);

-- Distritos de Madrid ciudad (código oficial del Ayuntamiento)
CREATE TABLE IF NOT EXISTS distritos (
    id      SMALLINT PRIMARY KEY,
    nombre  TEXT NOT NULL UNIQUE
);

-- Quién gestiona un punto (SCRAP, Ayuntamiento, tienda…)
CREATE TABLE IF NOT EXISTS operadores (
    id      SERIAL PRIMARY KEY,
    slug    TEXT NOT NULL UNIQUE,
    nombre  TEXT NOT NULL,
    tipo    TEXT NOT NULL CHECK (tipo IN ('scrap', 'ayuntamiento', 'comunidad', 'tienda', 'otro')),
    web     TEXT
);

-- Quién paga (patrocinio). Solo se muestra si un admin lo asigna.
CREATE TABLE IF NOT EXISTS sponsors (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL UNIQUE,
    web         TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Puntos de entrega ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS puntos (
    id                   SERIAL PRIMARY KEY,
    nombre               TEXT NOT NULL,
    tipo_punto           TEXT NOT NULL CHECK (tipo_punto IN (
                             'punto_limpio_fijo', 'punto_limpio_movil', 'punto_limpio_proximidad',
                             'tienda', 'contenedor_scrap', 'contenedor_pilas', 'otro')),
    direccion            TEXT,
    detalle_ubicacion    TEXT,              -- "esquina con…", "dentro del polideportivo…"
    distrito_id          SMALLINT REFERENCES distritos(id),
    barrio               TEXT,
    municipio            TEXT NOT NULL DEFAULT 'Madrid',
    provincia            TEXT NOT NULL DEFAULT 'Madrid',
    codigo_postal        TEXT,
    coordenadas          GEOGRAPHY(POINT, 4326),
    horario_texto        TEXT,              -- horario tal cual lo publica la fuente
    operador_id          INT REFERENCES operadores(id),
    sponsor_id           INT REFERENCES sponsors(id),
    operador_es_sponsor  BOOLEAN NOT NULL DEFAULT FALSE,
    -- Procedencia
    fuente               TEXT NOT NULL,     -- p. ej. 'datos.madrid.es/200284'
    fuente_id            TEXT NOT NULL,     -- id del registro en la fuente
    fuente_url           TEXT,
    scraped_at           TIMESTAMPTZ,
    verificado_at        TIMESTAMPTZ,
    verificado_por       TEXT,
    estado               TEXT NOT NULL DEFAULT 'pendiente_verificar'
                             CHECK (estado IN ('activo', 'pendiente_verificar', 'cerrado')),
    -- 0 = sin coords, 1 = geocodificado, 2 = coords de la fuente oficial, 3 = verificado a mano
    confianza_coords     SMALLINT NOT NULL DEFAULT 0,
    duplicado_de         INT REFERENCES puntos(id),   -- si se fusionó con otro punto
    notas                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (fuente, fuente_id)
);

CREATE INDEX IF NOT EXISTS idx_puntos_coordenadas ON puntos USING GIST (coordenadas);
CREATE INDEX IF NOT EXISTS idx_puntos_tipo        ON puntos (tipo_punto);
CREATE INDEX IF NOT EXISTS idx_puntos_distrito    ON puntos (distrito_id);
CREATE INDEX IF NOT EXISTS idx_puntos_estado      ON puntos (estado);

-- Qué acepta cada punto (por punto, no por sistema)
CREATE TABLE IF NOT EXISTS puntos_tipos (
    punto_id             INT NOT NULL REFERENCES puntos(id) ON DELETE CASCADE,
    tipo_dispositivo_id  INT NOT NULL REFERENCES tipos_dispositivo(id) ON DELETE CASCADE,
    waste_stream         TEXT NOT NULL DEFAULT 'raee' CHECK (waste_stream IN ('raee', 'pilas')),
    origen               TEXT,   -- 'fuente' | 'regla_tipo_punto' | 'manual'
    PRIMARY KEY (punto_id, tipo_dispositivo_id)
);

CREATE INDEX IF NOT EXISTS idx_puntos_tipos_tipo ON puntos_tipos (tipo_dispositivo_id);

-- Horarios estructurados. Un punto fijo tiene una fila por día; un punto móvil
-- tiene una fila por parada (día + franja + ubicación si se mueve).
CREATE TABLE IF NOT EXISTS horarios_punto (
    id               SERIAL PRIMARY KEY,
    punto_id         INT NOT NULL REFERENCES puntos(id) ON DELETE CASCADE,
    dia_semana       SMALLINT CHECK (dia_semana BETWEEN 1 AND 7),   -- ISO: 1 = lunes
    fecha            DATE,                                          -- para paradas puntuales
    hora_inicio      TIME NOT NULL,
    hora_fin         TIME NOT NULL,                                 -- '24:00' = hasta medianoche
    ubicacion_texto  TEXT,
    coordenadas      GEOGRAPHY(POINT, 4326),                        -- si la parada se mueve
    nota             TEXT,
    CHECK (dia_semana IS NOT NULL OR fecha IS NOT NULL),
    CHECK (hora_fin > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_horarios_punto ON horarios_punto (punto_id);

-- Notas normativas (texto verificado + fuente). La UI no hace afirmaciones legales propias.
CREATE TABLE IF NOT EXISTS notas_normativas (
    id             SERIAL PRIMARY KEY,
    clave          TEXT NOT NULL UNIQUE,
    texto          TEXT NOT NULL,
    fuente_url     TEXT,
    verificado_at  DATE
);

-- ── Ingesta ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scraping_runs (
    id                   SERIAL PRIMARY KEY,
    fuente               TEXT NOT NULL,
    archivo              TEXT,
    inicio               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fin                  TIMESTAMPTZ,
    leidos               INT DEFAULT 0,
    nuevos               INT DEFAULT 0,
    actualizados         INT DEFAULT 0,
    desactivados         INT DEFAULT 0,
    error                TEXT
);

-- ── Comportamiento (heredado de RAEEconecta) ───────────────────────────────

-- Reportes ciudadanos: datos de verificación para los SCRAP
CREATE TABLE IF NOT EXISTS reportes (
    id          SERIAL PRIMARY KEY,
    punto_id    INT NOT NULL REFERENCES puntos(id) ON DELETE CASCADE,
    tipo        TEXT NOT NULL CHECK (tipo IN (
                    'cerrado', 'lleno', 'horario_incorrecto', 'direccion_incorrecta',
                    'no_acepta', 'otro')),
    detalle     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check-in voluntario de entrega (base de la Fase 2: entregas verificadas)
CREATE TABLE IF NOT EXISTS entregas (
    id           SERIAL PRIMARY KEY,
    punto_id     INT NOT NULL REFERENCES puntos(id) ON DELETE CASCADE,
    distrito_id  SMALLINT REFERENCES distritos(id),
    items        JSONB,          -- [{"tipo": "<slug tipos_dispositivo>", "cantidad": 1}]
    peso_est_kg  NUMERIC(8,2),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entregas_fecha ON entregas (created_at);

-- Eventos del embudo (selección de punto, intención de descarte…)
CREATE TABLE IF NOT EXISTS eventos (
    id                 SERIAL PRIMARY KEY,
    tipo               TEXT NOT NULL CHECK (tipo IN (
                           'seleccion_dispositivo', 'seleccion_punto', 'intencion_descarte',
                           'guia_borrado_vista')),
    punto_id           INT REFERENCES puntos(id) ON DELETE SET NULL,
    tipo_dispositivo   TEXT,
    session_id         TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_tipo_fecha ON eventos (tipo, created_at);

-- Push (recordatorio de check-in). Sin envío programado en la Fase 1.
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          SERIAL PRIMARY KEY,
    endpoint    TEXT NOT NULL UNIQUE,
    p256dh      TEXT NOT NULL,
    auth        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notificaciones_programadas (
    id            SERIAL PRIMARY KEY,
    endpoint      TEXT NOT NULL REFERENCES push_subscriptions(endpoint) ON DELETE CASCADE,
    punto_id      INT REFERENCES puntos(id) ON DELETE SET NULL,
    nombre_punto  TEXT,
    fire_at       TIMESTAMPTZ NOT NULL,
    enviada       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Sin políticas = la anon key no puede leer ni escribir nada. El backend usa la
-- service_role key, que ignora RLS. Cierra la puerta si la anon key se filtra.

ALTER TABLE categorias_raee            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_dispositivo          ENABLE ROW LEVEL SECURITY;
ALTER TABLE distritos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE operadores                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntos                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntos_tipos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_punto             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_normativas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_runs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_programadas ENABLE ROW LEVEL SECURITY;
