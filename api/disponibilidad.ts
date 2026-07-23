import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const year = parseInt(url.searchParams.get("year") || "")
    const month = parseInt(url.searchParams.get("month") || "")
    if (isNaN(year) || isNaN(month)) {
      return Response.json({ success: false, error: "year y month requeridos" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)

    // Get first and last day of month
    const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`
    const lastDayObj = new Date(year, month + 1, 0)
    const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDayObj.getDate()).padStart(2, "0")}`

    // Get availability template
    const template = await sql`SELECT * FROM disponibilidad ORDER BY dia_semana`

    // Get date overrides
    const overrides = await sql`
      SELECT * FROM excepciones_fecha
      WHERE fecha >= ${firstDay}::date AND fecha <= ${lastDay}::date
    `

    // Get existing appointments for the month (non-cancelled)
    const citas = await sql`
      SELECT fecha, COUNT(*)::int as count
      FROM agendamentos
      WHERE fecha >= ${firstDay} AND fecha <= ${lastDay}
        AND (estado IS NULL OR estado != 'cancelada')
      GROUP BY fecha
    `

    // Build a map of date -> booked slots
    const bookedMap: Record<string, number> = {}
    for (const c of citas) {
      const d = c.fecha instanceof Date ? c.fecha.toISOString().split("T")[0] : String(c.fecha).split("T")[0]
      bookedMap[d] = c.count
    }

    // Build override map
    const overrideMap: Record<string, { slots_max: number | null; activo: boolean; motivo: string }> = {}
    for (const o of overrides) {
      const d = o.fecha instanceof Date ? o.fecha.toISOString().split("T")[0] : String(o.fecha).split("T")[0]
      overrideMap[d] = { slots_max: o.slots_max, activo: o.activo, motivo: o.motivo }
    }

    // Generate days array
    const days: { date: string; day: number; dayOfWeek: number; available: boolean; booked: number; max: number }[] = []
    for (let d = 1; d <= lastDayObj.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const dayOfWeek = new Date(year, month, d).getDay()
      const isPast = new Date(year, month, d) < new Date(new Date().toDateString())

      // Get max slots for this day
      const override = overrideMap[dateStr]
      let maxSlots: number | null = null

      if (override) {
        if (!override.activo) {
          days.push({ date: dateStr, day: d, dayOfWeek, available: false, booked: 0, max: 0 })
          continue
        }
        maxSlots = override.slots_max
      }

      if (maxSlots === null) {
        const templateEntry = template.find((t: any) => t.dia_semana === dayOfWeek)
        if (!templateEntry || !templateEntry.activo) {
          days.push({ date: dateStr, day: d, dayOfWeek, available: false, booked: 0, max: 0 })
          continue
        }
        maxSlots = templateEntry.slots_max
      }

      if (isPast) {
        days.push({ date: dateStr, day: d, dayOfWeek, available: false, booked: 0, max: 0 })
        continue
      }

      const booked = bookedMap[dateStr] || 0
      const available = booked < maxSlots

      days.push({ date: dateStr, day: d, dayOfWeek, available, booked, max: maxSlots })
    }

    return Response.json({ success: true, days, template, overrides })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener disponibilidad" }, { status: 500 })
  }
}
