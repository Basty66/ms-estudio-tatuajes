"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cambiarEstadoCotizacion } from "@/app/tinta/_acciones/panel";
import { PANEL } from "@/lib/admin/ruta";
import { rellenar } from "@/lib/contenido";
import { MAX_SESIONES, sinNombre, textoCadaSesion, textoSesiones, valoresPropuesta } from "@/lib/sesiones";
import { IconoWhatsapp } from "@/componentes/sitio/WhatsappFlotante";
import { claseBoton } from "./Boton";
import { Chip, campo, Etiqueta } from "./FormularioCita";
import { Calendario } from "./Iconos";

/**
 * Lo que se hace con una cotización. No trae teléfono: "Responder" abre
 * WhatsApp con el texto listo y ahí se elige el chat de la persona (la que
 * escribió con este código). Cuando ya mandó su referencia, "Valor final"
 * arma la propuesta (sesiones, valor y abono) y "Agendar" abre Nueva cita con
 * lo cotizado y lo acordado.
 */
export function AccionesCotizacion({
  id,
  estado,
  respuesta,
  citaId,
  propuesta,
  datosAbono,
}: {
  id: number;
  estado: string;
  respuesta: string;
  citaId: number | null;
  /** La plantilla "Valor final y sesiones". */
  propuesta: string;
  datosAbono: string;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [abierta, setAbierta] = useState(false);
  const [sesiones, setSesiones] = useState(1);
  const [valor, setValor] = useState("");
  const [abono, setAbono] = useState("");
  const total = Number(valor.replace(/\D/g, "")) || 0;
  const mensaje = rellenar(
    sinNombre(propuesta),
    valoresPropuesta({ nombre: "", valorFinal: total || null, sesiones, abono: Number(abono.replace(/\D/g, "")) || null, duracion: "", datosAbono }),
  );
  const agendar = `${PANEL}/nueva?cotizacion=${id}${total ? `&valor=${total}&sesiones=${sesiones}` : ""}`;
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
      <button type="button" aria-expanded={abierta} onClick={() => setAbierta(!abierta)} className={claseBoton(abierta ? "cromo" : "linea", "min-h-10 px-4 text-[13px]")}>
        Valor final
      </button>
      <Link href={agendar} className={claseBoton(estado === "respondida" && !abierta ? "cromo" : "linea", "min-h-10 px-4 text-[13px]")}>
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
      {abierta && (
        <div className="panel-surge mt-1 flex w-full flex-col gap-3 rounded-2xl border border-linea bg-tinta/40 p-3">
          <div>
            <Etiqueta nota="Un tatuaje grande va en varias">Sesiones</Etiqueta>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Chip key={n} activo={sesiones === n} onClick={() => setSesiones(n)} className="min-w-11">
                  {n}
                </Chip>
              ))}
              <input
                type="number"
                min={1}
                max={MAX_SESIONES}
                aria-label="Otra cantidad de sesiones"
                placeholder="Más"
                onChange={(e) => {
                  const n = Math.round(Number(e.target.value));
                  if (n >= 1 && n <= MAX_SESIONES) setSesiones(n);
                }}
                className="min-h-10 w-20 rounded-full border border-linea bg-transparent px-3 text-center text-[14px] tabular-nums placeholder:text-ceniza/60 focus:border-stencil focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="min-w-0">
              <Etiqueta>Valor final</Etiqueta>
              <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="numeric" placeholder="$" className={`${campo} tabular-nums`} />
            </label>
            <label className="min-w-0">
              <Etiqueta>Abono</Etiqueta>
              <input value={abono} onChange={(e) => setAbono(e.target.value)} inputMode="numeric" placeholder="$" className={`${campo} tabular-nums`} />
            </label>
          </div>
          <p className="-mt-1 text-[12px] text-ceniza">
            {sesiones > 1 && total ? `${textoSesiones(sesiones)} de ${textoCadaSesion(total, sesiones)}.` : "El valor final es por el trabajo completo."}
            {datosAbono ? "" : " Sin datos para transferir: agrégalos en Web → Mensajes de WhatsApp."}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!total}
              onClick={(e) => {
                if (!total) return e.preventDefault();
                if (estado === "nueva") cambiar("respondida");
              }}
              className={claseBoton("cromo", `min-h-11 px-3 text-[14px] ${total ? "" : "pointer-events-none opacity-40"}`)}
            >
              <IconoWhatsapp className="size-4 shrink-0" /> Mandar la propuesta
            </a>
            <Link href={agendar} className={claseBoton("linea", "min-h-11 px-3 text-[14px]")}>
              <Calendario className="size-4" /> Agendar con esto
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
