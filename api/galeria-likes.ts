import { neon } from "@neondatabase/serverless"
import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "edge" }

function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") || "unknown"
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const galeriaId = parseInt(url.searchParams.get("galeria_id") || "")
    if (isNaN(galeriaId)) {
      return Response.json({ success: false, error: "galeria_id requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const ip = getClientId(request)

    const [likesResult, userLike] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM galeria_likes WHERE galeria_id = ${galeriaId}`,
      sql`SELECT id FROM galeria_likes WHERE galeria_id = ${galeriaId} AND ip = ${ip}`,
    ])

    return Response.json({
      success: true,
      count: likesResult[0]?.count || 0,
      liked: userLike.length > 0,
    })
  } catch (error) {
    console.error("galeria-likes GET error:", String(error))
    return Response.json({ success: false, error: "Error al obtener likes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkRateLimit(`galeria-like:${getClientIp(request)}`, 30, 60_000)) {
    return tooManyRequests()
  }

  try {
    const { galeria_id } = await request.json()
    if (!galeria_id) {
      return Response.json({ success: false, error: "galeria_id requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const ip = getClientId(request)

    const existing = await sql`SELECT id FROM galeria_likes WHERE galeria_id = ${galeria_id} AND ip = ${ip}`

    if (existing.length > 0) {
      await sql`DELETE FROM galeria_likes WHERE id = ${existing[0].id}`
      const count = await sql`SELECT COUNT(*)::int as count FROM galeria_likes WHERE galeria_id = ${galeria_id}`
      return Response.json({ success: true, liked: false, count: count[0]?.count || 0 })
    } else {
      await sql`INSERT INTO galeria_likes (galeria_id, ip) VALUES (${galeria_id}, ${ip})`
      const count = await sql`SELECT COUNT(*)::int as count FROM galeria_likes WHERE galeria_id = ${galeria_id}`
      return Response.json({ success: true, liked: true, count: count[0]?.count || 0 })
    }
  } catch (error) {
    console.error("galeria-likes POST error:", String(error))
    return Response.json({ success: false, error: "Error al procesar like" }, { status: 500 })
  }
}
