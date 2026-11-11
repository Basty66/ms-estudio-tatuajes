import { citasEntre, sinCerrar } from "@/db/panel";
import { avisar } from "@/lib/admin/avisos";
import { clp, nombreZona, textoLado, TIPO } from "@/lib/admin/etiquetas";
import { hora, hoyChile, sumarDias } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";

/**
 * Aviso de cada mañana (cron de Vercel, ver vercel.json): las sesiones de hoy
 * y de mañana, con el saldo que hay que cobrar, y las citas que quedaron sin
 * cerrar.
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

  const hoy = hoyChile();
  const manana = sumarDias(hoy, 1);
  const [citas, abiertas] = await Promise.all([citasEntre(hoy, manana), sinCerrar()]);
  const sesiones = citas.filter((c) => c.tipo !== "bloqueo" && c.estado === "confirmada");
  const linea = (c: (typeof sesiones)[number]) =>
    `${hora(c.inicio)} ${c.cliente} · ${c.zona ? `${nombreZona(c.zona)}${c.lado ? ` ${textoLado(c.lado)}` : ""}` : TIPO[c.tipo]}${c.saldo ? ` · cobrar ${clp(c.saldo)}` : ""}`;
  const deHoy = sesiones.filter((c) => c.inicio.startsWith(hoy));
  const deManana = sesiones.filter((c) => c.inicio.startsWith(manana));

  const partes = [
    deHoy.length ? `Hoy:\n${deHoy.map(linea).join("\n")}` : null,
    deManana.length ? `Mañana:\n${deManana.map(linea).join("\n")}` : null,
    abiertas.length ? `${abiertas.length} ${abiertas.length === 1 ? "cita pasada sin cerrar" : "citas pasadas sin cerrar"}.` : null,
  ].filter(Boolean);

  if (partes.length === 0) return Response.json({ enviado: false, motivo: "nada que avisar" });

  const aviso = {
    titulo: deHoy.length ? `Hoy: ${deHoy.length} ${deHoy.length === 1 ? "sesión" : "sesiones"}` : deManana.length ? `Mañana: ${deManana.length} ${deManana.length === 1 ? "sesión" : "sesiones"}` : "Citas sin cerrar",
    cuerpo: partes.join("\n\n"),
    url: PANEL,
    tag: "resumen-diario",
  };
  if (new URL(request.url).searchParams.has("simular")) return Response.json({ simulado: aviso });
  return Response.json({ enviado: true, ...(await avisar(aviso)) });
}
