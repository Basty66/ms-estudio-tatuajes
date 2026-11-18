"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";

let modalesAbiertos = 0;

/**
 * Mientras un modal está abierto, la página de atrás se queda quieta: sin
 * scroll y con Lenis detenido. El modal lleva `data-lenis-prevent`: Lenis
 * bloquea la rueda en todo lo demás, y sin eso la rueda movía la página de
 * atrás en vez del modal.
 *
 * Los modales van sin backdrop-filter: con el fondo al 94 % casi no se nota,
 * y medido con el calendario abierto subía cada cuadro de 17 a 64 ms.
 */
export function useModalAbierto(activo = true) {
  useEffect(() => {
    if (!activo) return;
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    const antes = document.body.style.overflow;
    modalesAbiertos++;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      modalesAbiertos--;
      if (modalesAbiertos > 0) return;
      document.body.style.overflow = antes;
      lenis?.start();
    };
  }, [activo]);
}

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
