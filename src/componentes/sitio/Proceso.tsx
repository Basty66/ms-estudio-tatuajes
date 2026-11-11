"use client";

import Image from "next/image";
import { motion, useScroll } from "motion/react";
import { useRef } from "react";
import { PROCESO } from "@/lib/estudio";
import { Carrusel } from "./Carrusel";
import { Indice } from "./Indice";

/**
 * Las cuatro etapas de una sesión con cuadros reales.
 * - Teléfono: tarjetas grandes que se deslizan de lado, con la etapa escrita
 *   sobre la foto. Una pantalla en vez de dos.
 * - Escritorio: una fila unida por una línea de neón que avanza con el
 *   scroll (y retrocede al subir), con el texto bajo cada foto.
 */
export function Proceso() {
  const fila = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: fila, offset: ["start 0.85", "start 0.35"] });

  return (
    <section id="proceso" aria-labelledby="titulo-proceso" className="relative border-t border-linea/70 py-24 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Indice id="proceso" className="mb-4 lg:mb-6" />
            <h2 id="titulo-proceso" className="texto-cromo font-gotica text-[clamp(3.25rem,9vw,6rem)] leading-[0.85]">
              Una sesión
            </h2>
          </div>
          <p className="max-w-xs text-ceniza lg:pb-2 lg:text-right">
            Del calco a la piel en cuatro etapas, con cuadros reales del estudio.
          </p>
        </div>
      </div>

      <div ref={fila} className="relative mx-auto mt-10 max-w-[1400px] lg:px-8">
        <div aria-hidden className="absolute top-[26px] right-8 left-8 hidden h-px bg-linea lg:block">
          <motion.div style={{ scaleX: scrollYProgress }} className="h-px origin-left bg-stencil shadow-[0_0_10px_1px_rgba(47,107,255,0.9)]" />
        </div>

        <Carrusel etiqueta="Etapas de una sesión" className="sm:px-8 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
          {PROCESO.map((p, i) => (
            <li key={p.paso} className="w-[80%] shrink-0 snap-center sm:w-[46%] lg:w-auto">
              <span className="relative z-10 mb-4 hidden h-[52px] w-[52px] place-items-center rounded-full border border-stencil bg-tinta font-gotica text-3xl leading-none shadow-[0_0_22px_-2px_rgba(47,107,255,0.9)] lg:grid">
                {i + 1}
              </span>
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-linea lg:rounded-2xl">
                <Image src={p.src} alt={`${p.paso}: ${p.texto}`} fill sizes="(min-width: 1024px) 22vw, 80vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-tinta via-tinta/40 to-transparent lg:from-tinta/80 lg:via-transparent" />
                {/* Teléfono: el número y la etapa van sobre la foto. */}
                <span className="absolute top-4 left-4 grid h-10 w-10 place-items-center rounded-full border border-stencil bg-tinta/80 font-gotica text-2xl leading-none shadow-[0_0_22px_-2px_rgba(47,107,255,0.9)] backdrop-blur-sm lg:hidden">
                  {i + 1}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5 lg:hidden">
                  <h3 className="font-gotica text-[2.1rem] leading-none">{p.paso}</h3>
                  <p className="mt-2 text-[15px] leading-snug text-piel/85">{p.texto}</p>
                </div>
              </div>
              <div className="hidden lg:block">
                <h3 className="mt-4 font-gotica text-3xl leading-none">{p.paso}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ceniza">{p.texto}</p>
              </div>
            </li>
          ))}
        </Carrusel>
      </div>
    </section>
  );
}
