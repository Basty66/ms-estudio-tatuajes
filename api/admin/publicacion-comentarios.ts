import { neon } from "@neondatabase/serverless"
import { verifyRequest, unauthorized } from "../lib/auth"

export const config = { runtime: "edge" }

export async function GET(request: Request) {
  if (!(await verifyRequest(request))) return unauthorized()

  try {
    const url = new URL(request.url)
    const publicacionId = url.searchParams.get("publicacion_id")

    const sql = neon(process.env.NEON_DATABASE_URL!)

    if (publicacionId) {
      const id = parseInt(publicacionId)
      const comentarios = await sql`
        SELECT c.*, p.titulo as publicacion_titulo
        FROM publicacion_comentarios c
        JOIN publicaciones p ON p.id = c.publicacion_id
        WHERE c.publicacion_id = ${id}
        ORDER BY c.creado_en DESC
      `
      return Response.json({ success: true, comentarios })
    }

    const comentarios = await sql`
      SELECT c.*, p.titulo as publicacion_titulo
      FROM publicacion_comentarios c
      JOIN publicaciones p ON p.id = c.publicacion_id
      WHERE c.eliminado = false
      ORDER BY c.creado_en DESC
      LIMIT 100
    `

    return Response.json({ success: true, comentarios })
  } catch (error) {
    console.error("admin publicacion-comentarios GET error:", String(error))
    return Response.json({ success: false, error: "Error al obtener comentarios" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await verifyRequest(request))) return unauthorized()

  try {
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get("id") || "")
    if (isNaN(id)) {
      return Response.json({ success: false, error: "ID requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    await sql`UPDATE publicacion_comentarios SET eliminado = true WHERE id = ${id}`

    return Response.json({ success: true })
  } catch (error) {
    console.error("admin publicacion-comentarios DELETE error:", String(error))
    return Response.json({ success: false, error: "Error al eliminar" }, { status: 500 })
  }
}
