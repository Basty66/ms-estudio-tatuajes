export const config = { runtime: "edge" }

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    if (!code) return Response.json({ error: "Falta code" }, { status: 400 })

    // Instagram oEmbed no necesita auth para datos públicos
    const igUrl = `https://www.instagram.com/p/${code}/`
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(igUrl)}`

    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })

    if (!res.ok) {
      // Fallback: scrape og:image del HTML de Instagram
      const pageRes = await fetch(igUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
      })
      const html = await pageRes.text()
      const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
      const thumb = ogMatch ? ogMatch[1] : null
      if (thumb) {
        // Proxy: fetch image and return it directly
        const imgRes = await fetch(thumb)
        const imgBuffer = await imgRes.arrayBuffer()
        return new Response(imgBuffer, {
          headers: {
            "Content-Type": imgRes.headers.get("Content-Type") || "image/jpeg",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        })
      }
      return Response.json({ error: "No se pudo obtener thumbnail" }, { status: 404 })
    }

    const data = await res.json()
    const thumb = data.thumbnail_url
    if (!thumb) return Response.json({ error: "Sin thumbnail" }, { status: 404 })

    const imgRes = await fetch(thumb)
    const imgBuffer = await imgRes.arrayBuffer()
    return new Response(imgBuffer, {
      headers: {
        "Content-Type": imgRes.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (e) {
    return Response.json({ error: "Error interno" }, { status: 500 })
  }
}
