import { neon } from "@neondatabase/serverless"
import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "edge" }

const MAX_NOMBRE = 100
const MAX_TEXTO = 1000

// GET: testimonials aprobados (público)
export async function GET() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const testimonios = await sql`
      SELECT * FROM testimonios 
      WHERE aprobado = true 
      ORDER BY creado_en DESC 
      LIMIT 20
    `
    return Response.json({ success: true, testimonios })
  } catch (error) {
    console.error("testimonios GET error:", String(error))
    return Response.json({ success: false, error: "Error al obtener testimonios" }, { status: 500 })
  }
}

// POST: enviar testimonio (público, con rate limit)
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!checkRateLimit(`testimonio:${ip}`, 3, 60_000)) {
      return tooManyRequests()
    }

    const { nombre, texto, rating } = await request.json()

    if (!nombre || !texto) {
      return Response.json(
        { success: false, error: "Nombre y comentario son obligatorios" },
        { status: 400 },
      )
    }

    if (typeof nombre !== "string" || nombre.length > MAX_NOMBRE) {
      return Response.json(
        { success: false, error: "Nombre inválido" },
        { status: 400 },
      )
    }

    if (typeof texto !== "string" || texto.length > MAX_TEXTO) {
      return Response.json(
        { success: false, error: "Comentario demasiado largo" },
        { status: 400 },
      )
    }

    const validRating = Math.min(5, Math.max(1, Number(rating) || 5))

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      INSERT INTO testimonios (nombre, texto, rating)
      VALUES (${nombre.trim()}, ${texto.trim()}, ${validRating})
      RETURNING id
    `

    return Response.json({
      success: true,
      message: "Tu testimonio fue enviado y será visible tras ser aprobado por el estudio.",
      id: result[0]?.id,
    })
  } catch (error) {
    console.error("testimonios POST error:", String(error))
    return Response.json(
      { success: false, error: "Error al enviar el testimonio" },
      { status: 500 },
    )
  }
}
