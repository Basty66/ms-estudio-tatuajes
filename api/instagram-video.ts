export const config = { runtime: "edge" }

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  if (!code) return new Response("Missing code", { status: 400 })

  try {
    const igRes = await fetch(`https://www.instagram.com/p/${code}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
    })
    const html = await igRes.text()

    const ogMatch = html.match(/property="og:video"\s+content="([^"]+)"/)
    if (!ogMatch) return new Response("No video", { status: 404 })

    const videoUrl = ogMatch[1].replace(/&amp;/g, "&")

    return new Response(null, {
      status: 302,
      headers: {
        "Location": videoUrl,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (e) {
    return new Response("Error", { status: 500 })
  }
}
