import { neon } from "@neondatabase/serverless"
import { put } from "@vercel/blob"

export const config = { runtime: "edge" }

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const nombre = formData.get("nombre") as string
    const whatsapp = formData.get("whatsapp") as string
    const estilo = formData.get("estilo") as string
    const zona = formData.get("zona") as string
    const tamano = formData.get("tamano") as string
    const file = formData.get("imagen") as File | null

    let imageUrl = ""
    if (file && file.size > 0) {
      const blob = await put(`cotizaciones/${Date.now()}_${file.name}`, file, {
        access: "public",
      })
      imageUrl = blob.url
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    await sql`
      INSERT INTO cotizaciones (nombre, whatsapp, estilo, zona, tamano, imagen_url)
      VALUES (${nombre}, ${whatsapp}, ${estilo}, ${zona}, ${tamano}, ${imageUrl})
    `

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al guardar la cotización" }, { status: 500 })
  }
}
