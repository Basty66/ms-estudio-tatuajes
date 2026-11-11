"use client";

import { useRef } from "react";

/**
 * Botón que se deja atraer un poco por el cursor. Con el dedo no pasa nada:
 * el efecto solo responde a un mouse.
 */
export function BotonMagnetico({
  href,
  children,
  variante = "cromo",
  className = "",
  externo = false,
  alTocar,
}: {
  href: string;
  children: React.ReactNode;
  variante?: "cromo" | "linea";
  className?: string;
  externo?: boolean;
  alTocar?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const mover = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * 0.25;
    const dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
    ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const soltar = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const estilos =
    variante === "cromo"
      ? "boton-cromo bg-[image:var(--acero)] text-tinta shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-10px_rgba(47,107,255,0.75)]"
      : "border border-linea text-piel hover:border-stencil hover:shadow-[0_0_24px_-4px_rgba(47,107,255,0.7)]";

  return (
    <a
      ref={ref}
      href={href}
      onPointerMove={mover}
      onPointerLeave={soltar}
      onClick={alTocar}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-7 text-[15px] font-semibold transition-[transform,border-color] duration-300 ease-[var(--ease-salida)] ${estilos} ${className}`}
    >
      {children}
    </a>
  );
}
