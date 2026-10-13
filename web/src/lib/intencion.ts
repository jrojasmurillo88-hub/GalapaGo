import { postEvento } from "@/lib/api";
import { agregarCheckinPendiente } from "@/lib/checkins";
import { programarRecordatorioPush } from "@/lib/push";
import { obtenerSessionId } from "@/lib/sesion";

/**
 * El usuario pidió cómo llegar: es la señal de intención de descarte.
 * Registra el evento y deja preparado el check-in (en la app y por push, 24 h después).
 */
export function registrarIntencion(punto: { id: number; nombre: string; tipos: string[] }, tipoElegido?: string | null) {
  postEvento({
    tipo: "intencion_descarte",
    punto_id: punto.id,
    tipo_dispositivo: tipoElegido ?? undefined,
    session_id: obtenerSessionId(),
  }).catch(() => {});
  agregarCheckinPendiente({
    puntoId: punto.id,
    nombrePunto: punto.nombre,
    tipos: tipoElegido ? [tipoElegido] : punto.tipos,
  });
  programarRecordatorioPush(punto.id, punto.nombre);
}
