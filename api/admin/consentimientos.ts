import { neon } from "@neondatabase/serverless"
import { verifyRequest, unauthorized } from "../lib/auth"

export const config = { runtime: "edge" }

export async function GET(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    // Detalle de un consentimiento (incluye la firma)
    if (id) {
      if (isNaN(parseInt(id))) {
        return Response.json({ success: false, error: "ID inválido" }, { status: 400 })
      }
      const rows = await sql`SELECT * FROM consentimientos WHERE id = ${parseInt(id)} LIMIT 1`
      return Response.json({ success: true, consentimiento: rows[0] || null })
    }

    // Listado (sin la firma para aligerar la respuesta)
    const consentimientos = await sql`
      SELECT id, nombre, rut, telefono, email, zona_tatuaje,
             alergias, problemas_coagulacion, diabetes, enfermedad_cardiaca,
             epilepsia, vih_hepatitis, embarazo_lactancia,
             agendamiento_id, firmado_en, creado_en
      FROM consentimientos
      ORDER BY creado_en DESC
    `
    return Response.json({ success: true, consentimientos })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener consentimientos" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id || isNaN(parseInt(id))) {
      return Response.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    await sql`DELETE FROM consentimientos WHERE id = ${parseInt(id)}`
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al eliminar" }, { status: 500 })
  }
}
