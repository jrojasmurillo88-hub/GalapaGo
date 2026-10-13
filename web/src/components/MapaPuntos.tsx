"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import type { Punto, TipoPunto } from "@/lib/api";
import { COLOR_TIPO_PUNTO } from "@/lib/formato";
import { useIdioma } from "@/lib/i18n";

const iconoUsuario = L.divIcon({
  className: "",
  html: `<div style="
    width:14px; height:14px; border-radius:50%;
    background:var(--acento); border:2px solid white;
    box-shadow:0 0 0 4px color-mix(in srgb, var(--acento) 30%, transparent);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const cacheIconos = new Map<string, L.DivIcon>();

function icono(tipo: TipoPunto, elegido: boolean): L.DivIcon {
  const clave = `${tipo}|${elegido}`;
  const enCache = cacheIconos.get(clave);
  if (enCache) return enCache;

  const color = COLOR_TIPO_PUNTO[tipo];
  const size = elegido ? 18 : 13;
  let nuevo: L.DivIcon;
  if (!elegido) {
    nuevo = L.divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
        border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.45);"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  } else {
    const halo = 40;
    nuevo = L.divIcon({
      className: "",
      html: `<div style="width:${halo}px;height:${halo}px;position:relative;">
        <div class="galapago-marcador-seleccionado" style="position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);width:${size}px;height:${size}px;border-radius:50%;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;
          box-shadow:0 0 6px 2px color-mix(in srgb, var(--marca) 70%, transparent),0 1px 4px rgba(0,0,0,.5);"></div>
      </div>`,
      iconSize: [halo, halo],
      iconAnchor: [halo / 2, halo / 2],
    });
  }
  cacheIconos.set(clave, nuevo);
  return nuevo;
}

/** Encuadra al usuario y los puntos más cercanos cuando cambia la búsqueda */
function AjustarVista({ ubicacion, puntos }: { ubicacion: { lat: number; lng: number }; puntos: Punto[] }) {
  const map = useMap();
  const firma = puntos.slice(0, 8).map((p) => p.id).join(",");
  useEffect(() => {
    const cercanos = puntos.slice(0, 8);
    if (cercanos.length === 0) {
      map.setView([ubicacion.lat, ubicacion.lng], 14);
      return;
    }
    const bounds = L.latLngBounds([
      [ubicacion.lat, ubicacion.lng],
      ...cercanos.map((p) => [p.lat, p.lng] as [number, number]),
    ]);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ubicacion.lat, ubicacion.lng, firma, map]);
  return null;
}

/** Centra el mapa en el punto elegido desde la lista */
function CentrarEnElegido({ punto }: { punto: Punto | null }) {
  const map = useMap();
  useEffect(() => {
    if (punto) map.panTo([punto.lat, punto.lng], { animate: true });
  }, [punto, map]);
  return null;
}

function SelectorUbicacion({ activo, onElegir }: { activo: boolean; onElegir?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (activo) onElegir?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapaPuntos({
  puntos,
  ubicacion,
  elegidoId,
  modoSeleccionUbicacion = false,
  onElegirUbicacion,
  onElegirPunto,
}: {
  puntos: Punto[];
  ubicacion: { lat: number; lng: number };
  elegidoId: number | null;
  modoSeleccionUbicacion?: boolean;
  onElegirUbicacion?: (lat: number, lng: number) => void;
  onElegirPunto?: (id: number) => void;
}) {
  const { t } = useIdioma();
  const tiposPresentes = useMemo(
    () => Array.from(new Set(puntos.map((p) => p.tipo_punto))),
    [puntos]
  );
  const elegido = puntos.find((p) => p.id === elegidoId) ?? null;

  return (
    <div className="relative h-full w-full">
      {tiposPresentes.length > 0 && (
        <div className="absolute bottom-5 right-2 z-[1000] rounded-lg border border-borde bg-superficie/95 px-3 py-2 text-xs shadow-md">
          <p className="mb-1 font-semibold">{t("mapa.leyenda")}</p>
          {tiposPresentes.map((tp) => (
            <div key={tp} className="flex items-center gap-1.5 leading-relaxed">
              <span
                style={{ background: COLOR_TIPO_PUNTO[tp] }}
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border border-white"
              />
              <span className="text-texto-suave">{t(`tp.${tp}` as const)}</span>
            </div>
          ))}
        </div>
      )}
      <MapContainer
        center={[ubicacion.lat, ubicacion.lng]}
        zoom={14}
        scrollWheelZoom
        className={`h-full w-full ${modoSeleccionUbicacion ? "cursor-crosshair" : ""}`}
      >
        <AjustarVista ubicacion={ubicacion} puntos={puntos} />
        <CentrarEnElegido punto={elegido} />
        <SelectorUbicacion activo={modoSeleccionUbicacion} onElegir={onElegirUbicacion} />
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[ubicacion.lat, ubicacion.lng]} icon={iconoUsuario} />
        {puntos.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={icono(p.tipo_punto, p.id === elegidoId)}
            zIndexOffset={p.id === elegidoId ? 1000 : 0}
            eventHandlers={{ click: () => onElegirPunto?.(p.id) }}
          >
            <Popup>
              <div style={{ fontSize: 13, minWidth: 160 }}>
                <strong>{p.nombre}</strong>
                <br />
                <span style={{ color: "var(--texto-suave)" }}>{t(`tp.${p.tipo_punto}` as const)}</span>
                {p.direccion && (
                  <>
                    <br />
                    <span>{p.direccion}</span>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
