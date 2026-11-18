"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Foto } from "@/lib/contenido";
import { TRABAJOS, type Trabajo } from "@/lib/estudio";
import { useEstudio } from "./DatosEstudio";
import { useModalAbierto } from "./Efectos";
import { FotoStencil } from "./FotoStencil";
import { Ornamento } from "./Ornamento";
import { Titulo } from "./Titulo";

/** El mismo tatuaje en dos momentos: el calco violeta y el resultado. Las dos fotos se cambian desde el panel. */
function DelStencilALaPiel({ antes, despues }: { antes: Foto; despues: Foto }) {
  const [final, setFinal] = useState(false);
  const [aMano, setAMano] = useState(false);

  // Alterna solo hasta que la persona lo toque; ahí manda ella.
  useEffect(() => {
    if (aMano || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setFinal((v) => !v), 2800);
    return () => window.clearInterval(t);
  }, [aMano]);

  const elegir = (v: boolean) => {
    setAMano(true);
    setFinal(v);
  };

  return (
    <figure className="relative h-full min-h-[460px] overflow-hidden sm:min-h-[520px] rounded-3xl border border-linea bg-hollin">
      <Image
        src={antes.src}
        alt={antes.alt}
        fill
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-cover"
      />
      <motion.div className="absolute inset-0" animate={{ opacity: final ? 1 : 0 }} transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}>
        <Image
          src={despues.src}
          alt={despues.alt}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta via-tinta/70 to-transparent p-5 pt-24 sm:p-7 sm:pt-28">
        <p className="font-gotica text-4xl leading-none sm:text-5xl">Del stencil a la piel</p>
        <p className="mt-2 max-w-sm text-[15px] text-ceniza">{despues.alt}. Mismo diseño, antes y después de la sesión.</p>
        <div role="group" aria-label="Ver etapa" className="mt-5 inline-flex rounded-full border border-linea bg-tinta/70 p-1 backdrop-blur-md">
          {[
            { v: false, t: "Stencil" },
            { v: true, t: "Tatuaje" },
          ].map((o) => (
            <button
              key={o.t}
              type="button"
              aria-pressed={final === o.v}
              onClick={() => elegir(o.v)}
              className="relative min-h-10 rounded-full px-5 text-sm font-semibold"
            >
              {final === o.v && (
                <motion.span
                  layoutId="etapa"
                  className="absolute inset-0 rounded-full bg-[image:var(--acero)] shadow-[0_0_24px_-4px_rgba(47,107,255,0.9)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className={`relative ${final === o.v ? "text-tinta" : "text-ceniza"}`}>{o.t}</span>
            </button>
          ))}
        </div>
      </div>
    </figure>
  );
}

/** `trabajos` viene de la galería del panel; si todavía está vacía, quedan los de muestra. */
export function Trabajos({ trabajos = TRABAJOS, antes, despues }: { trabajos?: Trabajo[]; antes: Foto; despues: Foto }) {
  const { instagram } = useEstudio();
  const estilos = ["Todos", ...Array.from(new Set(trabajos.map((t) => t.estilo)))];
  const [filtro, setFiltro] = useState("Todos");
  const [abierto, setAbierto] = useState<Trabajo | null>(null);
  const visibles = trabajos.filter((t) => filtro === "Todos" || t.estilo === filtro);
  useModalAbierto(Boolean(abierto));

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(null);
    addEventListener("keydown", cerrar);
    return () => removeEventListener("keydown", cerrar);
  }, [abierto]);

  return (
    <section id="trabajos" aria-labelledby="titulo-trabajos" className="relative overflow-hidden">
      <Ornamento tipo="daga" className="top-24 right-[4%] hidden w-16 lg:block" />
      <Ornamento tipo="estrella" className="top-40 right-[14%] hidden w-6 lg:block" retraso={0.8} />
      <Ornamento tipo="telarana" className="bottom-0 left-0 w-32 opacity-30 sm:-bottom-6 sm:-left-6 sm:w-56" flotar={0} brillo={false} />

      <div className="relative mx-auto max-w-[1400px] px-4 pt-28 pb-24 sm:px-8 lg:pt-40 lg:pb-36">
        <Titulo id="titulo-trabajos" bajada="Lo último que salió del estudio. Toca una foto para verla en grande.">
          Trabajos
        </Titulo>

        <div className="mt-12 grid gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-5 lg:row-span-2">
            <DelStencilALaPiel antes={antes} despues={despues} />
          </div>

          <div className="lg:col-span-7">
            <div role="group" aria-label="Filtrar por estilo" className="mb-4 flex flex-wrap gap-2">
              {estilos.map((e) => {
                const activo = filtro === e;
                return (
                  <button
                    key={e}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltro(e)}
                    className={`relative min-h-10 shrink-0 rounded-full border px-4 text-sm transition-colors ${
                      activo ? "border-transparent text-tinta" : "border-linea text-ceniza hover:text-piel"
                    }`}
                  >
                    {activo && (
                      <motion.span
                        layoutId="filtro-trabajos"
                        className="absolute inset-0 rounded-full bg-[image:var(--acero)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{e}</span>
                  </button>
                );
              })}
            </div>

            <motion.ul layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
              <AnimatePresence mode="popLayout">
                {visibles.map((t, i) => (
                  <motion.li
                    key={t.src}
                    layout
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative aspect-[4/5]"
                  >
                    <button
                      type="button"
                      onClick={() => setAbierto(t)}
                      className="absolute inset-0 overflow-hidden rounded-2xl"
                      aria-label={`Ver en grande: ${t.alt}`}
                    >
                      <motion.div layoutId={`foto-${t.src}`} className="absolute inset-0">
                        <FotoStencil
                          src={t.src}
                          alt={t.alt}
                          ancho={t.ancho}
                          alto={t.alto}
                          retraso={i * 140}
                          foco={t.foco}
                          sizes="(min-width: 1024px) 20vw, 50vw"
                          className="h-full w-full transition-transform duration-700 ease-[var(--ease-salida)] group-hover:scale-[1.04]"
                        />
                      </motion.div>
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-tinta/90 to-transparent p-3 pt-12 text-left text-[13px]">
                        <span className="font-semibold text-piel">{t.estilo}</span>
                        <span className="text-ceniza">{t.zona}</span>
                      </span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>

            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-full border border-linea px-6 text-[15px] transition-[border-color,box-shadow] hover:border-stencil hover:shadow-[0_0_24px_-4px_rgba(47,107,255,0.7)]"
            >
              Ver todos los trabajos en Instagram
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {abierto && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={abierto.alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAbierto(null)}
            data-lenis-prevent
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center overscroll-contain bg-tinta/[0.94] p-4"
          >
            <motion.div
              layoutId={`foto-${abierto.src}`}
              className="relative aspect-[4/5] w-full max-w-[min(92vw,62vh)] overflow-hidden rounded-3xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(47,107,255,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={abierto.src} alt={abierto.alt} fill sizes="92vw" className="object-cover" style={{ objectPosition: abierto.foco }} />
            </motion.div>
            <div className="mt-4 flex w-full max-w-[min(92vw,62vh)] items-center justify-between text-[15px]">
              <span>
                <span className="font-semibold">{abierto.estilo}</span> <span className="text-ceniza">en {abierto.zona.toLowerCase()}</span>
              </span>
              <button type="button" onClick={() => setAbierto(null)} className="min-h-10 rounded-full border border-linea px-4 text-sm">
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
