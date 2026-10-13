"use client";

// i18n mínimo: español de España por defecto + inglés. Sin librerías.
// Para añadir un texto: ponerlo en `es` y en `en` (TypeScript avisa si falta).

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

export type Idioma = "es" | "en";

const es = {
  "app.lema": "Saca tus aparatos del cajón y llévalos al punto correcto.",
  "app.idioma": "English",
  "app.idiomaCorto": "EN",

  "inicio.titulo": "¿Qué quieres reciclar?",
  "inicio.subtitulo": "Elige el aparato y te enseñamos dónde dejarlo en Madrid.",
  "inicio.buscar": "Busca: móvil, tostadora, bombilla…",
  "inicio.sinResultados": "No encontramos ese aparato. Prueba con otra palabra o mira el mapa completo.",
  "inicio.verMapa": "Ver todos los puntos en el mapa",
  "inicio.cargando": "Cargando…",
  "inicio.error": "No pudimos conectar con el servidor. Inténtalo de nuevo en un momento.",

  "mapa.titulo": "Dónde llevar",
  "mapa.todos": "Todos los puntos",
  "mapa.cambiar": "Cambiar aparato",
  "mapa.elegirAparato": "Elegir aparato",
  "mapa.buscandoUbicacion": "Buscando tu ubicación…",
  "mapa.sinUbicacion": "No pudimos usar tu ubicación: mostramos el centro de Madrid.",
  "mapa.reintentar": "Reintentar",
  "mapa.desdeOtroSitio": "Buscar desde otro sitio",
  "mapa.tocaElMapa": "Toca el mapa para buscar desde ese sitio.",
  "mapa.cancelar": "Cancelar",
  "mapa.cargando": "Buscando puntos…",
  "mapa.despertando": "El servidor está arrancando, un momento…",
  "mapa.error": "El servidor no respondió. Recarga la página para intentarlo de nuevo.",
  "mapa.ninguno": "No hay puntos con estos filtros cerca. Prueba a quitar algún filtro.",
  "mapa.ampliado": "Ampliamos la búsqueda a {km} km.",
  "mapa.resultados": "{n} puntos",
  "mapa.verMas": "Ver {n} más",
  "mapa.leyenda": "Tipos de punto",
  "mapa.mostrarOtrosDias": "Mostrar puntos móviles de otros días",

  "filtros.titulo": "Filtros",
  "filtros.abierto": "Horario",
  "filtros.cualquiera": "Cualquiera",
  "filtros.ahora": "Abierto ahora",
  "filtros.hoy": "Abre hoy",
  "filtros.tipoPunto": "Tipo de punto",
  "filtros.operador": "Gestionado por",
  "filtros.distrito": "Distrito",
  "filtros.todos": "Todos",
  "filtros.limpiar": "Quitar filtros",

  "tp.punto_limpio_fijo": "Punto limpio fijo",
  "tp.punto_limpio_movil": "Punto limpio móvil",
  "tp.punto_limpio_proximidad": "Punto limpio de proximidad",
  "tp.tienda": "Tienda",
  "tp.contenedor_scrap": "Contenedor en comercio",
  "tp.contenedor_pilas": "Contenedor de pilas",
  "tp.otro": "Otro",

  "punto.abiertoAhora": "Abierto ahora",
  "punto.cerradoAhora": "Cerrado ahora",
  "punto.hoyAqui": "Hoy aquí de {inicio} a {fin}",
  "punto.hoyTodoElDia": "Hoy aquí todo el día",
  "punto.hoyDe": "Hoy de {inicio} a {fin}",
  "punto.abierto24h": "Abierto 24 horas",
  "punto.noHoy": "Hoy no está aquí",
  "punto.cerradoHoy": "Cerrado hoy",
  "punto.horarioComercio": "Horario de la tienda",
  "punto.horarioSinDatos": "Horario sin confirmar: consúltalo antes de ir",
  "punto.horario": "Horario",
  "punto.horarioFuente": "Horario publicado por la fuente",
  "punto.acepta": "Qué acepta",
  "punto.aceptaNota": "Según la fuente o el tipo de punto. Si algo no cuadra, avísanos.",
  "punto.gestionadoPor": "Gestionado por {nombre}",
  "punto.patrocinadoPor": "Patrocinado por {nombre}",
  "punto.comoLlegar": "Cómo llegar",
  "punto.verDetalle": "Ver detalle",
  "punto.elegir": "Elegir este punto",
  "punto.elegido": "Punto elegido",
  "punto.reportar": "Reportar un problema",
  "punto.volver": "← Volver",
  "punto.cargando": "Cargando…",
  "punto.noEncontrado": "No pudimos cargar este punto.",
  "punto.fuente": "Fuente: {fuente}",
  "punto.actualizado": "Datos actualizados el {fecha}",
  "punto.verificado": "Verificado por GalapaGo el {fecha}",
  "punto.sinVerificar": "Aún no verificado por GalapaGo",
  "punto.enVia": "En la vía pública",
  "punto.distancia": "{dist} · {min} min andando",
  "punto.normaTitulo": "Recogida en tiendas grandes",
  "punto.normaFuente": "Fuente oficial",
  "punto.tiendaAviso": "Comprueba en la tienda que tiene recogida: depende de su tamaño.",

  "guia.aviso": "Antes de entregarlo: borra tus datos",
  "guia.avisoTexto": "Tu {aparato} puede tener fotos, cuentas y contraseñas. Te explicamos cómo borrarlo en unos minutos.",
  "guia.verGuia": "Ver cómo borrarlo",
  "guia.titulo": "Cómo borrar tus datos",
  "guia.intro": "Pasos generales y neutrales. Cada fabricante lo explica en detalle en su web oficial.",
  "guia.oficial": "Instrucciones oficiales",
  "guia.hecho": "He borrado mis datos",
  "guia.hechoOk": "¡Perfecto! Ya puedes llevarlo a un punto.",
  "guia.irAlMapa": "Ver dónde llevarlo",
  "guia.noEncontrada": "No tenemos guía para este aparato.",

  "reporte.titulo": "Reportar un problema",
  "reporte.pregunta": "¿Qué pasa con este punto?",
  "reporte.cerrado": "Está cerrado o ya no existe",
  "reporte.lleno": "El contenedor está lleno",
  "reporte.horario_incorrecto": "El horario no es correcto",
  "reporte.direccion_incorrecta": "La dirección o la ubicación no es correcta",
  "reporte.no_acepta": "No aceptan lo que dice la app",
  "reporte.otro": "Otro problema",
  "reporte.detalle": "Detalle (opcional)",
  "reporte.enviar": "Enviar reporte",
  "reporte.enviando": "Enviando…",
  "reporte.gracias": "¡Gracias! Lo revisaremos para que la información sea fiable.",
  "reporte.error": "No pudimos enviar el reporte. Inténtalo de nuevo.",
  "reporte.volverPunto": "Volver al punto",

  "checkin.pregunta": "¿Pudiste entregar tus aparatos en {punto}?",
  "checkin.si": "Sí, los entregué",
  "checkin.noPude": "No pude",
  "checkin.estabaCerrado": "Estaba cerrado",
  "checkin.queEntregaste": "¿Qué entregaste?",
  "checkin.confirmar": "Confirmar",
  "checkin.saltar": "Prefiero no decirlo",
  "checkin.gracias": "¡Gracias por reciclar!",
  "checkin.peso": "Has evitado que unos {kg} kg de residuos electrónicos acaben donde no deben.",
  "checkin.normaSocial": "{n} personas de tu distrito han entregado aparatos este mes.",
  "checkin.cerrar": "Cerrar",
  "checkin.enviando": "Guardando…",
  "checkin.error": "No pudimos guardar tu respuesta.",
  "checkin.reintentar": "Reintentar",
  "checkin.reportado": "Gracias, lo marcamos para revisarlo.",

  "pie.datos": "Datos: Ayuntamiento de Madrid (CC BY 4.0), Ambilamp y © colaboradores de OpenStreetMap.",
};

