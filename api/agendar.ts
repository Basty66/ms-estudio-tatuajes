import { neon } from "@neondatabase/serverless"
import { notifyArtist, escapeHtml } from "./lib/telegram"
import { parseDateStr, todayStr } from "./lib/fecha"
import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "edge" }

const MAX_NOMBRE = 100
const MAX_DESCRIPCION = 1000

export async function POST(request: Request) {
  try {
    // Rate limit: máx 5 agendamientos por IP por minuto
    if (!checkRateLimit(`agendar:${getClientIp(request)}`, 5, 60_000)) {
      return tooManyRequests()
    }

    const { nombre, whatsapp, fecha, descripcion } = await request.json()

    if (!nombre || !whatsapp || !fecha) {
      return Response.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }
    if (typeof nombre !== "string" || nombre.length > MAX_NOMBRE) {
      return Response.json({ success: false, error: "Nombre inválido" }, { status: 400 })
    }
    if (descripcion && (typeof descripcion !== "string" || descripcion.length > MAX_DESCRIPCION)) {
      return Response.json({ success: false, error: "Descripción demasiado larga" }, { status: 400 })
    }
    if (!/^\+56\d{9}$/.test(whatsapp)) {
      return Response.json({ success: false, error: "WhatsApp inválido" }, { status: 400 })
    }

    // Parsear fecha (solo se acepta YYYY-MM-DD) sin bug de zona horaria
    const parsed = parseDateStr(String(fecha))
    if (!parsed) {
      return Response.json({ success: false, error: "Fecha inválida" }, { status: 400 })
    }
    const { dateStr, dayOfWeek } = parsed

    if (dateStr < todayStr()) {
      return Response.json({ success: false, error: "No se puede agendar en una fecha pasada" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)

    // Comprobar template semanal
    const template = await sql`
      SELECT * FROM disponibilidad WHERE dia_semana = ${dayOfWeek}
    `
    if (template.length === 0 || !template[0].activo) {
      return Response.json({ success: false, error: "Este día no está disponible" }, { status: 400 })
    }

    // Comprobar excepción de fecha
    const override = await sql`
      SELECT * FROM excepciones_fecha WHERE fecha = ${dateStr}::date
    `
    if (override.length > 0 && !override[0].activo) {
      return Response.json({ success: false, error: "Este día no está disponible" }, { status: 400 })
    }

    const maxSlots = override.length > 0 && override[0].slots_max !== null
      ? override[0].slots_max
      : template[0].slots_max

    // Inserción condicional atómica: solo inserta si aún hay cupo.
    // Esto evita la race condition de contar y luego insertar en pasos separados.
    const inserted = await sql`
      INSERT INTO agendamentos (nombre, whatsapp, fecha, descripcion, estado)
      SELECT ${nombre}, ${whatsapp}, ${dateStr}, ${descripcion || ""}, 'pendiente'
      WHERE (
        SELECT COUNT(*) FROM agendamentos
        WHERE fecha = ${dateStr}
          AND (estado IS NULL OR estado != 'cancelada')
      ) < ${maxSlots}
      RETURNING id
    `

    if (inserted.length === 0) {
      return Response.json({ success: false, error: "Este día ya está completo" }, { status: 400 })
    }

    await notifyArtist(
      `<b>🔔 NUEVA CITA</b>\n` +
      `<b>Cliente:</b> ${escapeHtml(nombre)}\n` +
      `<b>Fecha:</b> ${dateStr}\n` +
      `<b>WhatsApp:</b> <a href="https://wa.me/${whatsapp.replace(/\+/g, '')}">${whatsapp}</a>\n` +
      (descripcion ? `<b>Descripción:</b> ${escapeHtml(descripcion)}` : "")
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al agendar la cita" }, { status: 500 })
  }
}
