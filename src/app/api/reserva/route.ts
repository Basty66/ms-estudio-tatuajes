import { createHash } from "node:crypto";
import { esChoqueDeHoras, sql } from "@/db/conexion";
import { leerContenido } from "@/db/contenido";
import { liberarVencidas, ocupadosEntre } from "@/db/reservas";
import { avisar } from "@/lib/admin/avisos";
import { clp, nombreDonde, nombreTamano } from "@/lib/admin/etiquetas";
import { ahoraChile, esFecha, esHora, fechaLarga } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";
import { normalizarTelefono } from "@/lib/admin/telefono";
import { ESTILOS_PRECIO, estimar, estimarLaser, OBJETIVOS_LASER, TAMANOS, ZONAS, type EstiloPrecio, type ObjetivoLaser, type Tamano, type Zona } from "@/lib/precios";
import { cuposLibres, diaSemana, finDeCupo } from "@/lib/reservas";

/**
 * Una hora pedida desde la web, después de cotizar.
 *
 * Es una puerta abierta a internet: todo se revisa de nuevo acá (que la hora
 * sea uno de los cupos del día, que esté libre, que el teléfono sea chileno) y
 * hay un tope de 3 por hora por conexión. La cita nace "solicitada": aparta el
 * cupo hasta que el tatuador la confirma (con cuánto dura y el valor final) o
 * hasta que vence. La doble reserva la sigue impidiendo Postgres.
 */
export const dynamic = "force-dynamic";

const error = (mensaje: string, status = 400) => Response.json({ error: mensaje }, { status });

