"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Cabecera from "@/components/Cabecera";
import EstadoHoy from "@/components/EstadoHoy";
import { fetchPuntos, postEvento, type Punto, type TipoPunto } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import {
  COLOR_TIPO_PUNTO,
  formatDistancia,
  minutosCaminando,
  nombreDispositivo,
  urlComoLlegar,
} from "@/lib/formato";
import { useIdioma } from "@/lib/i18n";
import { registrarIntencion } from "@/lib/intencion";
import { obtenerSessionId } from "@/lib/sesion";

const MapaPuntos = dynamic(() => import("@/components/MapaPuntos"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-superficie-2" />,
});

const CENTRO_MADRID = { lat: 40.4168, lng: -3.7038 }; // Puerta del Sol
const RADIOS = [1500, 3000, 8000, 25000];
const MIN_RESULTADOS = 3;
const TAMANO_PAGINA = 15;
const SEGUNDOS_AVISO_DEMORA = 6;

// Sin aparato elegido, los contenedores especializados (pilas, lámparas en comercios)
// llenarían el mapa: se ocultan hasta que el usuario los pida.
const TIPOS_GENERALES: TipoPunto[] = [
  "punto_limpio_fijo",
  "punto_limpio_proximidad",
  "punto_limpio_movil",
  "tienda",
];
const TODOS_LOS_TIPOS: TipoPunto[] = [...TIPOS_GENERALES, "contenedor_scrap", "contenedor_pilas"];

type EstadoUbicacion = "buscando" | "ok" | "sin-permiso" | "manual";

