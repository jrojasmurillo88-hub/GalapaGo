import type { Idioma } from "@/lib/i18n";

// Guías de borrado de datos. Pasos neutrales; el detalle lo da cada fabricante.
// Enlaces comprobados el 13/10/2026. La clave coincide con tipos_dispositivo.guia_borrado.

interface Enlace {
  texto: Record<Idioma, string>;
  url: string;
}

interface Guia {
  titulo: Record<Idioma, string>;
  pasos: Record<Idioma, string[]>;
  enlaces: Enlace[];
}

const APPLE_IPHONE_IPAD: Enlace = {
  texto: { es: "Apple: antes de vender, regalar o renovar tu iPhone o iPad", en: "Apple: before you sell, give away or trade in your iPhone or iPad" },
  url: "https://support.apple.com/es-es/109511",
};
const GOOGLE_ANDROID: Enlace = {
  texto: { es: "Google: restablecer los datos de fábrica de un Android", en: "Google: factory reset an Android device" },
  url: "https://support.google.com/android/answer/6088915?hl=es",
};

export const GUIAS: Record<string, Guia> = {
  movil: {
    titulo: { es: "Móvil", en: "Mobile phone" },
    pasos: {
      es: [
        "Haz una copia de seguridad de lo que quieras conservar: fotos, contactos y chats.",
        "Cierra sesión en tu cuenta principal (Apple ID en iPhone, cuenta de Google en Android). Así el móvil queda libre de bloqueos de activación.",
        "Restablece los datos de fábrica. En iPhone: Ajustes › General › Transferir o restablecer el iPhone › Borrar contenidos y ajustes. En Android, desde Ajustes › Sistema › Restablecer (el nombre cambia según la marca).",
        "Saca la tarjeta SIM y, si tiene, la tarjeta de memoria.",
      ],
      en: [
        "Back up anything you want to keep: photos, contacts and chats.",
        "Sign out of your main account (Apple ID on iPhone, Google account on Android) so the phone isn't activation-locked.",
        "Factory reset it. On iPhone: Settings › General › Transfer or Reset iPhone › Erase All Content and Settings. On Android, from Settings › System › Reset (the name varies by brand).",
        "Remove the SIM card and, if there is one, the memory card.",
      ],
    },
    enlaces: [APPLE_IPHONE_IPAD, GOOGLE_ANDROID],
  },
  tablet: {
    titulo: { es: "Tablet", en: "Tablet" },
    pasos: {
      es: [
        "Haz una copia de seguridad de lo que quieras conservar.",
        "Cierra sesión en tu cuenta principal (Apple ID en iPad, cuenta de Google en Android).",
        "Restablece los datos de fábrica. En iPad: Ajustes › General › Transferir o restablecer el iPad › Borrar contenidos y ajustes. En Android, desde Ajustes › Sistema › Restablecer.",
        "Si tiene tarjeta SIM o de memoria, sácalas.",
      ],
      en: [
        "Back up anything you want to keep.",
        "Sign out of your main account (Apple ID on iPad, Google account on Android).",
        "Factory reset it. On iPad: Settings › General › Transfer or Reset iPad › Erase All Content and Settings. On Android, from Settings › System › Reset.",
        "Remove any SIM or memory card.",
      ],
    },
    enlaces: [APPLE_IPHONE_IPAD, GOOGLE_ANDROID],
  },
  portatil: {
    titulo: { es: "Ordenador", en: "Computer" },
    pasos: {
      es: [
        "Copia a otro sitio (disco externo o nube) los archivos que quieras conservar.",
        "Cierra sesión en tus cuentas: Apple ID / iCloud en Mac; cuenta Microsoft en Windows.",
        "Borra el equipo. En Windows: Configuración › Sistema › Recuperación › Restablecer este PC › Quitar todo. En un Mac reciente: Ajustes del Sistema › General › Transferir o restablecer › Borrar contenidos y ajustes.",
        "Si el ordenador ya no enciende, puedes sacar el disco antes de entregarlo o pedir ayuda en una tienda de reparación.",
      ],
      en: [
        "Copy the files you want to keep somewhere else (external drive or cloud).",
        "Sign out of your accounts: Apple ID / iCloud on Mac; Microsoft account on Windows.",
        "Erase the computer. On Windows: Settings › System › Recovery › Reset this PC › Remove everything. On a recent Mac: System Settings › General › Transfer or Reset › Erase All Content and Settings.",
        "If the computer no longer turns on, you can remove the drive before dropping it off, or ask a repair shop for help.",
      ],
    },
    enlaces: [
      {
        texto: { es: "Microsoft: restablecer el equipo", en: "Microsoft: reset your PC" },
        url: "https://support.microsoft.com/es-es/windows/restablecer-el-equipo-0ef73740-b927-549b-b7c9-e6f2b48d275e",
      },
      {
        texto: { es: "Apple: qué hacer antes de vender, regalar o reciclar tu Mac", en: "Apple: what to do before you sell, give away or recycle your Mac" },
        url: "https://support.apple.com/es-es/102773",
      },
      {
        texto: { es: "Apple: borrar el Mac y restablecer la configuración de fábrica", en: "Apple: erase your Mac and reset it to factory settings" },
        url: "https://support.apple.com/es-es/102664",
      },
    ],
  },
};
