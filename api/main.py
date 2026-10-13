"""
API GalapaGo — FastAPI sobre Supabase (PostgREST).
Correr: uvicorn main:app --reload

Endpoints:
  GET  /catalogo                 categorías, tipos de dispositivo, distritos, operadores
  GET  /puntos                   búsqueda con filtros (ubicación, dispositivo, tipo, operador,
                                 distrito, abierto ahora/hoy)
  GET  /puntos/{id}              detalle + horario semanal + qué acepta
  GET  /notas/{clave}            nota normativa con su fuente
  POST /reportes                 reporte ciudadano sobre un punto
  POST /entregas                 check-in voluntario de entrega
  POST /eventos                  eventos del embudo
  POST /push/suscribir|programar recordatorio de check-in
  POST /push/enviar-pendientes   envío (lo dispara un cron; en la Fase 1 no hay cron)
"""

import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pywebpush import WebPushException, webpush


# ── Configuración ─────────────────────────────────────────────────────────────

def _leer_env() -> dict[str, str]:
    env_path = Path(__file__).parent.parent / "db" / ".env"
    config = {}
    if env_path.exists():
        for linea in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in linea and not linea.lstrip().startswith("#"):
                k, v = linea.split("=", 1)
                config[k.strip()] = v.strip()
    return config

_config = _leer_env()

def _env(nombre: str, default: str = "") -> str:
    return os.environ.get(nombre) or _config.get(nombre, default)

SUPABASE_URL = _env("SUPABASE_URL").rstrip("/")
SUPABASE_KEY = _env("SUPABASE_SERVICE_KEY")
VAPID_PRIVATE_KEY = _env("VAPID_PRIVATE_KEY")
VAPID_CLAIM_EMAIL = _env("VAPID_CLAIM_EMAIL", "mailto:jrojasmurillo88@gmail.com")
CRON_SECRET = _env("CRON_SECRET")
ORIGENES_CORS = [o.strip() for o in _env("CORS_ORIGINS", "*").split(",") if o.strip()]

# Proyecto Supabase de RAEEconecta (Colombia): GalapaGo no debe usarlo nunca
if "ujmetjpaayflmfgyescn" in SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL apunta al proyecto de Colombia")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

TIPOS_PUNTO = [
    "punto_limpio_fijo", "punto_limpio_movil", "punto_limpio_proximidad",
    "tienda", "contenedor_scrap", "contenedor_pilas", "otro",
]
TIPOS_REPORTE = {"cerrado", "lleno", "horario_incorrecto", "direccion_incorrecta", "no_acepta", "otro"}
TIPOS_EVENTO = {"seleccion_dispositivo", "seleccion_punto", "intencion_descarte", "guia_borrado_vista"}

# Columnas de v_puntos que se exponen (sin la geografía cruda)
COLUMNAS_PUNTO = (
    "id,nombre,tipo_punto,direccion,detalle_ubicacion,distrito_id,distrito,barrio,municipio,"
    "lat,lng,horario_texto,operador_slug,operador_nombre,sponsor_nombre,estado,confianza_coords,"
    "fuente,fuente_url,scraped_at,verificado_at,tiene_horario,abre_hoy,abierto_ahora,horarios_hoy,tipos"
)


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="GalapaGo API",
    description="Puntos de entrega de residuos electrónicos (RAEE) y pilas en Madrid",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES_CORS,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _get(ruta: str, params: Optional[dict] = None) -> list | dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{SUPABASE_URL}/rest/v1/{ruta}", headers=HEADERS, params=params)
    if not resp.is_success:
        raise HTTPException(502, detail=resp.text)
    return resp.json()


async def _post(ruta: str, payload: dict | list, prefer: str = "return=minimal") -> httpx.Response:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/{ruta}", headers={**HEADERS, "Prefer": prefer}, json=payload
        )
    if not resp.is_success:
        raise HTTPException(502, detail=resp.text)
    return resp


