"use client";

import Image from "next/image";
import { motion, useScroll } from "motion/react";
import { useRef } from "react";
import { ESTUDIO } from "@/lib/estudio";
import { Carrusel } from "./Carrusel";
import { FotoStencil } from "./FotoStencil";
import { Indice } from "./Indice";
import { Ornamento } from "./Ornamento";
import { TextoRevelado } from "./TextoRevelado";

const ESPECIALIDADES = ["Lettering", "Fineline", "Black & grey", "Microrrealismo", "Realismo", "Blackwork"];

const DATOS = [
  { dato: "+5 años", detalle: "tatuando en Melipilla" },
  { dato: "Formado", detalle: "junto a artistas reconocidos de Chile" },
  { dato: "Convenciones", detalle: "nacionales e internacionales" },
];

/** Hitos sin años: lo que es seguro. Las fechas exactas las pone él. */
const TRAYECTORIA = [
  { hito: "Formación", texto: "Aprende el oficio junto a artistas reconocidos de la escena chilena." },
  { hito: "Convenciones", texto: "Tatúa en convenciones nacionales e internacionales." },
  { hito: "Estudio propio", texto: `Abre su estudio privado en ${ESTUDIO.direccion}, ${ESTUDIO.comuna}.` },
  { hito: "Borrado láser", texto: "Suma el láser para borrar o aclarar antes de un cover." },
  { hito: "Hoy", texto: "Lettering, fineline, black & grey y láser, todo en un mismo estudio." },
];

const LUGAR = [
  { dato: "Un solo tatuador", detalle: "de la cotización a los cuidados, hablas siempre con la misma persona" },
  { dato: "Material desechable", detalle: "agujas, grips y tintas de un solo uso, abiertos frente a ti" },
  { dato: "Diseño propio", detalle: "lo ves y lo apruebas antes de la sesión" },
  { dato: "Estudio privado", detalle: "con hora reservada, el espacio es tuyo mientras te tatúas" },
];

