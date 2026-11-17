import { createHash } from "node:crypto";
import { sql } from "@/db/conexion";
import { leerContenido } from "@/db/contenido";
import { avisar } from "@/lib/admin/avisos";
import { clp, nombreDonde, nombreEstilo, nombreTamano } from "@/lib/admin/etiquetas";
import { PANEL } from "@/lib/admin/ruta";
import { ESTILOS_PRECIO, estimar, estimarLaser, OBJETIVOS_LASER, TAMANOS, ZONAS, type EstiloPrecio, type ObjetivoLaser, type Tamano, type Zona } from "@/lib/precios";

/**
 * Lo que alguien cotizó en la web (un tatuaje o un borrado láser), justo
 * antes de abrir WhatsApp.
 *
 * Es una puerta abierta a internet: todo se revalida acá, el rango se
 * recalcula en el servidor (nunca se cree el que manda el navegador) y hay un
 * tope de 10 por hora por origen. El origen es un hash del IP con sal del
 * día: alcanza para frenar abusos y no identifica a nadie.
 *
 * Si algo falla responde 204 igual: la persona ya va camino a WhatsApp y no
 * tiene por qué enterarse.
 */
export async function POST(request: Request) {
  try {
    const d = (await request.json()) as Record<string, unknown>;
    const laser = d.tipo === "laser";
    const zona = ZONAS.find((z) => z.id === d.zona)?.id as Zona | undefined;
    const tamano = TAMANOS.find((t) => t.id === d.tamano)?.id as Tamano | undefined;
    // En el láser, "estilo" es lo que se busca: borrar del todo o aclarar para un cover.
    const estilo = laser
      ? (OBJETIVOS_LASER.find((o) => o.id === d.estilo)?.id as ObjetivoLaser | undefined)
      : (ESTILOS_PRECIO.find((e) => e.id === d.estilo)?.id as EstiloPrecio | undefined);
    if (!zona || !tamano || !estilo) return new Response(null, { status: 204 });
    const lado = d.lado === "izq" || d.lado === "der" ? d.lado : null;
    const idea = typeof d.idea === "string" && d.idea.trim() ? d.idea.trim().slice(0, 600) : null;
    const { precios } = await leerContenido();
    const rango = laser ? estimarLaser(precios, tamano, estilo as ObjetivoLaser) : { ...estimar(precios, tamano, estilo as EstiloPrecio, zona), sesiones: null };

    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sin-ip";
    const origen = createHash("sha256").update(`${new Date().toISOString().slice(0, 10)}|${ip}`).digest("hex").slice(0, 32);

    const [{ n }] = (await sql`
      SELECT COUNT(*)::INT AS n FROM cotizaciones WHERE origen = ${origen} AND creada_en > NOW() - INTERVAL '1 hour'
    `) as Array<{ n: number }>;
    if (n >= 10) return new Response(null, { status: 204 });

    await sql`
      INSERT INTO cotizaciones (tipo, zona, lado, tamano, estilo, idea, minimo, maximo, sesiones_min, sesiones_max, origen)
      VALUES (${laser ? "laser" : "tatuaje"}, ${zona}, ${lado}, ${tamano}, ${estilo}, ${idea}, ${rango.min}, ${rango.max},
              ${rango.sesiones?.min ?? null}, ${rango.sesiones?.max ?? null}, ${origen})
    `;

    const donde = nombreDonde(zona, lado);
    const que = laser
      ? `${nombreTamano(tamano)} · ${donde} · ${OBJETIVOS_LASER.find((o) => o.id === estilo)?.nombre} (${clp(rango.min)} a ${clp(rango.max)} por sesión, ${rango.sesiones?.min} a ${rango.sesiones?.max} sesiones)`
      : `${nombreTamano(tamano)} · ${donde} · ${nombreEstilo(estilo)} (${clp(rango.min)} a ${clp(rango.max)})`;
    await avisar({
      titulo: laser ? "Alguien cotizó un borrado láser" : "Alguien cotizó en la web",
      cuerpo: `${que}${idea ? `\n“${idea.slice(0, 120)}”` : ""}\nDebería llegarte su WhatsApp.`,
      url: `${PANEL}/cotizaciones`,
      tag: "cotizacion",
    });
  } catch (error) {
    console.error("cotizacion:", error);
  }
  return new Response(null, { status: 204 });
}
