"use client";

import { LiquidMetal } from "@paper-design/shaders-react";
import { useEffect, useRef, useState } from "react";

/**
 * El nombre del hero en tres tiempos, como un tatuaje:
 *   1. el calco violeta se dibuja trazo a trazo (SVG),
 *   2. la aguja lo repasa de izquierda a derecha,
 *   3. lo que queda detrás de la aguja es metal líquido (WebGL, Paper Shaders).
 *
 * El shader necesita la forma de las letras como imagen: se dibuja el texto en
 * un canvas con la fuente ya cargada y se recorta a la tinta real. El SVG usa
 * exactamente la misma caja, así el calco y el metal calzan.
 *
 * Sin WebGL2 queda el cromo fijo del SVG. Con "reducir movimiento", el metal
 * se queda quieto.
 */
const TAM = 200;
const MARGEN = 6;
const PESO = 400;

type Caja = { x: number; y: number; w: number; h: number };

export function NombreHero({
  texto = "Matness",
  className = "",
  retraso = 0,
}: {
  texto?: string;
  className?: string;
  /** Segundos que espera antes de empezar el calco. */
  retraso?: number;
}) {
  const medida = useRef<SVGTextElement>(null);
  const envoltura = useRef<HTMLDivElement>(null);
  const [caja, setCaja] = useState<Caja | null>(null);
  const [forma, setForma] = useState<string | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [quieto, setQuieto] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let vivo = true;
    const el = medida.current;
    if (!el) return;
    const familia = getComputedStyle(el).fontFamily;

    document.fonts
      .load(`${PESO} ${TAM}px ${familia}`)
      .catch(() => undefined)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!vivo) return;
        const lienzo = document.createElement("canvas");
        const ctx = lienzo.getContext("2d");
        if (!ctx) return;
        ctx.font = `${PESO} ${TAM}px ${familia}`;
        const t = ctx.measureText(texto);
        const c: Caja = {
          x: -t.actualBoundingBoxLeft - MARGEN,
          y: -t.actualBoundingBoxAscent - MARGEN,
          w: t.actualBoundingBoxLeft + t.actualBoundingBoxRight + MARGEN * 2,
          h: t.actualBoundingBoxAscent + t.actualBoundingBoxDescent + MARGEN * 2,
        };

        // La forma para el shader a 2×: con eso el borde sale limpio hasta
        // ~1500 px de ancho, y procesarla (el shader calcula el relieve en la
        // CPU) toma la cuarta parte que a 4×.
        const k = 2;
        lienzo.width = Math.ceil(c.w * k);
        lienzo.height = Math.ceil(c.h * k);
        ctx.scale(k, k);
        ctx.font = `${PESO} ${TAM}px ${familia}`;
        ctx.fillStyle = "#fff";
        ctx.fillText(texto, -c.x, -c.y);

        setWebgl(Boolean(document.createElement("canvas").getContext("webgl2")));
        setQuieto(matchMedia("(prefers-reduced-motion: reduce)").matches);
        setCaja(c);
        setForma(lienzo.toDataURL("image/png"));
      });

    return () => {
      vivo = false;
    };
  }, [texto]);

  // Fuera de pantalla el shader se detiene: no tiene sentido gastar batería
  // dibujando a 120 cuadros por segundo algo que nadie está mirando.
  useEffect(() => {
    const el = envoltura.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    o.observe(el);
    return () => o.disconnect();
  }, []);

  const vista = caja ? `${caja.x} ${caja.y} ${caja.w} ${caja.h}` : "0 -180 760 230";
  const comun = { x: 0, y: 0, fontSize: TAM, fontWeight: PESO, className: "font-gotica" } as const;

  return (
    <div
      ref={envoltura}
      className={`nombre-hero relative ${className}`}
      data-listo={caja && (forma || !webgl) ? "si" : "no"}
      style={{ aspectRatio: caja ? `${caja.w} / ${caja.h}` : "760 / 230", ["--nh-retraso" as string]: `${retraso}s` }}
      role="img"
      aria-label={texto}
    >
      {/* Respaldo y primer cuadro: cromo fijo en SVG. Queda debajo del metal. */}
      <svg viewBox={vista} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={`nh-cromo-${texto}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.22" stopColor="#d7dae1" />
            <stop offset="0.45" stopColor="#7f838d" />
            <stop offset="0.5" stopColor="#2a2c33" />
            <stop offset="0.54" stopColor="#f5f6f8" />
            <stop offset="0.75" stopColor="#a4a8b1" />
            <stop offset="1" stopColor="#8fb0ff" />
          </linearGradient>
          <filter id={`nh-resplandor-${texto}`} x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <text ref={medida} {...comun} fill="none" opacity="0">
          {texto}
        </text>
        <text {...comun} className={`${comun.className} nh-tinta nh-respaldo`} fill={`url(#nh-cromo-${texto})`} data-webgl={webgl ? "si" : "no"}>
          {texto}
        </text>
      </svg>

      {webgl && forma && (
        <div className="nh-tinta absolute inset-0">
          <LiquidMetal
            image={forma}
            colorBack="#00000000"
            colorTint="#c4d4ff"
            repetition={1.7}
            softness={0.28}
            shiftRed={0.1}
            shiftBlue={0.14}
            distortion={0.05}
            contour={0.28}
            angle={72}
            speed={quieto || !visible ? 0 : 0.55}
            fit="contain"
            scale={1}
            minPixelRatio={2}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}

      {/* Calco y aguja, encima de todo. */}
      <svg
        viewBox={vista}
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        style={{ ["--ancho" as string]: caja?.w ?? 760 }}
        aria-hidden
      >
        <text {...comun} className={`${comun.className} nh-trazo`} fill="none" stroke="#5b86ff" strokeWidth="1.3">
          {texto}
        </text>
        {caja && (
          <g className="nh-aguja">
            <rect x={caja.x} y={caja.y} width="6" height={caja.h} fill="#2f6bff" filter={`url(#nh-resplandor-${texto})`} />
            <rect x={caja.x + 2} y={caja.y} width="2" height={caja.h} fill="#ffffff" />
          </g>
        )}
      </svg>
    </div>
  );
}
