import { neon } from "@neondatabase/serverless"
import { notifyArtist, escapeHtml } from "./lib/telegram"
import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "edge" }

const MAX_NOMBRE = 100
const MAX_CAMPO = 60
// Límite defensivo para no guardar imágenes base64 enormes en la DB.
// Lo ideal es subir la imagen a un blob store (Vercel Blob / S3 / Cloudinary)
// y guardar solo la URL. Mientras tanto, rechazamos base64 grandes.
const MAX_IMAGEN_LEN = 200_000 // ~150 KB de imagen

export async function POST(request: Request) {
  try {
    // Rate limit: máx 5 cotizaciones por IP por minuto
    if (!checkRateLimit(`cotizar:${getClientIp(request)}`, 5, 60_000)) {
      return tooManyRequests()
    }

    const { nombre, whatsapp, estilo, zona, tamano, imagenBase64 } = await request.json()

    if (!nombre || !whatsapp || !estilo || !zona || !tamano) {
      return Response.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }
    if (typeof nombre !== "string" || nombre.length > MAX_NOMBRE) {
      return Response.json({ success: false, error: "Nombre inválido" }, { status: 400 })
    }
    for (const [campo, valor] of Object.entries({ estilo, zona, tamano })) {
      if (typeof valor !== "string" || valor.length > MAX_CAMPO) {
        return Response.json({ success: false, error: `Campo inválido: ${campo}` }, { status: 400 })
      }
    }
    if (!/^\+56\d{9}$/.test(whatsapp)) {
      return Response.json({ success: false, error: "WhatsApp inválido" }, { status: 400 })
    }

    let imagen = ""
    if (imagenBase64) {
      if (typeof imagenBase64 !== "string" || imagenBase64.length > MAX_IMAGEN_LEN) {
        return Response.json(
          { success: false, error: "La imagen es demasiado grande. Envíala por WhatsApp." },
          { status: 400 },
        )
      }
      imagen = imagenBase64
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)

    await sql`
      INSERT INTO cotizaciones (nombre, whatsapp, estilo, zona, tamano, imagen_url)
      VALUES (${nombre}, ${whatsapp}, ${estilo}, ${zona}, ${tamano}, ${imagen})
    `

    await notifyArtist(
      `<b>💰 NUEVA COTIZACIÓN</b>\n` +
      `<b>Cliente:</b> ${escapeHtml(nombre)}\n` +
      `<b>WhatsApp:</b> <a href="https://wa.me/${whatsapp.replace(/\+/g, '')}">${whatsapp}</a>\n` +
      `<b>Estilo:</b> ${escapeHtml(estilo)}\n` +
      `<b>Zona:</b> ${escapeHtml(zona)}\n` +
      `<b>Tamaño:</b> ${escapeHtml(tamano)}`
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error("cotizar error:", String(error))
    return Response.json({ success: false, error: "Error al guardar la cotización" }, { status: 500 })
  }
}
