"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cabecera from "@/components/Cabecera";
import EstadoHoy from "@/components/EstadoHoy";
import { fetchPunto, type HorarioSemanal, type PuntoDetalle } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import {
  COLOR_TIPO_PUNTO,
  esTodoElDia,
  formatFecha,
  hhmm,
  nombreDia,
  nombreDispositivo,
  urlComoLlegar,
} from "@/lib/formato";
import { useIdioma, type Idioma } from "@/lib/i18n";
import { registrarIntencion } from "@/lib/intencion";

/** Agrupa las franjas por día: { 1: ["08:00–20:00"], 7: ["09:00–14:00"] } */
function horarioPorDia(horarios: HorarioSemanal[], todoElDia: string): Map<number, string[]> {
  const porDia = new Map<number, string[]>();
  for (const h of horarios) {
    if (h.dia_semana == null) continue;
    const franja = esTodoElDia(h.hora_inicio, h.hora_fin)
      ? todoElDia
      : `${hhmm(h.hora_inicio)}–${hhmm(h.hora_fin)}`;
    porDia.set(h.dia_semana, [...(porDia.get(h.dia_semana) ?? []), franja]);
  }
  return porDia;
}

function nombreFuente(fuente: string, idioma: Idioma): string {
  if (fuente.startsWith("datos.madrid.es")) return `Ayuntamiento de Madrid · ${fuente}`;
  if (fuente === "ambilamp-arcgis") return "Ambilamp";
  if (fuente === "openstreetmap") return idioma === "es" ? "© colaboradores de OpenStreetMap" : "© OpenStreetMap contributors";
  return fuente;
}

export default function PuntoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const tipoElegido = useSearchParams().get("tipo");
  const { idioma, t } = useIdioma();
  const { catalogo } = useCatalogo();
  const [punto, setPunto] = useState<PuntoDetalle | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPunto(id)
      .then(setPunto)
      .catch(() => setError(true));
  }, [id]);

  if (error || !punto) {
    return (
      <>
        <Cabecera />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm">
          <p className={error ? "text-peligro" : "text-texto-suave"}>
            {error ? t("punto.noEncontrado") : t("punto.cargando")}
          </p>
          {error && (
            <Link href="/mapa" className="text-acento underline">
              {t("punto.volver")}
            </Link>
          )}
        </main>
      </>
    );
  }

  const dispositivos = (catalogo?.tipos_dispositivo ?? []).filter((d) => punto.tipos.includes(d.slug));
  const porDia = horarioPorDia(punto.horarios, idioma === "es" ? "Todo el día" : "All day");
  const actualizado = formatFecha(punto.scraped_at, idioma);
  const verificado = formatFecha(punto.verificado_at, idioma);

  return (
    <>
      <Cabecera />
      <main className="flex-1 px-4 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <Link href={`/mapa${tipoElegido ? `?tipo=${tipoElegido}` : ""}`} className="text-sm text-texto-suave hover:text-texto">
            {t("punto.volver")}
          </Link>

          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-texto-suave">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_TIPO_PUNTO[punto.tipo_punto] }} />
            {t(`tp.${punto.tipo_punto}` as const)}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight">{punto.nombre}</h1>
          <p className="mt-1 text-sm">
            {punto.direccion}
            {punto.distrito ? ` · ${punto.distrito}` : punto.municipio !== "Madrid" ? ` · ${punto.municipio}` : ""}
          </p>
          {punto.detalle_ubicacion && <p className="mt-0.5 text-sm text-texto-suave">{punto.detalle_ubicacion}</p>}

          {/* Gestionado / patrocinado */}
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {punto.operador_nombre && (
              <span className="rounded-full bg-superficie-2 px-2.5 py-1">
                {t("punto.gestionadoPor", { nombre: punto.operador_nombre })}
              </span>
            )}
            {punto.sponsor_nombre && (
              <span className="rounded-full bg-acento-suave px-2.5 py-1 text-acento">
                {t("punto.patrocinadoPor", { nombre: punto.sponsor_nombre })}
              </span>
            )}
          </div>

          <p className="mt-3 text-sm">
            <EstadoHoy punto={punto} />
          </p>

          <a
            href={urlComoLlegar(punto.lat, punto.lng)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => registrarIntencion(punto, tipoElegido)}
            className="mt-4 block w-full rounded-xl bg-marca px-4 py-3 text-center font-semibold text-sobre-marca shadow-sm hover:bg-marca-fuerte"
          >
            {t("punto.comoLlegar")}
          </a>

          {/* Horario */}
          <section className="mt-6 rounded-xl border border-borde bg-superficie p-4">
            <h2 className="font-semibold">{t("punto.horario")}</h2>
            {porDia.size > 0 && (
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7].map((dia) => (
                    <tr key={dia} className="border-t border-borde first:border-0">
                      <td className="py-1 pr-3 text-texto-suave">{nombreDia(dia, idioma)}</td>
                      <td className="py-1 text-right">{porDia.get(dia)?.join(", ") ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {punto.horario_texto && (
              <p className="mt-3 whitespace-pre-line text-xs text-texto-suave">
                <span className="font-semibold">{t("punto.horarioFuente")}:</span> {punto.horario_texto}
              </p>
            )}
          </section>

          {/* Qué acepta */}
          <section className="mt-4 rounded-xl border border-borde bg-superficie p-4">
            <h2 className="font-semibold">{t("punto.acepta")}</h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {dispositivos.map((d) => (
                <li
                  key={d.slug}
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    d.slug === tipoElegido ? "bg-marca text-sobre-marca" : "bg-superficie-2"
                  }`}
                >
                  {d.icono} {nombreDispositivo(d, idioma)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-texto-suave">{t("punto.aceptaNota")}</p>
          </section>

          {/* Tiendas: la regla, citada tal cual con su fuente */}
          {punto.tipo_punto === "tienda" && punto.nota_normativa && (
            <section className="mt-4 rounded-xl border border-aviso/40 bg-aviso-suave p-4 text-sm">
              <h2 className="font-semibold">{t("punto.normaTitulo")}</h2>
              <p className="mt-1">{punto.nota_normativa.texto}</p>
              <p className="mt-2 text-xs">{t("punto.tiendaAviso")}</p>
              {punto.nota_normativa.fuente_url && (
                <a
                  href={punto.nota_normativa.fuente_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-semibold underline"
                >
                  {t("punto.normaFuente")} (MITECO) ↗
                </a>
              )}
            </section>
          )}

          {/* Procedencia */}
          <section className="mt-4 text-xs text-texto-suave">
            <p>
              {punto.fuente_url ? (
                <a href={punto.fuente_url} target="_blank" rel="noopener noreferrer" className="underline">
                  {t("punto.fuente", { fuente: nombreFuente(punto.fuente, idioma) })}
                </a>
              ) : (
                t("punto.fuente", { fuente: nombreFuente(punto.fuente, idioma) })
              )}
              {actualizado && <> · {t("punto.actualizado", { fecha: actualizado })}</>}
            </p>
            <p className="mt-0.5">{verificado ? t("punto.verificado", { fecha: verificado }) : t("punto.sinVerificar")}</p>
          </section>

          <Link
            href={`/reportar/${punto.id}`}
            className="mt-5 block w-full rounded-xl border border-peligro/50 px-4 py-2.5 text-center text-sm font-semibold text-peligro hover:bg-peligro-suave"
          >
            ⚠️ {t("punto.reportar")}
          </Link>
        </div>
      </main>
    </>
  );
}
