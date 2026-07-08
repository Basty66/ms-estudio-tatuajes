import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

export async function POST(request: Request) {
  try {
    const { nombre, whatsapp, fecha, descripcion } = await request.json()

    const sql = neon(process.env.NEON_DATABASE_URL!)

    await sql`
      INSERT INTO agendamentos (nombre, whatsapp, fecha, descripcion)
      VALUES (${nombre}, ${whatsapp}, ${fecha}, ${descripcion || ""})
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al agendar la cita" }, { status: 500 })
  }
}
