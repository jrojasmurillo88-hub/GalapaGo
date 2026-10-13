"use client";

import type { Punto } from "@/lib/api";
import { esTodoElDia } from "@/lib/formato";
import { useIdioma } from "@/lib/i18n";

/** "Abierto ahora · hasta 20:00", "Hoy aquí de 10:00 a 13:00", "Hoy no está aquí"… */
export default function EstadoHoy({ punto }: { punto: Pick<Punto, "tipo_punto" | "tiene_horario" | "abre_hoy" | "abierto_ahora" | "horarios_hoy"> }) {
  const { t } = useIdioma();

  if (!punto.tiene_horario) {
    const comercio = punto.tipo_punto === "tienda" || punto.tipo_punto === "contenedor_scrap";
    return (
      <span className="text-texto-suave">{comercio ? t("punto.horarioComercio") : t("punto.horarioSinDatos")}</span>
    );
  }

  const movil = punto.tipo_punto === "punto_limpio_movil";
  if (!punto.abre_hoy) {
    return <span className="text-texto-suave">{t(movil ? "punto.noHoy" : "punto.cerradoHoy")}</span>;
  }

  const franjas = punto.horarios_hoy;
  const todoElDia = franjas.length === 1 && esTodoElDia(franjas[0].inicio, franjas[0].fin);
  // "Hoy aquí…" solo tiene sentido en los puntos móviles, que cambian de sitio
  const texto = todoElDia
    ? t(movil ? "punto.hoyTodoElDia" : "punto.abierto24h")
    : franjas.map((f) => t(movil ? "punto.hoyAqui" : "punto.hoyDe", { inicio: f.inicio, fin: f.fin })).join(" · ");

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      <span className={`font-semibold ${punto.abierto_ahora ? "text-marca" : "text-aviso"}`}>
        {punto.abierto_ahora ? t("punto.abiertoAhora") : t("punto.cerradoAhora")}
      </span>
      <span className="text-texto-suave">· {texto}</span>
    </span>
  );
}
