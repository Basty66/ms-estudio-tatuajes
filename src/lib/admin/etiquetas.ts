import { ESTILOS_PRECIO, TAMANOS, ZONAS } from "@/lib/precios";

/** Textos para mostrar lo que la base guarda como identificadores. */
export const clp = (n: number) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("es-CL");

/** Para cifras en espacios chicos: "$225 mil", "$1,2 M". */
export function clpCorto(n: number): string {
  const signo = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${signo}$${(a / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} M`;
  if (a >= 10_000) return `${signo}$${Math.round(a / 1000)} mil`;
  return clp(n);
}

export const nombreZona = (z: string | null) => (z ? (ZONAS.find((x) => x.id === z)?.nombre ?? z) : null);
export const nombreTamano = (t: string | null) => (t ? (TAMANOS.find((x) => x.id === t)?.nombre ?? t) : null);
export const nombreEstilo = (e: string | null) => (e ? (ESTILOS_PRECIO.find((x) => x.id === e)?.nombre ?? e) : null);

// Zonas que se nombran en femenino: "mano derecha", no "mano derecho".
const FEMENINAS = new Set(["mano", "pantorrilla", "pierna", "rodilla", "costillas", "nuca", "espalda-alta", "espalda-baja"]);

/** "Muslo izquierdo", "Mano derecha", "Costillas izquierdas". */
export function nombreDonde(zona: string | null, lado: string | null): string | null {
  const nombre = nombreZona(zona);
  if (!nombre || (lado !== "izq" && lado !== "der")) return nombre;
  const base = lado === "izq" ? "izquierd" : "derech";
  const fem = FEMENINAS.has(zona ?? "");
  return `${nombre} ${base}${fem ? "a" : "o"}${zona === "costillas" ? "s" : ""}`;
}

export const TIPO = { tatuaje: "Tatuaje", laser: "Láser", retoque: "Retoque", bloqueo: "Bloqueo" } as const;
export const ESTADO = { confirmada: "Confirmada", completada: "Hecha", cancelada: "Cancelada", no_vino: "No vino" } as const;

/** "Muslo izquierdo · Fineline · Mediano" */
export function resumenTatuaje(c: { zona: string | null; lado: string | null; estilo: string | null; tamano: string | null; descripcion: string | null }): string {
  return [nombreDonde(c.zona, c.lado), nombreEstilo(c.estilo), nombreTamano(c.tamano)]
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
