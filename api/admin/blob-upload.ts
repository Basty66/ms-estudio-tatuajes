import { verifyRequest, unauthorized } from "../lib/auth"

export const config = { runtime: "edge" }

const MAX_SIZE = 200 * 1024 * 1024
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i

function b64(str: string): string {
  return btoa(str)
}

async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function POST(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const body = await request.json()

    let pathname: string | undefined
    if (body.type === "blob.generate-client-token") {
      pathname = body.payload?.pathname
    } else if (typeof body.filename === "string") {
      const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_")
      pathname = `reels/${Date.now()}-${safeName}`
    }

    if (!pathname || !pathname.startsWith("reels/") || !VIDEO_EXT.test(pathname)) {
      return Response.json(
        { success: false, error: "Solo se permiten videos (mp4, webm, mov, m4v)" },
        { status: 400 },
      )
    }

    const rwToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!rwToken) {
      return Response.json({ success: false, error: "Blob no configurado" }, { status: 500 })
    }

    const storeId = rwToken.split("_")[3] || ""

    const payload = b64(
      JSON.stringify({
        pathname,
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: MAX_SIZE,
        validUntil: Date.now() + 10 * 60 * 1000,
      }),
    )

    const securedKey = await hmacSha256Hex(payload, rwToken)
    const clientToken = `vercel_blob_client_${storeId}_${b64(`${securedKey}.${payload}`)}`

    return Response.json({ clientToken })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al preparar la subida" }, { status: 500 })
  }
}
