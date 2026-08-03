import { neon } from "@neondatabase/serverless"
import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "edge" }

const MAX_NOMBRE = 100
const MAX_TEXTO = 500

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const galeriaId = parseInt(url.searchParams.get("galeria_id") || "")
    if (isNaN(galeriaId)) {
      return Response.json({ success: false, error: "galeria_id requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const comentarios = await sql`
      SELECT id, galeria_id, nombre, texto, creado_en
      FROM galeria_comentarios
      WHERE galeria_id = ${galeriaId} AND eliminado = false
      ORDER BY creado_en DESC
      LIMIT 50
    `

    return Response.json({ success: true, comentarios })
  } catch (error) {
    console.error("galeria-comentarios GET error:", String(error))
    return Response.json({ success: false, error: "Error al obtener comentarios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkRateLimit(`galeria-comentario:${getClientIp(request)}`, 5, 60_000)) {
    return tooManyRequests()
  }

  try {
    const { galeria_id, nombre, texto } = await request.json()

    if (!galeria_id || !nombre?.trim() || !texto?.trim()) {
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
      INSERT INTO galeria_comentarios (galeria_id, nombre, texto)
      VALUES (${galeria_id}, ${nombre.trim()}, ${texto.trim()})
      RETURNING id, galeria_id, nombre, texto, creado_en
    `

    return Response.json({ success: true, comentario: result[0] })
  } catch (error) {
    console.error("galeria-comentarios POST error:", String(error))
    return Response.json({ success: false, error: "Error al publicar comentario" }, { status: 500 })
  }
}
