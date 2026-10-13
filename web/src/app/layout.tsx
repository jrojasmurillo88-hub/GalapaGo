import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CheckinPrompt from "@/components/CheckinPrompt";
import { ProveedorIdioma } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPCION =
  "Encuentra dónde llevar tus aparatos electrónicos y pilas en Madrid: puntos limpios, tiendas y contenedores, con horarios y qué acepta cada uno.";

export const metadata: Metadata = {
  title: {
    default: "GalapaGo — Dónde reciclar tus aparatos en Madrid",
    template: "%s · GalapaGo",
  },
  description: DESCRIPCION,
  applicationName: "GalapaGo",
  openGraph: {
    title: "GalapaGo",
    description: DESCRIPCION,
    siteName: "GalapaGo",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "GalapaGo",
    description: DESCRIPCION,
  },
  appleWebApp: {
    capable: true,
    title: "GalapaGo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0e9466" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1210" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-ES"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-fondo text-texto">
        <ProveedorIdioma>
          {children}
          <CheckinPrompt />
        </ProveedorIdioma>
      </body>
    </html>
  );
}
