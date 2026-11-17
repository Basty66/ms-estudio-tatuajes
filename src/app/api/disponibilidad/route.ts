import { leerContenido } from "@/db/contenido";
import { disponibilidad } from "@/db/reservas";
import { duracionDe } from "@/lib/reservas";
import { TAMANOS, type Tamano } from "@/lib/precios";

/**
 * Los días y horas libres para el calendario de la web. Solo dice cuándo hay
 * espacio: nunca quién tiene hora ni para qué.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const u = new URL(request.url);
  const tipo = u.searchParams.get("tipo") === "laser" ? "laser" : "tatuaje";
  const tamano = (TAMANOS.find((t) => t.id === u.searchParams.get("tamano"))?.id ?? "mediano") as Tamano;
  const { reservas } = await leerContenido();
  if (!reservas.activas) return Response.json({ activas: false, duracion: 0, dias: [] });
  const duracion = duracionDe(reservas, tipo, tamano);
  return Response.json(
    { activas: true, duracion, dias: await disponibilidad(reservas, duracion) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
