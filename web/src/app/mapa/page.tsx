import { Suspense } from "react";
import MapaContenido from "./MapaContenido";

export default function MapaPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-fondo" />}>
      <MapaContenido />
    </Suspense>
  );
}
