"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

/**
 * Firmar con el dedo (o el mouse).
 *
 * Se guardan los trazos como puntos y se redibujan: en pantalla en color
 * claro sobre el fondo oscuro, y al exportar en tinta oscura sobre fondo
 * transparente, recortada a lo firmado. Así el PDF muestra una firma normal,
 * en negro sobre papel blanco.
 */
type Punto = { x: number; y: number };

export type ManejoFirma = {
  /** PNG de la firma (data URL), o null si casi no hay trazo. */
  exportar: () => string | null;
  borrar: () => void;
};

/** Largo mínimo del trazo, en px de pantalla: un punto o una raya no son una firma. */
const LARGO_MINIMO = 120;

function dibujar(ctx: CanvasRenderingContext2D, trazos: Punto[][], escala: number, color: string, dx = 0, dy = 0) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4 * escala;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const t of trazos) {
    const p = t.map((q) => ({ x: (q.x - dx) * escala, y: (q.y - dy) * escala }));
    if (p.length === 1) {
      ctx.beginPath();
      ctx.arc(p[0].x, p[0].y, 1.2 * escala, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    // Curvas por los puntos medios: el trazo sale suave y no en tramos rectos.
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i].x + p[i + 1].x) / 2;
      const my = (p[i].y + p[i + 1].y) / 2;
      ctx.quadraticCurveTo(p[i].x, p[i].y, mx, my);
    }
    const u = p[p.length - 1];
    ctx.lineTo(u.x, u.y);
    ctx.stroke();
  }
}

export const Firma = forwardRef<ManejoFirma, { etiqueta: string; alCambiar: (hayFirma: boolean) => void }>(function Firma({ etiqueta, alCambiar }, ref) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const trazos = useRef<Punto[][]>([]);
  const actual = useRef<Punto[] | null>(null);
  const [vacio, setVacio] = useState(true);

  const largo = () =>
    trazos.current.reduce((t, s) => t + s.slice(1).reduce((a, p, i) => a + Math.hypot(p.x - s[i].x, p.y - s[i].y), 0), 0);

  const repintar = useCallback(() => {
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, c.width, c.height);
    dibujar(ctx, trazos.current, dpr, "#efe8e2");
  }, []);

  // El lienzo se ajusta a su ancho real y a la densidad de la pantalla.
  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const ajustar = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = c.getBoundingClientRect();
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      repintar();
    };
    ajustar();
    const obs = new ResizeObserver(ajustar);
    obs.observe(c);
    return () => obs.disconnect();
  }, [repintar]);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>): Punto => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const avisar = () => {
    const hay = largo() >= LARGO_MINIMO;
    setVacio(trazos.current.length === 0);
    alCambiar(hay);
  };

  useImperativeHandle(ref, () => ({
    borrar: () => {
      trazos.current = [];
      repintar();
      avisar();
    },
    exportar: () => {
      if (largo() < LARGO_MINIMO) return null;
      const todos = trazos.current.flat();
      const margen = 8;
      const x0 = Math.min(...todos.map((p) => p.x)) - margen;
      const y0 = Math.min(...todos.map((p) => p.y)) - margen;
      const x1 = Math.max(...todos.map((p) => p.x)) + margen;
      const y1 = Math.max(...todos.map((p) => p.y)) + margen;
      const escala = 2;
      const c = document.createElement("canvas");
      c.width = Math.ceil((x1 - x0) * escala);
      c.height = Math.ceil((y1 - y0) * escala);
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      dibujar(ctx, trazos.current, escala, "#11141c", x0, y0);
      return c.toDataURL("image/png");
    },
  }));

  return (
    <div className="relative">
      <canvas
        ref={lienzo}
        aria-label={etiqueta}
        role="img"
        className="block h-[clamp(11rem,42vw,15rem)] w-full cursor-crosshair touch-none rounded-[20px] border border-linea bg-hollin/80"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          actual.current = [punto(e)];
          trazos.current.push(actual.current);
          repintar();
        }}
        onPointerMove={(e) => {
          if (!actual.current) return;
          // Los eventos agrupados dan un trazo fino aunque el teléfono reporte menos cuadros.
          const eventos = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
          const r = e.currentTarget.getBoundingClientRect();
          for (const ev of eventos) actual.current.push({ x: ev.clientX - r.left, y: ev.clientY - r.top });
          repintar();
        }}
        onPointerUp={() => {
          actual.current = null;
          avisar();
        }}
        onPointerCancel={() => {
          actual.current = null;
          avisar();
        }}
      />
      {/* La línea y la equis de siempre: dicen dónde firmar sin un texto encima. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-[30%] flex items-end gap-3 text-ceniza/70">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
        <span className="mb-1 h-px flex-1 bg-ceniza/30" />
      </div>
      {vacio && (
        <p aria-hidden className="pointer-events-none absolute inset-x-0 top-5 text-center text-[14px] text-ceniza/80">
          Firma con el dedo
        </p>
      )}
    </div>
  );
});