# ── Modelos ───────────────────────────────────────────────────────────────────

class Reporte(BaseModel):
    punto_id: int
    tipo: str
    detalle: Optional[str] = Field(None, max_length=1000)


class ItemEntrega(BaseModel):
    tipo: str                       # slug de tipos_dispositivo
    cantidad: int = Field(1, ge=1, le=20)


class Entrega(BaseModel):
    punto_id: int
    items: list[ItemEntrega] = []


class Evento(BaseModel):
    tipo: str
    punto_id: Optional[int] = None
    tipo_dispositivo: Optional[str] = None
    session_id: Optional[str] = Field(None, max_length=100)


class PushSuscripcionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSuscripcion(BaseModel):
    endpoint: str
    keys: PushSuscripcionKeys


class PushProgramar(BaseModel):
    endpoint: str
    punto_id: int
    nombre_punto: str
    horas_espera: int = Field(24, ge=1, le=168)


# ── Catálogo (cacheado en memoria: cambia muy poco) ──────────────────────────

_cache_catalogo: dict = {"datos": None, "hasta": 0.0}


@app.get("/catalogo", summary="Categorías RAEE, tipos de dispositivo, distritos y operadores")
async def get_catalogo():
    if _cache_catalogo["datos"] and time.time() < _cache_catalogo["hasta"]:
        return _cache_catalogo["datos"]
    categorias = await _get("categorias_raee", {"select": "*", "order": "id"})
    tipos = await _get("tipos_dispositivo", {
        "select": "slug,nombre_es,nombre_en,categoria_id,waste_stream,peso_est_kg,guia_borrado,icono,orden",
        "activo": "eq.true", "order": "orden",
    })
    distritos = await _get("distritos", {"select": "*", "order": "nombre"})
    operadores = await _get("operadores", {"select": "slug,nombre,tipo", "order": "nombre"})
    datos = {
        "categorias": categorias,
        "tipos_dispositivo": tipos,
        "distritos": distritos,
        "operadores": operadores,
        "tipos_punto": TIPOS_PUNTO,
    }
    _cache_catalogo.update(datos=datos, hasta=time.time() + 300)
    return datos


# ── Puntos ────────────────────────────────────────────────────────────────────

@app.get("/puntos", summary="Buscar puntos de entrega")
async def get_puntos(
    lat: Optional[float] = Query(None, description="Latitud (si se da, filtra por radio y ordena por distancia)"),
    lng: Optional[float] = Query(None),
    radio: int = Query(3000, ge=100, le=60000, description="Radio en metros"),
    tipo: Optional[str] = Query(None, description="Slug de tipo de dispositivo (ej: movil, portatil)"),
    tipos_punto: Optional[str] = Query(None, description="Lista separada por comas (ej: punto_limpio_fijo,tienda)"),
    operador: Optional[str] = Query(None, description="Slug del operador"),
    distrito: Optional[int] = Query(None, ge=1, le=21),
    horario: Optional[str] = Query(None, pattern="^(ahora|hoy)$"),
    limite: int = Query(300, ge=1, le=5000),
):
    lista_tipos = [t for t in (tipos_punto or "").split(",") if t]
    invalidos = set(lista_tipos) - set(TIPOS_PUNTO)
    if invalidos:
        raise HTTPException(400, detail=f"tipos_punto no válidos: {', '.join(sorted(invalidos))}")
    payload = {
        "_lat": lat, "_lng": lng, "_radio_metros": radio,
        "_tipo_dispositivo": tipo,
        "_tipos_punto": lista_tipos or None,
        "_operador": operador,
        "_distrito_id": distrito,
        "_horario": horario,
        "_limite": limite,
    }
    # Supabase devuelve como mucho 1000 filas por petición: paginar
    puntos: list = []
    async with httpx.AsyncClient(timeout=30) as client:
        while len(puntos) < limite:
            resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/buscar_puntos",
                headers={**HEADERS, "Prefer": "return=representation"},
                params={"offset": len(puntos), "limit": min(1000, limite - len(puntos))},
                json=payload,
            )
            if not resp.is_success:
                raise HTTPException(502, detail=resp.text)
            pagina = resp.json()
            puntos += pagina
            if len(pagina) < 1000:
                break
    return puntos


