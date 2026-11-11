import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { sql } from "@/db/conexion";

/**
 * Sesiones del panel.
 *
 * En la cookie viaja un token aleatorio de 32 bytes; en la base se guarda solo
 * su hash. Quien lea la tabla `sesiones` no puede entrar con nada de lo que
 * hay ahí.
 *
 * Son dos cosas distintas, a propósito:
 *
 *   - La SESIÓN dice de quién es este aparato. Dura 90 días y se renueva con
 *     el uso: en tu teléfono te identificas una vez y no se vuelve a pedir.
 *
 *   - El DESBLOQUEO dice que esa persona lo está usando ahora. Pasada media
 *     hora sin uso, el panel pide PIN o Face ID / huella, como la app de un
 *     banco. Un teléfono se presta o se deja sobre la mesa, y acá hay
 *     teléfonos de clientes y comprobantes con datos bancarios.
 */
const scrypt = promisify(scryptCb) as (
  clave: string,
  sal: Buffer,
  largo: number,
) => Promise<Buffer>;

export const COOKIE_SESION = "sesion_panel";
const DIAS_SESION = 90;
export const MINUTOS_DESBLOQUEO = 30;

// --------------------------------------------------------------------- PIN --

/** scrypt con sal propia por persona. El PIN nunca se guarda en claro. */
export async function hashPin(pin: string): Promise<string> {
  const sal = randomBytes(16);
  const derivado = await scrypt(pin, sal, 32);
  return `scrypt$${sal.toString("base64")}$${derivado.toString("base64")}`;
}

export async function pinCorrecto(pin: string, guardado: string): Promise<boolean> {
  const [esquema, salB64, hashB64] = guardado.split("$");
  if (esquema !== "scrypt" || !salB64 || !hashB64) return false;

  const esperado = Buffer.from(hashB64, "base64");
  const derivado = await scrypt(pin, Buffer.from(salB64, "base64"), esperado.length);

  // Comparación en tiempo constante: con === el tiempo de respuesta delata
  // cuántos bytes coinciden.
  return derivado.length === esperado.length && timingSafeEqual(derivado, esperado);
}

export { pinDemasiadoFacil, pinValido } from "@/lib/admin/pin";

