// Palabras que la gente escribe en el buscador -> slug de tipos_dispositivo.
// Se buscan sin tildes y en minúsculas. Añadir aquí lo que salga en las entrevistas.

export const SINONIMOS: Record<string, string[]> = {
  movil: ["telefono", "celular", "smartphone", "iphone", "android", "phone", "mobile", "cell"],
  portatil: ["laptop", "macbook", "notebook", "ordenador portatil", "computer"],
  tablet: ["ipad", "tableta", "ebook", "kindle", "libro electronico"],
  ordenador_sobremesa: ["pc", "torre", "ordenador", "desktop", "imac"],
  cargador_cable: ["cable", "usb", "cargador", "charger", "adaptador", "enchufe", "alargador"],
  periferico: ["teclado", "raton", "router", "modem", "keyboard", "mouse", "webcam", "disco duro", "pendrive"],
  auriculares_altavoz: ["cascos", "auriculares", "airpods", "altavoz", "headphones", "speaker", "radio"],
  consola: ["playstation", "ps4", "ps5", "xbox", "nintendo", "switch", "mando", "videojuego", "game"],
  monitor: ["pantalla", "screen", "display"],
  televisor: ["tele", "tv", "television", "smart tv"],
  impresora: ["printer", "escaner", "scanner"],
  pequeno_electrodomestico: [
    "tostadora", "secador", "plancha", "batidora", "cafetera", "aspiradora", "hervidor",
    "maquinilla", "afeitadora", "toaster", "hair dryer", "iron", "blender", "coffee", "vacuum", "kettle",
  ],
  microondas: ["microwave"],
  bombilla: ["bombilla", "fluorescente", "led", "lampara", "bulb", "light", "lamp", "tubo"],
  frigorifico: ["nevera", "congelador", "fridge", "freezer", "refrigerator"],
  aire_acondicionado: ["aire", "climatizador", "air conditioner", "ac"],
  lavadora: ["secadora", "lavavajillas", "washing machine", "dryer", "dishwasher"],
  pilas: ["pila", "batteries", "battery", "aa", "aaa", "boton"],
  bateria_movil_portatil: ["bateria", "powerbank", "power bank", "bateria externa"],
};

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