@app.get("/puntos/{punto_id}", summary="Detalle de un punto")
async def get_punto(punto_id: int):
    data = await _get("v_puntos", {"id": f"eq.{punto_id}", "select": COLUMNAS_PUNTO})
    if not data:
        raise HTTPException(404, detail="Punto no encontrado")
    punto = data[0]
    punto["horarios"] = await _get("horarios_punto", {
        "punto_id": f"eq.{punto_id}",
        "select": "dia_semana,fecha,hora_inicio,hora_fin,ubicacion_texto,nota",
        "order": "dia_semana,fecha,hora_inicio",
    })
    if punto["tipo_punto"] == "tienda":
        notas = await _get("notas_normativas", {"clave": "eq.distribuidores_raee_muy_pequenos", "select": "*"})
        punto["nota_normativa"] = notas[0] if notas else None
    return punto


@app.get("/notas/{clave}", summary="Nota normativa con su fuente")
async def get_nota(clave: str):
    data = await _get("notas_normativas", {"clave": f"eq.{clave}", "select": "*"})
    if not data:
        raise HTTPException(404, detail="Nota no encontrada")
    return data[0]


# ── Comportamiento ────────────────────────────────────────────────────────────

@app.post("/reportes", status_code=201, summary="Reportar un problema en un punto")
async def post_reporte(reporte: Reporte):
    if reporte.tipo not in TIPOS_REPORTE:
        raise HTTPException(400, detail=f"tipo debe ser uno de: {', '.join(sorted(TIPOS_REPORTE))}")
    await _post("reportes", reporte.model_dump())
    return {"ok": True}


@app.post("/entregas", status_code=201, summary="Registrar check-in voluntario de entrega")
async def post_entrega(entrega: Entrega):
    punto = await _get("puntos", {"id": f"eq.{entrega.punto_id}", "select": "distrito_id"})
    if not punto:
        raise HTTPException(404, detail="Punto no encontrado")
    distrito_id = punto[0]["distrito_id"]

    peso_kg = None
    items = [i.model_dump() for i in entrega.items]
    if items:
        slugs = ",".join(sorted({i["tipo"] for i in items}))
        pesos = {t["slug"]: t["peso_est_kg"] for t in
                 await _get("tipos_dispositivo", {"slug": f"in.({slugs})", "select": "slug,peso_est_kg"})}
        desconocidos = {i["tipo"] for i in items} - set(pesos)
        if desconocidos:
            raise HTTPException(400, detail=f"Tipos desconocidos: {', '.join(sorted(desconocidos))}")
        peso_kg = round(sum(float(pesos[i["tipo"]] or 0) * i["cantidad"] for i in items), 2)

    await _post("entregas", {
        "punto_id": entrega.punto_id, "distrito_id": distrito_id,
        "items": items or None, "peso_est_kg": peso_kg,
    })

    # Norma descriptiva: cuántas entregas hubo en el distrito en 30 días
    conteo_zona = 0
    if distrito_id:
        hace_30_dias = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/entregas",
                headers={**HEADERS, "Prefer": "count=exact"},
                params={"distrito_id": f"eq.{distrito_id}", "created_at": f"gte.{hace_30_dias}",
                        "select": "id", "limit": 1},
            )
        try:
            conteo_zona = int(resp.headers.get("Content-Range", "0/0").split("/")[-1])
        except ValueError:
            conteo_zona = 0

    return {"ok": True, "conteo_zona": conteo_zona, "peso_est_kg": peso_kg}


