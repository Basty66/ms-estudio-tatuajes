export const config = { runtime: "edge" }

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    if (!code) return Response.json({ error: "Falta code" }, { status: 400 })

    const igUrl = `https://www.instagram.com/p/${code}/`
    
    const pageRes = await fetch(igUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    })
    const html = await pageRes.text()
    
    const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
    const thumbUrl = ogMatch ? ogMatch[1] : null
    
    if (!thumbUrl) {
      return Response.json({ error: "No thumbnail found" }, { status: 404 })
    }

    // Redirect directly to Instagram CDN image
    return Response.redirect(thumbUrl, 302)
  } catch (e) {
    return Response.json({ error: "Error" }, { status: 500 })
  }
}