/** Compara dos textos sin que el tiempo de respuesta delate cuánto coinciden. */
export function igualesSinFiltrar(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// ------------------------------------------------------- intentos fallidos --

const MAX_INTENTOS = 5;
const MINUTOS_CASTIGO = 15;

/**
 * Cuatro dígitos son diez mil combinaciones: sin límite se prueban en minutos.
 * Con cinco intentos y quince minutos de espera deja de valer la pena.
 * Devuelve los minutos que faltan si la persona está castigada, o null.
 */
export async function minutosDeCastigo(usuarioId: number): Promise<number | null> {
  const [fila] = (await sql`
    SELECT CEIL(EXTRACT(EPOCH FROM bloqueado_hasta - NOW()) / 60)::INT AS faltan
    FROM usuarios
    WHERE id = ${usuarioId} AND bloqueado_hasta > NOW()
  `) as Array<{ faltan: number }>;
  return fila ? Math.max(1, fila.faltan) : null;
}

/** Anota un intento fallido. Devuelve cuántos quedan antes del castigo. */
export async function anotarFallo(usuarioId: number): Promise<number> {
  const [fila] = (await sql`
    UPDATE usuarios
    SET intentos_fallidos = CASE WHEN intentos_fallidos + 1 >= ${MAX_INTENTOS}
                                 THEN 0 ELSE intentos_fallidos + 1 END,
        bloqueado_hasta = CASE WHEN intentos_fallidos + 1 >= ${MAX_INTENTOS}
                               THEN NOW() + (${MINUTOS_CASTIGO} || ' minutes')::INTERVAL
                               ELSE bloqueado_hasta END
    WHERE id = ${usuarioId}
    RETURNING intentos_fallidos, bloqueado_hasta > NOW() AS castigado
  `) as Array<{ intentos_fallidos: number; castigado: boolean }>;
  if (!fila || fila.castigado) return 0;
  return MAX_INTENTOS - fila.intentos_fallidos;
}

export const mensajeCastigo = (minutos: number) =>
  `Demasiados intentos. Espera ${minutos} ${minutos === 1 ? "minuto" : "minutos"} y vuelve a probar.`;

// ----------------------------------------------------------------- sesión --

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function abrirSesion(usuarioId: number, dispositivo: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");

  // Se aprovecha de barrer las vencidas: no hay otro momento en que se miren.
  await sql`DELETE FROM sesiones WHERE vence_en < NOW()`;
  await sql`
    INSERT INTO sesiones (token_hash, usuario_id, dispositivo, vence_en, desbloqueada_hasta)
    VALUES (${hashToken(token)}, ${usuarioId}, ${dispositivo},
            NOW() + (${DIAS_SESION} || ' days')::INTERVAL,
            NOW() + (${MINUTOS_DESBLOQUEO} || ' minutes')::INTERVAL)
  `;
  await sql`
    UPDATE usuarios SET ultimo_ingreso = NOW(), intentos_fallidos = 0, bloqueado_hasta = NULL
    WHERE id = ${usuarioId}
  `;

  const tarro = await cookies();
  tarro.set(COOKIE_SESION, token, {
    httpOnly: true,
    // Lax y no Strict: tocar la notificación abre el panel como navegación
    // nueva, y con Strict esa primera carga llegaría sin sesión.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * DIAS_SESION,
  });
}

export type Usuario = { id: number; nombre: string };
export type Sesion = Usuario & { bloqueada: boolean };

/**
 * La sesión de este aparato, comprobada contra la base en cada llamada.
 *
 * No basta con que exista la cookie: la sesión pudo haberse cerrado desde
 * otro aparato, o la persona pudo haber sido desactivada.
 *
 * Si está desbloqueada, cada uso corre el plazo otra media hora: el candado
 * cae por inactividad, no a una hora fija.
 */
export async function leerSesion(): Promise<Sesion | null> {
  const tarro = await cookies();
  const token = tarro.get(COOKIE_SESION)?.value;
  if (!token) return null;

  // En el RETURNING de un UPDATE, las columnas de `s` ya traen el valor nuevo.
  // Por eso "bloqueada" se calcula con la misma condición que decide si se
  // corre el plazo: si se corrió, estaba desbloqueada.
  const [fila] = (await sql`
    UPDATE sesiones s
    SET ultimo_uso = NOW(),
        vence_en = CASE WHEN s.vence_en < NOW() + INTERVAL '30 days'
                        THEN NOW() + (${DIAS_SESION} || ' days')::INTERVAL
                        ELSE s.vence_en END,
        desbloqueada_hasta = CASE WHEN s.desbloqueada_hasta > NOW()
                                  THEN NOW() + (${MINUTOS_DESBLOQUEO} || ' minutes')::INTERVAL
                                  ELSE s.desbloqueada_hasta END
    FROM usuarios u
    WHERE s.token_hash = ${hashToken(token)}
      AND s.vence_en > NOW()
      AND u.id = s.usuario_id
      AND u.activo
    RETURNING u.id, u.nombre, NOT COALESCE(s.desbloqueada_hasta > NOW(), FALSE) AS bloqueada
  `) as Array<{ id: number; nombre: string; bloqueada: boolean }>;

  return fila ? { id: fila.id, nombre: fila.nombre, bloqueada: fila.bloqueada } : null;
}

/**
 * ¿La sesión sigue abierta y desbloqueada? Solo mira, no toca nada.
 *
 * Para la consulta de "¿cambió algo?" que el panel hace cada pocos segundos.
 * Si usara leerSesion(), cada consulta contaría como uso y el panel abierto
 * sobre la mesa no se bloquearía nunca.
 */
export async function sesionVigente(): Promise<boolean> {
  const tarro = await cookies();
  const token = tarro.get(COOKIE_SESION)?.value;
  if (!token) return false;
  const [fila] = (await sql`
    SELECT 1 AS si
    FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.vence_en > NOW()
      AND s.desbloqueada_hasta > NOW()
      AND u.activo
  `) as Array<{ si: number }>;
  return Boolean(fila);
}

/** Quién opera, solo si la sesión existe Y está desbloqueada. */
export async function usuarioActual(): Promise<Usuario | null> {
  const sesion = await leerSesion();
  if (!sesion || sesion.bloqueada) return null;
  return { id: sesion.id, nombre: sesion.nombre };
}

/** Quita el candado de la sesión de este aparato por otra media hora. */
export async function desbloquear(): Promise<void> {
  const tarro = await cookies();
  const token = tarro.get(COOKIE_SESION)?.value;
  if (!token) return;
  await sql`
    UPDATE sesiones
    SET desbloqueada_hasta = NOW() + (${MINUTOS_DESBLOQUEO} || ' minutes')::INTERVAL,
        ultimo_uso = NOW()
    WHERE token_hash = ${hashToken(token)}
  `;
}

/**
 * Pone el candado ya, sin esperar la media hora: la app se cerró o estuvo en
 * segundo plano. La sesión sigue; solo se vuelve a pedir PIN o huella.
 */
export async function bloquear(): Promise<void> {
  const tarro = await cookies();
  const token = tarro.get(COOKIE_SESION)?.value;
  if (!token) return;
  await sql`
    UPDATE sesiones SET desbloqueada_hasta = NOW() WHERE token_hash = ${hashToken(token)}
  `;
}

export async function cerrarSesion(): Promise<void> {
  const tarro = await cookies();
  const token = tarro.get(COOKIE_SESION)?.value;
  if (token) await sql`DELETE FROM sesiones WHERE token_hash = ${hashToken(token)}`;
  tarro.delete(COOKIE_SESION);
}

export function nombreDelAparato(userAgent: string | null): string {
  const ua = userAgent ?? "";
  if (/iPhone|iPad/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Navegador";
}
