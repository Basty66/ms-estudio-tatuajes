"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cambiarEstadoCotizacion } from "@/app/tinta/_acciones/panel";
import { PANEL } from "@/lib/admin/ruta";
import { IconoWhatsapp } from "@/componentes/sitio/WhatsappFlotante";
import { claseBoton } from "./Boton";
import { Calendario } from "./Iconos";

/**
 * Lo que se hace con una cotización. No trae teléfono: "Responder" abre
 * WhatsApp con el texto listo y ahí se elige el chat de la persona (la que
 * escribió con este código). "Agendar" abre Nueva cita con lo cotizado.
 */
export function AccionesCotizacion({ id, estado, respuesta, citaId }: { id: number; estado: string; respuesta: string; citaId: number | null }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const cambiar = (nuevo: string) =>
    iniciar(async () => {
      await cambiarEstadoCotizacion(id, nuevo);
      router.refresh();
    });

  if (estado === "agendada") {
    return citaId ? (
      <Link href={`${PANEL}/cita/${citaId}`} className={claseBoton("linea", "min-h-10 px-4 text-[13px]")}>
        <Calendario className="size-4" /> Ver la cita
      </Link>
    ) : null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(respuesta)}`}
        target="_blank"
        rel="noopener noreferrer"
        // Responder la deja como respondida; el enlace es real para que el teléfono no lo bloquee.
        onClick={() => estado === "nueva" && cambiar("respondida")}
        className={claseBoton(estado === "nueva" ? "cromo" : "linea", "min-h-10 px-4 text-[13px]")}
      >
        <IconoWhatsapp className="size-4 shrink-0" /> Responder
      </a>
      <Link href={`${PANEL}/nueva?cotizacion=${id}`} className={claseBoton(estado === "respondida" ? "cromo" : "linea", "min-h-10 px-4 text-[13px]")}>
        <Calendario className="size-4" /> Agendar
      </Link>
      <button
        type="button"
        disabled={pendiente}
        onClick={() => cambiar(estado === "descartada" ? "nueva" : "descartada")}
        className="ml-auto min-h-10 rounded-full px-3 text-[13px] text-ceniza transition-colors hover:text-piel disabled:opacity-40"
      >
        {estado === "descartada" ? "Recuperar" : "Descartar"}
      </button>
    </div>
  );
}
