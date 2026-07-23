import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (password === process.env.ADMIN_PASSWORD) {
      const token = btoa(`admin:${Date.now()}:${Math.random().toString(36).slice(2)}`)
      return Response.json({ success: true, token })
    }

    return Response.json({ success: false, error: "Contraseña incorrecta" }, { status: 401 })
  } catch {
    return Response.json({ success: false, error: "Error de autenticación" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const [cotRes, ageRes, visRes, galRes, pubRes, resRes] = await Promise.all([
      sql`SELECT COUNT(*)::int as total FROM cotizaciones`,
      sql`SELECT COUNT(*)::int as total FROM agendamentos WHERE estado IS NULL OR estado != 'cancelada'`,
      sql`SELECT COUNT(*)::int as total FROM visitas`,
      sql`SELECT COUNT(*)::int as total FROM galeria`,
      sql`SELECT COUNT(*)::int as total FROM publicaciones`,
      sql`SELECT COUNT(*)::int as total FROM resenas`,
    ])

    const recentCotizaciones = await sql`SELECT * FROM cotizaciones ORDER BY creado_en DESC LIMIT 5`
    const recentAgendamentos = await sql`SELECT * FROM agendamentos ORDER BY creado_en DESC LIMIT 10`

    const citasPendientes = (await sql`
      SELECT COUNT(*)::int as total FROM agendamentos
      WHERE (estado IS NULL OR estado = 'pendiente') AND fecha >= CURRENT_DATE
    `)[0]?.total || 0

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
