import { leerContenido } from "@/db/contenido";
import { disponibilidad } from "@/db/reservas";

/**
 * Los cupos de cada día para el calendario de la web. Solo dice cuándo hay
 * espacio: nunca quién tiene hora ni para qué.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const { reservas } = await leerContenido();
  if (!reservas.activas) return Response.json({ activas: false, dias: [] });
  return Response.json({ activas: true, dias: await disponibilidad(reservas) }, { headers: { "Cache-Control": "no-store" } });
}