@app.post("/eventos", status_code=201, summary="Registrar evento del embudo")
async def post_evento(evento: Evento):
    if evento.tipo not in TIPOS_EVENTO:
        raise HTTPException(400, detail=f"tipo debe ser uno de: {', '.join(sorted(TIPOS_EVENTO))}")
    await _post("eventos", evento.model_dump())
    return {"ok": True}


# ── Notificaciones push ───────────────────────────────────────────────────────

@app.post("/push/suscribir", status_code=201, summary="Registrar una suscripción push del navegador")
async def post_push_suscribir(sub: PushSuscripcion):
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/push_subscriptions",
            headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
            params={"on_conflict": "endpoint"},
            json={"endpoint": sub.endpoint, "p256dh": sub.keys.p256dh, "auth": sub.keys.auth},
        )
    if not resp.is_success:
        raise HTTPException(502, detail=resp.text)
    return {"ok": True}


@app.post("/push/programar", status_code=201, summary="Programar el recordatorio de check-in")
async def post_push_programar(datos: PushProgramar):
    fire_at = (datetime.now(timezone.utc) + timedelta(hours=datos.horas_espera)).isoformat()
    await _post("notificaciones_programadas", {
        "endpoint": datos.endpoint, "punto_id": datos.punto_id,
        "nombre_punto": datos.nombre_punto, "fire_at": fire_at,
    })
    return {"ok": True}


@app.post("/push/enviar-pendientes", summary="Envía las notificaciones cuya hora ya llegó (cron externo)")
async def post_push_enviar_pendientes(x_cron_secret: Optional[str] = Header(None)):
    if not CRON_SECRET or x_cron_secret != CRON_SECRET:
        raise HTTPException(401, detail="No autorizado")
    if not VAPID_PRIVATE_KEY:
        raise HTTPException(500, detail="VAPID_PRIVATE_KEY no configurada")

    ahora = datetime.now(timezone.utc).isoformat()
    pendientes = await _get("notificaciones_programadas",
                            {"enviada": "eq.false", "fire_at": f"lte.{ahora}", "select": "*"})

    enviadas, fallidas, expiradas = 0, 0, 0
    async with httpx.AsyncClient(timeout=30) as client:
        for n in pendientes:
            sub_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/push_subscriptions",
                headers=HEADERS, params={"endpoint": f"eq.{n['endpoint']}", "select": "*"},
            )
            sub_data = sub_resp.json() if sub_resp.is_success else []
            if not sub_data:
                await _marcar_notificacion_enviada(client, n["id"])
                fallidas += 1
                continue
            sub = sub_data[0]
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub["endpoint"],
                        "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
                    },
                    data=json.dumps({
                        "titulo": "¿Llevaste tu aparato?",
                        "cuerpo": f"Cuéntanos si lo entregaste en {n.get('nombre_punto') or 'el punto que elegiste'}",
                        "puntoId": n.get("punto_id"),
                    }),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_CLAIM_EMAIL},
                )
                enviadas += 1
            except WebPushException as e:
                # 404/410 = la suscripción ya no existe en el navegador
                if e.response is not None and e.response.status_code in (404, 410):
                    await client.delete(
                        f"{SUPABASE_URL}/rest/v1/push_subscriptions",
                        headers=HEADERS, params={"endpoint": f"eq.{sub['endpoint']}"},
                    )
                    expiradas += 1
                else:
                    fallidas += 1
            await _marcar_notificacion_enviada(client, n["id"])

    return {"ok": True, "enviadas": enviadas, "fallidas": fallidas, "suscripciones_expiradas": expiradas}


async def _marcar_notificacion_enviada(client: httpx.AsyncClient, notif_id: int):
    await client.patch(
        f"{SUPABASE_URL}/rest/v1/notificaciones_programadas",
        headers={**HEADERS, "Prefer": "return=minimal"},
        params={"id": f"eq.{notif_id}"},
        json={"enviada": True},
    )


@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok", "docs": "/docs"}
