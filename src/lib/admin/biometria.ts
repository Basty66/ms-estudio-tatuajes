import "server-only";
import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { sql } from "@/db/conexion";

/**
 * Piezas comunes de la entrada con Face ID / huella (WebAuthn).
 *
 * La biometría nunca sale del teléfono: Face ID o la huella desbloquean una
 * llave privada guardada en el propio aparato, que firma un desafío. Al
 * servidor llega solo la firma, y la comprueba con la llave pública que se
 * guardó al activarla.
 */
export const NOMBRE_SITIO = "Panel Matness";

/**
 * El dominio y el origen salen de la petición y no de una constante: la misma
 * aplicación corre en localhost y en el dominio de Vercel, y una passkey queda
 * atada al dominio donde se creó.
 */
export async function dominioYOrigen(): Promise<{ rpID: string; origen: string }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { rpID: host.split(":")[0], origen: `${protocolo}://${host}` };
}

const COOKIE_DESAFIO = "desafio_bio";

/**
 * Guarda el desafío de una ceremonia. Vive cinco minutos y se usa una vez: si
 * se pudiera reutilizar, una respuesta grabada serviría para volver a entrar.
 */
export async function guardarDesafio(desafio: string, usuarioId: number | null): Promise<void> {
  const id = randomBytes(16).toString("base64url");

  await sql`DELETE FROM desafios_biometricos WHERE vence_en < NOW()`;
  await sql`
    INSERT INTO desafios_biometricos (id, desafio, usuario_id, vence_en)
    VALUES (${id}, ${desafio}, ${usuarioId}, NOW() + INTERVAL '5 minutes')
  `;

  const tarro = await cookies();
  tarro.set(COOKIE_DESAFIO, id, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });
}

/**
 * Qué credencial biométrica vive en ESTE aparato.
 *
 * Una passkey de iPhone se sincroniza por iCloud y la base no sabe en qué
 * aparato se tocó. Sin esta cookie, el botón de Face ID aparecería en un
 * computador donde nadie lo activó y fallaría al tocarlo. Se guarda al
 * activarla y se borra al quitarla.
 */
export const COOKIE_BIO = "bio_aparato";

export async function credencialDeEsteAparato(
  usuarioId: number,
): Promise<{ id: string; llavePublica: string; contador: number; transportes: string[] } | null> {
  const tarro = await cookies();
  const id = tarro.get(COOKIE_BIO)?.value;
  if (!id) return null;

  const [fila] = (await sql`
    SELECT id, llave_publica, contador::INT AS contador, transportes
    FROM credenciales_biometricas
    WHERE id = ${id} AND usuario_id = ${usuarioId}
  `) as Array<{ id: string; llave_publica: string; contador: number; transportes: string[] | null }>;

  return fila
    ? {
        id: fila.id,
        llavePublica: fila.llave_publica,
        contador: fila.contador,
        transportes: fila.transportes ?? [],
      }
    : null;
}

/** Toma el desafío y lo borra en el mismo paso. */
export async function tomarDesafio(): Promise<{ desafio: string; usuarioId: number | null } | null> {
  const tarro = await cookies();
  const id = tarro.get(COOKIE_DESAFIO)?.value;
  if (!id) return null;
  tarro.delete(COOKIE_DESAFIO);

  const [fila] = (await sql`
    DELETE FROM desafios_biometricos
    WHERE id = ${id} AND vence_en > NOW()
    RETURNING desafio, usuario_id
  `) as Array<{ desafio: string; usuario_id: number | null }>;

  return fila ? { desafio: fila.desafio, usuarioId: fila.usuario_id } : null;
}
