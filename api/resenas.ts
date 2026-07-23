import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

export async function GET() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const resenas = await sql`SELECT * FROM resenas ORDER BY creado_en DESC`
    return Response.json({ success: true, resenas })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener reseñas" }, { status: 500 })
  }
}
