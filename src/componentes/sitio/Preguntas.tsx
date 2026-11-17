"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Par } from "@/lib/contenido";
import { BotonMagnetico } from "./BotonMagnetico";
import { useEstudio } from "./DatosEstudio";
import { Ornamento } from "./Ornamento";

function Contacto({ className = "" }: { className?: string }) {
  const { whatsappCon } = useEstudio();
  return (
    <div className={`rounded-3xl border border-linea bg-hollin/70 p-6 ${className}`}>
      <p className="text-lg font-semibold">¿No está tu pregunta?</p>
      <p className="mt-1 text-[15px] leading-relaxed text-ceniza">Escríbeme y te respondo por WhatsApp. Si tienes una foto o una referencia, mándala también.</p>
      <BotonMagnetico href={whatsappCon("Hola, tengo una pregunta sobre un tatuaje.")} externo className="mt-5 w-full">
        Preguntar por WhatsApp
      </BotonMagnetico>
    </div>
  );
}

/**
 * Preguntas frecuentes. En escritorio, el título y el contacto quedan fijos a
 * la izquierda mientras se leen las respuestas; en el teléfono, el contacto va
 * al final, justo donde termina la duda.
 */
export function Preguntas({ preguntas }: { preguntas: Par[] }) {
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <section id="preguntas" aria-labelledby="titulo-preguntas" className="relative mx-auto max-w-[1400px] px-4 py-24 sm:px-8 lg:py-36">
      <Ornamento tipo="luna" className="top-14 right-[8%] w-20 sm:w-28" flotar={14} />

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <h2 id="titulo-preguntas" className="texto-cromo font-gotica text-[clamp(3.5rem,11vw,6rem)] leading-[0.85]">
              Preguntas
            </h2>
            <p className="mt-5 max-w-sm text-ceniza">Lo que más me preguntan antes de la primera sesión.</p>
            <Contacto className="mt-10 hidden lg:block" />
          </div>
        </div>

        <div className="lg:col-span-7">
          <ul className="border-t border-linea">
            {preguntas.map((q, i) => {
              const abierto = abierta === i;
              return (
                <li key={q.titulo} className="border-b border-linea">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={abierto}
                      aria-controls={`respuesta-${i}`}
                      onClick={() => setAbierta(abierto ? null : i)}
                      className="group flex w-full items-center gap-4 py-5 text-left sm:py-6"
                    >
                      <span className={`w-6 shrink-0 text-[12px] font-semibold tabular-nums transition-colors ${abierto ? "text-stencil-claro" : "text-ceniza/70"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={`flex-1 text-[18px] leading-snug font-semibold transition-colors sm:text-[22px] ${abierto ? "text-piel" : "text-piel/80 group-hover:text-piel"}`}>
                        {q.titulo}
                      </span>
                      <span
                        aria-hidden
                        className={`relative grid size-9 shrink-0 place-items-center rounded-full border transition-colors ${abierto ? "border-stencil bg-stencil" : "border-linea group-hover:border-ceniza"}`}
                      >
                        <span className="absolute h-px w-3.5 bg-current" />
                        <span className={`absolute h-3.5 w-px bg-current transition-transform duration-300 ${abierto ? "scale-y-0" : ""}`} />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {abierto && (
                      <motion.div
                        id={`respuesta-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-[62ch] pb-6 pl-10 text-[16px] leading-relaxed text-ceniza sm:text-[17px]">{q.texto}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
          <Contacto className="mt-8 lg:hidden" />
        </div>
      </div>
    </section>
  );
}
