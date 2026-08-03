import { neon } from "@neondatabase/serverless"
import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "edge" }

const MAX_NOMBRE = 100
const MAX_TEXTO = 500

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const publicacionId = parseInt(url.searchParams.get("publicacion_id") || "")
    if (isNaN(publicacionId)) {
      return Response.json({ success: false, error: "publicacion_id requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const comentarios = await sql`
      SELECT id, publicacion_id, nombre, texto, creado_en
      FROM publicacion_comentarios
      WHERE publicacion_id = ${publicacionId} AND eliminado = false
      ORDER BY creado_en DESC
      LIMIT 50
    `

    return Response.json({ success: true, comentarios })
  } catch (error) {
    console.error("publicacion-comentarios GET error:", String(error))
    return Response.json({ success: false, error: "Error al obtener comentarios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkRateLimit(`comentario:${getClientIp(request)}`, 5, 60_000)) {
    return tooManyRequests()
  }

  try {
    const { publicacion_id, nombre, texto } = await request.json()

    if (!publicacion_id || !nombre?.trim() || !texto?.trim()) {
      return Response.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }
    if (nombre.trim().length > MAX_NOMBRE) {
      return Response.json({ success: false, error: "Nombre demasiado largo" }, { status: 400 })
    }
    if (texto.trim().length > MAX_TEXTO) {
      return Response.json({ success: false, error: "Comentario demasiado largo (máx 500 caracteres)" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      INSERT INTO publicacion_comentarios (publicacion_id, nombre, texto)
      VALUES (${publicacion_id}, ${nombre.trim()}, ${texto.trim()})
      RETURNING id, publicacion_id, nombre, texto, creado_en
    `

    return Response.json({ success: true, comentario: result[0] })
  } catch (error) {
    console.error("publicacion-comentarios POST error:", String(error))
    return Response.json({ success: false, error: "Error al publicar comentario" }, { status: 500 })
  }
}
