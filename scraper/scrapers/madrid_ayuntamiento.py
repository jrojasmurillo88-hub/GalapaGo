"""
Ayuntamiento de Madrid — datos abiertos (datos.madrid.es, licencia CC BY 4.0).

No descarga nada: lee los archivos que se bajan a mano a scraper/input/madrid/
(el robots.txt de datos.madrid.es pide que los bots no descarguen recursos).
Ver README, sección "Datos de Madrid".

Conjuntos usados:
  200284  Puntos limpios fijos                       (CSV, latin-1)
  300198  Puntos limpios de proximidad               (CSV, UTF-8)
  900026  Puntos limpios móviles 24 horas (por día)  (CSV, UTF-8)
  300384  Contenedores de pilas en mupis             (CSV, UTF-8)
  900003  Contenedores de pilas en marquesinas       (XLSX)

Falta: 300101 Puntos limpios móviles por turnos (mañana/tarde). El portal solo
publica la ficha PDF, sin el archivo de datos.
"""

import csv
import re
import unicodedata
import warnings
from collections import Counter
from pathlib import Path

import openpyxl

import horarios
import reglas
from models import Horario, Punto

INPUT = Path(__file__).parent.parent / "input" / "madrid"
OPERADOR = "ayuntamiento-madrid"
BASE = "https://datos.madrid.es/dataset/"

DISTRITOS = {
    1: "Centro", 2: "Arganzuela", 3: "Retiro", 4: "Salamanca", 5: "Chamartín", 6: "Tetuán",
    7: "Chamberí", 8: "Fuencarral-El Pardo", 9: "Moncloa-Aravaca", 10: "Latina", 11: "Carabanchel",
    12: "Usera", 13: "Puente de Vallecas", 14: "Moratalaz", 15: "Ciudad Lineal", 16: "Hortaleza",
    17: "Villaverde", 18: "Villa de Vallecas", 19: "Vicálvaro", 20: "San Blas-Canillejas", 21: "Barajas",
}

DIAS = {"lunes": 1, "martes": 2, "miércoles": 3, "jueves": 4, "viernes": 5, "sábado": 6, "domingo": 7}

# Caja aproximada del municipio de Madrid, para descartar coordenadas rotas
LAT_MIN, LAT_MAX, LNG_MIN, LNG_MAX = 40.30, 40.65, -3.90, -3.50


# ── Helpers ───────────────────────────────────────────────────────────────────

def _leer_csv(nombre: str, encoding: str = "utf-8-sig") -> list[dict]:
    with open(INPUT / nombre, encoding=encoding, newline="") as f:
        return [
            {k.strip(): (v or "").replace("\xa0", " ").strip() for k, v in fila.items() if k}
            for fila in csv.DictReader(f, delimiter=";")
        ]


def _num(valor) -> float | None:
    if valor in (None, ""):
        return None
    try:
        return float(str(valor).replace(",", "."))
    except ValueError:
        return None


def _coords(lat, lng) -> tuple[float | None, float | None, int]:
    lat, lng = _num(lat), _num(lng)
    if lat is None or lng is None or not (LAT_MIN < lat < LAT_MAX and LNG_MIN < lng < LNG_MAX):
        return None, None, 0
    return lat, lng, 2


def _distrito(codigo) -> int | None:
    try:
        n = int(str(codigo).strip())
    except (TypeError, ValueError):
        return None
    return n if 1 <= n <= 21 else None


def _distrito_por_nombre(nombre: str) -> int | None:
    clave = _slug(nombre)
    return next((cod for cod, n in DISTRITOS.items() if _slug(n) == clave), None)


def _slug(texto: str) -> str:
    texto = unicodedata.normalize("NFD", texto.lower())
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", texto).strip("-")


def _titulo(texto: str) -> str:
    """'CALLE ESTRELLA DENEBOLA' -> 'Calle Estrella Denebola' (sin tocar 'de', 'del'…)."""
    minus = {"de", "del", "la", "las", "los", "el", "y"}
    palabras = texto.lower().split()
    return " ".join(p if (i and p in minus) else p.capitalize() for i, p in enumerate(palabras))


