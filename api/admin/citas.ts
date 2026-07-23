import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

function checkAuth(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const citas = await sql`
      SELECT * FROM agendamentos
      ORDER BY
        CASE WHEN estado IS NULL OR estado = 'pendiente' THEN 0
             WHEN estado = 'confirmada' THEN 1
             WHEN estado = 'completada' THEN 2
             ELSE 3
        END,
        fecha DESC,
        creado_en DESC
    `
    return Response.json({ success: true, citas })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener citas" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const { id, estado, admin_notas, duracion, hora, nombre, whatsapp, fecha, descripcion } = await request.json()
    if (!id) {
      return Response.json({ success: false, error: "ID requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)

    // Build the SET clause dynamically
    const sets: string[] = []
    const vals: any[] = []

    if (estado !== undefined) { sets.push(`estado = $${vals.length + 1}`); vals.push(estado) }
    if (admin_notas !== undefined) { sets.push(`admin_notas = $${vals.length + 1}`); vals.push(admin_notas) }
    if (duracion !== undefined) { sets.push(`duracion = $${vals.length + 1}`); vals.push(duracion) }
    if (hora !== undefined) { sets.push(`hora = $${vals.length + 1}`); vals.push(hora) }
    if (nombre !== undefined) { sets.push(`nombre = $${vals.length + 1}`); vals.push(nombre) }
    if (whatsapp !== undefined) { sets.push(`whatsapp = $${vals.length + 1}`); vals.push(whatsapp) }
    if (fecha !== undefined) { sets.push(`fecha = $${vals.length + 1}`); vals.push(fecha) }
    if (descripcion !== undefined) { sets.push(`descripcion = $${vals.length + 1}`); vals.push(descripcion) }

    if (sets.length === 0) {
      return Response.json({ success: false, error: "Sin campos a actualizar" }, { status: 400 })
    }

    vals.push(id)
    const query = `UPDATE agendamentos SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`
    const result = await sql.query(query, vals)

    return Response.json({ success: true, cita: result[0] || null })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al actualizar cita" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const { nombre, whatsapp, fecha, hora, duracion, descripcion, estado } = await request.json()

    if (!nombre || !whatsapp || !fecha) {
      return Response.json({ success: false, error: "Campos requeridos: nombre, whatsapp, fecha" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      INSERT INTO agendamentos (nombre, whatsapp, fecha, hora, duracion, descripcion, estado, admin_notas)
      VALUES (${nombre}, ${whatsapp}, ${fecha}, ${hora || ""}, ${duracion || 120}, ${descripcion || ""}, ${estado || "confirmada"}, ${""})
      RETURNING *
    `

    return Response.json({ success: true, cita: result[0] })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al crear cita" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return Response.json({ success: false, error: "ID requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    await sql`DELETE FROM agendamentos WHERE id = ${parseInt(id)}`

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al eliminar cita" }, { status: 500 })
  }
}
