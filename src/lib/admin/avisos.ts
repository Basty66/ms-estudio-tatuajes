import "server-only";
import webpush from "web-push";
import { sql } from "@/db/conexion";

/**
 * Notificaciones push al panel.
 *
 * Cómo sabe el sistema a quién avisar: el navegador no dice quién eres. Cuando
 * alguien entra al panel con su sesión y acepta los avisos, el navegador genera
 * una suscripción —una URL única de ESE navegador en ESE aparato, más dos
 * llaves de cifrado— y nosotros la guardamos junto a quien tiene la sesión.
 * Ese es todo el vínculo.
 *
 * Una persona puede tener varias: el teléfono y el computador. Se avisa a
 * todas. Los clientes nunca reciben nada; no tienen cuenta ni entran acá.
 * Reemplaza al bot de Telegram del sitio anterior.
 *
 * Esto vive acá y no en el archivo de acciones a propósito: todo lo que
 * exporta un archivo "use server" se puede invocar desde afuera, y mandar un
 * aviso a los teléfonos del estudio no puede quedar al alcance de cualquiera.
 */
export const LLAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLICA ?? "";
const PRIVADA = process.env.VAPID_PRIVADA ?? "";
const CONTACTO = process.env.VAPID_CONTACTO ?? "https://tatuajes-azure.vercel.app";

export const HAY_AVISOS = Boolean(LLAVE_PUBLICA && PRIVADA);

if (HAY_AVISOS) {
  webpush.setVapidDetails(CONTACTO, LLAVE_PUBLICA, PRIVADA);
}

export type Aviso = { titulo: string; cuerpo: string; url?: string; tag?: string };

/**
 * Manda el aviso a los aparatos registrados: a todos los del equipo, o solo a
 * los de una persona si se indica.
 *
 * Las suscripciones se rompen solas: alguien reinstala, borra los datos del
 * navegador o revoca el permiso. El servicio push responde 404 o 410 y esa
 * fila hay que borrarla en el acto — sin eso se acumulan suscripciones muertas
 * a las que se les sigue intentando enviar en cada aviso, y cada intento
 * cuesta tiempo de respuesta.
 */
export async function avisar(
  aviso: Aviso,
  soloA?: number,
): Promise<{ enviados: number; limpiados: number }> {
  if (!HAY_AVISOS) return { enviados: 0, limpiados: 0 };

  const suscripciones = (await sql`
    SELECT s.endpoint, s.p256dh, s.auth
    FROM suscripciones_push s
    JOIN usuarios u ON u.id = s.usuario_id
    WHERE u.activo
      AND (${soloA ?? null}::INT IS NULL AND u.recibe_avisos OR u.id = ${soloA ?? null}::INT)
  `) as Array<{ endpoint: string; p256dh: string; auth: string }>;

  let enviados = 0;
  const muertas: string[] = [];

  await Promise.all(
    suscripciones.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(aviso),
        );
        enviados++;
      } catch (error) {
        const codigo = (error as { statusCode?: number }).statusCode;
        if (codigo === 404 || codigo === 410) muertas.push(s.endpoint);
      }
    }),
  );

  if (muertas.length > 0) {
    await sql`DELETE FROM suscripciones_push WHERE endpoint = ANY(${muertas})`;
  }

  await sql`
    UPDATE suscripciones_push SET ultimo_envio = NOW()
    WHERE endpoint = ANY(${suscripciones.map((s) => s.endpoint)})
      AND endpoint <> ALL(${muertas})
  `;

  return { enviados, limpiados: muertas.length };
}
