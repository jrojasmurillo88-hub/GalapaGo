"""
Convierte horarios en texto libre ("Lunes a viernes de 9:00 a 14:00 y de 17:00 a 19:00.")
en franjas estructuradas por día de la semana.

Criterio: solo se estructura lo que se entiende sin ambigüedad. Las líneas de
cierres ("Cerrado agosto…"), temporadas ("Julio de…", "Invierno…") o sin días
explícitos se ignoran y el resultado se marca como parcial. El texto original
siempre se guarda en puntos.horario_texto y la app lo muestra.
"""

import re
import unicodedata

from models import Horario

DIAS = {"lunes": 1, "martes": 2, "miercoles": 3, "jueves": 4, "viernes": 5, "sabado": 6, "domingo": 7}
_DIA = r"(lunes|martes|miercoles|jueves|viernes|sabados?|domingos?)"
_RANGO_DIAS = re.compile(_DIA + r"\s+a\s+" + _DIA)
_FRANJA = re.compile(r"(\d{1,2})(?::(\d{2}))?\s*a\s*(\d{1,2})(?::(\d{2}))?")
_LINEA_IGNORADA = re.compile(
    r"^(cerrado|agosto|julio|junio|septiembre|durante|del \d|invierno|verano|los dias \d)"
)


def _normalizar(texto: str) -> str:
    texto = texto.replace("\xa0", " ").lower().strip()
    texto = "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", texto)


def _dia(nombre: str) -> int:
    return DIAS[nombre.rstrip("s")] if nombre.rstrip("s") in DIAS else DIAS[nombre]


def _dias_de(prefijo: str) -> set[int]:
    dias: set[int] = set()
    if "todos los dias" in prefijo:
        return set(range(1, 8))
    if "fines de semana" in prefijo:
        dias |= {6, 7}
    for a, b in _RANGO_DIAS.findall(prefijo):
        ini, fin = _dia(a), _dia(b)
        dias |= set(range(ini, fin + 1)) if ini <= fin else set()
        prefijo = prefijo.replace(f"{a} a {b}", " ")
    for nombre in re.findall(_DIA, prefijo):
        dias.add(_dia(nombre))
    return dias


def _hhmm(h: str, m: str | None) -> str | None:
    hora, minuto = int(h), int(m or 0)
    if hora > 24 or minuto > 59 or (hora == 24 and minuto):
        return None
    return f"{hora:02d}:{minuto:02d}"


def parsear(texto: str | None) -> tuple[list[Horario], bool]:
    """Devuelve (franjas, completo). completo=False si alguna parte no se pudo estructurar."""
    if not texto:
        return [], False

    # Separar en frases: saltos de línea y ". " seguido de mayúscula
    frases = [f for linea in texto.splitlines() for f in re.split(r"\.\s+(?=[A-ZÁÉÍÓÚ])", linea)]
    franjas: list[Horario] = []
    completo = True

    for frase in frases:
        f = _normalizar(frase).strip(" .")
        if not f or "situado en via publica" == f:
            continue
        f = re.sub(r"^de\s+", "", f)
        if "cerrado" in f and not _FRANJA.search(f):
            continue  # cierres: "Agosto cerrado", "Sábados y domingos cerrado"
        if _LINEA_IGNORADA.match(f):
            if not f.startswith(("cerrado", "los dias")):   # cierres y festivos no restan
                completo = False
            continue

        corte = re.search(r"\bde\s+\d|\d", f)
        prefijo = f[: corte.start()] if corte else f
        dias = _dias_de(prefijo)
        if not dias:
            completo = False
            continue

        if "24 horas" in f and not _FRANJA.search(f):
            pares = [("00:00", "24:00")]
        else:
            pares = []
            for h1, m1, h2, m2 in _FRANJA.findall(f[len(prefijo):]):
                ini, fin = _hhmm(h1, m1), _hhmm(h2, m2)
                if ini and fin and fin > ini:
                    pares.append((ini, fin))
        if not pares:
            completo = False
            continue

        for dia in sorted(dias):
            for ini, fin in pares:
                franjas.append(Horario(hora_inicio=ini, hora_fin=fin, dia_semana=dia))

    return franjas, completo and bool(franjas)


if __name__ == "__main__":
    ejemplos = [
        "De lunes a sábados de 8 a 20 horas. Domingos y festivos de 9 a 14 horas. Los días 24 y 31 de diciembre de 9 a 14 horas. Cerrado días 25 de diciembre y 1 y 6 de enero.",
        "Todos los días 24 horas. Situado en vía pública",
        "Lunes a viernes de 9:00 a 14:00 y de 17:00 a 19:00.",
        "Lunes a viernes de 8:30 a 21:30.\nSábados de 10:00 a 15:00 y de 16:00 a 21:30.",
        "Lunes a jueves de 8:30 a 15:00.\nViernes de 8:30 a 14:00.\nSábados y domingos cerrado",
        "Lunes a viernes de 9:00 a 21:00.\nFines de semana y festivos de 10:00 a 14:00 y de 16:00 a 21:00.",
        "Invierno de 9:00 a 21:00.\nVerano de 9:00 a 21:00.",
        "de 7:00 a 24:00 horas.",
        "Lunes a viernes de 8:00 a 23:00.\nSábados de 9:00 a 22:00.\nDomingos y festivos de 9:00 a 15.",
    ]
    for e in ejemplos:
        franjas, completo = parsear(e)
        resumen = sorted({(h.dia_semana, h.hora_inicio, h.hora_fin) for h in franjas})
        print(("OK     " if completo else "PARCIAL"), repr(e[:60]), "->", resumen)
