"""
Ambilamp — contenedores de lámparas en comercios ("Puntos ciudadano").

Fuente: capa pública de ArcGIS que Ambilamp enlaza desde ambilamp.es/ciudadano
(robots.txt de arcgis.com y ambilamp.es lo permiten). Sin licencia explícita:
los puntos se cargan como 'pendiente_verificar' y se cita la fuente.

Solo Comunidad de Madrid, solo puntos ciudadano activos (BAJA vacío). Una
petición por página de 2000 registros, con pausa entre páginas.
"""

import json
import time
from datetime import datetime
from pathlib import Path

import requests

from models import Punto

CAPA = "https://services2.arcgis.com/s6IzRKhcELc4OvBn/arcgis/rest/services/Puntos_Ambilamp/FeatureServer/0"
FUENTE_URL = "https://ambilamp.es/ciudadano"
HEADERS = {"User-Agent": "GalapaGo/0.1 (+jrojasmurillo88@gmail.com)"}
RAW = Path(__file__).parent.parent / "output" / "raw"
WHERE = "CCAA = 'Madrid (Comunidad de)' AND Tipo = 'PUNTOS CIUDADANO' AND BAJA IS NULL"


def _descargar() -> list[dict]:
    features, offset = [], 0
    while True:
        resp = requests.get(f"{CAPA}/query", headers=HEADERS, timeout=60, params={
            "where": WHERE, "outFields": "Referencia,Nombre,Poblacion,CP,Direccion1,Direccion2,Sector",
            "outSR": 4326, "resultOffset": offset, "resultRecordCount": 2000, "f": "json",
        })
        resp.raise_for_status()
        datos = resp.json()
        if "error" in datos:
            raise RuntimeError(datos["error"])
        features += datos["features"]
        if not datos.get("exceededTransferLimit"):
            break
        offset += len(datos["features"])
        time.sleep(2)

    RAW.mkdir(parents=True, exist_ok=True)
    (RAW / f"ambilamp_{datetime.now():%Y%m%d_%H%M%S}.json").write_text(
        json.dumps(features, ensure_ascii=False), encoding="utf-8")
    return features


def _limpio(texto) -> str:
    return " ".join(str(texto or "").split())


def scrape() -> list[Punto]:
    puntos = []
    for f in _descargar():
        a, g = f["attributes"], f.get("geometry") or {}
        if not a.get("Referencia"):
            continue
        municipio = " ".join(w if w in ("de", "del", "la", "el") else w.capitalize()
                             for w in _limpio(a["Poblacion"]).lower().split()) or None
        direccion = ", ".join(x for x in (_limpio(a["Direccion1"]), _limpio(a["Direccion2"])) if x)
        sector = _limpio(a["Sector"])
        puntos.append(Punto(
            fuente="ambilamp-arcgis",
            fuente_id=a["Referencia"],
            fuente_url=FUENTE_URL,
            nombre=_limpio(a["Nombre"]).title(),
            tipo_punto="contenedor_scrap",
            operador_slug="ambilamp",
            direccion=direccion or None,
            detalle_ubicacion=f"Contenedor de Ambilamp en comercio ({sector.lower()})" if sector
                              else "Contenedor de Ambilamp en comercio",
            municipio=municipio or "Madrid",
            codigo_postal=_limpio(a["CP"]) or None,
            lat=g.get("y"), lng=g.get("x"),
            confianza_coords=1 if g else 0,   # georreferenciado por la fuente, no oficial
            horario_texto="Horario del comercio",
            tipos=["bombilla"],
            origen_tipos="fuente",
            estado="pendiente_verificar",
        ))
    print(f"  [ambilamp] puntos ciudadano en la Comunidad de Madrid: {len(puntos)}")
    return puntos