export function Tatuador() {
  const linea = useRef<HTMLDivElement>(null);
  // La trayectoria se va encendiendo al bajar y se apaga al subir.
  const { scrollYProgress } = useScroll({ target: linea, offset: ["start 0.8", "end 0.55"] });

  return (
    <section id="tatuador" aria-labelledby="titulo-tatuador" className="relative overflow-hidden border-t border-linea/70 bg-hollin/40">
      <Ornamento tipo="daga" className="top-10 right-[4%] w-10 rotate-[18deg] sm:w-14 lg:top-24 lg:right-[3%] lg:w-16" />
      <Ornamento tipo="estrella" className="top-20 right-[30%] hidden w-5 lg:block" retraso={3} />

      <div className="relative mx-auto max-w-[1400px] px-4 py-24 sm:px-8 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          {/* Retratos: a un tamaño cercano a su resolución real, para que se vean nítidos. */}
          <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] lg:col-span-4 lg:mx-0 lg:max-w-[400px]">
            <FotoStencil
              src="/trabajos/tatuador-1.jpg"
              alt="Matness tatuando en su estudio, con la máquina en la mano"
              ancho={720}
              alto={900}
              sizes="400px"
              className="aspect-[4/5] w-full rounded-3xl border border-linea"
            />
            <figure className="absolute -right-2 -bottom-8 w-[40%] overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95),0_0_40px_-10px_rgba(47,107,255,0.8)] sm:-right-10 lg:-right-12">
              <Image src="/trabajos/tatuador-2.jpg" alt="Matness trabajando bajo la luz azul del estudio" width={720} height={900} sizes="170px" className="aspect-[4/5] w-full object-cover" />
            </figure>
            <p className="mt-4 max-w-[55%] text-[13px] text-ceniza">
              Matness en el estudio de {ESTUDIO.direccion}.
            </p>
          </div>

          {/* Quién es */}
          <div className="flex flex-col lg:col-span-8">
            <Indice id="tatuador" className="mb-4 lg:mb-6" />
            <h2 id="titulo-tatuador" className="texto-cromo font-gotica text-[clamp(3.25rem,9vw,7rem)] leading-[0.85]">
              El tatuador
            </h2>
            <TextoRevelado
              texto="Transformo ideas en arte sobre la piel. Cada tatuaje es una pieza única, diseñada para ti y hecha con los estándares más altos de calidad e higiene."
              className="mt-8 max-w-[30ch] text-[clamp(1.5rem,2.8vw,2.4rem)] leading-[1.2] font-semibold tracking-[-0.015em]"
            />

            <dl className="mt-10 grid gap-2 sm:grid-cols-3 sm:gap-4">
              {DATOS.map((d) => (
                <div key={d.dato} className="flex items-center justify-between gap-4 rounded-2xl border border-linea bg-tinta/60 px-4 py-3 sm:block sm:p-5">
                  <dt className="font-gotica text-[1.75rem] leading-none text-piel [text-shadow:0_0_22px_rgba(47,107,255,0.6)] sm:text-[clamp(1.6rem,2.6vw,2.4rem)]">
                    {d.dato}
                  </dt>
                  <dd className="text-right text-[14px] leading-snug text-ceniza sm:mt-2 sm:text-left">{d.detalle}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <p className="mb-3 text-[15px] font-semibold">Especialidades</p>
              <ul className="flex flex-wrap gap-2">
                {ESPECIALIDADES.map((e) => (
                  <li key={e} className="rounded-full border border-linea px-4 py-2 text-[14px] text-piel/90">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Trayectoria: en el teléfono se desliza de lado; en escritorio, una línea que se enciende con el scroll. */}
        <div className="mt-20 lg:mt-28">
          <div className="flex items-end justify-between gap-4">
            <h3 className="font-gotica text-5xl leading-none sm:text-6xl">Trayectoria</h3>
            <p className="pb-1 text-[13px] text-ceniza lg:hidden">Desliza →</p>
          </div>
          <div ref={linea} className="relative -mx-4 mt-8 sm:-mx-8 lg:mx-0 lg:mt-10 lg:pt-10">
            <span aria-hidden className="absolute top-[7px] right-0 left-0 hidden h-px bg-linea lg:block" />
            <motion.span
              aria-hidden
              style={{ scaleX: scrollYProgress }}
              className="absolute top-[7px] right-0 left-0 hidden h-px origin-left bg-stencil shadow-[0_0_10px_1px_rgba(47,107,255,0.9)] lg:block"
            />
            <Carrusel etiqueta="Trayectoria" className="sm:px-8 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible lg:px-0">
              {TRAYECTORIA.map((t, i) => {
                const hoy = i === TRAYECTORIA.length - 1;
                return (
                  <li
                    key={t.hito}
                    className={`relative w-[72%] shrink-0 snap-center rounded-3xl border p-5 sm:w-[42%] lg:w-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 ${
                      hoy ? "border-stencil/60 bg-stencil/10" : "border-linea bg-tinta/60"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`absolute -top-10 left-0 hidden h-[15px] w-[15px] rounded-full border-2 lg:block ${
                        hoy ? "border-stencil bg-stencil shadow-[0_0_14px_3px_rgba(47,107,255,0.9)]" : "border-stencil bg-tinta"
                      }`}
                    />
                    <p className="mb-3 text-[12px] font-semibold text-stencil-claro tabular-nums lg:hidden">{String(i + 1).padStart(2, "0")}</p>
                    <p className="font-gotica text-3xl leading-none">{t.hito}</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-ceniza">{t.texto}</p>
                  </li>
                );
              })}
            </Carrusel>
          </div>
        </div>

        {/* Cómo trabaja: 2×2 en el teléfono, una fila en escritorio. */}
        <h3 className="mt-20 text-[12px] font-semibold tracking-[0.2em] text-ceniza uppercase lg:mt-28">Cómo trabajo</h3>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-linea bg-linea lg:grid-cols-4">
          {LUGAR.map((d) => (
            <div key={d.dato} className="bg-tinta p-4 sm:p-6 lg:p-8">
              <dt className="font-gotica text-[1.6rem] leading-[0.95] text-piel sm:text-3xl">{d.dato}</dt>
              <dd className="mt-2 text-[13px] leading-snug text-ceniza sm:mt-3 sm:text-[15px] sm:leading-relaxed">{d.detalle}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
