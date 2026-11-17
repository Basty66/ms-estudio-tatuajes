"use client";

import { useEffect, useRef } from "react";
import { BotonMagnetico } from "./BotonMagnetico";
import { ANCLA_LASER } from "./Cotizador";
import { useEstudio } from "./DatosEstudio";

const DATOS = [
  { dato: "4 a 8 semanas", detalle: "entre sesiones, para que la piel se recupere" },
  { dato: "Sin cortes", detalle: "ni anestesia general. Con los cuidados, no deja cicatriz" },
  { dato: "Borrar o aclarar", detalle: "para quitarlo del todo o dejarlo listo para un cover" },
];

export function Laser() {
  const { whatsappCon } = useEstudio();
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reducir) v.play().catch(() => undefined);
      else v.pause();
    });
    o.observe(v);
    return () => o.disconnect();
  }, []);

  const evaluar = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {/* Al cotizador, ya en borrado láser: precio por sesión y cuántas sesiones. */}
        <BotonMagnetico href={`#${ANCLA_LASER}`} className="shadow-[0_0_40px_-8px_rgba(47,107,255,0.9)]">
          Cotizar el borrado
        </BotonMagnetico>
        <BotonMagnetico href={whatsappCon("Hola, quiero evaluar un tatuaje para borrado láser. Te mando una foto.")} externo variante="linea">
          Mandar una foto
        </BotonMagnetico>
      </div>
      <span className="max-w-sm text-[14px] leading-snug text-ceniza">El precio es por sesión y depende del tamaño. Con una foto te digo cuántas sesiones calculo.</span>
    </div>
  );

  return (
    <section id="laser" aria-labelledby="titulo-laser" className="relative overflow-hidden border-t border-linea/70">
      <div aria-hidden className="pointer-events-none absolute top-1/3 -left-40 h-[50vh] w-[60vw] rounded-full bg-stencil/15 blur-[120px]" />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-x-16 gap-y-10 px-4 py-24 sm:px-8 lg:grid-cols-12 lg:py-36">
        {/* Qué es, cómo cotizarlo y qué esperar */}
        <div className="lg:col-span-6">
          <h2 id="titulo-laser" className="texto-cromo font-gotica text-[clamp(3.25rem,9vw,6.5rem)] leading-[0.85]">
            Borrado láser
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-piel/85">
            Para el tatuaje que ya no va contigo, o el que quieres aclarar antes de taparlo con uno nuevo.
          </p>
          <div className="mt-8">{evaluar}</div>

          <dl className="mt-12 hidden divide-y divide-linea border-y border-linea lg:block">
            {DATOS.map((d) => (
              <div key={d.dato} className="grid grid-cols-[minmax(0,10rem)_1fr] gap-4 py-4">
                <dt className="font-semibold text-piel">{d.dato}</dt>
                <dd className="text-[14px] leading-snug text-ceniza">{d.detalle}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* La sesión real, a un tamaño en que el video se ve nítido */}
        <div className="lg:col-span-6 lg:justify-self-end">
          <figure className="relative overflow-hidden rounded-3xl border border-linea shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),0_0_60px_-30px_rgba(47,107,255,0.8)] lg:max-w-[560px]">
            <video
              ref={video}
              muted
              loop
              playsInline
              preload="metadata"
              poster="/videos/laser.jpg"
              className="aspect-[16/10] w-full object-cover"
              aria-label="Sesión de borrado láser en el estudio"
            >
              <source src="/videos/laser.webm" type="video/webm" />
              <source src="/videos/laser.mp4" type="video/mp4" />
            </video>
            <div aria-hidden className="laser-barrido absolute inset-y-0 w-1/3" />
            <figcaption className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-tinta/75 px-3 py-1.5 text-[12px] lg:bg-tinta/60 lg:backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stencil shadow-[0_0_8px_2px_rgba(47,107,255,0.9)]" />
              Sesión real en el estudio
            </figcaption>
          </figure>
          <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-ceniza">
            <span className="font-semibold text-piel">Cómo funciona: </span>
            cada pulso rompe la tinta en partículas tan chicas que el cuerpo las elimina solo. Por eso el tatuaje se aclara de a poco, sesión a sesión.
          </p>
        </div>

        {/* En el teléfono, los datos van después del video */}
        <dl className="grid gap-2 sm:grid-cols-3 lg:hidden">
          {DATOS.map((d) => (
            <div key={d.dato} className="flex items-baseline justify-between gap-4 rounded-2xl border border-linea bg-hollin/60 px-4 py-3 sm:block">
              <dt className="shrink-0 font-semibold text-piel">{d.dato}</dt>
              <dd className="text-right text-[13px] leading-snug text-ceniza sm:mt-1 sm:text-left">{d.detalle}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
