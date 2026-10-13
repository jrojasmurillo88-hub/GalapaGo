"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Cabecera from "@/components/Cabecera";
import { postReporte, type TipoReporte } from "@/lib/api";
import { useIdioma } from "@/lib/i18n";

const TIPOS: TipoReporte[] = ["cerrado", "lleno", "horario_incorrecto", "direccion_incorrecta", "no_acepta", "otro"];

export default function ReportarPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useIdioma();
  const [tipo, setTipo] = useState<TipoReporte>("cerrado");
  const [detalle, setDetalle] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(false);
    try {
      await postReporte({ punto_id: Number(id), tipo, detalle: detalle.trim() || undefined });
      setEnviado(true);
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Cabecera />
      <main className="flex-1 px-4 py-6">
        {enviado ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-base font-medium">{t("reporte.gracias")}</p>
            <Link href={`/punto/${id}`} className="text-sm text-acento underline">
              {t("reporte.volverPunto")}
            </Link>
          </div>
        ) : (
          <form onSubmit={enviar} className="mx-auto w-full max-w-md">
            <Link href={`/punto/${id}`} className="text-sm text-texto-suave hover:text-texto">
              {t("punto.volver")}
            </Link>
            <h1 className="mt-3 text-xl font-bold">{t("reporte.titulo")}</h1>
            <p className="mt-1 text-sm text-texto-suave">{t("reporte.pregunta")}</p>

            <div className="mt-4 flex flex-col gap-2">
              {TIPOS.map((opcion) => (
                <label
                  key={opcion}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                    tipo === opcion ? "border-marca bg-marca-suave" : "border-borde bg-superficie"
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={opcion}
                    checked={tipo === opcion}
                    onChange={() => setTipo(opcion)}
                  />
                  {t(`reporte.${opcion}` as const)}
                </label>
              ))}
            </div>

            <textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder={t("reporte.detalle")}
              maxLength={1000}
              className="mt-4 w-full rounded-lg border border-borde bg-superficie p-3 text-sm"
              rows={3}
            />

            {error && <p className="mt-2 text-sm text-peligro">{t("reporte.error")}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="mt-4 w-full rounded-xl bg-marca px-4 py-3 font-semibold text-sobre-marca hover:bg-marca-fuerte disabled:opacity-60"
            >
              {enviando ? t("reporte.enviando") : t("reporte.enviar")}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