def _con_reglas(punto: Punto) -> Punto:
    punto.tipos = list(reglas.POR_TIPO_PUNTO[punto.tipo_punto])
    punto.origen_tipos = "regla_tipo_punto"
    return punto


# ── Conjuntos ─────────────────────────────────────────────────────────────────

def fijos() -> list[Punto]:
    puntos = []
    for f in _leer_csv("200284-0-puntos-limpios-fijos-csv.csv", encoding="latin-1"):
        lat, lng, conf = _coords(f["LATITUD"], f["LONGITUD"])
        franjas, completo = horarios.parsear(f["HORARIO"])
        distrito = _distrito(f["COD-DISTRITO"]) or _distrito_por_nombre(f["DISTRITO"])
        direccion = _titulo(f"{f['CLASE-VIAL']} {f['NOMBRE-VIA']}") + (f", {f['NUM']}" if f["NUM"] else "")
        puntos.append(_con_reglas(Punto(
            fuente="datos.madrid.es/200284",
            fuente_id=f["PK"],
            fuente_url=f["CONTENT-URL"] or BASE + "200284-0-puntos-limpios-fijos",
            nombre=f"Punto Limpio Fijo {DISTRITOS.get(distrito, _titulo(f['DISTRITO']))}",
            tipo_punto="punto_limpio_fijo",
            operador_slug=OPERADOR,
            direccion=direccion,
            distrito_id=distrito,
            barrio=_titulo(f["BARRIO"]) or None,
            codigo_postal=f["CODIGO-POSTAL"] or None,
            lat=lat, lng=lng, confianza_coords=conf,
            horario_texto=f["HORARIO"],
            horarios=franjas,
            estado="activo",
            notas=None if completo else "horario estructurado parcial",
        )))
    return puntos


def _nombre_proximidad(centro: str) -> str:
    """En los de vía pública, CENTRO repite la dirección ("Plaza del Rey, 3. Situado en vía pública")."""
    if not centro or "vía pública" in centro.lower():
        return "Punto Limpio de Proximidad"
    return centro


def proximidad() -> list[Punto]:
    puntos = []
    vistos: Counter = Counter()
    for f in _leer_csv("300198-1-puntos-proximidad-csv.csv"):
        lat, lng, conf = _coords(f["LATITUD"], f["LONGITUD"])
        franjas, completo = horarios.parsear(f["HORARIO"])
        base_id = f"{f['COD_DISTRITO']}-{_slug(f['DIRECCION_COMPLETA'])}"
        vistos[base_id] += 1
        fuente_id = base_id if vistos[base_id] == 1 else f"{base_id}-{vistos[base_id]}"
        en_via_publica = "vía pública" in f["HORARIO"].lower()
        puntos.append(_con_reglas(Punto(
            fuente="datos.madrid.es/300198",
            fuente_id=fuente_id,
            fuente_url=BASE + "300198-0-puntos-proximidad",
            nombre=_nombre_proximidad(f["CENTRO"]),
            tipo_punto="punto_limpio_proximidad",
            operador_slug=OPERADOR,
            direccion=f["DIRECCION_COMPLETA"],
            detalle_ubicacion="En la vía pública" if en_via_publica else None,
            distrito_id=_distrito(f["COD_DISTRITO"]),
            lat=lat, lng=lng, confianza_coords=conf,
            horario_texto=f["HORARIO"],
            horarios=franjas,
            estado="activo",
            notas=None if completo else "horario estructurado parcial",
        )))
    return puntos


