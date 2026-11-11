"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { CUERPO, type Lado, type Vista } from "@/lib/cuerpo";
import { ZONAS, type Zona } from "@/lib/precios";

/** Una zona del cuerpo con su lado. Las zonas del centro (cuello, abdomen, espalda) no tienen lado. */
export type Eleccion = { zona: Zona; lado: Lado | null };

export const clave = (e: Eleccion) => (e.lado ? `${e.zona}-${e.lado}` : e.zona);

export function nombreZona(z: Zona): string {
  return ZONAS.find((x) => x.id === z)?.nombre ?? z;
}

export function textoLado(l: Lado | null): string {
  return l === "izq" ? "Lado izquierdo" : l === "der" ? "Lado derecho" : "Centro";
}

/** En qué vista se ve una zona: el pecho solo de frente, el glúteo solo de espalda. */
function vistaDe(e: Eleccion, actual: Vista): Vista {
  const k = clave(e);
  const enActual = CUERPO[actual].regiones.some((r) => clave(r) === k);
  return enActual ? actual : actual === "frente" ? "espalda" : "frente";
}

/**
 * Silueta anatómica para elegir la zona tocándola, de frente o de espalda.
 * Cada lado es su propia zona: tocar el muslo izquierdo no marca el derecho.
 * Las indicaciones de lado son las de la persona (de frente, su izquierda
 * queda a la derecha de la pantalla).
 *
 * El dibujo es solo para mouse y dedo; con teclado y lector de pantalla se
 * elige con la lista de abajo, que tiene las mismas zonas.
 */
export function MapaCuerpo({
  valor,
  cambiar,
  previa,
  className = "",
}: {
  valor: Eleccion;
  cambiar: (e: Eleccion) => void;
  /** Zona bajo el cursor, para mostrarla antes de tocarla. */
  previa?: (e: Eleccion | null) => void;
  className?: string;
}) {
  const [vista, setVista] = useState<Vista>(() => vistaDe(valor, "frente"));
  const elegida = clave(valor);
  const cuerpo = CUERPO[vista];
  // El punto de aguja marca el centro de la zona elegida, si se ve en esta vista.
  const punto = cuerpo.regiones.find((r) => clave(r) === elegida)?.centro;

  const elegirDeLista = (k: string) => {
    for (const v of ["frente", "espalda"] as const) {
      const r = CUERPO[v].regiones.find((x) => clave(x) === k);
      if (r) {
        cambiar({ zona: r.zona, lado: r.lado });
        setVista(vistaDe(r, vista));
        return;
      }
    }
  };

  // La lista: cada zona una vez, de frente primero.
  const opciones: Eleccion[] = [];
  for (const v of ["frente", "espalda"] as const)
    for (const r of CUERPO[v].regiones) if (!opciones.some((o) => clave(o) === clave(r))) opciones.push({ zona: r.zona, lado: r.lado });
  opciones.sort((a, b) => nombreZona(a.zona).localeCompare(nombreZona(b.zona), "es") || (a.lado ?? "").localeCompare(b.lado ?? ""));

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div role="group" aria-label="Vista del cuerpo" className="mx-auto inline-flex rounded-full border border-linea bg-tinta/70 p-1">
        {(["frente", "espalda"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={vista === v}
            onClick={() => setVista(v)}
            className="relative min-h-9 rounded-full px-4 text-[13px] font-semibold capitalize"
          >
            {vista === v && (
              <motion.span
                layoutId="vista-cuerpo"
                className="absolute inset-0 rounded-full bg-[image:var(--acero)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className={`relative ${vista === v ? "text-tinta" : "text-ceniza"}`}>{v}</span>
          </button>
        ))}
      </div>

      <div className="mapa-cuerpo relative mx-auto aspect-[650/1276] w-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.svg
            key={vista}
            viewBox={cuerpo.viewBox}
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.4 }}
            transition={{ duration: 0.28, ease: [0.65, 0, 0.35, 1] }}
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
            onPointerLeave={() => previa?.(null)}
          >
            <defs>
              <filter id="mapa-neon" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="9" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {cuerpo.fijas.map((d) => (
              <path key={d} d={d} className="fill-[#10141d]" />
            ))}

            {cuerpo.regiones.map((r) => {
              const k = clave(r);
              const activa = k === elegida;
              return (
                <g
                  key={k}
                  data-zona={k}
                  data-activa={activa ? "si" : "no"}
                  className="mapa-zona"
                  filter={activa ? "url(#mapa-neon)" : undefined}
                  onClick={() => cambiar({ zona: r.zona, lado: r.lado })}
                  onPointerEnter={(e) => e.pointerType === "mouse" && previa?.({ zona: r.zona, lado: r.lado })}
                >
                  {r.trazos.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </g>
              );
            })}

            <path d={cuerpo.contorno} className="pointer-events-none fill-none stroke-piel/20" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />

            {punto && (
              <g className="pointer-events-none" transform={`translate(${punto[0]} ${punto[1]})`}>
                <circle r="22" className="mapa-pulso fill-none stroke-[#dfe7ff]" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                <circle r="6" className="fill-white" />
              </g>
            )}
          </motion.svg>
        </AnimatePresence>
      </div>

      <label className="sr-only" htmlFor="zona-lista">
        Zona del tatuaje
      </label>
      <select
        id="zona-lista"
        value={elegida}
        onChange={(e) => elegirDeLista(e.target.value)}
        className="mx-auto w-full max-w-[16rem] rounded-full border border-linea bg-tinta px-4 py-2 text-[13px] text-ceniza focus:border-stencil focus:outline-none"
      >
        {opciones.map((o) => (
          <option key={clave(o)} value={clave(o)}>
            {nombreZona(o.zona)}
            {o.lado ? ` · ${o.lado === "izq" ? "izquierdo" : "derecho"}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
