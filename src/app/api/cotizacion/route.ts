import { createHash } from "node:crypto";
import { sql } from "@/db/conexion";
import { leerContenido } from "@/db/contenido";
import { avisar } from "@/lib/admin/avisos";
import { clp, nombreDonde, nombreEstilo, nombreTamano } from "@/lib/admin/etiquetas";
import { PANEL } from "@/lib/admin/ruta";
import { ESTILOS_PRECIO, estimar, TAMANOS, ZONAS, type EstiloPrecio, type Tamano, type Zona } from "@/lib/precios";

/**
 * Lo que alguien cotizó en la web, justo antes de abrir WhatsApp.
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
    const zona = ZONAS.find((z) => z.id === d.zona)?.id as Zona | undefined;
    const tamano = TAMANOS.find((t) => t.id === d.tamano)?.id as Tamano | undefined;
    const estilo = ESTILOS_PRECIO.find((e) => e.id === d.estilo)?.id as EstiloPrecio | undefined;
    if (!zona || !tamano || !estilo) return new Response(null, { status: 204 });
    const lado = d.lado === "izq" || d.lado === "der" ? d.lado : null;
    const idea = typeof d.idea === "string" && d.idea.trim() ? d.idea.trim().slice(0, 600) : null;
    const rango = estimar((await leerContenido()).precios, tamano, estilo, zona);

    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sin-ip";
    const origen = createHash("sha256").update(`${new Date().toISOString().slice(0, 10)}|${ip}`).digest("hex").slice(0, 32);

    const [{ n }] = (await sql`
      SELECT COUNT(*)::INT AS n FROM cotizaciones WHERE origen = ${origen} AND creada_en > NOW() - INTERVAL '1 hour'
    `) as Array<{ n: number }>;
    if (n >= 10) return new Response(null, { status: 204 });

    await sql`
      INSERT INTO cotizaciones (zona, lado, tamano, estilo, idea, minimo, maximo, origen)
      VALUES (${zona}, ${lado}, ${tamano}, ${estilo}, ${idea}, ${rango.min}, ${rango.max}, ${origen})
    `;

    const donde = nombreDonde(zona, lado);
    await avisar({
      titulo: "Alguien cotizó en la web",
      cuerpo: `${nombreTamano(tamano)} · ${donde} · ${nombreEstilo(estilo)} (${clp(rango.min)} a ${clp(rango.max)})${idea ? `\n“${idea.slice(0, 120)}”` : ""}\nDebería llegarte su WhatsApp.`,
      url: `${PANEL}/cotizaciones`,
      tag: "cotizacion",
    });
  } catch (error) {
    console.error("cotizacion:", error);
  }
  return new Response(null, { status: 204 });
}
