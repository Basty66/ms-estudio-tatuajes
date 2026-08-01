import { neon } from "@neondatabase/serverless"
import { createToken, verifyRequest, unauthorized } from "../lib/auth"

export const config = { runtime: "edge" }

/**
 * Comparación en tiempo constante para evitar timing attacks al comparar la contraseña.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const expected = process.env.ADMIN_PASSWORD || ""

    if (typeof password === "string" && expected && safeEqual(password, expected)) {
      const token = await createToken()
      return Response.json({ success: true, token })
    }

    return Response.json({ success: false, error: "Contraseña incorrecta" }, { status: 401 })
  } catch {
    return Response.json({ success: false, error: "Error de autenticación" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const cotRes = await sql`SELECT COUNT(*)::int as total FROM cotizaciones`
    const ageRes = await sql`SELECT COUNT(*)::int as total FROM agendamentos WHERE estado IS NULL OR estado != 'cancelada'`
    const visRes = await sql`SELECT COUNT(*)::int as total FROM visitas`
    const galRes = await sql`SELECT COUNT(*)::int as total FROM galeria`
    const pubRes = await sql`SELECT COUNT(*)::int as total FROM publicaciones`
    const resRes = await sql`SELECT COUNT(*)::int as total FROM resenas`

    const recentCotizaciones = await sql`SELECT * FROM cotizaciones ORDER BY created_at DESC LIMIT 5`
    const recentAgendamentos = await sql`SELECT * FROM agendamentos ORDER BY creado_en DESC LIMIT 10`

    const pendientes = await sql`
      SELECT COUNT(*)::int as total FROM agendamentos
      WHERE (estado IS NULL OR estado = 'pendiente')
    `
    const citasPendientes = pendientes[0]?.total || 0

    return Response.json({
      success: true,
      metrics: {
        cotizaciones: cotRes[0]?.total || 0,
        agendamentos: ageRes[0]?.total || 0,
        visitas: visRes[0]?.total || 0,
        galeria: galRes[0]?.total || 0,
        publicaciones: pubRes[0]?.total || 0,
        resenas: resRes[0]?.total || 0,
        citasPendientes,
      },
      recentCotizaciones,
      recentAgendamentos,
    })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener métricas" }, { status: 500 })
  }
}
