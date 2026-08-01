import { SignJWT, jwtVerify } from "jose"

export const config = { runtime: "edge" }

/**
 * Secret para firmar los JWT. Debe definirse en las variables de entorno de Vercel.
 * Genera uno con: openssl rand -base64 48
 * Si no está definido, se hace fallback a ADMIN_PASSWORD para no romper el deploy,
 * pero SIEMPRE conviene tener un JWT_SECRET dedicado y largo.
 */
function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || ""
  return new TextEncoder().encode(raw)
}

const ISSUER = "ms-estudio-tatuajes"
const AUDIENCE = "admin"
const EXPIRATION = "8h"

/**
 * Genera un JWT firmado tras un login correcto.
 */
export async function createToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRATION)
    .sign(getSecret())
}

/**
 * Verifica el JWT del header Authorization. Devuelve true solo si la firma
 * es válida y el token no ha expirado.
 */
export async function verifyRequest(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization")
  const token = auth?.replace("Bearer ", "").trim()
  if (!token) return false

  try {
    await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Respuesta estándar de "no autorizado".
 */
export function unauthorized(): Response {
  return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
}
