from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone


@dataclass
class Horario:
    hora_inicio: str                 # "HH:MM"
    hora_fin: str                    # "HH:MM" ("24:00" = hasta medianoche)
    dia_semana: int | None = None    # ISO: 1 = lunes … 7 = domingo
    fecha: str | None = None         # "YYYY-MM-DD" para paradas puntuales
    ubicacion_texto: str | None = None
    nota: str | None = None


@dataclass
class Punto:
    # Procedencia (obligatoria en todos los puntos)
    fuente: str                      # p. ej. "datos.madrid.es/200284"
    fuente_id: str                   # id estable del registro dentro de la fuente
    fuente_url: str
    nombre: str
    tipo_punto: str                  # ver CHECK de puntos.tipo_punto en 001_esquema.sql
    operador_slug: str
    direccion: str | None = None
    detalle_ubicacion: str | None = None
    distrito_id: int | None = None
    barrio: str | None = None
    municipio: str = "Madrid"
    codigo_postal: str | None = None
    lat: float | None = None
    lng: float | None = None
    # 0 = sin coords, 1 = geocodificado, 2 = coords de la fuente oficial, 3 = verificado a mano
    confianza_coords: int = 0
    horario_texto: str | None = None
    horarios: list[Horario] = field(default_factory=list)
    tipos: list[str] = field(default_factory=list)   # slugs de tipos_dispositivo
    origen_tipos: str = "regla_tipo_punto"           # 'fuente' | 'regla_tipo_punto' | 'manual'
    estado: str = "pendiente_verificar"
    notas: str | None = None
    scraped_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        return asdict(self)
