-- ============================================================
-- GalapaGo — 002 · Datos semilla (catálogos)
-- Idempotente: actualiza los nombres si ya existen.
-- ============================================================

-- ── Categorías RAEE (RD 110/2015, anexo III) ───────────────────────────────

INSERT INTO categorias_raee (id, nombre_es, nombre_en, visible_consumidor) VALUES
    (1, 'Aparatos de intercambio de temperatura',              'Temperature exchange equipment',     TRUE),
    (2, 'Monitores, pantallas y aparatos con pantalla > 100 cm²', 'Screens and monitors',            TRUE),
    (3, 'Lámparas',                                            'Lamps',                              TRUE),
    (4, 'Grandes aparatos',                                    'Large equipment',                    TRUE),
    (5, 'Pequeños aparatos',                                   'Small equipment',                    TRUE),
    (6, 'Aparatos de informática y telecomunicaciones pequeños', 'Small IT and telecom equipment',   TRUE),
    (7, 'Paneles fotovoltaicos grandes',                       'Large photovoltaic panels',          FALSE)
ON CONFLICT (id) DO UPDATE SET
    nombre_es = EXCLUDED.nombre_es,
    nombre_en = EXCLUDED.nombre_en,
    visible_consumidor = EXCLUDED.visible_consumidor;

-- ── Tipos de dispositivo ───────────────────────────────────────────────────
-- Categoría según los ejemplos del anexo IV del RD 110/2015 (revisar casos límite).
-- Pesos: estimaciones propias de GalapaGo para calcular kg aproximados, no datos oficiales.

INSERT INTO tipos_dispositivo
    (slug, nombre_es, nombre_en, categoria_id, waste_stream, peso_est_kg, peso_fuente, guia_borrado, icono, orden)
VALUES
    ('movil',                  'Móvil',                          'Mobile phone',               6,    'raee',  0.18, 'estimación GalapaGo', 'movil',    '📱', 10),
    ('portatil',               'Ordenador portátil',             'Laptop',                     2,    'raee',  2.20, 'estimación GalapaGo', 'portatil', '💻', 20),
    ('tablet',                 'Tablet',                         'Tablet',                     2,    'raee',  0.50, 'estimación GalapaGo', 'tablet',   '📲', 30),
    ('ordenador_sobremesa',    'Ordenador de sobremesa',         'Desktop computer',           6,    'raee',  8.00, 'estimación GalapaGo', 'portatil', '🖥️', 40),
    ('cargador_cable',         'Cargador o cable',               'Charger or cable',           6,    'raee',  0.15, 'estimación GalapaGo', NULL,       '🔌', 50),
    ('periferico',             'Teclado, ratón o router',        'Keyboard, mouse or router',  6,    'raee',  0.50, 'estimación GalapaGo', NULL,       '⌨️', 60),
    ('auriculares_altavoz',    'Auriculares o altavoz',          'Headphones or speaker',      5,    'raee',  0.30, 'estimación GalapaGo', NULL,       '🎧', 70),
    ('consola',                'Consola o videojuegos',          'Games console',              5,    'raee',  3.00, 'estimación GalapaGo', NULL,       '🎮', 80),
    ('monitor',                'Monitor',                        'Computer monitor',           2,    'raee',  4.50, 'estimación GalapaGo', NULL,       '🖥️', 90),
    ('televisor',              'Televisor',                      'Television',                 2,    'raee', 12.00, 'estimación GalapaGo', NULL,       '📺', 100),
    ('impresora',              'Impresora',                      'Printer',                    6,    'raee',  6.00, 'estimación GalapaGo', NULL,       '🖨️', 110),
    ('pequeno_electrodomestico','Pequeño electrodoméstico',      'Small appliance',            5,    'raee',  2.00, 'estimación GalapaGo', NULL,       '☕', 120),
    ('microondas',             'Microondas',                     'Microwave',                  5,    'raee', 12.00, 'estimación GalapaGo', NULL,       '♨️', 130),
    ('bombilla',               'Bombilla o fluorescente',        'Light bulb or tube',         3,    'raee',  0.10, 'estimación GalapaGo', NULL,       '💡', 140),
    ('frigorifico',            'Frigorífico',                    'Fridge',                     1,    'raee', 50.00, 'estimación GalapaGo', NULL,       '🧊', 150),
    ('aire_acondicionado',     'Aire acondicionado portátil',    'Portable air conditioner',   1,    'raee', 30.00, 'estimación GalapaGo', NULL,       '❄️', 160),
    ('lavadora',               'Lavadora',                       'Washing machine',            4,    'raee', 65.00, 'estimación GalapaGo', NULL,       '🧺', 170),
    ('pilas',                  'Pilas',                          'Batteries',                  NULL, 'pilas', 0.03, 'estimación GalapaGo', NULL,       '🔋', 180),
    ('bateria_movil_portatil', 'Batería de móvil o portátil',    'Phone or laptop battery',    NULL, 'pilas', 0.20, 'estimación GalapaGo', NULL,       '🪫', 190)
ON CONFLICT (slug) DO UPDATE SET
    nombre_es = EXCLUDED.nombre_es,
    nombre_en = EXCLUDED.nombre_en,
    categoria_id = EXCLUDED.categoria_id,
    waste_stream = EXCLUDED.waste_stream,
    peso_est_kg = EXCLUDED.peso_est_kg,
    peso_fuente = EXCLUDED.peso_fuente,
    guia_borrado = EXCLUDED.guia_borrado,
    icono = EXCLUDED.icono,
    orden = EXCLUDED.orden;

-- ── Distritos de Madrid (códigos oficiales del Ayuntamiento) ───────────────

INSERT INTO distritos (id, nombre) VALUES
    (1, 'Centro'), (2, 'Arganzuela'), (3, 'Retiro'), (4, 'Salamanca'), (5, 'Chamartín'),
    (6, 'Tetuán'), (7, 'Chamberí'), (8, 'Fuencarral-El Pardo'), (9, 'Moncloa-Aravaca'),
    (10, 'Latina'), (11, 'Carabanchel'), (12, 'Usera'), (13, 'Puente de Vallecas'),
    (14, 'Moratalaz'), (15, 'Ciudad Lineal'), (16, 'Hortaleza'), (17, 'Villaverde'),
    (18, 'Villa de Vallecas'), (19, 'Vicálvaro'), (20, 'San Blas-Canillejas'), (21, 'Barajas')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- ── Operadores ─────────────────────────────────────────────────────────────
-- Solo nombres en texto (sin logos de terceros).

INSERT INTO operadores (slug, nombre, tipo, web) VALUES
    ('ayuntamiento-madrid', 'Ayuntamiento de Madrid',  'ayuntamiento', 'https://www.madrid.es/puntoslimpios'),
    ('comunidad-madrid',    'Comunidad de Madrid',     'comunidad',    'https://www.comunidad.madrid'),
    ('erp',                 'ERP España',              'scrap',        'https://erp-recycling.org/es-es/'),
    ('ecolec',              'Fundación Ecolec',        'scrap',        'https://www.ecolec.es'),
    ('ecotic',              'Fundación Ecotic',        'scrap',        'https://www.ecotic.es'),
    ('recyclia',            'Recyclia',                'scrap',        'https://www.recyclia.es'),
    ('ecopilas',            'Ecopilas',                'scrap',        'https://www.ecopilas.es'),
    ('ambilamp',            'Ambilamp',                'scrap',        'https://www.ambilamp.es')
ON CONFLICT (slug) DO UPDATE SET nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo, web = EXCLUDED.web;
