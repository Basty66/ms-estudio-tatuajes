"use client";

import { Children, useEffect, useRef, useState } from "react";

/**
 * En el teléfono, una fila que se desliza de lado con imán (scroll-snap) y
 * puntos que dicen en cuál vas: se recorre con el pulgar en vez de bajar
 * una pantalla entera por cada tarjeta. En escritorio, la grilla que diga
 * `className` (los puntos se esconden).
 *
 * El scroll es el nativo del navegador, el más fluido que hay; acá solo se
 * mide cuál tarjeta quedó al centro, una vez por cuadro.
 */
export function Carrusel({ children, etiqueta, className = "" }: { children: React.ReactNode; etiqueta: string; className?: string }) {
  const fila = useRef<HTMLOListElement>(null);
  const total = Children.count(children);
  const [activa, setActiva] = useState(0);

  useEffect(() => {
    const el = fila.current;
    if (!el) return;
    let cuadro = 0;
    const medir = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const centro = el.scrollLeft + el.clientWidth / 2;
        let mejor = 0;
        let distancia = Infinity;
        Array.from(el.children).forEach((h, i) => {
          const hijo = h as HTMLElement;
          const d = Math.abs(hijo.offsetLeft + hijo.offsetWidth / 2 - centro);
          if (d < distancia) {
            distancia = d;
            mejor = i;
          }
        });
        setActiva(mejor);
      });
    };
    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      el.removeEventListener("scroll", medir);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  const ir = (i: number) => {
    const el = fila.current;
    const hijo = el?.children[i] as HTMLElement | undefined;
    if (!el || !hijo) return;
    el.scrollTo({ left: hijo.offsetLeft - (el.clientWidth - hijo.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <>
      <ol
        ref={fila}
        aria-label={etiqueta}
        className={`relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </ol>
      <div className="mt-5 flex justify-center gap-1.5 lg:hidden">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir a ${i + 1} de ${total}`}
            aria-current={i === activa}
            onClick={() => ir(i)}
            className="grid h-6 w-6 place-items-center"
          >
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activa ? "w-5 bg-stencil shadow-[0_0_10px_2px_rgba(47,107,255,0.8)]" : "w-1.5 bg-ceniza/40"
              }`}
            />
          </button>
        ))}
      </div>
    </>
  );
}
