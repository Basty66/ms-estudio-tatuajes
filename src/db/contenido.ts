import "server-only";
import { cache } from "react";
import { sql } from "@/db/conexion";
import { CONTENIDO_BASE, mezclar, type ClaveBloque, type Contenido } from "@/lib/contenido";

/**
 * El contenido de la web, ya junto con los valores de fábrica.
 *
 * Si la base no responde, la portada sale igual con lo de fábrica en vez de
 * caerse. Va en cache() para que el layout y la página, en la misma
 * petición, la pidan una sola vez.
 */
export const leerContenido = cache(async (): Promise<Contenido> => {
  try {
    const filas = (await sql`SELECT clave, valor FROM contenido`) as Array<{ clave: ClaveBloque; valor: unknown }>;
    return mezclar(Object.fromEntries(filas.map((f) => [f.clave, f.valor])));
  } catch {
    return CONTENIDO_BASE;
  }
});

/** Cuándo y quién cambió cada bloque por última vez. */
export async function cambiosDelContenido(): Promise<Partial<Record<ClaveBloque, { cuando: string; quien: string }>>> {
  const filas = (await sql`
    SELECT clave, to_char(actualizado_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS cuando, actualizado_por AS quien
    FROM contenido
  `) as Array<{ clave: ClaveBloque; cuando: string; quien: string }>;
  return Object.fromEntries(filas.map((f) => [f.clave, { cuando: f.cuando, quien: f.quien }]));
}

/** Lo guardado tal cual, sin mezclar: las fotos subidas llevan la ruta del archivo para poder borrarlo. */
export async function bloqueGuardado(clave: ClaveBloque): Promise<unknown> {
  const [f] = (await sql`SELECT valor FROM contenido WHERE clave = ${clave}`) as Array<{ valor: unknown }>;
  return f?.valor ?? null;
}
