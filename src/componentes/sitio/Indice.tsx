import { SECCIONES, type IdSeccion } from "@/lib/estudio";

/**
 * El índice de cada sección, sobre el título: número y etiqueta, como en una
 * revista. El número sale del orden de SECCIONES, así nunca queda desfasado.
 */
export function Indice({ id, className = "" }: { id: IdSeccion; className?: string }) {
  const i = SECCIONES.findIndex((s) => s.id === id);
  return (
    <p className={`flex items-center gap-3 text-[12px] font-semibold tracking-[0.2em] text-ceniza uppercase ${className}`}>
      <span className="text-stencil-claro tabular-nums [text-shadow:0_0_14px_rgba(47,107,255,0.8)]">{String(i + 1).padStart(2, "0")}</span>
      <span aria-hidden className="h-px w-8 bg-gradient-to-r from-stencil to-linea" />
      {SECCIONES[i].etiqueta}
    </p>
  );
}
