"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { instantaneaCheckin, marcarResuelto, suscribirCheckins, type CheckinPendiente } from "@/lib/checkins";
import { postEntrega, postReporte } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import { nombreDispositivo } from "@/lib/formato";
import { useIdioma } from "@/lib/i18n";

const UMBRAL_NORMA_SOCIAL = 5; // por debajo, la cifra desanima más que anima

type Paso = "pregunta" | "items" | "enviando" | "error" | "impacto" | "cerrado";

export default function CheckinPrompt() {
  const { idioma, t } = useIdioma();
  const { catalogo } = useCatalogo();
  const instantanea = useSyncExternalStore(suscribirCheckins, instantaneaCheckin, () => "");
  const pendiente = useMemo<CheckinPendiente | null>(() => (instantanea ? JSON.parse(instantanea) : null), [instantanea]);
  // Al responder, el check-in se marca resuelto y desaparece de la suscripción:
  // se fija aquí para poder enseñar el "gracias" antes de pasar al siguiente.
  const [fijado, setFijado] = useState<CheckinPendiente | null>(null);
  const checkin = fijado ?? pendiente;
  const [paso, setPaso] = useState<Paso>("pregunta");
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<{ conteo: number; kg: number | null }>({ conteo: 0, kg: null });
  const [accion, setAccion] = useState<"entrega" | "cerrado" | null>(null);

  if (!checkin) return null;
  const actual = checkin;

  // marcarResuelto() ya avisa a la suscripción: aquí solo se reinicia el diálogo
  function siguiente() {
    setFijado(null);
    setPaso("pregunta");
    setCantidades({});
  }

  async function confirmarEntrega() {
    setAccion("entrega");
    setFijado(actual);
    setPaso("enviando");
    try {
      const items = Object.entries(cantidades)
        .filter(([, n]) => n > 0)
        .map(([tipo, cantidad]) => ({ tipo, cantidad }));
      const resp = await postEntrega({ punto_id: actual.puntoId, items });
      setResultado({ conteo: resp.conteo_zona, kg: resp.peso_est_kg });
      marcarResuelto(actual.puntoId);
      setPaso("impacto");
    } catch {
      setPaso("error");
    }
  }

  async function avisarCerrado() {
    setAccion("cerrado");
    setFijado(actual);
    setPaso("enviando");
    try {
      await postReporte({ punto_id: actual.puntoId, tipo: "cerrado", detalle: "Desde el check-in" });
      marcarResuelto(actual.puntoId);
      setPaso("cerrado");
    } catch {
      setPaso("error");
    }
  }

  function noPude() {
    marcarResuelto(actual.puntoId);
    siguiente();
  }

  const opciones = (catalogo?.tipos_dispositivo ?? []).filter((d) => actual.tipos.includes(d.slug));
  const boton = "w-full rounded-lg px-4 py-2.5 text-sm font-semibold";
  const primario = `${boton} bg-marca text-sobre-marca hover:bg-marca-fuerte`;
  const secundario = `${boton} border border-borde hover:border-texto-suave`;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-superficie p-5 text-texto shadow-xl">
        {paso === "pregunta" && (
          <>
            <p className="text-base font-semibold">{t("checkin.pregunta", { punto: actual.nombrePunto })}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={() => setPaso("items")} className={primario}>
                {t("checkin.si")}
              </button>
              <button onClick={noPude} className={secundario}>
                {t("checkin.noPude")}
              </button>
              <button onClick={avisarCerrado} className={secundario}>
                {t("checkin.estabaCerrado")}
              </button>
            </div>
          </>
        )}

        {paso === "items" && (
          <>
            <p className="text-base font-semibold">{t("checkin.queEntregaste")}</p>
            <ul className="mt-3 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
              {opciones.map((d) => {
                const n = cantidades[d.slug] ?? 0;
                return (
                  <li key={d.slug} className="flex items-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm">
                    <span className="flex-1">
                      {d.icono} {nombreDispositivo(d, idioma)}
                    </span>
                    <button
                      onClick={() => setCantidades((c) => ({ ...c, [d.slug]: Math.max(0, n - 1) }))}
                      className="h-7 w-7 rounded-full border border-borde"
                      aria-label="−"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-semibold">{n}</span>
                    <button
                      onClick={() => setCantidades((c) => ({ ...c, [d.slug]: Math.min(20, n + 1) }))}
                      className="h-7 w-7 rounded-full border border-marca text-marca"
                      aria-label="+"
                    >
                      +
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={confirmarEntrega} className={primario}>
                {t("checkin.confirmar")}
              </button>
              <button
                onClick={() => {
                  setCantidades({});
                  confirmarEntrega();
                }}
                className="text-xs text-texto-suave underline"
              >
                {t("checkin.saltar")}
              </button>
            </div>
          </>
        )}

        {paso === "enviando" && <p className="py-2 text-center text-sm text-texto-suave">{t("checkin.enviando")}</p>}

        {paso === "error" && (
          <>
            <p className="text-sm text-peligro">{t("checkin.error")}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={accion === "cerrado" ? avisarCerrado : confirmarEntrega} className={primario}>
                {t("checkin.reintentar")}
              </button>
              <button onClick={() => { setFijado(null); setPaso("pregunta"); }} className={secundario}>
                {t("mapa.cancelar")}
              </button>
            </div>
          </>
        )}

        {paso === "impacto" && (
          <>
            <p className="text-lg font-semibold">🌱 {t("checkin.gracias")}</p>
            {resultado.kg != null && resultado.kg > 0 && (
              <p className="mt-2 text-sm text-texto-suave">
                {t("checkin.peso", { kg: resultado.kg.toLocaleString(idioma === "es" ? "es-ES" : "en-GB") })}
              </p>
            )}
            {resultado.conteo >= UMBRAL_NORMA_SOCIAL && (
              <p className="mt-2 text-sm text-texto-suave">{t("checkin.normaSocial", { n: resultado.conteo })}</p>
            )}
            <button onClick={siguiente} className={`${primario} mt-4`}>
              {t("checkin.cerrar")}
            </button>
          </>
        )}

        {paso === "cerrado" && (
          <>
            <p className="text-base font-semibold">{t("checkin.reportado")}</p>
            <button onClick={siguiente} className={`${secundario} mt-4`}>
              {t("checkin.cerrar")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
