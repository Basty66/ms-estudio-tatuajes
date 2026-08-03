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
    const publicacionId = parseInt(url.searchParams.get("publicacion_id") || "")
    if (isNaN(publicacionId)) {
      return Response.json({ success: false, error: "publicacion_id requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const ip = getClientId(request)

    const [likesResult, userLike] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM publicacion_likes WHERE publicacion_id = ${publicacionId}`,
      sql`SELECT id FROM publicacion_likes WHERE publicacion_id = ${publicacionId} AND ip = ${ip}`,
    ])

    return Response.json({
      success: true,
      count: likesResult[0]?.count || 0,
      liked: userLike.length > 0,
    })
  } catch (error) {
    console.error("publicacion-likes GET error:", String(error))
    return Response.json({ success: false, error: "Error al obtener likes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkRateLimit(`like:${getClientIp(request)}`, 30, 60_000)) {
    return tooManyRequests()
  }

  try {
    const { publicacion_id } = await request.json()
    if (!publicacion_id) {
      return Response.json({ success: false, error: "publicacion_id requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const ip = getClientId(request)

    const existing = await sql`SELECT id FROM publicacion_likes WHERE publicacion_id = ${publicacion_id} AND ip = ${ip}`

    if (existing.length > 0) {
      await sql`DELETE FROM publicacion_likes WHERE id = ${existing[0].id}`
      const count = await sql`SELECT COUNT(*)::int as count FROM publicacion_likes WHERE publicacion_id = ${publicacion_id}`
      return Response.json({ success: true, liked: false, count: count[0]?.count || 0 })
    } else {
      await sql`INSERT INTO publicacion_likes (publicacion_id, ip) VALUES (${publicacion_id}, ${ip})`
      const count = await sql`SELECT COUNT(*)::int as count FROM publicacion_likes WHERE publicacion_id = ${publicacion_id}`
      return Response.json({ success: true, liked: true, count: count[0]?.count || 0 })
    }
  } catch (error) {
    console.error("publicacion-likes POST error:", String(error))
    return Response.json({ success: false, error: "Error al procesar like" }, { status: 500 })
  }
}