const en: typeof es = {
  "app.lema": "Get your old devices out of the drawer and into the right place.",
  "app.idioma": "Español",
  "app.idiomaCorto": "ES",

  "inicio.titulo": "What do you want to recycle?",
  "inicio.subtitulo": "Pick the device and we'll show you where to drop it off in Madrid.",
  "inicio.buscar": "Search: phone, toaster, light bulb…",
  "inicio.sinResultados": "We couldn't find that device. Try another word or open the full map.",
  "inicio.verMapa": "See all points on the map",
  "inicio.cargando": "Loading…",
  "inicio.error": "We couldn't reach the server. Please try again in a moment.",

  "mapa.titulo": "Where to take",
  "mapa.todos": "All drop-off points",
  "mapa.cambiar": "Change device",
  "mapa.elegirAparato": "Choose a device",
  "mapa.buscandoUbicacion": "Finding your location…",
  "mapa.sinUbicacion": "We couldn't use your location: showing central Madrid.",
  "mapa.reintentar": "Retry",
  "mapa.desdeOtroSitio": "Search from another place",
  "mapa.tocaElMapa": "Tap the map to search from there.",
  "mapa.cancelar": "Cancel",
  "mapa.cargando": "Finding drop-off points…",
  "mapa.despertando": "The server is starting up, one moment…",
  "mapa.error": "The server didn't respond. Reload the page to try again.",
  "mapa.ninguno": "No points nearby with these filters. Try removing one.",
  "mapa.ampliado": "We widened the search to {km} km.",
  "mapa.resultados": "{n} points",
  "mapa.verMas": "Show {n} more",
  "mapa.leyenda": "Point types",
  "mapa.mostrarOtrosDias": "Show mobile points from other days",

  "filtros.titulo": "Filters",
  "filtros.abierto": "Opening hours",
  "filtros.cualquiera": "Any time",
  "filtros.ahora": "Open now",
  "filtros.hoy": "Open today",
  "filtros.tipoPunto": "Point type",
  "filtros.operador": "Run by",
  "filtros.distrito": "District",
  "filtros.todos": "All",
  "filtros.limpiar": "Clear filters",

  "tp.punto_limpio_fijo": "Recycling centre",
  "tp.punto_limpio_movil": "Mobile collection point",
  "tp.punto_limpio_proximidad": "Neighbourhood collection point",
  "tp.tienda": "Shop",
  "tp.contenedor_scrap": "Bin inside a shop",
  "tp.contenedor_pilas": "Battery bin",
  "tp.otro": "Other",

  "punto.abiertoAhora": "Open now",
  "punto.cerradoAhora": "Closed now",
  "punto.hoyAqui": "Here today from {inicio} to {fin}",
  "punto.hoyTodoElDia": "Here all day today",
  "punto.hoyDe": "Today {inicio}–{fin}",
  "punto.abierto24h": "Open 24 hours",
  "punto.noHoy": "Not here today",
  "punto.cerradoHoy": "Closed today",
  "punto.horarioComercio": "Shop opening hours",
  "punto.horarioSinDatos": "Opening hours not confirmed: check before you go",
  "punto.horario": "Opening hours",
  "punto.horarioFuente": "Opening hours as published by the source",
  "punto.acepta": "What it accepts",
  "punto.aceptaNota": "Based on the source or the type of point. If something is wrong, let us know.",
  "punto.gestionadoPor": "Run by {nombre}",
  "punto.patrocinadoPor": "Sponsored by {nombre}",
  "punto.comoLlegar": "Get directions",
  "punto.verDetalle": "See details",
  "punto.elegir": "Choose this point",
  "punto.elegido": "Chosen point",
  "punto.reportar": "Report a problem",
  "punto.volver": "← Back",
  "punto.cargando": "Loading…",
  "punto.noEncontrado": "We couldn't load this point.",
  "punto.fuente": "Source: {fuente}",
  "punto.actualizado": "Data updated on {fecha}",
  "punto.verificado": "Checked by GalapaGo on {fecha}",
  "punto.sinVerificar": "Not yet checked by GalapaGo",
  "punto.enVia": "On the street",
  "punto.distancia": "{dist} · {min} min walk",
  "punto.normaTitulo": "Take-back at large shops",
  "punto.normaFuente": "Official source",
  "punto.tiendaAviso": "Check with the shop that it takes devices back: it depends on its size.",

  "guia.aviso": "Before you drop it off: wipe your data",
  "guia.avisoTexto": "Your {aparato} may hold photos, accounts and passwords. Here's how to wipe it in a few minutes.",
  "guia.verGuia": "See how to wipe it",
  "guia.titulo": "How to wipe your data",
  "guia.intro": "General, brand-neutral steps. Each manufacturer explains them in detail on its official website.",
  "guia.oficial": "Official instructions",
  "guia.hecho": "I've wiped my data",
  "guia.hechoOk": "Great! You're ready to drop it off.",
  "guia.irAlMapa": "See where to take it",
  "guia.noEncontrada": "We don't have a guide for this device.",

  "reporte.titulo": "Report a problem",
  "reporte.pregunta": "What's wrong with this point?",
  "reporte.cerrado": "It's closed or no longer exists",
  "reporte.lleno": "The bin is full",
  "reporte.horario_incorrecto": "The opening hours are wrong",
  "reporte.direccion_incorrecta": "The address or location is wrong",
  "reporte.no_acepta": "They don't accept what the app says",
  "reporte.otro": "Something else",
  "reporte.detalle": "Details (optional)",
  "reporte.enviar": "Send report",
  "reporte.enviando": "Sending…",
  "reporte.gracias": "Thanks! We'll review it to keep the information reliable.",
  "reporte.error": "We couldn't send the report. Please try again.",
  "reporte.volverPunto": "Back to the point",

  "checkin.pregunta": "Did you manage to drop off your devices at {punto}?",
  "checkin.si": "Yes, I did",
  "checkin.noPude": "I couldn't",
  "checkin.estabaCerrado": "It was closed",
  "checkin.queEntregaste": "What did you drop off?",
  "checkin.confirmar": "Confirm",
  "checkin.saltar": "I'd rather not say",
  "checkin.gracias": "Thanks for recycling!",
  "checkin.peso": "You kept about {kg} kg of e-waste out of the wrong bin.",
  "checkin.normaSocial": "{n} people in your district dropped off devices this month.",
  "checkin.cerrar": "Close",
  "checkin.enviando": "Saving…",
  "checkin.error": "We couldn't save your answer.",
  "checkin.reintentar": "Retry",
  "checkin.reportado": "Thanks, we've flagged it for review.",

  "pie.datos": "Data: Ayuntamiento de Madrid (CC BY 4.0), Ambilamp and © OpenStreetMap contributors.",
};

