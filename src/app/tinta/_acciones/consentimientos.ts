"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sql } from "@/db/conexion";
import { leerContenido } from "@/db/contenido";
import { borrarFoto, borrarPrivado, hayPrivado } from "@/lib/admin/almacen";
import { fechaLarga, hora } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";
import { usuarioActual } from "@/lib/admin/sesion";
import { DIAS_QUE_DURA_EL_LINK } from "@/lib/consentimiento";
import { rellenar } from "@/lib/contenido";
import { DOMINIO } from "@/lib/sitio";

/**
 * Consentimiento informado y seguimiento, del lado del panel.
 *
 * Como todo archivo "use server": cada acción comprueba la sesión y revisa lo
 * que llega. La firma NO pasa por acá: la hace el cliente, sin sesión, por
 * /api/consentimiento con el token de su link.
 */
type Respuesta<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const SIN_SESION = { ok: false as const, error: "La sesión se cerró o el panel se bloqueó. Vuelve a entrar." };

const id = (v: unknown) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 && n <= 2e9 ? n : null;
};

function refrescar(...rutas: string[]) {
  revalidatePath(PANEL, "layout");
  for (const r of rutas) revalidatePath(r);
}

/** El dominio desde el que se usa el panel: el link tiene que abrir en esta misma web. */
async function origen(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? DOMINIO;
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

/**
 * Crea (o renueva) el link de una cita. El token viaja solo en el link; en la
 * base queda su hash. Pedir uno nuevo deja sin efecto el anterior.
 *
 * `donde`: "link" para mandarlo por WhatsApp (dura 7 días); "estudio" para
 * firmarlo ahora en este teléfono (dura una hora).
 */
export async function pedirConsentimiento(citaId: number, donde: "link" | "estudio"): Promise<Respuesta<{ link: string; mensaje: string; vence: string }>> {
  const u = await usuarioActual();
  if (!u) return SIN_SESION;
  const cita = id(citaId);
  if (!cita) return { ok: false, error: "Esa cita no existe." };
  if (!hayPrivado) return { ok: false, error: "Falta conectar el almacén privado en Vercel: ahí se guardan las firmas." };

  const [c] = (await sql`
    SELECT c.id, c.cliente_id, c.estado, c.tipo, to_char(c.inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio, cl.nombre
    FROM citas c JOIN clientes cl ON cl.id = c.cliente_id
    WHERE c.id = ${cita} AND c.tipo <> 'bloqueo'
  `) as Array<{ id: number; cliente_id: number; estado: string; tipo: string; inicio: string; nombre: string }>;
  if (!c) return { ok: false, error: "Esa cita no existe." };
  if (c.estado === "cancelada" || c.estado === "no_vino") return { ok: false, error: "La cita no está activa." };

  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const minutos = donde === "estudio" ? 60 : DIAS_QUE_DURA_EL_LINK * 24 * 60;

  const filas = (await sql`
    INSERT INTO consentimientos (cita_id, cliente_id, token_hash, vence_en, pedido_por)
    VALUES (${c.id}, ${c.cliente_id}, ${hash}, NOW() + (${minutos} || ' minutes')::INTERVAL, ${u.nombre})
    ON CONFLICT (cita_id) DO UPDATE
      SET token_hash = EXCLUDED.token_hash, vence_en = EXCLUDED.vence_en, pedido_por = EXCLUDED.pedido_por, pedido_en = NOW()
      WHERE consentimientos.firmado_en IS NULL
    RETURNING to_char(vence_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS vence
  `) as Array<{ vence: string }>;
  if (filas.length === 0) return { ok: false, error: "Ya está firmado." };

  const link = `${await origen()}/consentimiento/${token}${donde === "estudio" ? "?estudio=1" : ""}`;
  const { mensajes } = await leerContenido();
  const mensaje = rellenar(mensajes.consentimiento, {
    nombre: c.nombre.split(" ")[0],
    fecha: `${fechaLarga(c.inicio)} a las ${hora(c.inicio)}`,
    link,
  });
  refrescar(`${PANEL}/cita/${c.id}`);
  return { ok: true, link, mensaje, vence: filas[0].vence };
}

/**
 * Borra un consentimiento firmado (porque se firmó con un error, por ejemplo)
 * o un pedido pendiente. Primero el archivo de la firma, después la fila.
 */
export async function anularConsentimiento(citaId: number): Promise<Respuesta> {
  if (!(await usuarioActual())) return SIN_SESION;
  const cita = id(citaId);
  if (!cita) return { ok: false, error: "Esa cita no existe." };
  const [k] = (await sql`SELECT id, firma FROM consentimientos WHERE cita_id = ${cita}`) as Array<{ id: number; firma: string | null }>;
  if (!k) return { ok: true };
  if (k.firma) {
    try {
      await borrarPrivado(k.firma);
    } catch {
      return { ok: false, error: "No se pudo borrar la firma. Vuelve a intentarlo." };
    }
  }
  await sql`DELETE FROM consentimientos WHERE id = ${k.id}`;
  refrescar(`${PANEL}/cita/${cita}`);
  return { ok: true };
}

/**
 * Lo que pide la ley cuando alguien quiere que borren sus datos: se borran
 * sus consentimientos (con la salud y la firma), las fotos de sus trabajos,
 * su teléfono, Instagram y notas, y las notas y descripciones de sus citas.
 *
 * Queda lo que el estudio está obligado a guardar: los pagos (monto, fecha y
 * comprobante, por el SII) y las citas sin datos personales, para que las
 * finanzas sigan cuadrando.
 */
export async function borrarDatosCliente(clienteId: number): Promise<Respuesta> {
  if (!(await usuarioActual())) return SIN_SESION;
  const cliente = id(clienteId);
  if (!cliente) return { ok: false, error: "Ese cliente no existe." };

  const [firmas, fotos] = (await Promise.all([
    sql`SELECT firma FROM consentimientos WHERE cliente_id = ${cliente} AND firma IS NOT NULL`,
    sql`SELECT g.url FROM galeria g JOIN citas c ON c.id = g.cita_id WHERE c.cliente_id = ${cliente}`,
  ])) as [Array<{ firma: string }>, Array<{ url: string }>];

  try {
    for (const f of firmas) await borrarPrivado(f.firma);
    for (const f of fotos) await borrarFoto(f.url);
  } catch {
    return { ok: false, error: "No se pudieron borrar todos los archivos. Vuelve a intentarlo: lo que ya se borró no vuelve." };
  }

  await sql`DELETE FROM galeria g USING citas c WHERE c.id = g.cita_id AND c.cliente_id = ${cliente}`;
  await sql`DELETE FROM consentimientos WHERE cliente_id = ${cliente}`;
  await sql`UPDATE citas SET notas = NULL, descripcion = NULL WHERE cliente_id = ${cliente}`;
  await sql`UPDATE clientes SET nombre = 'Datos borrados', telefono = NULL, instagram = NULL, notas = NULL WHERE id = ${cliente}`;
  refrescar(`${PANEL}/cliente/${cliente}`, `${PANEL}/clientes`, `${PANEL}/galeria`, "/");
  return { ok: true };
}

/** Anota que se mandó un mensaje de seguimiento (o el de la reseña). */
export async function marcarSeguimiento(citaId: number, etapa: string): Promise<Respuesta> {
  const u = await usuarioActual();
  if (!u) return SIN_SESION;
  const cita = id(citaId);
  if (!cita || !["dia1", "dia7", "dia30", "laser1", "laserProxima", "siguienteSesion", "resena"].includes(etapa)) return { ok: false, error: "No existe." };
  await sql`
    INSERT INTO seguimientos (cita_id, etapa, enviado_por)
    SELECT id, ${etapa}, ${u.nombre} FROM citas WHERE id = ${cita} AND tipo <> 'bloqueo'
    ON CONFLICT (cita_id, etapa) DO NOTHING
  `;
  refrescar(`${PANEL}/cita/${cita}`);
  return { ok: true };
}
