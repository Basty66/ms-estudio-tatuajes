import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

function checkAuth(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`
}

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const posts = await sql`SELECT * FROM publicaciones ORDER BY creado_en DESC`
    return Response.json({ success: true, posts })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener publicaciones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const { titulo, contenido, imagen_url, tipo, publicado } = await request.json()

    if (!titulo) {
      return Response.json({ success: false, error: "Título requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      INSERT INTO publicaciones (titulo, contenido, imagen_url, tipo, publicado)
      VALUES (${titulo}, ${contenido || ""}, ${imagen_url || ""}, ${tipo || "post"}, ${publicado ?? true})
      RETURNING *
    `

    return Response.json({ success: true, post: result[0] })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al crear publicación" }, { status: 500 })
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
    await sql`DELETE FROM publicaciones WHERE id = ${parseInt(id)}`

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al eliminar" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const { id, titulo, contenido, imagen_url, tipo, publicado } = await request.json()
    if (!id) {
      return Response.json({ success: false, error: "ID requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      UPDATE publicaciones
      SET titulo = ${titulo || ""}, contenido = ${contenido || ""}, imagen_url = ${imagen_url || ""}, tipo = ${tipo || "post"}, publicado = ${publicado ?? true}
      WHERE id = ${id}
      RETURNING *
    `

    return Response.json({ success: true, post: result[0] })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al actualizar" }, { status: 500 })
  }
}
