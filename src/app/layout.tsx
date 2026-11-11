import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, UnifrakturMaguntia } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL("https://tatuajes-azure.vercel.app"),
  title: "Matness · Estudio de tatuajes en Melipilla",
  description:
    "Lettering, fineline, blackwork y borrado con láser en Av. Manso 529, Melipilla. Cotiza tu tatuaje al instante y reserva tu hora.",
  openGraph: {
    title: "Matness · Estudio de tatuajes en Melipilla",
    description: "Lettering, fineline, blackwork y borrado con láser. Cotiza y reserva en línea.",
    images: ["/images/tatuaje3.jpg"],
    locale: "es_CL",
    type: "website",
  },
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
