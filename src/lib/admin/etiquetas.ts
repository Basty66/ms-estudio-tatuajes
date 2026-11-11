import { ESTILOS_PRECIO, TAMANOS, ZONAS } from "@/lib/precios";

/** Textos para mostrar lo que la base guarda como identificadores. */
export const clp = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export const nombreZona = (z: string | null) => (z ? (ZONAS.find((x) => x.id === z)?.nombre ?? z) : null);
export const nombreTamano = (t: string | null) => (t ? (TAMANOS.find((x) => x.id === t)?.nombre ?? t) : null);
export const nombreEstilo = (e: string | null) => (e ? (ESTILOS_PRECIO.find((x) => x.id === e)?.nombre ?? e) : null);
export const textoLado = (l: string | null) => (l === "izq" ? "izquierdo" : l === "der" ? "derecho" : null);

export const TIPO = { tatuaje: "Tatuaje", laser: "Láser", retoque: "Retoque", bloqueo: "Bloqueo" } as const;
export const ESTADO = { confirmada: "Confirmada", completada: "Hecha", cancelada: "Cancelada", no_vino: "No vino" } as const;

/** "Muslo izquierdo · Fineline · Mediano" */
export function resumenTatuaje(c: { zona: string | null; lado: string | null; estilo: string | null; tamano: string | null; descripcion: string | null }): string {
  const zona = nombreZona(c.zona);
  return [zona && (textoLado(c.lado) ? `${zona} ${textoLado(c.lado)}` : zona), nombreEstilo(c.estilo), nombreTamano(c.tamano)]
    .filter(Boolean)
    .join(" · ") || (c.descripcion ?? "");
}

export const CATEGORIAS = [
  ["insumos", "Insumos"],
  ["arriendo", "Arriendo"],
  ["servicios", "Servicios"],
  ["publicidad", "Publicidad"],
  ["equipos", "Equipos"],
  ["otro", "Otro"],
] as const;
