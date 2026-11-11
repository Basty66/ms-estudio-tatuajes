"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * El nombre del estudio pasando por las dos etapas de un tatuaje: primero el
 * calco violeta del stencil se dibuja trazo a trazo, después la "aguja" lo
 * repasa de izquierda a derecha y queda en cromo, con un brillo que lo barre
 * cada tanto.
 *
 * La caja del SVG se mide con getBBox() recién cuando la fuente cargó: medida
 * con la letra de respaldo, la palabra quedaría cortada o con aire de sobra.
 */
export function NombreCromo({
  texto = "Matness",
  className = "",
  animar = true,
  retraso = 0,
}: {
  texto?: string;
  className?: string;
  animar?: boolean;
  /** Segundos que espera antes de empezar el calco. */
  retraso?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const medida = useRef<SVGTextElement>(null);
  const [caja, setCaja] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    let vivo = true;
    const el = medida.current;
    if (!el) return;
    const familia = getComputedStyle(el).fontFamily;

    document.fonts
      .load(`400 200px ${familia}`)
      .catch(() => undefined)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!vivo || !medida.current) return;
        // getBBox() devuelve la caja de la fuente (ascendente + descendente),
        // no la tinta: deja aire de sobra abajo. El canvas sí mide la tinta.
        const ctx = document.createElement("canvas").getContext("2d");
        if (!ctx) return;
        ctx.font = `400 200px ${familia}`;
        const t = ctx.measureText(texto);
        const m = 6;
        setCaja({
          x: -t.actualBoundingBoxLeft - m,
          y: -t.actualBoundingBoxAscent - m,
          w: t.actualBoundingBoxLeft + t.actualBoundingBoxRight + m * 2,
          h: t.actualBoundingBoxAscent + t.actualBoundingBoxDescent + m * 2,
        });
      });

    return () => {
      vivo = false;
    };
  }, [texto]);

  const vista = caja ? `${caja.x} ${caja.y} ${caja.w} ${caja.h}` : "0 -180 760 230";
  const comun = {
    x: 0,
    y: 0,
    fontSize: 200,
    fontWeight: 400,
    className: "font-gotica",
  } as const;

  return (
    <svg
      viewBox={vista}
      className={`nombre-cromo ${className}`}
      data-listo={caja ? "si" : "no"}
      data-animar={animar ? "si" : "no"}
      role="img"
      aria-label={texto}
      style={{ ["--ancho" as string]: caja?.w ?? 760, ["--nh-retraso" as string]: `${retraso}s` }}
    >
      <defs>
        <linearGradient id={`cromo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.2" stopColor="#d7dae1" />
          <stop offset="0.42" stopColor="#7f838d" />
          <stop offset="0.5" stopColor="#24262c" />
          <stop offset="0.53" stopColor="#f5f6f8" />
          <stop offset="0.7" stopColor="#a4a8b1" />
          <stop offset="0.88" stopColor="#e9ebee" />
          <stop offset="1" stopColor="#8fb0ff" />
        </linearGradient>
        <linearGradient id={`brillo-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`letras-${id}`}>
          <text {...comun}>{texto}</text>
        </clipPath>
        <filter id={`resplandor-${id}`} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Solo para medir: invisible, pero con la misma letra. */}
      <text ref={medida} {...comun} fill="none" opacity="0">
        {texto}
      </text>

      <text {...comun} className={`${comun.className} nc-trazo`} fill="none" stroke="#5b86ff" strokeWidth="1.4">
        {texto}
      </text>

      <text {...comun} className={`${comun.className} nc-tinta`} fill={`url(#cromo-${id})`}>
        {texto}
      </text>

      {caja && (
        <>
          <g clipPath={`url(#letras-${id})`}>
            <rect
              className="nc-brillo"
              x={caja.x - caja.w * 0.3}
              y={caja.y}
              width={caja.w * 0.3}
              height={caja.h}
              fill={`url(#brillo-${id})`}
            />
          </g>
          <g className="nc-aguja">
            <rect x={caja.x} y={caja.y} width="5" height={caja.h} fill="#2f6bff" filter={`url(#resplandor-${id})`} />
            <rect x={caja.x + 1.5} y={caja.y} width="2" height={caja.h} fill="#ffffff" />
          </g>
        </>
      )}
    </svg>
  );
}
