import { sql } from "@/db/conexion";
import { sesionVigente } from "@/lib/admin/sesion";

/**
 * ¿Cambió algo? Devuelve el contador que avanza con cada escritura (ver la
 * secuencia `cambios` en db/001) y la versión publicada del panel.
 *
 * Es una consulta mínima y no cuenta como uso (ver sesionVigente): el panel
 * abierto sobre la mesa igual se bloquea a la media hora. 401 si la sesión se
 * cerró o se bloqueó.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await sesionVigente())) {
    return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const [fila] = (await sql`SELECT last_value::TEXT AS ultimo FROM cambios`) as Array<{ ultimo: string }>;
  return Response.json(
    { ultimo: fila.ultimo, version: process.env.NEXT_PUBLIC_VERSION ?? "" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
