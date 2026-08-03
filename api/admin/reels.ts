import { neon } from "@neondatabase/serverless"
import { verifyRequest, unauthorized } from "../lib/auth"

export const config = { runtime: "edge" }

export async function GET(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const reels = await sql`SELECT * FROM reels ORDER BY orden ASC, creado_en DESC`
    return Response.json({ success: true, reels })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener reels" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const { url, titulo, plataforma, video_url } = await request.json()

    if (!url) {
      return Response.json({ success: false, error: "URL requerida" }, { status: 400 })
    }
    if (!["instagram", "tiktok", "youtube", "video"].includes(plataforma)) {
      return Response.json({ success: false, error: "plataforma inválida" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      INSERT INTO reels (url, titulo, plataforma, video_url)
      VALUES (${url}, ${titulo || ""}, ${plataforma}, ${video_url || ""})
      RETURNING *
    `



    return Response.json({ success: true, reel: result[0] })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al crear reel" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await verifyRequest(request))) {
    return unauthorized()
  }

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id || isNaN(parseInt(id))) {
      return Response.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`SELECT * FROM reels WHERE id = ${parseInt(id)}`
    const reel = result[0]

    if (reel?.video_url && reel.video_url.includes(".blob.vercel-storage.com")) {
      const oidcToken = process.env.VERCEL_OIDC_TOKEN
      const storeId = process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3]
      const bearer = oidcToken || process.env.BLOB_READ_WRITE_TOKEN
      if (bearer && storeId) {
        await fetch("https://vercel.com/api/blob/delete", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${bearer}`,
            "x-vercel-blob-store-id": storeId,
            "x-api-version": "12",
          },
          body: JSON.stringify({ urls: [reel.video_url] }),
        }).catch(() => {})
      }
    }

    await sql`DELETE FROM reels WHERE id = ${parseInt(id)}`
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al eliminar" }, { status: 500 })
  }
}
