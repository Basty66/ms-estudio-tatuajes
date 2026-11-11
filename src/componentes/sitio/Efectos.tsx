"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";

/**
 * Scroll suave y cursor de aguja. Los dos se apagan solos con "reducir
 * movimiento", y el cursor solo existe con mouse: en el teléfono no hay
 * cursor que reemplazar.
 */
export function Efectos() {
  const punto = useRef<HTMLDivElement>(null);
  const aro = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // En pantallas táctiles el scroll nativo es el más fluido que hay: Lenis
    // solo se usa con mouse o trackpad.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!matchMedia("(pointer: fine)").matches) return;

    const lenis = new Lenis({ lerp: 0.11, anchors: { offset: -72 } });
    // El menú del teléfono lo detiene mientras está abierto.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    let cuadro = requestAnimationFrame(function paso(t) {
      lenis.raf(t);
      cuadro = requestAnimationFrame(paso);
    });

    return () => {
      cancelAnimationFrame(cuadro);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const conMouse = matchMedia("(pointer: fine)").matches;
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!conMouse || quieto || !punto.current || !aro.current) return;

    document.documentElement.classList.add("con-cursor");
    const p = punto.current;
    const a = aro.current;
    let x = -100;
    let y = -100;
    let ax = x;
    let ay = y;
    let cuadro = 0;

    const mover = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      p.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const sobre = (e.target as Element | null)?.closest?.("[data-cursor], a, button");
      a.dataset.modo = sobre?.getAttribute("data-cursor") ?? (sobre ? "accion" : "");
    };

    const seguir = () => {
      ax += (x - ax) * 0.18;
      ay += (y - ay) * 0.18;
      a.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
      cuadro = requestAnimationFrame(seguir);
    };

    window.addEventListener("pointermove", mover, { passive: true });
    cuadro = requestAnimationFrame(seguir);
    return () => {
      document.documentElement.classList.remove("con-cursor");
      window.removeEventListener("pointermove", mover);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  return (
    <>
      <div ref={aro} className="cursor-aro" aria-hidden>
        <span>Ver</span>
      </div>
      <div ref={punto} className="cursor-punto" aria-hidden />
    </>
  );
}
