"use client";

import { motion } from "motion/react";
import { enlaceWhatsapp } from "@/lib/estudio";

export function IconoWhatsapp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.2.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

/**
 * Botón de WhatsApp siempre a mano, en el verde que la gente reconoce sin
 * leer. Queda debajo de los menús y de la foto ampliada (z-45), y las barras
 * de abajo del teléfono le dejan su espacio a la derecha.
 */
export function WhatsappFlotante() {
  return (
    <motion.a
      href={enlaceWhatsapp("Hola, vengo de la web y quiero consultar por un tatuaje.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 320, damping: 20 }}
      className="group fixed right-4 z-[45] flex items-center gap-3 sm:right-6"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <span className="pointer-events-none hidden translate-x-2 rounded-full border border-linea bg-tinta/90 px-4 py-2 text-[14px] font-semibold whitespace-nowrap opacity-0 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] transition-[opacity,translate] duration-300 group-hover:translate-x-0 group-hover:opacity-100 lg:block">
        Escríbeme por WhatsApp
      </span>
      <span className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_14px_34px_-8px_rgba(37,211,102,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform duration-300 group-hover:scale-105 lg:h-[60px] lg:w-[60px]">
        <span aria-hidden className="whatsapp-pulso absolute inset-0 rounded-full bg-[#25d366]" />
        <IconoWhatsapp className="relative h-7 w-7" />
      </span>
    </motion.a>
  );
}
