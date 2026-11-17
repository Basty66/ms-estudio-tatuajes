"use client";

import Image from "next/image";
import type { Foto, TextosTatuador } from "@/lib/contenido";
import { useEstudio } from "./DatosEstudio";
import { FotoStencil } from "./FotoStencil";
import { Ornamento } from "./Ornamento";
import { TextoRevelado } from "./TextoRevelado";

/** Los textos y los dos retratos se cambian desde el panel (Web → El tatuador y Fotos). */
export function Tatuador({ textos, grande, chica }: { textos: TextosTatuador; grande: Foto; chica: Foto }) {
  const { direccion } = useEstudio();

  return (
    <section id="tatuador" aria-labelledby="titulo-tatuador" className="relative overflow-hidden border-t border-linea/70 bg-hollin/40">
      <Ornamento tipo="daga" className="top-10 right-[4%] w-10 rotate-[18deg] sm:w-14 lg:top-24 lg:right-[3%] lg:w-16" />
      <Ornamento tipo="estrella" className="top-20 right-[30%] hidden w-5 lg:block" retraso={3} />

      <div className="relative mx-auto max-w-[1400px] px-4 py-24 sm:px-8 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          {/* Retratos: a un tamaño cercano a su resolución real, para que se vean nítidos. */}
          <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] lg:col-span-4 lg:mx-0 lg:max-w-[400px]">
            <FotoStencil
              src={grande.src}
              alt={grande.alt}
              ancho={grande.ancho}
              alto={grande.alto}
              sizes="400px"
              className="aspect-[4/5] w-full rounded-3xl border border-linea"
            />
            <figure className="absolute -right-2 -bottom-8 w-[40%] overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95),0_0_40px_-10px_rgba(47,107,255,0.8)] sm:-right-10 lg:-right-12">
              <Image src={chica.src} alt={chica.alt} width={chica.ancho} height={chica.alto} sizes="170px" className="aspect-[4/5] w-full object-cover" />
            </figure>
            <p className="mt-4 max-w-[55%] text-[13px] text-ceniza">
              Matness en el estudio de {direccion}.
            </p>
          </div>

          {/* Quién es */}
          <div className="flex flex-col lg:col-span-8">
            <h2 id="titulo-tatuador" className="texto-cromo font-gotica text-[clamp(3.25rem,9vw,7rem)] leading-[0.85]">
              El tatuador
            </h2>
            <TextoRevelado
              texto={textos.frase}
              className="mt-8 max-w-[30ch] text-[clamp(1.5rem,2.8vw,2.4rem)] leading-[1.2] font-semibold tracking-[-0.015em]"
            />

            <dl className="mt-10 grid gap-2 sm:grid-cols-3 sm:gap-4">
              {textos.datos.map((d) => (
                <div key={`${d.titulo}${d.texto}`} className="flex items-center justify-between gap-4 rounded-2xl border border-linea bg-tinta/60 px-4 py-3 sm:block sm:p-5">
                  <dt className="font-gotica text-[1.75rem] leading-none text-piel [text-shadow:0_0_22px_rgba(47,107,255,0.6)] sm:text-[clamp(1.6rem,2.6vw,2.4rem)]">
                    {d.titulo}
                  </dt>
                  <dd className="text-right text-[14px] leading-snug text-ceniza sm:mt-2 sm:text-left">{d.texto}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <p className="mb-3 text-[15px] font-semibold">Especialidades</p>
              <ul className="flex flex-wrap gap-2">
                {textos.especialidades.map((e) => (
                  <li key={e} className="rounded-full border border-linea px-4 py-2 text-[14px] text-piel/90">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Cómo trabaja: 2×2 en el teléfono, una fila en escritorio. */}
        <h3 className="mt-20 text-[12px] font-semibold tracking-[0.2em] text-ceniza uppercase lg:mt-28">Cómo trabajo</h3>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-linea bg-linea lg:grid-cols-4">
          {textos.lugar.map((d) => (
            <div key={`${d.titulo}${d.texto}`} className="bg-tinta p-4 sm:p-6 lg:p-8">
              <dt className="font-gotica text-[1.6rem] leading-[0.95] text-piel sm:text-3xl">{d.titulo}</dt>
              <dd className="mt-2 text-[13px] leading-snug text-ceniza sm:mt-3 sm:text-[15px] sm:leading-relaxed">{d.texto}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
