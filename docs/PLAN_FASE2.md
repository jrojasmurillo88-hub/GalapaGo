# Fase 2 — Plan (pendiente de aprobación)

Objetivo: que el piloto (≈26 oct – 5 nov 2026, un distrito, 30–50 usuarios, 1 comercio) pueda **registrar entregas verificadas, dar puntos y canjearlos**, y que los founders puedan **enseñar datos a un SCRAP**. Basado en `docs/GALAPAGO_BRIEF.md` §6–8 y en lo que ya existe (`entregas`, `eventos`, `reportes`).

## Principios

- Supabase Auth (enlace mágico por email + Google). Datos personales mínimos; BD en Frankfurt.
- Todo lo económico es **configurable en BD** (puntos por tipo, multiplicadores, topes).
- Cada cifra del panel de sponsors sale de filas `entregas` con `estado = 'verificada'`: trazable.
- Monedero = suma del libro de puntos (`movimientos_puntos`), nunca un saldo editable.

## Cambios de esquema (`004_fase2.sql`)

| Tabla | Campos clave | Nota |
|---|---|---|
| `perfiles` | `id` (= auth.users.id), nombre, distrito_id, rango_edad, idioma, consentimiento_datos_at, consentimiento_comunicaciones_at, rol (`usuario`/`admin`/`comercio`/`sponsor`), partner_id | Borrado de cuenta = borrar perfil y anonimizar entregas |
| `entregas` (ampliar) | usuario_id, tipo_dispositivo_id, cantidad, metodo (`qr`/`foto`), foto_path, datos_borrados (bool), estado (`pendiente`/`verificada`/`rechazada`), verificada_por, verificada_at, puntos, kg_est, campana_id | La tabla actual se reutiliza; las filas anónimas del check-in siguen valiendo como dato de comportamiento |
| `codigos_qr` | punto_id, secreto, valido_desde, valido_hasta, activo | QR que rota (p. ej. diario) o ligado a punto + franja horaria |
| `puntos_tipo_dispositivo` (o columnas en `tipos_dispositivo`) | puntos_base | Ya existen peso y categoría; añadir `puntos_base` |
| `partners` | nombre, tipo (`recompensa`/`sponsor`/`circular`/`publico`), contacto | Se puede unir con `sponsors` (migración de datos trivial) |
| `recompensas` | partner_id, titulo_es/en, descripcion, coste_puntos, stock, valida_hasta, activa | |
| `canjes` | usuario_id, recompensa_id, codigo (único, corto), estado (`emitido`/`validado`/`caducado`), validado_at, validado_por | El comercio valida el código |
| `campanas` | sponsor_id, tipos_dispositivo[], distritos[], multiplicador, inicio, fin | "x2 en portátiles en Chamberí esta semana" |
| `movimientos_puntos` | usuario_id, delta, motivo (`entrega`/`canje`/`ajuste`), ref_id, created_at | Libro contable |
| `compromisos` | usuario_id, tipo_dispositivo_id, fecha_objetivo, cumplido_entrega_id | "Llevaré [objeto] al piloto" |
| `config` | clave/valor: tope diario de entregas, tope diario de puntos, flag `modulo_comunidad` | |
| `eventos_comunidad` (flag, apagado) | título, fecha, lugar, punto_id, puntos | Solo si se activa |

RLS con políticas reales: cada usuario solo lee/escribe lo suyo; admins vía rol; la API sigue usando service_role para lo sensible (otorgar puntos, validar canjes).

## API (FastAPI)

- `POST /entregas` → ahora autenticado: `{punto_id, tipo, cantidad, metodo, qr | foto, datos_borrados}`. QR válido ⇒ `verificada` y puntos al momento; foto ⇒ `pendiente`.
- `POST /entregas/{id}/foto` (subida a Supabase Storage, bucket privado).
- `GET /yo` (perfil + saldo + historial + impacto), `DELETE /yo` (borrar cuenta).
- `GET /recompensas`, `POST /canjes` → código de un solo uso.
- `POST /comercio/validar` (rol comercio) → marca canje validado.
- Admin: `GET /admin/entregas?estado=pendiente`, `POST /admin/entregas/{id}/verificar|rechazar`, CRUD de puntos, tipos, recompensas, partners, campañas; `GET /admin/export.csv`.
- Sponsor: `GET /sponsor/resumen?desde&hasta&distrito&categoria` (entregas verificadas, kg est., usuarios únicos, tasa de repetición), `GET /sponsor/informe.csv`.
- `POST /compromisos` + recordatorio (push o email).

Reglas antifraude en el servidor: QR caducado o de otro punto ⇒ rechazo; tope diario por usuario; una foto por ítem; hash perceptual de la foto si da tiempo.

## Web

- Registro/entrada (enlace mágico), consentimiento RGPD explícito, borrar cuenta.
- En el detalle del punto: **"Registrar entrega"** → escanear QR (cámara) o subir foto → casilla "He borrado mis datos" (ya existe la guía).
- **Monedero** (saldo, historial), **Recompensas** (catálogo, canjear → QR/código), **Impacto** (aparatos y kg, tarjeta para compartir).
- **Compromiso** en el inicio ("Llevaré mi portátil antes del 5 nov").
- `/admin` (founders): cola de fotos, gestión, export CSV.
- `/comercio`: validar códigos y ver canjes.
- `/sponsor`: panel con filtros y descarga.

## ¿Qué cabe antes del 26 de octubre? (≈ 9 días laborables)

| Prioridad | Qué | Estimación |
|---|---|---|
| **Imprescindible** | Auth + perfil + consentimiento + borrar cuenta | 1,5 días |
| **Imprescindible** | Registrar entrega con QR (punto del piloto) y foto como respaldo + cola de aprobación admin | 2,5 días |
| **Imprescindible** | Libro de puntos, tabla de puntos editable, tope diario | 1 día |
| **Imprescindible** | 1 recompensa + canje con código + página del comercio para validarlo | 1,5 días |
| Muy útil | Panel sponsor básico (cifras + CSV) | 1 día |
| Muy útil | Compromiso + recordatorio | 0,5 días |
| Si sobra tiempo | Campañas con multiplicador, tarjeta compartible, antifraude por hash de foto | 1–2 días |
| Después del piloto | Módulo comunidad, recogida a domicilio | — |

Con lo imprescindible + "muy útil" se llega justo (~8 días). Recomendación: congelar alcance el 22 oct y dedicar 23–24 oct a pruebas con 3–5 personas del IE.

## Decisiones que necesito antes de empezar

1. Distrito del piloto y punto(s) donde irá el QR (¿un comercio aliado, un punto limpio de proximidad?). Un QR en un punto municipal requiere permiso; en el comercio aliado es directo.
2. La recompensa y el comercio (texto, coste en puntos, stock).
3. Tabla inicial de puntos por aparato (propongo partir de peso + brecha de categoría: pantallas y frío valen más).
4. Email desde el que salen los enlaces mágicos (dominio propio o el de Supabase en el piloto).
