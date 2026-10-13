const STORAGE_KEY = "galapago_checkins_pendientes_v1";
const HORAS_ESPERA = 24;

export interface CheckinPendiente {
  puntoId: number;
  nombrePunto: string;
  tipos: string[]; // slugs de tipos_dispositivo que se ofrecen en "¿Qué entregaste?"
  creadoEn: string; // ISO
  resuelto: boolean;
}

function leerTodos(): CheckinPendiente[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CheckinPendiente[]) : [];
  } catch {
    return [];
  }
}

function guardarTodos(checkins: CheckinPendiente[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkins));
  } catch {
    // sin almacenamiento: el check-in dentro de la app no estará disponible
  }
}

export function agregarCheckinPendiente(datos: { puntoId: number; nombrePunto: string; tipos: string[] }) {
  const actuales = leerTodos();
  // evitar duplicados para el mismo punto mientras esté pendiente
  if (actuales.some((c) => c.puntoId === datos.puntoId && !c.resuelto)) return;
  actuales.push({ ...datos, creadoEn: new Date().toISOString(), resuelto: false });
  guardarTodos(actuales);
}

export function obtenerProximoCheckinListo(): CheckinPendiente | null {
  const ahora = Date.now();
  const listos = leerTodos().filter((c) => {
    if (c.resuelto) return false;
    const horas = (ahora - new Date(c.creadoEn).getTime()) / (1000 * 60 * 60);
    return horas >= HORAS_ESPERA;
  });
  if (listos.length === 0) return null;
  listos.sort((a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime());
  return listos[0];
}

export function marcarResuelto(puntoId: number) {
  guardarTodos(leerTodos().map((c) => (c.puntoId === puntoId ? { ...c, resuelto: true } : c)));
  oyentes.forEach((o) => o());
}

// ── Suscripción (para leer el próximo check-in desde React sin efectos) ──────

const oyentes = new Set<() => void>();

export function suscribirCheckins(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

/** Instantánea estable (texto) del próximo check-in listo; "" si no hay. */
export function instantaneaCheckin(): string {
  const c = obtenerProximoCheckinListo();
  return c ? JSON.stringify(c) : "";
}
