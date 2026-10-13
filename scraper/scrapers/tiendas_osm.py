"""
Tiendas de grandes cadenas en Madrid ciudad (OpenStreetMap, licencia ODbL:
"© colaboradores de OpenStreetMap", atribución obligatoria en la app).

Por qué estas cadenas: los establecimientos con >= 400 m² de zona de venta de AEE
deben recoger gratis y sin compra los RAEE muy pequeños (< 25 cm) — ver
notas_normativas 'distribuidores_raee_muy_pequenos'. Que una tienda concreta
cumpla el umbral NO se puede saber desde OSM, por eso entran como
'pendiente_verificar' y solo con dispositivos pequeños.

Una sola consulta a Overpass; si el servidor está saturado, prueba otro.
"""

import json
import time
from datetime import datetime
from pathlib import Path

import requests

import geocoder
from models import Punto

SERVIDORES = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
HEADERS = {"User-Agent": "GalapaGo/0.1 (+jrojasmurillo88@gmail.com)"}
RAW = Path(__file__).parent.parent / "output" / "raw"

# Marca OSM -> (nombre a mostrar, ¿solo si es hipermercado?)
CADENAS = {
    "MediaMarkt": ("MediaMarkt", False), "Media Markt": ("MediaMarkt", False),
    "Worten": ("Worten", False), "Fnac": ("Fnac", False), "FNAC": ("Fnac", False),
    "El Corte Inglés": ("El Corte Inglés", False), "Hipercor": ("Hipercor", False),
    "Leroy Merlin": ("Leroy Merlin", False), "Conforama": ("Conforama", False),
    "IKEA": ("IKEA", False), "Ikea": ("IKEA", False),
    "Carrefour": ("Carrefour", True), "Alcampo": ("Alcampo", True),
}
# Tiendas de alimentación pequeñas de la misma marca no llegan al umbral
TIENDAS_VALIDAS = {"electronics", "department_store", "doityourself", "hardware",
                   "furniture", "hypermarket", "books", "mall", None}

CONSULTA = """[out:json][timeout:90][bbox:40.31,-3.89,40.64,-3.52];
nwr["brand"~"^(%s)$"];
out center tags;""" % "|".join(CADENAS)

# Muy pequeños (< 25 cm): lo que cabe en la regla
TIPOS = ["movil", "cargador_cable", "auriculares_altavoz", "periferico", "pequeno_electrodomestico"]


def _descargar() -> list[dict]:
    # Reutilizar la descarga de las últimas 24 h (Overpass es un servicio compartido)
    recientes = sorted(RAW.glob("osm_tiendas_*.json"))
    if recientes and time.time() - recientes[-1].stat().st_mtime < 86400:
        print(f"  [tiendas] reutilizando {recientes[-1].name}")
        return json.loads(recientes[-1].read_text(encoding="utf-8"))
    ultimo_error = None
    for url in SERVIDORES:
        try:
            resp = requests.post(url, data={"data": CONSULTA}, headers=HEADERS, timeout=150)
            resp.raise_for_status()
            elementos = resp.json()["elements"]
            RAW.mkdir(parents=True, exist_ok=True)
            (RAW / f"osm_tiendas_{datetime.now():%Y%m%d_%H%M%S}.json").write_text(
                json.dumps(elementos, ensure_ascii=False), encoding="utf-8")
            return elementos
        except Exception as e:  # servidor saturado: probar el siguiente
            ultimo_error = e
            print(f"  [tiendas] {url}: {e}")
            time.sleep(10)
    raise RuntimeError(f"Ningún servidor Overpass respondió: {ultimo_error}")


def scrape() -> list[Punto]:
    puntos = []
    for e in _descargar():
        t = e.get("tags", {})
        marca, solo_hiper = CADENAS.get(t.get("brand"), (None, False))
        tienda = t.get("shop")
        if not marca or tienda not in TIENDAS_VALIDAS:
            continue
        if solo_hiper and tienda not in ("hypermarket", "department_store", "mall"):
            continue
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lng = e.get("lon") or e.get("center", {}).get("lon")
        calle = " ".join(x for x in (t.get("addr:street"), t.get("addr:housenumber")) if x)
        municipio = t.get("addr:city")
        if lat and (not calle or not municipio):
            inv = geocoder.inverso(lat, lng) or {}
            calle = calle or inv.get("direccion") or ""
            municipio = municipio or inv.get("municipio")
            t.setdefault("addr:postcode", inv.get("codigo_postal"))
        puntos.append(Punto(
            fuente="openstreetmap",
            fuente_id=f"{e['type']}/{e['id']}",
            fuente_url=f"https://www.openstreetmap.org/{e['type']}/{e['id']}",
            nombre=t.get("name") or marca,
            tipo_punto="tienda",
            operador_slug=f"tienda-{marca.lower().replace(' ', '-').replace('é', 'e')}",
            direccion=calle or None,
            municipio=municipio or "Madrid",
            detalle_ubicacion="Recogida de aparatos muy pequeños (< 25 cm) en tienda",
            codigo_postal=t.get("addr:postcode"),
            lat=lat, lng=lng, confianza_coords=1 if lat else 0,
            horario_texto=t.get("opening_hours") or "Horario de la tienda",
            tipos=list(TIPOS),
            origen_tipos="regla_tipo_punto",
            estado="pendiente_verificar",
        ))
    print(f"  [tiendas] {len(puntos)} tiendas de grandes cadenas")
    return puntos
