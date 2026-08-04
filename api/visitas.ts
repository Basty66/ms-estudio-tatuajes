import { neon } from "@neondatabase/serverless"
import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "edge" }

const MAX_RUTA = 200

export async function POST(request: Request) {
  if (!checkRateLimit(`visitas:${getClientIp(request)}`, 30, 60_000)) {
    return tooManyRequests()
  }

  try {
    const { ruta } = await request.json()
    const rutaStr = typeof ruta === "string" ? ruta.slice(0, MAX_RUTA) : "/"
    const sql = neon(process.env.NEON_DATABASE_URL!)
    await sql`INSERT INTO visitas (ruta) VALUES (${rutaStr})`
    return Response.json({ success: true })
  } catch (error) {
    console.error("visitas error:", String(error))
    return Response.json({ success: false, error: "Error al registrar visita" }, { status: 500 })
  }
}
