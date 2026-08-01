export const config = { runtime: "edge" }

/**
 * Rate limiter simple en memoria (best-effort).
 * Nota: en Edge/serverless cada instancia tiene su propia memoria, así que esto
 * frena picos de spam desde una misma IP pero no es un límite global estricto.
 * Para algo robusto usar Upstash Redis / Vercel KV.
 */
const hits = new Map<string, number[]>()

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

/**
 * Devuelve true si la petición está DENTRO del límite (permitida),
 * false si lo excede (bloquear).
 */
export function checkRateLimit(key: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now()
  const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs)

  if (timestamps.length >= max) {
    hits.set(key, timestamps)
    return false
  }

  timestamps.push(now)
  hits.set(key, timestamps)

  // Limpieza oportunista para no crecer sin límite
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      const fresh = v.filter((t) => now - t < windowMs)
      if (fresh.length === 0) hits.delete(k)
      else hits.set(k, fresh)
    }
  }

  return true
}

export function tooManyRequests(): Response {
  return Response.json(
    { success: false, error: "Demasiadas peticiones. Intenta de nuevo en un momento." },
    { status: 429 },
  )
}
