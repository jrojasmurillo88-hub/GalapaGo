"use client";

import { useEffect, useState } from "react";
import { fetchCatalogo, type Catalogo } from "@/lib/api";

// El catálogo cambia muy poco: una petición por visita, compartida entre páginas.
let promesa: Promise<Catalogo> | null = null;

function cargar(): Promise<Catalogo> {
  if (!promesa) {
    promesa = fetchCatalogo().catch((e) => {
      promesa = null; // permitir reintentar
      throw e;
    });
  }
  return promesa;
}

export function useCatalogo(): { catalogo: Catalogo | null; error: boolean } {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    cargar()
      .then((c) => vivo && setCatalogo(c))
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
    };
  }, []);

  return { catalogo, error };
}
