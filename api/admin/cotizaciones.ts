import { neon } from "@neondatabase/serverless"
import { verifyRequest, unauthorized } from "../lib/auth"

export const config = { runtime: "edge" }

export async function GET(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const cotizaciones = await sql`SELECT * FROM cotizaciones ORDER BY created_at DESC`
    return Response.json({ success: true, cotizaciones })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener cotizaciones" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const { id, estado } = await request.json()
    if (!id) {
      return Response.json({ success: false, error: "ID requerido" }, { status: 400 })
    }

    if (!["pendiente", "aceptada", "rechazada"].includes(estado)) {
      return Response.json({ success: false, error: "Estado inválido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      UPDATE cotizaciones SET estado = ${estado} WHERE id = ${id} RETURNING *
    `

    return Response.json({ success: true, cotizacion: result[0] || null })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al actualizar cotización" }, { status: 500 })
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
    await sql`DELETE FROM cotizaciones WHERE id = ${parseInt(id)}`

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al eliminar cotización" }, { status: 500 })
  }
}
