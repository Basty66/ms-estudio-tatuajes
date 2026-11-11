"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ESTUDIO } from "@/lib/estudio";
import { BotonMagnetico } from "./BotonMagnetico";
import { MuroTatuajes, type Pieza } from "./MuroTatuajes";
import { NombreCromo } from "./NombreCromo";
import { NombreHero } from "./NombreHero";

const PARED: Pieza[] = [
  ...Array.from({ length: 14 }, (_, i) => ({
    tipo: "foto" as const,
    src: `/trabajos/pared-${String(i + 1).padStart(2, "0")}.jpg`,
    alt: "",
  })),
  { tipo: "foto", src: "/images/tatuaje3.jpg", alt: "" },
  { tipo: "foto", src: "/images/tatuaje2.jpg", alt: "" },
  { tipo: "foto", src: "/images/tatuaje1.jpg", alt: "" },
];

/**
 * El hero muestra el trabajo real en movimiento:
 * - En el teléfono, el proceso en video a pantalla completa (9:16 calza
 *   justo con la pantalla): máquina, aguja, stencil, resultado.
 * - En escritorio, la pared 3D de trabajos corriendo, con el mismo video en
 *   una tarjeta tipo reel.
 * Encima, el nombre en metal líquido. Al bajar, todo se acerca y se apaga
 * como un plano de cine, solo con transform y opacity.
 */
export function Hero() {
  const escena = useRef<HTMLElement>(null);
  const videos = useRef<HTMLVideoElement[]>([]);
  const [quieto, setQuieto] = useState(false);

  const { scrollYProgress } = useScroll({ target: escena, offset: ["start start", "end start"] });
  const escala = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const subida = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);
  const opacidad = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const fondo = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  // Videos: no se reproducen con "reducir movimiento" (queda el póster) y se
  // pausan fuera de pantalla para no gastar batería.
  useEffect(() => {
    const el = escena.current;
    if (!el) return;
    const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const o = new IntersectionObserver(([e]) => {
      setQuieto(reducir);
      for (const v of videos.current) {
        if (e.isIntersecting && !reducir) v.play().catch(() => undefined);
        else v.pause();
      }
    });
    o.observe(el);
    return () => o.disconnect();
  }, []);

  const guardarVideo = (v: HTMLVideoElement | null) => {
    if (v && !videos.current.includes(v)) videos.current.push(v);
  };

  const fuentes = (
    <>
      <source src="/videos/hero-proceso.webm" type="video/webm" />
      <source src="/videos/hero-proceso.mp4" type="video/mp4" />
    </>
  );

  return (
    <section
      id="inicio"
      ref={escena}
      aria-label="Matness, estudio de tatuajes en Melipilla"
      className="relative isolate flex min-h-[640px] flex-col overflow-hidden"
      style={{ height: "100svh" }}
    >
      {/* ---------- Fondo ---------- */}
      <motion.div aria-hidden style={{ scale: fondo }} className="absolute inset-0 -z-10">
        {/* Teléfono: el proceso en video. */}
        <video
          ref={guardarVideo}
          muted
          loop
          playsInline
          autoPlay={!quieto}
          preload="auto"
          poster="/videos/hero-proceso.jpg"
          className="absolute inset-0 h-full w-full object-cover lg:hidden"
        >
          {fuentes}
        </video>
        {/* Escritorio: la pared de trabajos. */}
        <div className="absolute inset-0 hidden lg:block">
          <MuroTatuajes piezas={PARED} columnas={6} />
        </div>
        {/* Viñeta: oscurece el centro y los bordes para que el nombre y el texto se lean siempre. */}
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_45%,rgba(7,8,13,0.55),rgba(7,8,13,0.2)_60%,transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-tinta/80 via-tinta/10 to-tinta" />
        {/* El tinte por mezcla de color sobre un video se recalcula en cada cuadro:
            en el teléfono va como capa normal, que la GPU compone sin costo. */}
        <div className="absolute inset-0 bg-stencil/[0.07] lg:bg-stencil/10 lg:mix-blend-color" />
      </motion.div>

      {/* ---------- Nombre ---------- */}
      <motion.div
        style={{ scale: escala, y: subida, opacity: opacidad }}
        className="flex flex-1 flex-col items-center justify-center px-4 pt-20 will-change-transform lg:pt-28"
      >
        <h1 className="sr-only">Matness Studio, estudio de tatuajes en {ESTUDIO.comuna}</h1>
        <div className="flex w-full max-w-[min(1180px,100%)] flex-col items-center">
          <NombreHero className="w-full drop-shadow-[0_24px_50px_rgba(0,0,0,0.85)]" />
          {/* "Studio" va en cromo SVG: el mismo estilo sin un segundo motor WebGL. */}
          <NombreCromo
            texto="Studio"
            retraso={0.9}
            className="mt-[2.4%] w-[28%] lg:-mt-[0.5%] drop-shadow-[0_16px_34px_rgba(0,0,0,0.85)]"
          />
        </div>
      </motion.div>

      {/* ---------- Texto y acciones ---------- */}
      <motion.div style={{ opacity: opacidad }} className="mx-auto w-full max-w-[1400px] px-4 pb-6 sm:px-8">
        <div className="grid gap-6 pb-8 lg:grid-cols-12 lg:items-end">
          <p className="text-lg leading-relaxed text-piel/90 [text-shadow:0_2px_20px_rgba(0,0,0,0.8)] sm:text-xl lg:col-span-5">
            Lettering, fineline y blackwork. Cotiza tu idea en un minuto y reserva tu hora sin esperar respuesta.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:col-start-6 lg:justify-start">
            <BotonMagnetico href="#cotiza" className="shadow-[0_0_40px_-6px_rgba(47,107,255,0.9)]">
              Cotizar y pedir hora
            </BotonMagnetico>
            <BotonMagnetico href="#trabajos" variante="linea" className="bg-tinta/55 lg:bg-tinta/40 lg:backdrop-blur-md">
              Ver trabajos
            </BotonMagnetico>
          </div>

          {/* Escritorio: el reel del proceso en una tarjeta. */}
          <div className="hidden justify-end lg:col-span-3 lg:flex lg:pr-20">
            <figure className="relative w-[168px] overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(47,107,255,0.7)]">
              <video
                ref={guardarVideo}
                muted
                loop
                playsInline
                autoPlay={!quieto}
                preload="metadata"
                poster="/videos/hero-proceso.jpg"
                className="aspect-[9/16] w-full object-cover"
              >
                {fuentes}
              </video>
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta/90 to-transparent p-3 pt-10 text-[12px] leading-tight text-piel">
                Del stencil a la piel, en 12 segundos
              </figcaption>
            </figure>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-white/15 pt-4 pr-[72px] text-[13px] text-piel/70 lg:pr-20">
          <span>
            {ESTUDIO.direccion}, {ESTUDIO.comuna}
          </span>
          <a
            href={`https://instagram.com/${ESTUDIO.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-piel"
          >
            @{ESTUDIO.instagram}
          </a>
        </div>
      </motion.div>
    </section>
  );
}
