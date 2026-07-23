import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

export async function POST(request: Request) {
  try {
    const { ruta } = await request.json()
    const sql = neon(process.env.NEON_DATABASE_URL!)
    await sql`INSERT INTO visitas (ruta) VALUES (${ruta || "/"})`
    return Response.json({ success: true })
  } catch {
    return Response.json({ success: false })
  }
}