export async function POST(request: Request) {
  let d: Record<string, unknown>;
  try {
    d = await request.json();
  } catch {
    return error("No llegó bien. Vuelve a intentarlo.");
  }
  const { reservas, precios } = await leerContenido();
  if (!reservas.activas) return error("Las reservas en línea están apagadas. Escríbenos por WhatsApp.", 403);

  // --- Lo cotizado
  const laser = d.tipo === "laser";
  const zona = ZONAS.find((z) => z.id === d.zona)?.id as Zona | undefined;
  const tamano = TAMANOS.find((t) => t.id === d.tamano)?.id as Tamano | undefined;
  const estilo = laser
    ? (OBJETIVOS_LASER.find((o) => o.id === d.estilo)?.id as ObjetivoLaser | undefined)
    : (ESTILOS_PRECIO.find((e) => e.id === d.estilo)?.id as EstiloPrecio | undefined);
  if (!zona || !tamano || !estilo) return error("Falta lo que cotizaste. Vuelve al cotizador.");
  const lado = d.lado === "izq" || d.lado === "der" ? d.lado : null;
  const idea = typeof d.idea === "string" && d.idea.trim() ? d.idea.trim().slice(0, 600) : null;
  const codigo = typeof d.codigo === "string" && /^MS-[A-Z2-9]{4}$/.test(d.codigo) ? d.codigo : null;

  // --- Quién y cuándo
  const nombre = typeof d.nombre === "string" ? d.nombre.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const telefono = normalizarTelefono(String(d.telefono ?? ""));
  if (nombre.length < 2) return error("Escribe tu nombre.");
  if (!telefono || !/^569\d{8}$/.test(telefono)) return error("Revisa tu WhatsApp: un celular chileno, como 9 1234 5678.");
  if (d.acepta !== true) return error("Para pedir la hora tienes que aceptar que guardemos tu nombre y WhatsApp.");
  if (!esFecha(d.fecha) || !esHora(d.hora)) return error("Elige día y hora.");
  // Que sea un cupo del día y esté libre, mirando la agenda de verdad. Aparta hasta el cupo siguiente;
  // cuánto dura de verdad lo pone el tatuador al confirmar.
  await liberarVencidas(reservas.vence);
  const libres = cuposLibres(reservas, d.fecha, await ocupadosEntre(d.fecha, d.fecha), ahoraChile());
  if (!libres.includes(d.hora)) return error("Esa hora ya no está disponible. Elige otra.", 409);
  const inicio = `${d.fecha}T${d.hora}`;
  const fin = finDeCupo(reservas.dias[diaSemana(d.fecha)], d.fecha, d.hora);

  // Tope por conexión: el hash cambia cada día y no identifica a nadie.
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sin-ip";
  const red = createHash("sha256").update(`${new Date().toISOString().slice(0, 10)}|reserva|${ip}`).digest("hex").slice(0, 32);
  const [{ n }] = (await sql`SELECT COUNT(*)::INT AS n FROM citas WHERE origen_red = ${red} AND creada_en > NOW() - INTERVAL '1 hour'`) as Array<{ n: number }>;
  if (n >= 3) return error("Ya pediste varias horas. Escríbenos por WhatsApp y lo vemos.", 429);

  const rango = laser ? estimarLaser(precios, tamano, estilo as ObjetivoLaser) : { ...estimar(precios, tamano, estilo as EstiloPrecio, zona), sesiones: null };
  const textoRango = `${clp(rango.min)} a ${clp(rango.max)}${laser ? ` por sesión, ${rango.sesiones?.min} a ${rango.sesiones?.max} sesiones` : ""}`;

  try {
    // Una sola sentencia: el cliente (si el teléfono ya existe, es el mismo),
    // la cita apartada y la cotización unida a ella.
    const [fila] = (await sql`
      WITH quien AS (
        INSERT INTO clientes (nombre, telefono, creado_por) VALUES (${nombre}, ${telefono}, 'Web')
        ON CONFLICT (telefono) WHERE telefono IS NOT NULL DO UPDATE SET telefono = EXCLUDED.telefono
        RETURNING id
      ),
      cita AS (
        INSERT INTO citas (cliente_id, tipo, estado, inicio, fin, zona, lado, tamano, estilo, descripcion, notas, creada_por, origen, origen_red)
        SELECT id, ${laser ? "laser" : "tatuaje"}, 'solicitada', ${inicio}::TIMESTAMP, ${fin}::TIMESTAMP, ${zona}, ${lado}, ${tamano},
               ${laser ? null : estilo}, ${idea ?? (laser ? `Borrado láser: ${OBJETIVOS_LASER.find((o) => o.id === estilo)?.nombre.toLowerCase()}` : null)},
               ${`Pedida desde la web${codigo ? ` · ${codigo}` : ""} · ${textoRango}`}, 'Web', 'web', ${red}
        FROM quien
        RETURNING id
      ),
      cotizada AS (
        UPDATE cotizaciones SET estado = 'agendada', cita_id = cita.id, vista = TRUE
        FROM cita
        WHERE cotizaciones.id = (SELECT id FROM cotizaciones WHERE codigo = ${codigo} AND cita_id IS NULL ORDER BY creada_en DESC LIMIT 1)
      )
      SELECT id FROM cita
    `) as Array<{ id: number }>;

    const cuando = `${fechaLarga(inicio)} a las ${d.hora}`;
    await avisar({
      titulo: `${nombre.split(" ")[0]} pidió hora desde la web`,
      cuerpo: `${cuando.charAt(0).toUpperCase() + cuando.slice(1)} · ${laser ? "Láser · " : ""}${nombreTamano(tamano)} · ${nombreDonde(zona, lado)}\nConfírmala con cuánto dura, el valor final y el abono.`,
      url: `${PANEL}/cita/${fila.id}`,
      tag: `reserva-${fila.id}`,
    }).catch(() => undefined);

    return Response.json({ ok: true, cuando });
  } catch (e) {
    if (esChoqueDeHoras(e)) return error("Alguien acaba de tomar esa hora. Elige otra.", 409);
    console.error("reserva:", e);
    return error("No se pudo pedir la hora. Vuelve a intentarlo o escríbenos por WhatsApp.", 500);
  }
}
