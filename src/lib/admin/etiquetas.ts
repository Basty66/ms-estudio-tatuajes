import { ESTILOS_PRECIO, OBJETIVOS_LASER, TAMANOS, ZONAS } from "@/lib/precios";

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
export const ESTADO = { solicitada: "Por confirmar", confirmada: "Confirmada", completada: "Hecha", cancelada: "Cancelada", no_vino: "No vino" } as const;

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

/**
 * Una cotización de la web en palabras, para la lista y para responderla:
 * "mediano en antebrazo derecho, fineline" y "$50.000 a $90.000".
 */
export function textoCotizacion(c: {
  tipo: "tatuaje" | "laser";
  zona: string;
  lado: string | null;
  tamano: string;
  estilo: string;
  minimo: number;
  maximo: number;
  sesiones_min: number | null;
  sesiones_max: number | null;
}): { detalle: string; rango: string } {
  const tamano = (nombreTamano(c.tamano) ?? c.tamano).toLowerCase();
  const donde = (nombreDonde(c.zona, c.lado) ?? c.zona).toLowerCase();
  if (c.tipo === "laser") {
    const objetivo = OBJETIVOS_LASER.find((o) => o.id === c.estilo)?.nombre.toLowerCase() ?? c.estilo;
    return {
      detalle: `borrado láser de un tatuaje ${tamano} en ${donde}, para ${objetivo === "borrar del todo" ? "borrarlo del todo" : "aclararlo para un cover"}`,
      rango: `${clp(c.minimo)} a ${clp(c.maximo)} por sesión${c.sesiones_min ? ` (${c.sesiones_min} a ${c.sesiones_max} sesiones)` : ""}`,
    };
  }
  return { detalle: `${tamano} en ${donde}, ${(nombreEstilo(c.estilo) ?? c.estilo).toLowerCase()}`, rango: `${clp(c.minimo)} a ${clp(c.maximo)}` };
}
