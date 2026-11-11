"use server";

import { sql } from "@/db/conexion";
import { HAY_AVISOS, avisar } from "@/lib/admin/avisos";
import { PANEL } from "@/lib/admin/ruta";
import { usuarioActual } from "@/lib/admin/sesion";

/**
 * Lo que el panel puede pedir sobre los avisos de ESTE aparato.
 *
 * Cada una comprueba la sesión por su cuenta: una acción de servidor se puede
 * invocar desde cualquier página, no solo desde el panel.
 */
type Suscripcion = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Guarda la suscripción de este aparato bajo quien tiene la sesión abierta. */
export async function suscribirAvisos(
  suscripcion: Suscripcion,
  dispositivo: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!HAY_AVISOS) {
    return { ok: false, error: "Faltan las llaves VAPID en el servidor." };
  }

  const usuario = await usuarioActual();
  if (!usuario) {
    return { ok: false, error: "La sesión se cerró o el panel se bloqueó. Vuelve a entrar." };
  }

  // El endpoint es único: si el mismo aparato se vuelve a suscribir, se
  // actualiza en vez de duplicarse. Un navegador puede regenerar su
  // suscripción solo, y sin esto se acumularían filas muertas.
  try {
    await sql`
      INSERT INTO suscripciones_push (usuario_id, endpoint, p256dh, auth, dispositivo)
      VALUES (${usuario.id}, ${suscripcion.endpoint}, ${suscripcion.keys.p256dh},
              ${suscripcion.keys.auth}, ${String(dispositivo).slice(0, 40)})
      ON CONFLICT (endpoint) DO UPDATE
        SET usuario_id = EXCLUDED.usuario_id,
            p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth,
            dispositivo = EXCLUDED.dispositivo,
            fallos = 0
    `;
  } catch (e) {
    // Antes esto reventaba sin que nadie se enterara y la suscripción nunca
    // llegaba a guardarse, aunque el navegador la hubiera creado.
    return { ok: false, error: `No se pudo guardar: ${(e as Error).message}` };
  }
  return { ok: true };
}

export async function desuscribirAvisos(endpoint: string): Promise<{ ok: boolean }> {
  const usuario = await usuarioActual();
  if (!usuario) return { ok: false };
  await sql`
    DELETE FROM suscripciones_push WHERE endpoint = ${endpoint} AND usuario_id = ${usuario.id}
  `;
  return { ok: true };
}

/**
 * Aviso de prueba, solo a los aparatos de quien lo pide: probar en tu
 * teléfono no tiene por qué hacer sonar el de los demás.
 */
export async function probarAviso(): Promise<{ enviados: number }> {
  const usuario = await usuarioActual();
  if (!usuario) return { enviados: 0 };

  const { enviados } = await avisar(
    {
      titulo: "Prueba de aviso",
      cuerpo: `Hola ${usuario.nombre}: si ves esto, los avisos funcionan en este aparato.`,
      url: PANEL,
      tag: "prueba",
    },
    usuario.id,
  );
  return { enviados };
}
