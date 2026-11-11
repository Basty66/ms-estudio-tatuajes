"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type Pieza = { tipo: "foto" | "video"; src: string; poster?: string; alt: string };

/**
 * La pared del estudio: trabajos reales en columnas que corren sin fin, en
 * un plano inclinado en 3D. Columnas pares suben, impares bajan.
 *
 * Cada columna repite su lista dos veces y se desplaza exactamente la mitad,
 * así el salto del final calza con el inicio y no se nota. Es una animación
 * CSS de transform: la mueve la GPU y no depende de JavaScript, por eso
 * aguanta 120 Hz incluso en un teléfono.
 *
 * Fuera de pantalla se pausa; con "reducir movimiento" queda quieta.
 */
export function MuroTatuajes({ piezas, columnas = 5 }: { piezas: Pieza[]; columnas?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [enPantalla, setEnPantalla] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting));
    o.observe(el);
    return () => o.disconnect();
  }, []);

  // Reparte las piezas rotando el punto de partida en cada columna, para que
  // dos columnas vecinas no muestren la misma foto a la misma altura.
  const filas = Math.max(4, Math.ceil(piezas.length / 2));
  const grupos = Array.from({ length: columnas }, (_, c) =>
    Array.from({ length: filas }, (_, f) => piezas[(c * 3 + f) % piezas.length]),
  );

  return (
    <div ref={ref} className="muro" data-pausa={enPantalla ? "no" : "si"} aria-hidden>
      <div className="muro-plano" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
        {grupos.map((grupo, c) => (
          <div
            key={c}
            className="muro-columna"
            data-sentido={c % 2 ? "baja" : "sube"}
            style={{ animationDuration: `${46 + (c % 3) * 9}s` }}
          >
            {[...grupo, ...grupo].map((p, i) => (
              <figure key={i} className="muro-pieza">
                {p.tipo === "video" ? (
                  <video
                    src={p.src}
                    poster={p.poster}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image src={p.src} alt="" fill sizes="(min-width: 1024px) 20vw, 34vw" className="object-cover" />
                )}
              </figure>
            ))}
          </div>
        ))}
      </div>
      <div className="muro-aguja" />
    </div>
  );
}
