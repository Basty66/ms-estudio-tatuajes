import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

function checkAuth(request: Request): boolean {
  const auth = request.headers.get("authorization")
  const token = auth?.replace("Bearer ", "")
  const decoded = token ? atob(token) : ""
  return decoded === process.env.ADMIN_PASSWORD
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const year = url.searchParams.get("year")
    const month = url.searchParams.get("month")

    const sql = neon(process.env.NEON_DATABASE_URL!)

    const template = await sql`SELECT * FROM disponibilidad ORDER BY dia_semana`

    let overrides
    if (year && month) {
      const y = parseInt(year)
      const m = parseInt(month)
      const firstDay = `${y}-${String(m + 1).padStart(2, "0")}-01`
      const lastDayObj = new Date(y, m + 1, 0)
      const lastDay = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDayObj.getDate()).padStart(2, "0")}`
      overrides = await sql`
        SELECT * FROM excepciones_fecha
        WHERE fecha >= ${firstDay}::date AND fecha <= ${lastDay}::date
        ORDER BY fecha
      `
    } else {
      overrides = await sql`SELECT * FROM excepciones_fecha ORDER BY fecha DESC LIMIT 31`
    }

    const citas = await sql`
      SELECT * FROM agendamentos
      WHERE (estado IS NULL OR estado != 'cancelada')
      ORDER BY fecha ASC, creado_en ASC
    `

    return Response.json({ success: true, template, overrides, citas })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener disponibilidad" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const data = await request.json()
    const sql = neon(process.env.NEON_DATABASE_URL!)

    // Update weekly template
    if (data.template) {
      for (const t of data.template) {
        await sql`
          INSERT INTO disponibilidad (dia_semana, activo, hora_inicio, hora_fin, slots_max)
          VALUES (${t.dia_semana}, ${t.activo}, ${t.hora_inicio || "10:00"}, ${t.hora_fin || "19:00"}, ${t.slots_max || 3})
          ON CONFLICT (dia_semana) DO UPDATE SET
            activo = ${t.activo},
            hora_inicio = ${t.hora_inicio || "10:00"},
            hora_fin = ${t.hora_fin || "19:00"},
            slots_max = ${t.slots_max || 3}
        `
      }
    }

    // Save date override
    if (data.override) {
      await sql`
        INSERT INTO excepciones_fecha (fecha, slots_max, activo, motivo)
        VALUES (${data.override.fecha}::date, ${data.override.slots_max}, ${data.override.activo ?? true}, ${data.override.motivo || ""})
        ON CONFLICT (fecha) DO UPDATE SET
          slots_max = ${data.override.slots_max},
          activo = ${data.override.activo ?? true},
          motivo = ${data.override.motivo || ""}
      `
    }

    // Delete override
    if (data.deleteOverride) {
      await sql`DELETE FROM excepciones_fecha WHERE fecha = ${data.deleteOverride}::date`
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al guardar" }, { status: 500 })
  }
}
