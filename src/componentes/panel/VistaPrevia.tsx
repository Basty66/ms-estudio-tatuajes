"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PANEL } from "@/lib/admin/ruta";
import { Cerrar } from "./Iconos";

/**
 * Cómo queda lo que se está editando, antes de guardarlo.
 *
 * Abre la sección de verdad de la web (/tinta/vista) dentro de un marco con
 * el ancho de un teléfono o de un computador, y le manda lo escrito por
 * postMessage cada vez que cambia. Nada se guarda hasta tocar Guardar.
 */
export function VistaPrevia({ bloque, valor, cerrar }: { bloque: string; valor: unknown; cerrar: () => void }) {
  const [modo, setModo] = useState<"telefono" | "computador">("telefono");
  const [caja, setCaja] = useState({ ancho: 0, alto: 0 });
  const marco = useRef<HTMLIFrameElement>(null);
  const zona = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  const mandar = useCallback(() => {
    marco.current?.contentWindow?.postMessage({ tipo: "vista-previa", bloque, valor }, window.location.origin);
  }, [bloque, valor]);

  useEffect(mandar, [mandar]);

  // La vista avisa cuando terminó de cargar: recién ahí puede recibir el borrador.
  useEffect(() => {
    const oir = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.tipo === "vista-lista") mandar();
    };
    window.addEventListener("message", oir);
    return () => window.removeEventListener("message", oir);
  }, [mandar]);

  useEffect(() => {
    const z = zona.current;
    if (!z) return;
    const medir = () => setCaja({ ancho: z.clientWidth, alto: z.clientHeight });
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(z);
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    boton.current?.focus();
    return () => {
      obs.disconnect();
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [cerrar]);

  const ancho = modo === "telefono" ? 390 : 1280;
  const escala = caja.ancho ? Math.min(1, caja.ancho / ancho) : 1;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Vista previa" className="fixed inset-0 z-50 flex flex-col bg-tinta/[0.96] backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-linea/80 px-4 py-3 sm:px-6" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Vista previa</p>
          <p className="truncate text-[13px] text-ceniza">Así queda al guardar. Todavía no se ve en la web.</p>
        </div>
        <div className="hidden rounded-full border border-linea p-1 sm:flex">
          {(["telefono", "computador"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={modo === m}
              onClick={() => setModo(m)}
              className={`min-h-9 rounded-full px-4 text-[13px] font-semibold transition-colors ${modo === m ? "bg-piel text-tinta" : "text-ceniza hover:text-piel"}`}
            >
              {m === "telefono" ? "Teléfono" : "Computador"}
            </button>
          ))}
        </div>
        <button ref={boton} type="button" onClick={cerrar} aria-label="Cerrar la vista previa" className="grid size-11 shrink-0 place-items-center rounded-full border border-linea text-ceniza hover:text-piel">
          <Cerrar className="size-5" />
        </button>
      </div>
      <div ref={zona} className="relative flex-1 overflow-hidden sm:p-6">
        {caja.ancho > 0 && (
          <div
            className="mx-auto overflow-hidden bg-tinta sm:rounded-[28px] sm:border sm:border-linea sm:shadow-[0_30px_80px_-30px_rgba(47,107,255,0.45)]"
            style={{ width: ancho * escala, height: "100%" }}
          >
            <iframe
              ref={marco}
              src={`${PANEL}/vista?bloque=${bloque}`}
              title="Vista previa de la web"
              className="block origin-top-left border-0"
              style={{ width: ancho, height: `${100 / escala}%`, transform: `scale(${escala})` }}
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
