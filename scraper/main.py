"""
Runner de fuentes de datos. Guarda el resultado en output/<fuente>_<fecha>.json,
que luego carga db/loader.py.

Uso:
  python main.py                 # todas las fuentes
  python main.py madrid          # solo una
  python main.py madrid --geo    # + geocodifica (Nominatim) los puntos sin coordenadas
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from scrapers import ambilamp, madrid_ayuntamiento

OUTPUT = Path(__file__).parent / "output"

FUENTES = {
    "madrid": madrid_ayuntamiento.scrape,
    "ambilamp": ambilamp.scrape,
}


def correr(nombre: str, geocodificar: bool = False) -> Path | None:
    print(f"\n== {nombre} ==")
    datos = [p.to_dict() for p in FUENTES[nombre]()]
    if not datos:
        print(f"[{nombre}] Sin puntos.")
        return None

    if geocodificar:
        from geocoder import geocodificar_puntos
        for p in datos:
            p.setdefault("ciudad", p.get("municipio") or "Madrid")
        datos = geocodificar_puntos(datos)
        for p in datos:
            if p.get("lat") is not None and not p.get("confianza_coords"):
                p["confianza_coords"] = 1

    OUTPUT.mkdir(exist_ok=True)
    ruta = OUTPUT / f"{nombre}_{datetime.now():%Y%m%d_%H%M%S}.json"
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{nombre}] {len(datos)} puntos -> {ruta}")
    return ruta


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("fuente", nargs="?", default="todas", help=f"{', '.join(FUENTES)} | todas")
    parser.add_argument("--geo", action="store_true", help="Geocodificar puntos sin coordenadas")
    args = parser.parse_args()

    if args.fuente == "todas":
        for nombre in FUENTES:
            correr(nombre, args.geo)
    elif args.fuente in FUENTES:
        correr(args.fuente, args.geo)
    else:
        sys.exit(f"Fuente desconocida: {args.fuente}. Opciones: {', '.join(FUENTES)} | todas")


if __name__ == "__main__":
    main()
