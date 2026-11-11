"use client";

import { useEffect, useRef } from "react";
import { enlaceWhatsapp } from "@/lib/estudio";
import { BotonMagnetico } from "./BotonMagnetico";
import { Indice } from "./Indice";

const DATOS = [
  { dato: "4 a 8 semanas", detalle: "entre sesiones, para que la piel se recupere" },
  { dato: "Sin cortes", detalle: "ni anestesia general. Con los cuidados, no deja cicatriz" },
  { dato: "Borrar o aclarar", detalle: "para quitarlo del todo o dejarlo listo para un cover" },
];

/** Partículas de tinta: posición inicial y hacia dónde se dispersan. */
const PARTICULAS = [
  [150, 128, -26, -10], [158, 122, -8, -24], [166, 126, 14, -20], [174, 132, 28, -6],
  [146, 138, -30, 8], [156, 136, -12, 4], [166, 140, 6, 12], [176, 142, 24, 16],
  [152, 148, -20, 24], [162, 150, -2, 28], [172, 150, 18, 26], [160, 130, 2, -4],
];

/**
 * Cómo funciona, en un dibujo que se mueve: un pulso de láser entra en la
 * piel, rompe el bloque de tinta en partículas y estas se dispersan y se
 * desvanecen, que es lo que hace el cuerpo entre sesión y sesión.
 * Todo es CSS (transform y opacity) y se repite cada 4,5 segundos.
 */
function Diagrama() {
  return (
    <svg viewBox="0 0 320 210" className="w-full" role="img" aria-label="El láser rompe la tinta en partículas que el cuerpo elimina">
      <defs>
        <linearGradient id="haz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f6bff" stopOpacity="0" />
          <stop offset="0.6" stopColor="#8aa8ff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id="destello">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#8aa8ff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#2f6bff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Capas de la piel */}
      <rect x="10" y="70" width="300" height="22" rx="4" fill="rgb(239 232 226 / 0.10)" />
      <rect x="10" y="92" width="300" height="100" rx="4" fill="rgb(239 232 226 / 0.05)" />
      <path d="M10 70 H310 M10 92 H310" stroke="rgb(239 232 226 / 0.25)" strokeDasharray="3 5" />
      <text x="16" y="85" className="fill-ceniza text-[9px]">Piel</text>
      <text x="16" y="186" className="fill-ceniza text-[9px]">Dermis, donde vive la tinta</text>

      {/* Cabezal y haz */}
      <rect x="148" y="6" width="24" height="30" rx="6" fill="#151a25" stroke="#2f6bff" />
      <rect x="156" y="36" width="8" height="6" rx="2" fill="#2f6bff" />
      <rect className="laser-haz" x="157" y="42" width="6" height="92" fill="url(#haz)" />
      <circle className="laser-destello" cx="160" cy="136" r="26" fill="url(#destello)" />

      {/* Tinta */}
      {PARTICULAS.map(([x, y, dx, dy], i) => (
        <circle
          key={i}
          className="laser-tinta"
          cx={x}
          cy={y}
          r="5.5"
          fill="#0b0d14"
          stroke="#2f6bff"
          strokeOpacity="0.5"
          style={{ ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px` }}
        />
      ))}

      <text x="186" y="24" className="fill-piel text-[10px] font-semibold">Pulso láser</text>
      <text x="206" y="134" className="laser-etiqueta fill-stencil-claro text-[10px]">La tinta se rompe</text>
    </svg>
  );
}

export function Laser() {
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
      <BotonMagnetico
        href={enlaceWhatsapp("Hola, quiero evaluar un tatuaje para borrado láser. Te mando una foto.")}
        externo
        className="shadow-[0_0_40px_-8px_rgba(47,107,255,0.9)]"
      >
        Evaluar mi tatuaje
      </BotonMagnetico>
      <span className="max-w-xs text-[14px] leading-snug text-ceniza">
        Mándame una foto por WhatsApp y te digo cuántas sesiones calculo.
      </span>
    </div>
  );

  return (
    <section id="laser" aria-labelledby="titulo-laser" className="relative overflow-hidden border-t border-linea/70">
      <div aria-hidden className="pointer-events-none absolute top-1/3 -left-40 h-[50vh] w-[60vw] rounded-full bg-stencil/15 blur-[120px]" />
      <div className="relative mx-auto grid max-w-[1400px] gap-x-10 gap-y-8 px-4 py-24 sm:px-8 lg:grid-cols-12 lg:gap-y-12 lg:py-36">
        {/* Fila 1: qué es y qué esperar */}
        <div className="lg:col-span-7">
          <Indice id="laser" className="mb-4 lg:mb-6" />
          <h2 id="titulo-laser" className="texto-cromo font-gotica text-[clamp(3.25rem,9vw,6.5rem)] leading-[0.85]">
            Borrado láser
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-piel/85">
            Para el tatuaje que ya no va contigo, o el que quieres aclarar antes de taparlo con uno nuevo.
          </p>
          <div className="mt-8">{evaluar}</div>
        </div>

        <dl className="order-last grid gap-2 sm:grid-cols-3 lg:order-none lg:col-span-4 lg:col-start-9 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-linea lg:self-end lg:border-y lg:border-linea">
          {DATOS.map((d) => (
            <div
              key={d.dato}
              className="flex items-baseline justify-between gap-4 rounded-2xl border border-linea bg-hollin/60 px-4 py-3 sm:block lg:grid lg:grid-cols-[minmax(0,9.5rem)_1fr] lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-4"
            >
              <dt className="shrink-0 font-semibold text-piel">{d.dato}</dt>
              <dd className="text-right text-[13px] leading-snug text-ceniza sm:mt-1 sm:text-left lg:mt-0 lg:text-[14px]">{d.detalle}</dd>
            </div>
          ))}
        </dl>

        {/* Fila 2: la sesión real y cómo funciona, a la misma altura */}
        <figure className="relative overflow-hidden rounded-3xl border border-linea shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),0_0_60px_-30px_rgba(47,107,255,0.8)] lg:col-span-7">
          <video
            ref={video}
            muted
            loop
            playsInline
            preload="metadata"
            poster="/videos/laser.jpg"
            className="aspect-[16/10] h-full w-full object-cover"
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

        <div className="flex flex-col justify-between rounded-3xl border border-linea bg-hollin/70 p-5 sm:p-7 lg:col-span-5">
          <p className="text-[15px] font-semibold">Cómo funciona</p>
          <div className="mx-auto my-4 w-full max-w-[400px]">
            <Diagrama />
          </div>
          <p className="text-[14px] leading-relaxed text-ceniza">
            Cada pulso rompe la tinta en partículas tan chicas que el cuerpo las elimina solo. Por eso el tatuaje se aclara
            de a poco, sesión a sesión.
          </p>
        </div>

      </div>
    </section>
  );
}
