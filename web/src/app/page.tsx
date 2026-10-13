"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cabecera from "@/components/Cabecera";
import { postEvento } from "@/lib/api";
import { useCatalogo } from "@/lib/catalogo";
import { nombreDispositivo } from "@/lib/formato";
import { useIdioma } from "@/lib/i18n";
import { obtenerSessionId } from "@/lib/sesion";
import { normalizar, SINONIMOS } from "@/lib/sinonimos";

export default function InicioPage() {
  const router = useRouter();
  const { idioma, t } = useIdioma();
  const { catalogo, error } = useCatalogo();
  const [busqueda, setBusqueda] = useState("");

  const dispositivos = useMemo(() => {
    const todos = catalogo?.tipos_dispositivo ?? [];
    const q = normalizar(busqueda);
    if (!q) return todos;
    return todos.filter((d) =>
      [d.nombre_es, d.nombre_en, ...(SINONIMOS[d.slug] ?? [])].some((palabra) =>
        normalizar(palabra).includes(q)
      )
    );
  }, [catalogo, busqueda]);

  function elegir(slug: string) {
    postEvento({ tipo: "seleccion_dispositivo", tipo_dispositivo: slug, session_id: obtenerSessionId() }).catch(
      () => {}
    );
    router.push(`/mapa?tipo=${encodeURIComponent(slug)}`);
  }

  return (
    <>
      <Cabecera />
      <main className="flex flex-1 flex-col px-4 pb-10 pt-6">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("inicio.titulo")}</h1>
          <p className="mt-1.5 text-sm text-texto-suave">{t("inicio.subtitulo")}</p>

          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t("inicio.buscar")}
            className="mt-5 w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-base outline-none placeholder:text-texto-suave focus:border-marca focus:ring-2 focus:ring-marca/25"
          />

          {error && <p className="mt-6 text-sm text-peligro">{t("inicio.error")}</p>}
          {!catalogo && !error && <p className="mt-6 text-sm text-texto-suave">{t("inicio.cargando")}</p>}

          {catalogo && dispositivos.length === 0 && (
            <p className="mt-6 text-sm text-texto-suave">{t("inicio.sinResultados")}</p>
          )}

          <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {dispositivos.map((d) => (
              <button
                key={d.slug}
                onClick={() => elegir(d.slug)}
                className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-borde bg-superficie p-3 text-center text-[13px] font-medium leading-tight transition hover:border-marca hover:bg-marca-suave active:scale-[0.98]"
              >
                <span className="text-3xl" aria-hidden="true">
                  {d.icono}
                </span>
                {nombreDispositivo(d, idioma)}
              </button>
            ))}
          </div>

          <Link
            href="/mapa"
            className="mt-6 block w-full rounded-xl border border-acento px-4 py-3 text-center text-sm font-semibold text-acento hover:bg-acento-suave"
          >
            {t("inicio.verMapa")}
          </Link>

          <p className="mt-10 text-center text-xs text-texto-suave">{t("pie.datos")}</p>
        </div>
      </main>
    </>
  );
}
