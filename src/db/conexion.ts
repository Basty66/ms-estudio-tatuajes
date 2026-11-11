import "server-only";
import { neon } from "@neondatabase/serverless";

/**
 * Conexión a Postgres (Neon, sa-east-1, endpoint -pooler).
 *
 * Las consultas se escriben SIEMPRE con plantillas etiquetadas —
 * sql`... ${valor} ...` — que mandan los valores aparte del texto de la
 * consulta. Concatenar a mano es cómo se escribe una inyección SQL sin darse
 * cuenta.
 *
 * En desarrollo NEON_DATABASE_URL apunta a la rama `dev`; producción se
 * configura en Vercel.
 */
const url = process.env.NEON_DATABASE_URL;
if (!url) throw new Error("Falta NEON_DATABASE_URL");

export const sql = neon(url);

/** Para los mensajes: el choque de horas que impide el constraint de exclusión. */
export function esChoqueDeHoras(error: unknown): boolean {
  return (error as { code?: string })?.code === "23P01";
}
