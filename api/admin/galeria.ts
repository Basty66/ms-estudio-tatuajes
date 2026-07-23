import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

function checkAuth(request: Request): boolean {
  const auth = request.headers.get("authorization")
  const token = auth?.replace("Bearer ", "")
  const decoded = token ? atob(token) : ""
  return decoded === process.env.ADMIN_PASSWORD
}

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const url = new URL(request.url)
    const estilo = url.searchParams.get("estilo")

    let images
    if (estilo && estilo !== "todos") {
      images = sql`SELECT * FROM galeria WHERE estilo = ${estilo} ORDER BY orden ASC, creado_en DESC`
    } else {
      images = sql`SELECT * FROM galeria ORDER BY orden ASC, creado_en DESC`
    }

    return Response.json({ success: true, images: await images })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener imágenes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const { imagen_url, estilo, titulo, descripcion, orden } = await request.json()

    if (!imagen_url) {
      return Response.json({ success: false, error: "Se requiere imagen" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      INSERT INTO galeria (imagen_url, estilo, titulo, descripcion, orden)
      VALUES (${imagen_url}, ${estilo || "general"}, ${titulo || ""}, ${descripcion || ""}, ${orden || 0})
      RETURNING *
    `

    return Response.json({ success: true, image: result[0] })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al subir imagen" }, { status: 500 })
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
    await sql`DELETE FROM galeria WHERE id = ${parseInt(id)}`

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
    const { id, titulo, descripcion, estilo, orden } = await request.json()
    if (!id) {
      return Response.json({ success: false, error: "ID requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      UPDATE galeria
      SET titulo = ${titulo || ""}, descripcion = ${descripcion || ""}, estilo = ${estilo || "general"}, orden = ${orden || 0}
      WHERE id = ${id}
      RETURNING *
    `

    return Response.json({ success: true, image: result[0] })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al actualizar" }, { status: 500 })
  }
}
