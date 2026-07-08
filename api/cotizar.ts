import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

export async function POST(request: Request) {
  try {
    const { nombre, whatsapp, estilo, zona, tamano, imagenBase64 } = await request.json()

    if (!nombre || !whatsapp || !estilo || !zona || !tamano) {
      return Response.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }
    if (!/^\+56\d{9}$/.test(whatsapp)) {
      return Response.json({ success: false, error: "WhatsApp inválido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    await sql`
      INSERT INTO cotizaciones (nombre, whatsapp, estilo, zona, tamano, imagen_url)
      VALUES (${nombre}, ${whatsapp}, ${estilo}, ${zona}, ${tamano}, ${imagenBase64 || ""})
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al guardar la cotización" }, { status: 500 })
  }
}
