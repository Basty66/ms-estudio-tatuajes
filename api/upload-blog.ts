import { put } from "@vercel/blob"
import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "nodejs" }

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB para blog

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!checkRateLimit(`upload-blog:${ip}`, 10, 60_000)) {
      return tooManyRequests()
    }

    const { image } = await request.json()

    if (!image || typeof image !== "string" || !image.startsWith("data:image")) {
      return Response.json(
        { success: false, error: "Imagen inválida" },
        { status: 400 },
      )
    }

    // Validar tamaño del base64
    const base64Data = image.split(",")[1] || ""
    const sizeInBytes = Math.ceil((base64Data.length * 3) / 4)
    if (sizeInBytes > MAX_SIZE) {
      return Response.json(
        { success: false, error: "La imagen no puede superar 5 MB" },
        { status: 400 },
      )
    }

    // Convertir base64 a Buffer (Node.js compatible)
    const buffer = Buffer.from(base64Data, "base64")

    // Determinar extensión
    const mimeMatch = image.match(/data:image\/(\w+)/)
    const ext = mimeMatch?.[1] || "jpg"
    const contentType = `image/${ext === "jpg" ? "jpeg" : ext === "svg" ? "svg+xml" : ext}`

    // Subir a Vercel Blob
    const filename = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const blob = await put(filename, buffer, {
      contentType,
      access: "public",
    })

    return Response.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("upload-blog error:", String(error))
    return Response.json(
      { success: false, error: "Error al subir la imagen" },
      { status: 500 },
    )
  }
}
