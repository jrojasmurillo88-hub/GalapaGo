import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GalapaGo — Dónde reciclar tus aparatos en Madrid",
    short_name: "GalapaGo",
    description: "Dónde llevar tus aparatos electrónicos y pilas en Madrid.",
    lang: "es-ES",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8f7",
    theme_color: "#0e9466",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
