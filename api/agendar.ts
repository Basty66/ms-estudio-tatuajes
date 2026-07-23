import { neon } from "@neondatabase/serverless"
import { notifyArtist } from "./lib/telegram"

export const config = { runtime: "edge" }

export async function POST(request: Request) {
  try {
    const { nombre, whatsapp, fecha, descripcion } = await request.json()

    if (!nombre || !whatsapp || !fecha) {
      return Response.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }
    if (!/^\+56\d{9}$/.test(whatsapp)) {
      return Response.json({ success: false, error: "WhatsApp inválido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)

    // Parse fecha - it could be "DD de Month de YYYY" or "YYYY-MM-DD"
    let dateObj: Date
    if (fecha.includes("de")) {
      // Spanish format: "12 de julio de 2026"
      const parts = fecha.split(" de ")
      const day = parseInt(parts[0])
      const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
      const month = monthNames.indexOf(parts[1].toLowerCase())
      const year = parseInt(parts[2])
      dateObj = new Date(year, month, day)
    } else {
      dateObj = new Date(fecha + "T12:00:00")
    }

    const dateStr = dateObj.toISOString().split("T")[0]
    const dayOfWeek = dateObj.getDay()

    if (isNaN(dayOfWeek)) {
      return Response.json({ success: false, error: "Fecha inválida" }, { status: 400 })
    }

    const todayStr = new Date().toISOString().split("T")[0]
    if (dateStr < todayStr) {
      return Response.json({ success: false, error: "No se puede agendar en una fecha pasada" }, { status: 400 })
    }

    // Check availability template
    const template = await sql`
      SELECT * FROM disponibilidad WHERE dia_semana = ${dayOfWeek}
    `
    if (template.length === 0 || !template[0].activo) {
      return Response.json({ success: false, error: "Este día no está disponible" }, { status: 400 })
    }

    // Check for date override
    const override = await sql`
      SELECT * FROM excepciones_fecha WHERE fecha = ${dateStr}::date
    `
    if (override.length > 0 && !override[0].activo) {
      return Response.json({ success: false, error: "Este día no está disponible" }, { status: 400 })
    }

    const maxSlots = override.length > 0 && override[0].slots_max !== null
      ? override[0].slots_max
      : template[0].slots_max

    // Count existing non-cancelled appointments for this date
    const existing = await sql`
      SELECT COUNT(*)::int as count FROM agendamentos
      WHERE fecha = ${dateStr}
        AND (estado IS NULL OR estado != 'cancelada')
    `
    const bookedCount = existing[0]?.count || 0

    if (bookedCount >= maxSlots) {
      return Response.json({ success: false, error: "Este día ya está completo" }, { status: 400 })
    }

    // All good, insert
    await sql`
      INSERT INTO agendamentos (nombre, whatsapp, fecha, descripcion, estado)
      VALUES (${nombre}, ${whatsapp}, ${dateStr}, ${descripcion || ""}, 'pendiente')
    `

    await notifyArtist(
      `<b>🔔 NUEVA CITA</b>\n` +
      `<b>Cliente:</b> ${nombre}\n` +
      `<b>Fecha:</b> ${dateStr}\n` +
      `<b>WhatsApp:</b> <a href="https://wa.me/${whatsapp.replace(/\+/g, '')}">${whatsapp}</a>\n` +
      (descripcion ? `<b>Descripción:</b> ${descripcion}` : "")
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al agendar la cita" }, { status: 500 })
  }
}
