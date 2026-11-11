"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Una foto de un trabajo que aparece primero como el calco violeta y después
 * se "tatúa": la foto real baja de arriba abajo detrás de una línea de luz,
 * como la pasada de la aguja.
 *
 * - modo "carga": se tatúa sola al cargar (el hero), tras `retraso` ms.
 * - modo "vista": se tatúa cada vez que entra en pantalla (al salir vuelve
 *   a ser calco, sin que se vea). En escritorio, pasar el cursor vuelve a
 *   mostrar el calco, para ver cómo partió.
 */
export function FotoStencil({
  src,
  alt,
  ancho,
  alto,
  modo = "vista",
  retraso = 0,
  prioridad = false,
  sizes = "(min-width: 1024px) 40vw, 100vw",
  foco = "50% 50%",
  className = "",
}: {
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  modo?: "carga" | "vista";
  retraso?: number;
  prioridad?: boolean;
  sizes?: string;
  foco?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tatuada, setTatuada] = useState(false);
  const [quieta, setQuieta] = useState(false);
  const [calcoAMano, setCalcoAMano] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (modo === "carga") {
      const t = window.setTimeout(() => setTatuada(true), retraso);
      return () => window.clearTimeout(t);
    }

    let espera = 0;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        window.clearTimeout(espera);
        if (entrada.isIntersecting) {
          espera = window.setTimeout(() => setTatuada(true), retraso);
        } else {
          setTatuada(false);
          setQuieta(false);
        }
      },
      { threshold: 0.35 },
    );
    observador.observe(el);
    return () => {
      window.clearTimeout(espera);
      observador.disconnect();
    };
  }, [modo, retraso]);

  // Cuando termina la pasada, la línea de luz se apaga.
  useEffect(() => {
    if (!tatuada) return;
    const t = window.setTimeout(() => setQuieta(true), 1600);
    return () => window.clearTimeout(t);
  }, [tatuada]);

  const estado = tatuada && !calcoAMano ? "tinta" : "stencil";

  return (
    <div
      ref={ref}
      className={`foto-stencil relative overflow-hidden bg-hollin ${className}`}
      data-estado={estado}
      data-quieta={quieta ? "si" : "no"}
      onPointerEnter={(e) => e.pointerType === "mouse" && tatuada && setCalcoAMano(true)}
      onPointerLeave={() => setCalcoAMano(false)}
      data-cursor="ver"
    >
      <Image
        src={src}
        alt=""
        aria-hidden
        width={ancho}
        height={alto}
        sizes={sizes}
        priority={prioridad}
        className="fs-calco absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: foco }}
      />
      <div className="fs-tinte pointer-events-none absolute inset-0" />
      <div className="fs-real absolute inset-0">
        <Image
          src={src}
          alt={alt}
          width={ancho}
          height={alto}
          sizes={sizes}
          priority={prioridad}
          className="h-full w-full object-cover"
          style={{ objectPosition: foco }}
        />
      </div>
      <div className="fs-aguja pointer-events-none absolute inset-x-0 h-px bg-white shadow-[0_0_18px_4px_rgba(47,107,255,0.95)]" />
    </div>
  );
}
