import { neon } from "@neondatabase/serverless"
import { verifyRequest, unauthorized } from "../lib/auth"

export const config = { runtime: "edge" }

// GET: todos los testimonios (admin)
export async function GET(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const testimonios = await sql`SELECT * FROM testimonios ORDER BY creado_en DESC`
    return Response.json({ success: true, testimonios })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener testimonios" }, { status: 500 })
  }
}

// PATCH: aprobar/rechazar testimonio
export async function PATCH(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const { id, aprobado } = await request.json()
    if (!id) {
      return Response.json({ success: false, error: "ID requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      UPDATE testimonios 
      SET aprobado = ${!!aprobado}
      WHERE id = ${id}
      RETURNING *
    `

    return Response.json({ success: true, testimonio: result[0] })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al actualizar" }, { status: 500 })
  }
}

// DELETE: eliminar testimonio
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
    await sql`DELETE FROM testimonios WHERE id = ${parseInt(id)}`
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al eliminar" }, { status: 500 })
  }
}
