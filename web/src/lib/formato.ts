import type { Idioma } from "@/lib/i18n";
import type { TipoDispositivo, TipoPunto } from "@/lib/api";

export function formatDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

export function minutosCaminando(metros: number): number {
  const VELOCIDAD_M_MIN = 80; // ~4,8 km/h
  return Math.max(1, Math.round(metros / VELOCIDAD_M_MIN));
}

export function formatFecha(iso: string | null, idioma: Idioma): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(idioma === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "09:00:00" -> "09:00"; "24:00:00" -> "24:00" */
export function hhmm(hora: string): string {
  return hora.slice(0, 5);
}

export function esTodoElDia(inicio: string, fin: string): boolean {
  return hhmm(inicio) === "00:00" && (hhmm(fin) === "24:00" || hhmm(fin) === "23:59");
}

const DIAS: Record<Idioma, string[]> = {
  es: ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

export function nombreDia(isoDia: number, idioma: Idioma): string {
  const nombre = DIAS[idioma][isoDia - 1] ?? "";
  return idioma === "es" ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : nombre;
}

export function nombreDispositivo(t: TipoDispositivo, idioma: Idioma): string {
  return idioma === "es" ? t.nombre_es : t.nombre_en;
}

/** Color de cada tipo de punto (tokens de globals.css) */
export const COLOR_TIPO_PUNTO: Record<TipoPunto, string> = {
  punto_limpio_fijo: "var(--tp-fijo)",
  punto_limpio_proximidad: "var(--tp-proximidad)",
  punto_limpio_movil: "var(--tp-movil)",
  tienda: "var(--tp-tienda)",
  contenedor_scrap: "var(--tp-scrap)",
  contenedor_pilas: "var(--tp-pilas)",
  otro: "var(--tp-otro)",
};

/** Enlace de Google Maps a pie hasta el punto */
export function urlComoLlegar(lat: number, lng: number): string {
  const qs = new URLSearchParams({ api: "1", destination: `${lat},${lng}`, travelmode: "walking" });
  return `https://www.google.com/maps/dir/?${qs.toString()}`;
}
