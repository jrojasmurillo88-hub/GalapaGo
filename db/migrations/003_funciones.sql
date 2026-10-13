-- ============================================================
-- GalapaGo — 003 · Vistas y funciones de consulta
-- Todo "hoy/ahora" se calcula en hora de Madrid (Europe/Madrid).
-- ============================================================

-- Hora local de Madrid
CREATE OR REPLACE FUNCTION ahora_madrid() RETURNS TIMESTAMP
LANGUAGE sql STABLE AS $$ SELECT (NOW() AT TIME ZONE 'Europe/Madrid') $$;

-- Franjas de un punto para una fecha concreta (por día de semana o por fecha)
CREATE OR REPLACE FUNCTION horarios_en_fecha(_punto_id INT, _fecha DATE)
RETURNS TABLE (hora_inicio TIME, hora_fin TIME, ubicacion_texto TEXT)
LANGUAGE sql STABLE AS $$
    SELECT h.hora_inicio, h.hora_fin, h.ubicacion_texto
    FROM horarios_punto h
    WHERE h.punto_id = _punto_id
      AND (h.fecha = _fecha
           OR (h.fecha IS NULL AND h.dia_semana = EXTRACT(ISODOW FROM _fecha)::INT))
    ORDER BY h.hora_inicio
$$;

-- Vista principal: puntos visibles (no cerrados, no duplicados) con todo lo que
-- necesita el frontend. sponsor_nombre solo aparece si un admin lo asignó.
DROP VIEW IF EXISTS v_puntos;
CREATE VIEW v_puntos AS
SELECT
    p.id,
    p.nombre,
    p.tipo_punto,
    p.direccion,
    p.detalle_ubicacion,
    p.distrito_id,
    d.nombre                                   AS distrito,
    p.barrio,
    p.municipio,
    ST_Y(p.coordenadas::geometry)::float       AS lat,
    ST_X(p.coordenadas::geometry)::float       AS lng,
    p.coordenadas,
    p.horario_texto,
    o.slug                                     AS operador_slug,
    o.nombre                                   AS operador_nombre,
    COALESCE(s.nombre, CASE WHEN p.operador_es_sponsor THEN o.nombre END) AS sponsor_nombre,
    p.estado,
    p.confianza_coords,
    p.fuente,
    p.fuente_url,
    p.scraped_at,
    p.verificado_at,
    EXISTS (SELECT 1 FROM horarios_punto h WHERE h.punto_id = p.id) AS tiene_horario,
    EXISTS (SELECT 1 FROM horarios_en_fecha(p.id, ahora_madrid()::date)) AS abre_hoy,
    EXISTS (SELECT 1 FROM horarios_en_fecha(p.id, ahora_madrid()::date) f
            WHERE ahora_madrid()::time >= f.hora_inicio
              AND ahora_madrid()::time <  f.hora_fin)                   AS abierto_ahora,
    (SELECT COALESCE(json_agg(json_build_object(
                'inicio', to_char(f.hora_inicio, 'HH24:MI'),
                'fin',    to_char(f.hora_fin, 'HH24:MI'),
                'ubicacion', f.ubicacion_texto)), '[]'::json)
       FROM horarios_en_fecha(p.id, ahora_madrid()::date) f)            AS horarios_hoy,
    (SELECT COALESCE(array_agg(t.slug ORDER BY t.orden), '{}')
       FROM puntos_tipos pt JOIN tipos_dispositivo t ON t.id = pt.tipo_dispositivo_id
      WHERE pt.punto_id = p.id)                                         AS tipos
FROM puntos p
LEFT JOIN distritos  d ON d.id = p.distrito_id
LEFT JOIN operadores o ON o.id = p.operador_id
LEFT JOIN sponsors   s ON s.id = p.sponsor_id AND s.activo
WHERE p.estado <> 'cerrado'
  AND p.duplicado_de IS NULL
  AND p.coordenadas IS NOT NULL;

-- Búsqueda con filtros. Todos los parámetros son opcionales.
--   _lat/_lng + _radio_metros: si vienen, filtra por radio y ordena por distancia
--   _tipo_dispositivo: slug de tipos_dispositivo
--   _tipos_punto: p. ej. '{punto_limpio_fijo,tienda}'
--   _horario: 'ahora' | 'hoy' | NULL
DROP FUNCTION IF EXISTS buscar_puntos(float, float, int, text, text[], text, int, text, int);
CREATE FUNCTION buscar_puntos(
    _lat               float  DEFAULT NULL,
    _lng               float  DEFAULT NULL,
    _radio_metros      int    DEFAULT 3000,
    _tipo_dispositivo  text   DEFAULT NULL,
    _tipos_punto       text[] DEFAULT NULL,
    _operador          text   DEFAULT NULL,
    _distrito_id       int    DEFAULT NULL,
    _horario           text   DEFAULT NULL,
    _limite            int    DEFAULT 300
)
RETURNS TABLE (
    id int, nombre text, tipo_punto text, direccion text, detalle_ubicacion text,
    distrito_id smallint, distrito text, lat float, lng float, horario_texto text,
    operador_slug text, operador_nombre text, sponsor_nombre text, estado text,
    verificado_at timestamptz, tiene_horario boolean, abre_hoy boolean,
    abierto_ahora boolean, horarios_hoy json, tipos text[], distancia_metros float
)
LANGUAGE sql STABLE AS $$
    SELECT
        v.id, v.nombre, v.tipo_punto, v.direccion, v.detalle_ubicacion,
        v.distrito_id, v.distrito, v.lat, v.lng, v.horario_texto,
        v.operador_slug, v.operador_nombre, v.sponsor_nombre, v.estado,
        v.verificado_at, v.tiene_horario, v.abre_hoy, v.abierto_ahora,
        v.horarios_hoy, v.tipos,
        CASE WHEN _lat IS NULL OR _lng IS NULL THEN NULL
             ELSE ROUND(ST_Distance(v.coordenadas, ST_MakePoint(_lng, _lat)::geography)::numeric, 0)::float
        END AS distancia_metros
    FROM v_puntos v
    WHERE (_lat IS NULL OR _lng IS NULL
           OR ST_DWithin(v.coordenadas, ST_MakePoint(_lng, _lat)::geography, _radio_metros))
      AND (_tipo_dispositivo IS NULL OR _tipo_dispositivo = ANY (v.tipos))
      AND (_tipos_punto IS NULL OR v.tipo_punto = ANY (_tipos_punto))
      AND (_operador IS NULL OR v.operador_slug = _operador)
      AND (_distrito_id IS NULL OR v.distrito_id = _distrito_id)
      AND (_horario IS NULL
           OR (_horario = 'hoy'   AND v.abre_hoy)
           OR (_horario = 'ahora' AND v.abierto_ahora))
    ORDER BY distancia_metros NULLS LAST, v.nombre
    LIMIT _limite
$$;
