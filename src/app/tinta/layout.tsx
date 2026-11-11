import type { Metadata, Viewport } from "next";
import { RegistrarPanel } from "@/componentes/panel/RegistrarPanel";

/**
 * El manifest se declara SOLO acá: lo único instalable en el teléfono es el
 * panel, no la web pública (el navegador ofrece instalar lo que declara la
 * página desde la que entras, y la portada no declara ninguno).
 *
 * Envuelve también la pantalla de entrada, a propósito: quien instala la app
 * desde ahí tiene que llevarse el mismo manifest.
 */
export const metadata: Metadata = {
  title: "Panel · Matness",
  manifest: "/tinta/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Matness", statusBarStyle: "black-translucent" },
  icons: { icon: "/tinta/panel-192.png", apple: "/tinta/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#07080d",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function LayoutTinta({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RegistrarPanel />
    </>
  );
}