const DICCIONARIOS = { es, en };
export type ClaveTexto = keyof typeof es;

const STORAGE_KEY = "galapago_idioma";

interface ContextoIdioma {
  idioma: Idioma;
  cambiarIdioma: (i: Idioma) => void;
  t: (clave: ClaveTexto, vars?: Record<string, string | number>) => string;
}

const Contexto = createContext<ContextoIdioma | null>(null);

// El idioma guardado vive en localStorage: se lee como "almacén externo" para
// que el servidor renderice en español y el cliente cambie sin parpadeos raros.
const oyentes = new Set<() => void>();
let enMemoria: Idioma | null = null; // por si el navegador bloquea localStorage

function leerGuardado(): Idioma {
  if (enMemoria) return enMemoria;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  window.addEventListener("storage", oyente);
  return () => {
    oyentes.delete(oyente);
    window.removeEventListener("storage", oyente);
  };
}

export function ProveedorIdioma({ children }: { children: React.ReactNode }) {
  const idioma = useSyncExternalStore<Idioma>(suscribir, leerGuardado, () => "es");

  useEffect(() => {
    document.documentElement.lang = idioma === "es" ? "es-ES" : "en";
  }, [idioma]);

  const cambiarIdioma = useCallback((i: Idioma) => {
    enMemoria = i;
    try {
      window.localStorage.setItem(STORAGE_KEY, i);
    } catch {
      // sin almacenamiento: el idioma solo dura esta visita
    }
    oyentes.forEach((o) => o());
  }, []);

  const t = useCallback(
    (clave: ClaveTexto, vars?: Record<string, string | number>) => {
      let texto: string = DICCIONARIOS[idioma][clave] ?? es[clave] ?? clave;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) texto = texto.replaceAll(`{${k}}`, String(v));
      }
      return texto;
    },
    [idioma]
  );

  return <Contexto.Provider value={{ idioma, cambiarIdioma, t }}>{children}</Contexto.Provider>;
}

export function useIdioma(): ContextoIdioma {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useIdioma debe usarse dentro de <ProveedorIdioma>");
  return ctx;
}
