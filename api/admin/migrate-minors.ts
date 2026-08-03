import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

export async function GET(request: Request) {
  try {
    // Solo permitir con auth admin
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)

    // Ejecutar migración
    await sql`
      ALTER TABLE consentimientos 
      ADD COLUMN IF NOT EXISTS menor_edad BOOLEAN DEFAULT false
    `
    await sql`
      ALTER TABLE consentimientos 
      ADD COLUMN IF NOT EXISTS nombre_padre TEXT DEFAULT ''
    `
    await sql`
      ALTER TABLE consentimientos 
      ADD COLUMN IF NOT EXISTS rut_padre TEXT DEFAULT ''
    `
    await sql`
      ALTER TABLE consentimientos 
      ADD COLUMN IF NOT EXISTS carnet_padre_url TEXT DEFAULT ''
    `

    return Response.json({ success: true, message: "Migración ejecutada correctamente" })
  } catch (error) {
    console.error("Migration error:", String(error))
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
}
