import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, UnifrakturMaguntia } from "next/font/google";
import "./globals.css";
import { SITIO } from "@/lib/sitio";

// Letra del nombre y los titulares: Old English de tatuaje. Para cambiarla,
// basta con reemplazar esta fuente (la variable CSS sigue siendo la misma).
const gotica = UnifrakturMaguntia({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fraktur",
  display: "swap",
});

const texto = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  // Lo que se busca: "tatuajes Melipilla", "borrado láser Melipilla", "estudio de tatuajes".
  title: { default: "Matness Studio · Tatuajes y borrado láser en Melipilla", template: "%s · Matness Studio" },
  description:
    "Estudio de tatuajes en Melipilla: lettering, fineline, blackwork y borrado con láser en Av. Manso 529. Cotiza tu tatuaje al instante y reserva tu hora en línea.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Matness Studio · Tatuajes y borrado láser en Melipilla",
    description: "Lettering, fineline, blackwork y borrado con láser. Cotiza al instante y reserva tu hora en línea.",
    siteName: "Matness Studio",
    locale: "es_CL",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#07080d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={`${gotica.variable} ${texto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
