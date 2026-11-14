"use client";

import { createContext, useContext } from "react";
import { CONTENIDO_BASE, enlaceWhatsapp, type DatosEstudio } from "@/lib/contenido";

const Contexto = createContext<DatosEstudio>(CONTENIDO_BASE.estudio);

/**
 * WhatsApp, Instagram y dirección del estudio para toda la web. Se cambian en
 * el panel (Web → Datos del estudio) y los lee el layout una vez: así el menú,
 * el pie y el botón flotante nunca muestran números distintos.
 */
export function ProveedorEstudio({ estudio, children }: { estudio: DatosEstudio; children: React.ReactNode }) {
  return <Contexto value={estudio}>{children}</Contexto>;
}

export function useEstudio() {
  const estudio = useContext(Contexto);
  return { ...estudio, whatsappCon: (mensaje: string) => enlaceWhatsapp(estudio.whatsapp, mensaje) };
}
