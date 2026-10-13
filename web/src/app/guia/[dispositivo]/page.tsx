"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cabecera from "@/components/Cabecera";
import { postEvento } from "@/lib/api";
import { GUIAS } from "@/lib/guias";
import { useIdioma } from "@/lib/i18n";
import { obtenerSessionId } from "@/lib/sesion";

const CLAVE_BORRADO = "galapago_datos_borrados";

export default function GuiaBorradoPage() {
  const { dispositivo } = useParams<{ dispositivo: string }>();
  const tipo = useSearchParams().get("tipo");
  const { idioma, t } = useIdioma();
  const guia = GUIAS[dispositivo];
  const [hecho, setHecho] = useState(false);

  useEffect(() => {
    if (!guia) return;
    postEvento({
      tipo: "guia_borrado_vista",
      tipo_dispositivo: tipo ?? dispositivo,
      session_id: obtenerSessionId(),
    }).catch(() => {});
  }, [guia, tipo, dispositivo]);

  function marcarHecho(valor: boolean) {
    setHecho(valor);
    // Solo en este navegador: en la Fase 2 se guardará con la entrega ("I wiped my device")
    try {
      const actuales = JSON.parse(window.localStorage.getItem(CLAVE_BORRADO) ?? "{}");
      actuales[tipo ?? dispositivo] = valor ? new Date().toISOString() : undefined;
      window.localStorage.setItem(CLAVE_BORRADO, JSON.stringify(actuales));
    } catch {
      // sin almacenamiento: no pasa nada
    }
  }

  return (
    <>
      <Cabecera />
      <main className="flex-1 px-4 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <Link href={tipo ? `/mapa?tipo=${tipo}` : "/"} className="text-sm text-texto-suave hover:text-texto">
            {t("punto.volver")}
          </Link>

          {!guia ? (
            <p className="mt-6 text-sm text-texto-suave">{t("guia.noEncontrada")}</p>
          ) : (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-acento">🔒 {guia.titulo[idioma]}</p>
              <h1 className="mt-1 text-2xl font-bold">{t("guia.titulo")}</h1>
              <p className="mt-1 text-sm text-texto-suave">{t("guia.intro")}</p>

              <ol className="mt-5 flex flex-col gap-3">
                {guia.pasos[idioma].map((paso, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-borde bg-superficie p-3 text-sm">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-acento-suave text-xs font-bold text-acento">
                      {i + 1}
                    </span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>

              <section className="mt-5">
                <h2 className="text-sm font-semibold">{t("guia.oficial")}</h2>
                <ul className="mt-1.5 flex flex-col gap-1 text-sm">
                  {guia.enlaces.map((e) => (
                    <li key={e.url}>
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-acento underline">
                        {e.texto[idioma]} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              <label className="mt-6 flex items-center gap-3 rounded-xl border border-marca/40 bg-marca-suave p-4 font-semibold">
                <input
                  type="checkbox"
                  checked={hecho}
                  onChange={(e) => marcarHecho(e.target.checked)}
                  className="h-5 w-5 accent-[var(--marca)]"
                />
                {t("guia.hecho")}
              </label>
              {hecho && (
                <div className="mt-3 text-sm">
                  <p className="text-marca">{t("guia.hechoOk")}</p>
                  <Link
                    href={tipo ? `/mapa?tipo=${tipo}` : "/mapa"}
                    className="mt-3 block w-full rounded-xl bg-marca px-4 py-3 text-center font-semibold text-sobre-marca hover:bg-marca-fuerte"
                  >
                    {t("guia.irAlMapa")}
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
