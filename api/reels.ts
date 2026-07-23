import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

export async function GET() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const reels = await sql`SELECT * FROM reels WHERE activo = true ORDER BY orden ASC, creado_en DESC`
    return Response.json({ success: true, reels })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener reels" }, { status: 500 })
  }
}
