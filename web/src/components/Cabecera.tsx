"use client";

import Link from "next/link";
import { Logotipo } from "@/components/Logo";
import { useIdioma } from "@/lib/i18n";

export default function Cabecera({ children }: { children?: React.ReactNode }) {
  const { idioma, cambiarIdioma, t } = useIdioma();
  return (
    <header className="sticky top-0 z-[1100] border-b border-borde bg-superficie/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link href="/" aria-label="GalapaGo">
          <Logotipo />
        </Link>
        <div className="min-w-0 flex-1">{children}</div>
        <button
          onClick={() => cambiarIdioma(idioma === "es" ? "en" : "es")}
          className="rounded-full border border-borde px-3 py-1 text-xs font-semibold text-texto-suave hover:border-acento hover:text-acento"
          aria-label={t("app.idioma")}
          title={t("app.idioma")}
        >
          {t("app.idiomaCorto")}
        </button>
      </div>
    </header>
  );
}