def moviles_24h() -> list[Punto]:
    """Cada fila es una parada fija que solo funciona un día de la semana, 24 h."""
    puntos = []
    for f in _leer_csv("900026-0-puntos-limpios-residuos-csv.csv"):
        lat, lng, conf = _coords(f["LATITUD"], f["LONGITUD"])
        dia = DIAS.get(f["DÍA_SEMANA"].lower())
        ubicacion = f["UBICACIÓN"]
        nombre = "Punto Limpio Móvil 24 h"
        if ubicacion and ubicacion.lower() != "vía pública":
            nombre += f" · {ubicacion}"
        puntos.append(_con_reglas(Punto(
            fuente="datos.madrid.es/900026",
            fuente_id=f"{dia}-{_slug(f['DIRECCIÓN COMPLETA'])}",
            fuente_url=BASE + "900026-0-puntos-limpios-residuos",
            nombre=nombre,
            tipo_punto="punto_limpio_movil",
            operador_slug=OPERADOR,
            direccion=f["DIRECCIÓN COMPLETA"],
            detalle_ubicacion=f["DIRECCIÓN COMPLETA AMPLIADA"] or None,
            distrito_id=_distrito(f["COD_DISTRITO"]),
            barrio=f["BARRIO"] or None,
            lat=lat, lng=lng, confianza_coords=conf,
            horario_texto=f"{f['DÍA_SEMANA']}, 24 horas",
            horarios=[Horario(hora_inicio="00:00", hora_fin="24:00", dia_semana=dia)] if dia else [],
            estado="activo",
        )))
    return puntos


def _todo_el_dia() -> list[Horario]:
    return [Horario(hora_inicio="00:00", hora_fin="24:00", dia_semana=d) for d in range(1, 8)]


def pilas_mupis() -> list[Punto]:
    puntos = []
    for f in _leer_csv("300384-0-mupi-pilas-csv.csv"):
        if not f["CODIGO SOPORTE"]:
            continue
        lat, lng, conf = _coords(f["LATITUD"], f["LONGITUD"])
        puntos.append(_con_reglas(Punto(
            fuente="datos.madrid.es/300384",
            fuente_id=f["CODIGO SOPORTE"],
            fuente_url=BASE + "300384-0-mupi-pilas",
            nombre="Contenedor de pilas (mupi)",
            tipo_punto="contenedor_pilas",
            operador_slug=OPERADOR,
            direccion=_titulo(f["NOMBRE"].replace(",", ", ")),
            distrito_id=_distrito(f["CODIGO J.M."]),
            lat=lat, lng=lng, confianza_coords=conf,
            horario_texto="Todos los días, 24 horas (en la vía pública)",
            horarios=_todo_el_dia(),
            estado="activo",
        )))
    return puntos


def pilas_marquesinas() -> list[Punto]:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        hoja = openpyxl.load_workbook(INPUT / "900003-0-contenedores-pilas-marquesinas.xlsx", read_only=True).active
        filas = list(hoja.iter_rows(values_only=True))
    cabecera = filas[0]
    puntos = []
    vistos: Counter = Counter()
    for valores in filas[1:]:
        f = dict(zip(cabecera, valores))
        if str(f.get("CONT PILAS") or "").upper() != "SI":
            continue
        lat, lng, conf = _coords(f["Latitud"], f["Longitud"])
        parada = str(f["Parada"])
        vistos[parada] += 1
        direccion = _titulo(f"{f['VIAL'] or ''} {f['DIRECCIÓN'] or ''}".strip())
        numero = str(f["Nº"] or "").replace("Nº", "").strip()
        if numero and numero != "0":
            direccion += f", {numero}"
        puntos.append(_con_reglas(Punto(
            fuente="datos.madrid.es/900003",
            fuente_id=parada if vistos[parada] == 1 else f"{parada}-{vistos[parada]}",
            fuente_url=BASE + "900003-0-contenedores-pilas-marquesinas",
            nombre="Contenedor de pilas (marquesina de autobús)",
            tipo_punto="contenedor_pilas",
            operador_slug=OPERADOR,
            direccion=direccion,
            detalle_ubicacion=_titulo(str(f["emplazamiento"])) if f["emplazamiento"] else None,
            distrito_id=_distrito(f["COD_DIS"]),
            lat=lat, lng=lng, confianza_coords=conf,
            horario_texto="Todos los días, 24 horas (en la vía pública)",
            horarios=_todo_el_dia(),
            estado="activo",
        )))
    return puntos


def scrape() -> list[Punto]:
    puntos: list[Punto] = []
    for conjunto in (fijos, proximidad, moviles_24h, pilas_mupis, pilas_marquesinas):
        resultado = conjunto()
        print(f"  [madrid] {conjunto.__name__}: {len(resultado)} puntos")
        puntos += resultado
    return puntos
