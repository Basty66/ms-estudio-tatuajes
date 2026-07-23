export const config = { runtime: "edge" }

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  if (!code) return new Response("Missing code", { status: 400 })

  try {
    // Primero obtenemos la URL real de la imagen desde og:image
    const igRes = await fetch(`https://www.instagram.com/p/${code}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
    })
    const html = await igRes.text()

    const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/)
    if (!ogMatch) return new Response("No image", { status: 404 })

    const imgUrl = ogMatch[1].replace(/&amp;/g, "&")

    // Descargamos la imagen desde el servidor (sin CORS)
    const imgRes = await fetch(imgUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })

    if (!imgRes.ok) return new Response("Image fetch failed", { status: 502 })

    const buffer = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get("content-type") || "image/jpeg"

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (e) {
    return new Response("Error", { status: 500 })
  }
}
