"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { TextosCuidados } from "@/lib/contenido";
import { ESTUDIO } from "@/lib/estudio";
import { Ornamento } from "./Ornamento";
import { Titulo } from "./Titulo";
import { IconoWhatsapp } from "./WhatsappFlotante";

/** Todos los cuidados en texto, para guardarlos en el WhatsApp propio. */
function enTexto({ etapas, evitar, alertas }: TextosCuidados): string {
  return [
    `Cuidados de mi tatuaje · ${ESTUDIO.nombre}`,
    ...etapas.flatMap((c) => ["", `${c.cuando}:`, ...c.pasos.map((p) => `• ${p}`)]),
    "",
    "Evitar hasta que sane:",
    ...evitar.map((e) => `• ${e}`),
    "",
    "Escribir de inmediato si hay:",
    ...alertas.map((a) => `• ${a}`),
  ].join("\n");
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="mt-1 size-4 shrink-0 text-stencil-claro" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

/**
 * La cicatrización como un recorrido de cuatro etapas: se toca la etapa (o se
 * desliza el panel en el teléfono) y la línea se "cura" de azul a piel hasta
 * ahí. Una pantalla en vez de tres, y lo de evitar y las alertas siempre a la
 * vista al lado.
 */
export function Cuidados({ cuidados }: { cuidados: TextosCuidados }) {
  const { etapas, evitar, alertas } = cuidados;
  const [etapa, setEtapa] = useState(0);
  const actual = etapas[etapa];
  const ultima = etapas.length - 1;
  const ir = (i: number) => setEtapa(Math.max(0, Math.min(ultima, i)));

  return (
    <section id="cuidados" aria-labelledby="titulo-cuidados" className="relative overflow-hidden border-t border-linea/70 bg-hollin/40">
      <Ornamento tipo="corazon" className="top-24 left-[44%] hidden w-36 lg:block" flotar={14} />
      <div className="relative mx-auto max-w-[1400px] px-4 py-24 sm:px-8 lg:py-36">
        <Titulo id="titulo-cuidados" bajada="Lo que hagas el primer mes decide cómo se va a ver tu tatuaje los próximos veinte años.">
          Cuidados
        </Titulo>

        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            {/* Recorrido: cuatro puntos sobre una línea que se va curando. */}
            <div role="tablist" aria-label="Etapas de la cicatrización" className="relative grid grid-cols-4">
              <div aria-hidden className="absolute top-[15px] right-[12.5%] left-[12.5%] h-0.5 rounded-full bg-linea">
                <motion.div
                  className="h-full origin-left rounded-full bg-gradient-to-r from-stencil via-stencil-claro to-piel shadow-[0_0_10px_1px_rgba(47,107,255,0.7)]"
                  animate={{ scaleX: etapa / ultima }}
                  transition={{ type: "spring", stiffness: 180, damping: 26 }}
                />
              </div>
              {etapas.map((c, i) => {
                const elegida = i === etapa;
                return (
                  <button
                    key={c.cuando}
                    type="button"
                    role="tab"
                    id={`cuidado-${i}`}
                    aria-selected={elegida}
                    aria-controls="cuidado-panel"
                    onClick={() => ir(i)}
                    className="relative flex min-h-16 flex-col items-center gap-2 text-center"
                  >
                    <span
                      className={`grid size-[32px] place-items-center rounded-full border-2 text-[13px] font-semibold tabular-nums transition-all duration-300 ${
                        i <= etapa ? "border-stencil bg-stencil text-piel shadow-[0_0_16px_2px_rgba(47,107,255,0.7)]" : "border-linea bg-tinta text-ceniza"
                      } ${elegida ? "scale-110" : ""}`}
                    >
                      {i + 1}
                    </span>
                    <span className={`text-[12px] leading-tight font-semibold transition-colors sm:text-[14px] ${elegida ? "text-piel" : "text-ceniza"}`}>{c.corto}</span>
                  </button>
                );
              })}
            </div>

            <div id="cuidado-panel" role="tabpanel" aria-labelledby={`cuidado-${etapa}`} className="mt-5 overflow-hidden rounded-3xl border border-linea bg-tinta/70">
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) ir(etapa + 1);
                  else if (info.offset.x > 60) ir(etapa - 1);
                }}
                className="min-h-[300px] cursor-grab touch-pan-y p-5 active:cursor-grabbing sm:min-h-[280px] sm:p-8"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={etapa} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
                    <p className="text-[12px] font-semibold tracking-[0.18em] text-stencil-claro uppercase">
                      Etapa {etapa + 1} de {etapas.length}
                    </p>
                    <h3 className="mt-2 font-gotica text-[2.6rem] leading-none sm:text-5xl">{actual.cuando}</h3>
                    <ul className="mt-5 space-y-3">
                      {actual.pasos.map((p) => (
                        <li key={p} className="flex gap-3 text-[16px] leading-relaxed text-piel/85 sm:text-[17px]">
                          <Check />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              <div className="flex items-center justify-between gap-3 border-t border-linea px-3 py-2 sm:px-5">
                <button
                  type="button"
                  onClick={() => ir(etapa - 1)}
                  disabled={etapa === 0}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-ceniza transition-colors hover:text-piel disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M15 5l-7 7 7 7" />
                  </svg>
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => ir(etapa === ultima ? 0 : etapa + 1)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-stencil-claro transition-colors hover:text-piel"
                >
                  {etapa === ultima ? "Volver al día 1" : "Siguiente etapa"}
                  {etapa !== ultima && <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            <div className="rounded-3xl border border-linea bg-tinta p-5 sm:p-7">
              <h3 className="text-lg font-semibold">Evita hasta que sane</h3>
              <ul className="mt-4 space-y-2.5 text-[15px] text-ceniza">
                {evitar.map((e) => (
                  <li key={e} className="flex gap-3">
                    <span aria-hidden className="mt-[10px] h-px w-3 shrink-0 bg-ceniza" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-sangre/40 bg-sangre/[0.06] p-5 sm:p-7">
              <h3 className="text-lg font-semibold text-piel">Escríbeme de inmediato si ves</h3>
              <ul className="mt-4 space-y-2.5 text-[15px] text-piel/80">
                {alertas.map((a) => (
                  <li key={a} className="flex gap-3">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sangre" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            {/* wa.me sin número abre la lista de chats: se lo manda uno mismo y queda guardado. */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(enTexto(cuidados))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center justify-center gap-3 rounded-full border border-linea px-6 text-[15px] font-semibold transition-[border-color,box-shadow] hover:border-stencil hover:shadow-[0_0_24px_-4px_rgba(47,107,255,0.7)] sm:col-span-2 lg:col-span-1"
            >
              <IconoWhatsapp className="size-5 text-[#25d366]" />
              Guardar los cuidados en mi WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