function obtenerUbicacion(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolver) => {
    if (!("geolocation" in navigator)) return resolver(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolver({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolver(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}
type Horario = "ahora" | "hoy" | null;

export default function MapaContenido() {
  const { idioma, t } = useIdioma();
  const { catalogo } = useCatalogo();
  const tipo = useSearchParams().get("tipo");
  const dispositivo = catalogo?.tipos_dispositivo.find((d) => d.slug === tipo) ?? null;

  // Ubicación
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [estadoUbicacion, setEstadoUbicacion] = useState<EstadoUbicacion>("buscando");
  const [modoReubicar, setModoReubicar] = useState(false);

  // Filtros
  const [horario, setHorario] = useState<Horario>(null);
  const [tiposPunto, setTiposPunto] = useState<TipoPunto[]>(tipo ? TODOS_LOS_TIPOS : TIPOS_GENERALES);
  const [operador, setOperador] = useState<string>("");
  const [distrito, setDistrito] = useState<number | null>(null);
  const [panelFiltros, setPanelFiltros] = useState(false);
  const [mostrarOtrosDias, setMostrarOtrosDias] = useState(false);

  // Resultados. Cada búsqueda tiene una clave; "cargando" = la respuesta guardada
  // no corresponde a la búsqueda actual (así no hace falta tocar estado en los efectos).
  const clave = ubicacion
    ? JSON.stringify([ubicacion.lat, ubicacion.lng, tipo, tiposPunto, operador, distrito, horario])
    : null;
  const [respuesta, setRespuesta] = useState<{
    clave: string;
    puntos: Punto[];
    radio: number | null;
    error: boolean;
  } | null>(null);
  const [demoraClave, setDemoraClave] = useState<string | null>(null);
  const [paginacion, setPaginacion] = useState<{ clave: string | null; n: number }>({ clave: null, n: TAMANO_PAGINA });
  const [elegidoId, setElegidoId] = useState<number | null>(null);
  const refsTarjetas = useRef(new Map<number, HTMLLIElement>());

  const cargando = clave === null || respuesta?.clave !== clave;
  const error = !cargando && respuesta!.error;
  const puntos = useMemo(() => (!cargando && respuesta ? respuesta.puntos : []), [cargando, respuesta]);
  const radioUsado = cargando ? null : respuesta!.radio;
  const demorando = cargando && demoraClave === clave;
  const mostrados = paginacion.clave === clave ? paginacion.n : TAMANO_PAGINA;
  const setMostrados = (n: number) => setPaginacion({ clave, n });

  function aplicarUbicacion(r: { lat: number; lng: number } | null) {
    setUbicacion(r ?? CENTRO_MADRID);
    setEstadoUbicacion(r ? "ok" : "sin-permiso");
  }

  function pedirUbicacion() {
    setEstadoUbicacion("buscando");
    obtenerUbicacion().then(aplicarUbicacion);
  }

  useEffect(() => {
    obtenerUbicacion().then(aplicarUbicacion);
  }, []);

  // Buscar: radios crecientes hasta tener unos cuantos resultados
  useEffect(() => {
    if (!ubicacion || clave === null) return;
    let cancelado = false;

    (async () => {
      try {
        const radios = distrito ? [60000] : RADIOS; // con distrito elegido no hace falta radio
        for (const radio of radios) {
          const resultado = await fetchPuntos({
            lat: ubicacion.lat,
            lng: ubicacion.lng,
            radio,
            tipo,
            tiposPunto,
            operador: operador || null,
            distrito,
            horario,
            limite: 300,
          });
          if (cancelado) return;
          if (resultado.length >= MIN_RESULTADOS || radio === radios[radios.length - 1]) {
            setRespuesta({ clave, puntos: resultado, radio, error: false });
            return;
          }
        }
      } catch {
        if (!cancelado) setRespuesta({ clave, puntos: [], radio: null, error: true });
      }
    })();

    const timer = setTimeout(() => !cancelado && setDemoraClave(clave), SEGUNDOS_AVISO_DEMORA * 1000);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [clave, ubicacion, tipo, tiposPunto, operador, distrito, horario]);

  // Los puntos móviles solo están un día: por defecto se ocultan si hoy no vienen
  const moviles_ocultos = puntos.filter((p) => p.tipo_punto === "punto_limpio_movil" && !p.abre_hoy).length;
  const visibles = useMemo(
    () => (mostrarOtrosDias ? puntos : puntos.filter((p) => p.tipo_punto !== "punto_limpio_movil" || p.abre_hoy)),
    [puntos, mostrarOtrosDias]
  );

  function elegirPunto(id: number) {
    setElegidoId(id);
    const indice = visibles.findIndex((p) => p.id === id);
    if (indice >= mostrados) setMostrados(indice + 1);
    requestAnimationFrame(() =>
      refsTarjetas.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    );
    postEvento({
      tipo: "seleccion_punto",
      punto_id: id,
      tipo_dispositivo: tipo ?? undefined,
      session_id: obtenerSessionId(),
    }).catch(() => {});
  }

  function alternarTipoPunto(tp: TipoPunto) {
    setTiposPunto((actual) => {
      const nuevo = actual.includes(tp) ? actual.filter((x) => x !== tp) : [...actual, tp];
      return nuevo.length ? nuevo : actual; // al menos uno
    });
  }

  const hayFiltros = horario !== null || operador !== "" || distrito !== null ||
    tiposPunto.length !== (tipo ? TODOS_LOS_TIPOS : TIPOS_GENERALES).length;

  function limpiarFiltros() {
    setHorario(null);
    setOperador("");
    setDistrito(null);
    setTiposPunto(tipo ? TODOS_LOS_TIPOS : TIPOS_GENERALES);
  }

  const operadoresConPuntos = catalogo?.operadores ?? [];

  return (
    <>
      <Cabecera>
        <p className="truncate text-sm font-semibold">
          {dispositivo ? `${dispositivo.icono} ${nombreDispositivo(dispositivo, idioma)}` : t("mapa.todos")}
        </p>
      </Cabecera>

      <main className="flex flex-1 flex-col">
        {/* Barra de filtros rápidos */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-borde bg-superficie px-4 py-2 text-sm">
          <Link href="/" className="shrink-0 rounded-full border border-borde px-3 py-1 text-texto-suave hover:border-marca">
            ← {t(tipo ? "mapa.cambiar" : "mapa.elegirAparato")}
          </Link>
          {(["ahora", "hoy"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorario(horario === h ? null : h)}
              aria-pressed={horario === h}
              className={`shrink-0 rounded-full border px-3 py-1 ${
                horario === h ? "border-marca bg-marca text-sobre-marca" : "border-borde hover:border-marca"
              }`}
            >
              {t(h === "ahora" ? "filtros.ahora" : "filtros.hoy")}
            </button>
          ))}
          <button
            onClick={() => setPanelFiltros((v) => !v)}
            aria-expanded={panelFiltros}
            className={`shrink-0 rounded-full border px-3 py-1 ${
              hayFiltros ? "border-acento text-acento" : "border-borde hover:border-acento"
            }`}
          >
            ⚙ {t("filtros.titulo")}
          </button>
          {hayFiltros && (
            <button onClick={limpiarFiltros} className="shrink-0 px-1 text-xs text-texto-suave underline">
              {t("filtros.limpiar")}
            </button>
          )}
        </div>

        {panelFiltros && (
          <div className="grid gap-4 border-b border-borde bg-superficie px-4 py-3 text-sm sm:grid-cols-3">
            <fieldset>
              <legend className="mb-1.5 font-semibold">{t("filtros.tipoPunto")}</legend>
              <div className="flex flex-wrap gap-1.5">
                {TODOS_LOS_TIPOS.map((tp) => (
                  <button
                    key={tp}
                    onClick={() => alternarTipoPunto(tp)}
                    aria-pressed={tiposPunto.includes(tp)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                      tiposPunto.includes(tp) ? "border-texto-suave bg-superficie-2" : "border-borde text-texto-suave opacity-60"
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_TIPO_PUNTO[tp] }} />
                    {t(`tp.${tp}` as const)}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold">{t("filtros.operador")}</span>
              <select
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                className="rounded-lg border border-borde bg-superficie px-2 py-1.5"
              >
                <option value="">{t("filtros.todos")}</option>
                {operadoresConPuntos.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-semibold">{t("filtros.distrito")}</span>
              <select
                value={distrito ?? ""}
                onChange={(e) => setDistrito(e.target.value ? Number(e.target.value) : null)}
                className="rounded-lg border border-borde bg-superficie px-2 py-1.5"
              >
                <option value="">{t("filtros.todos")}</option>
                {(catalogo?.distritos ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Avisos */}
        {estadoUbicacion === "sin-permiso" && (
          <div className="bg-aviso-suave px-4 py-2 text-xs text-aviso">
            {t("mapa.sinUbicacion")}{" "}
            <button onClick={pedirUbicacion} className="font-semibold underline">
              {t("mapa.reintentar")}
            </button>
          </div>
        )}
        {modoReubicar && (
          <div className="bg-acento-suave px-4 py-2 text-xs text-acento">
            {t("mapa.tocaElMapa")}{" "}
            <button onClick={() => setModoReubicar(false)} className="font-semibold underline">
              {t("mapa.cancelar")}
            </button>
          </div>
        )}

        <div className="flex flex-1 flex-col md:flex-row">
          <section className="h-[42vh] md:order-2 md:h-auto md:flex-1">
            {ubicacion ? (
              <MapaPuntos
                puntos={visibles}
                ubicacion={ubicacion}
                elegidoId={elegidoId}
                modoSeleccionUbicacion={modoReubicar}
                onElegirUbicacion={(lat, lng) => {
                  setUbicacion({ lat, lng });
                  setEstadoUbicacion("manual");
                  setModoReubicar(false);
                  setElegidoId(null);
                }}
                onElegirPunto={elegirPunto}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-texto-suave">
                {t("mapa.buscandoUbicacion")}
              </div>
            )}
          </section>

          <section className="flex-1 px-4 py-3 md:order-1 md:max-w-sm md:flex-none md:basis-96 md:overflow-y-auto">
            {dispositivo?.guia_borrado && (
              <div className="mb-3 rounded-xl border border-acento/40 bg-acento-suave p-3 text-sm">
                <p className="font-semibold text-acento">🔒 {t("guia.aviso")}</p>
                <p className="mt-1 text-texto-suave">
                  {t("guia.avisoTexto", { aparato: nombreDispositivo(dispositivo, idioma).toLowerCase() })}
                </p>
                <Link
                  href={`/guia/${dispositivo.guia_borrado}?tipo=${dispositivo.slug}`}
                  className="mt-2 inline-block font-semibold text-acento underline"
                >
                  {t("guia.verGuia")} →
                </Link>
              </div>
            )}

            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-texto-suave">
              <span>
                {!cargando && !error && t("mapa.resultados", { n: visibles.length })}
                {!cargando && radioUsado && radioUsado > RADIOS[0] && !distrito && (
                  <> · {t("mapa.ampliado", { km: radioUsado / 1000 })}</>
                )}
              </span>
              <button
                onClick={() => setModoReubicar((m) => !m)}
                className="shrink-0 rounded-full border border-acento px-2.5 py-1 font-semibold text-acento"
              >
                📍 {t("mapa.desdeOtroSitio")}
              </button>
            </div>

            {cargando && (
              <p className="py-6 text-sm text-texto-suave">{demorando ? t("mapa.despertando") : t("mapa.cargando")}</p>
            )}
            {error && <p className="py-6 text-sm text-peligro">{t("mapa.error")}</p>}
            {!cargando && !error && visibles.length === 0 && (
              <p className="py-6 text-sm text-texto-suave">{t("mapa.ninguno")}</p>
            )}

            {!cargando && !error && (
              <ul className="flex flex-col gap-2">
                {visibles.slice(0, mostrados).map((p) => (
                  <TarjetaPunto
                    key={p.id}
                    punto={p}
                    elegido={p.id === elegidoId}
                    tipoElegido={tipo}
                    onElegir={() => elegirPunto(p.id)}
                    refLi={(el) => {
                      if (el) refsTarjetas.current.set(p.id, el);
                      else refsTarjetas.current.delete(p.id);
                    }}
                  />
                ))}
              </ul>
            )}

            {!cargando && visibles.length > mostrados && (
              <button
                onClick={() => setMostrados(mostrados + TAMANO_PAGINA)}
                className="mt-3 w-full rounded-xl border border-borde py-2 text-sm font-semibold hover:border-marca"
              >
                {t("mapa.verMas", { n: Math.min(TAMANO_PAGINA, visibles.length - mostrados) })}
              </button>
            )}

            {!cargando && moviles_ocultos > 0 && (
              <label className="mt-3 flex items-center gap-2 text-xs text-texto-suave">
                <input
                  type="checkbox"
                  checked={mostrarOtrosDias}
                  onChange={(e) => setMostrarOtrosDias(e.target.checked)}
                />
                {t("mapa.mostrarOtrosDias")} ({moviles_ocultos})
              </label>
            )}

            <p className="mt-6 text-[11px] text-texto-suave">{t("pie.datos")}</p>
          </section>
        </div>
      </main>
    </>
  );
}

function TarjetaPunto({
  punto,
  elegido,
  tipoElegido,
  onElegir,
  refLi,
}: {
  punto: Punto;
  elegido: boolean;
  tipoElegido: string | null;
  onElegir: () => void;
  refLi: (el: HTMLLIElement | null) => void;
}) {
  const { t } = useIdioma();
  const operador = punto.sponsor_nombre
    ? t("punto.patrocinadoPor", { nombre: punto.sponsor_nombre })
    : punto.operador_nombre
      ? t("punto.gestionadoPor", { nombre: punto.operador_nombre })
      : null;

  return (
    <li
      ref={refLi}
      className={`rounded-xl border bg-superficie p-3 transition ${
        elegido ? "border-marca ring-2 ring-marca/25" : "border-borde"
      }`}
    >
      <button onClick={onElegir} className="block w-full text-left">
        <div className="flex items-start gap-2">
          <span
            className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ background: COLOR_TIPO_PUNTO[punto.tipo_punto] }}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug">{punto.nombre}</p>
            <p className="text-xs text-texto-suave">
              {t(`tp.${punto.tipo_punto}` as const)}
              {punto.distrito ? ` · ${punto.distrito}` : ""}
            </p>
            {punto.direccion && <p className="mt-0.5 text-sm">{punto.direccion}</p>}
            <p className="mt-1 text-xs">
              <EstadoHoy punto={punto} />
            </p>
            {punto.distancia_metros != null && (
              <p className="mt-0.5 text-xs text-texto-suave">
                {t("punto.distancia", {
                  dist: formatDistancia(punto.distancia_metros),
                  min: minutosCaminando(punto.distancia_metros),
                })}
              </p>
            )}
            {operador && <p className="mt-0.5 text-xs text-texto-suave">{operador}</p>}
          </div>
        </div>
      </button>
      {elegido && (
        <div className="mt-3 flex gap-2">
          <a
            href={urlComoLlegar(punto.lat, punto.lng)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => registrarIntencion(punto, tipoElegido)}
            className="flex-1 rounded-lg bg-marca px-3 py-2 text-center text-sm font-semibold text-sobre-marca hover:bg-marca-fuerte"
          >
            {t("punto.comoLlegar")}
          </a>
          <Link
            href={`/punto/${punto.id}${tipoElegido ? `?tipo=${tipoElegido}` : ""}`}
            className="flex-1 rounded-lg border border-borde px-3 py-2 text-center text-sm font-semibold hover:border-marca"
          >
            {t("punto.verDetalle")}
          </Link>
        </div>
      )}
    </li>
  );
}
