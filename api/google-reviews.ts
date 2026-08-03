import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "edge" }

// Cache en memoria para no llamar a Google en cada request
let cache: { data: any; ts: number } | null = null
const CACHE_TTL = 30 * 60 * 1000 // 30 minutos

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!checkRateLimit(`google-reviews:${ip}`, 20, 60_000)) {
      return tooManyRequests()
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const placeId = process.env.GOOGLE_PLACE_ID

    // Si no están configuradas, devolver vacío (no error)
    if (!apiKey || !placeId) {
      return Response.json({ success: true, reviews: [], rating: 0, total: 0, configured: false })
    }

    // Usar cache si existe
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return Response.json({ success: true, ...cache.data, configured: true })
    }

    // Obtener detalles del lugar con reseñas
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${apiKey}&language=es`

    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== "OK") {
      console.error("Google Places API error:", data.status)
      return Response.json(
        { success: false, error: "Error al obtener reseñas de Google", configured: true },
        { status: 502 },
      )
    }

    const result = data.result || {}

    // Formatear reseñas (máximas 5 más recientes)
    const reviews = (result.reviews || []).slice(0, 5).map((r: any) => ({
      id: r.time || Math.random(),
      autor: r.author_name,
      texto: r.text || "",
      rating: r.rating,
      fuente: "Google",
      foto: r.profile_photo_url || "",
      time: r.time,
      language: r.language,
    }))

    const responseData = {
      reviews,
      rating: result.rating || 0,
      total: result.user_ratings_total || 0,
    }

    // Guardar en cache
    cache = { data: responseData, ts: Date.now() }

    return Response.json({ success: true, ...responseData, configured: true })
  } catch (error) {
    console.error("google-reviews error:", String(error))
    return Response.json(
      { success: false, error: "Error al obtener reseñas", configured: !!process.env.GOOGLE_PLACES_API_KEY },
      { status: 500 },
    )
  }
}
