const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Tipos ────────────────────────────────────────────────────────────────────

export type TipoPunto =
  | "punto_limpio_fijo"
  | "punto_limpio_movil"
  | "punto_limpio_proximidad"
  | "tienda"
  | "contenedor_scrap"
  | "contenedor_pilas"
  | "otro";

export interface TipoDispositivo {
  slug: string;
  nombre_es: string;
  nombre_en: string;
  categoria_id: number | null;
  waste_stream: "raee" | "pilas";
  peso_est_kg: number | null;
  guia_borrado: string | null;
  icono: string | null;
  orden: number;
}

export interface Catalogo {
  categorias: { id: number; nombre_es: string; nombre_en: string; visible_consumidor: boolean }[];
  tipos_dispositivo: TipoDispositivo[];
  distritos: { id: number; nombre: string }[];
  operadores: { slug: string; nombre: string; tipo: string }[];
  tipos_punto: TipoPunto[];
}

export interface FranjaHoy {
  inicio: string; // "HH:MM"
  fin: string;
  ubicacion: string | null;
}

export interface Punto {
  id: number;
  nombre: string;
  tipo_punto: TipoPunto;
  direccion: string | null;
  detalle_ubicacion: string | null;
  distrito_id: number | null;
  distrito: string | null;
  lat: number;
  lng: number;
  horario_texto: string | null;
  operador_slug: string | null;
  operador_nombre: string | null;
  sponsor_nombre: string | null;
  estado: "activo" | "pendiente_verificar" | "cerrado";
  verificado_at: string | null;
  tiene_horario: boolean;
  abre_hoy: boolean;
  abierto_ahora: boolean;
  horarios_hoy: FranjaHoy[];
  tipos: string[];
  distancia_metros: number | null;
}

export interface HorarioSemanal {
  dia_semana: number | null; // ISO: 1 = lunes
  fecha: string | null;
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string;
  ubicacion_texto: string | null;
  nota: string | null;
}

export interface NotaNormativa {
  clave: string;
  texto: string;
  fuente_url: string | null;
  verificado_at: string | null;
}

export interface PuntoDetalle extends Omit<Punto, "distancia_metros"> {
  barrio: string | null;
  municipio: string;
  fuente: string;
  fuente_url: string | null;
  scraped_at: string | null;
  horarios: HorarioSemanal[];
  nota_normativa?: NotaNormativa | null;
}

export type TipoReporte =
  | "cerrado"
  | "lleno"
  | "horario_incorrecto"
  | "direccion_incorrecta"
  | "no_acepta"
  | "otro";

export type TipoEvento =
  | "seleccion_dispositivo"
  | "seleccion_punto"
  | "intencion_descarte"
  | "guia_borrado_vista";

// ── HTTP ─────────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 120000; // el plan gratuito de Render puede tardar ~1 min en despertar

async function obtenerJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, { ...init, signal: controller.signal });
    if (!resp.ok) throw new Error(`Error ${resp.status} consultando ${url}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

function postJson<T>(ruta: string, body: unknown): Promise<T> {
  return obtenerJson(`${API_URL}${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export function fetchCatalogo(): Promise<Catalogo> {
  return obtenerJson(`${API_URL}/catalogo`);
}

export interface FiltrosPuntos {
  lat?: number;
  lng?: number;
  radio?: number;
  tipo?: string | null;
  tiposPunto?: TipoPunto[];
  operador?: string | null;
  distrito?: number | null;
  horario?: "ahora" | "hoy" | null;
  limite?: number;
}

export function fetchPuntos(f: FiltrosPuntos): Promise<Punto[]> {
  const qs = new URLSearchParams();
  if (f.lat != null && f.lng != null) {
    qs.set("lat", String(f.lat));
    qs.set("lng", String(f.lng));
    qs.set("radio", String(f.radio ?? 3000));
  }
  if (f.tipo) qs.set("tipo", f.tipo);
  if (f.tiposPunto?.length) qs.set("tipos_punto", f.tiposPunto.join(","));
  if (f.operador) qs.set("operador", f.operador);
  if (f.distrito) qs.set("distrito", String(f.distrito));
  if (f.horario) qs.set("horario", f.horario);
  qs.set("limite", String(f.limite ?? 300));
  return obtenerJson(`${API_URL}/puntos?${qs.toString()}`);
}

export function fetchPunto(id: number | string): Promise<PuntoDetalle> {
  return obtenerJson(`${API_URL}/puntos/${id}`);
}

export function postReporte(body: { punto_id: number; tipo: TipoReporte; detalle?: string }) {
  return postJson<{ ok: boolean }>("/reportes", body);
}

export function postEntrega(body: { punto_id: number; items: { tipo: string; cantidad: number }[] }) {
  return postJson<{ ok: boolean; conteo_zona: number; peso_est_kg: number | null }>("/entregas", body);
}

export function postEvento(body: {
  tipo: TipoEvento;
  punto_id?: number;
  tipo_dispositivo?: string;
  session_id?: string;
}) {
  return postJson<{ ok: boolean }>("/eventos", body);
}

export function postPushSuscribir(body: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  return postJson<{ ok: boolean }>("/push/suscribir", body);
}

export function postPushProgramar(body: {
  endpoint: string;
  punto_id: number;
  nombre_punto: string;
  horas_espera?: number;
}) {
  return postJson<{ ok: boolean }>("/push/programar", body);
}
