import { sql } from "@/db/conexion";
import { seguimientosDeHoy } from "@/db/consentimientos";
import { citasEntre, sinCerrar } from "@/db/panel";
import { borrarPrivado } from "@/lib/admin/almacen";
import { avisar } from "@/lib/admin/avisos";
import { clp, nombreDonde, TIPO } from "@/lib/admin/etiquetas";
import { hora, hoyChile, sumarDias } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";

/**
 * Aviso de cada mañana (cron de Vercel, ver vercel.json): las sesiones de hoy
 * y de mañana, con el saldo que hay que cobrar y si falta el consentimiento,
 * y las citas que quedaron sin cerrar.
 *
 * De paso hace la limpieza que pide la ley de datos: borra los
 * consentimientos que cumplieron su plazo (primero la firma, después la fila)
 * y los links que vencieron hace más de un mes sin firmarse.
 *
 * Exige CRON_SECRET siempre (Vercel lo manda solo como Bearer). Con
 * ?simular=1 devuelve lo que mandaría, sin mandarlo.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return new Response("No autorizado", { status: 401 });
  }

  const simular = new URL(request.url).searchParams.has("simular");
  const limpieza = simular ? null : await limpiarConsentimientos();

  const hoy = hoyChile();
  const manana = sumarDias(hoy, 1);
  const [citas, abiertas, mensajes] = await Promise.all([citasEntre(hoy, manana), sinCerrar(), seguimientosDeHoy(hoy)]);
  const sesiones = citas.filter((c) => c.tipo !== "bloqueo" && c.estado === "confirmada");
  const linea = (c: (typeof sesiones)[number]) =>
    `${hora(c.inicio)} ${c.cliente} · ${nombreDonde(c.zona, c.lado) ?? TIPO[c.tipo]}${c.saldo ? ` · cobrar ${clp(c.saldo)}` : ""}${c.consentimiento === "firmado" ? "" : " · sin consentimiento"}`;
  const deHoy = sesiones.filter((c) => c.inicio.startsWith(hoy));
  const deManana = sesiones.filter((c) => c.inicio.startsWith(manana));

  const partes = [
    deHoy.length ? `Hoy:\n${deHoy.map(linea).join("\n")}` : null,
    deManana.length ? `Mañana:\n${deManana.map(linea).join("\n")}` : null,
    abiertas.length ? `${abiertas.length} ${abiertas.length === 1 ? "cita pasada sin cerrar" : "citas pasadas sin cerrar"}.` : null,
    // Los mensajes salen del WhatsApp del estudio (gratis): el aviso solo recuerda a quién escribir.
    mensajes.length ? `${mensajes.length} ${mensajes.length === 1 ? "mensaje de cuidados o próxima sesión" : "mensajes de cuidados o próxima sesión"} por mandar.` : null,
  ].filter(Boolean);

  if (partes.length === 0) return Response.json({ enviado: false, motivo: "nada que avisar", limpieza });

  const aviso = {
    titulo: deHoy.length ? `Hoy: ${deHoy.length} ${deHoy.length === 1 ? "sesión" : "sesiones"}` : deManana.length ? `Mañana: ${deManana.length} ${deManana.length === 1 ? "sesión" : "sesiones"}` : "Citas sin cerrar",
    cuerpo: partes.join("\n\n"),
    url: PANEL,
    tag: "resumen-diario",
  };
  if (simular) return Response.json({ simulado: aviso });
  return Response.json({ enviado: true, ...(await avisar(aviso)), limpieza });
}

async function limpiarConsentimientos(): Promise<{ vencidos: number; links: number }> {
  const vencidos = (await sql`
    SELECT id, firma FROM consentimientos
    WHERE conservar_hasta < (NOW() AT TIME ZONE 'America/Santiago')::DATE
  `) as Array<{ id: number; firma: string | null }>;
  let borrados = 0;
  for (const k of vencidos) {
    try {
      if (k.firma) await borrarPrivado(k.firma);
      await sql`DELETE FROM consentimientos WHERE id = ${k.id}`;
      borrados++;
    } catch (error) {
      // Si el archivo no se pudo borrar, la fila se queda para intentarlo mañana.
      console.error("limpieza consentimiento", k.id, error);
    }
  }
  const links = (await sql`
    DELETE FROM consentimientos WHERE firmado_en IS NULL AND vence_en < NOW() - INTERVAL '30 days' RETURNING id
  `) as Array<{ id: number }>;
  return { vencidos: borrados, links: links.length };
}
