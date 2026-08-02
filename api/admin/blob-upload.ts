import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client"

import { verifyRequest, unauthorized } from "../lib/auth"

export const config = { runtime: "edge" }

const MAX_VIDEO_BYTES = 200 * 1024 * 1024 // 200 MB
const ALLOWED: string[] = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]

/**
 * Genera un token de cliente de Vercel Blob para subir un video
 * directo desde el navegador (funciona desde PC y móvil).
 */
export async function POST(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const { filename, contentType } = await request.json()

    if (!filename || typeof filename !== "string") {
      return Response.json({ success: false, error: "filename requerido" }, { status: 400 })
    }

    const tipo = (contentType as string) || ""
    if (!tipo.startsWith("video/")) {
      return Response.json({ success: false, error: "Solo se permiten archivos de video" }, { status: 400 })
    }
    if (!ALLOWED.includes(tipo)) {
      return Response.json({ success: false, error: "Formato no permitido. Usa MP4, WebM o MOV" }, { status: 400 })
    }

    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname: `reels/${filename}`,
      addRandomSuffix: true,
      allowedContentTypes: ALLOWED,
      maximumSizeInBytes: MAX_VIDEO_BYTES,
      validUntil: Date.now() + 60 * 60 * 1000,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return Response.json({ success: true, clientToken })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al generar token de subida" }, { status: 500 })
  }
}
