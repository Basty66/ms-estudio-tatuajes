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
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const reels = await sql`SELECT * FROM reels ORDER BY orden ASC, creado_en DESC`
    return Response.json({ success: true, reels })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener reels" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const { url, titulo, plataforma, video_url } = await request.json()

    if (!url) {
      return Response.json({ success: false, error: "URL requerida" }, { status: 400 })
    }
    if (!["instagram", "tiktok", "youtube"].includes(plataforma)) {
      return Response.json({ success: false, error: "plataforma debe ser instagram, tiktok o youtube" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      INSERT INTO reels (url, titulo, plataforma)
      VALUES (${url}, ${titulo || ""}, ${plataforma})
      RETURNING *
    `

    return Response.json({ success: true, reel: result[0] })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al crear reel" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id || isNaN(parseInt(id))) {
      return Response.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    await sql`DELETE FROM reels WHERE id = ${parseInt(id)}`
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al eliminar" }, { status: 500 })
  }
}
