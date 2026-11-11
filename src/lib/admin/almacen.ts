import "server-only";
import { del, get, put } from "@vercel/blob";

/**
 * Archivos del panel en Vercel Blob, en dos almacenes separados a propósito:
 *
 *   - PÚBLICO: las fotos de la galería. Se muestran en la web, es su función.
 *   - PRIVADO: los comprobantes de pago. Llevan nombre, RUT, banco y cuenta de
 *     un tercero; nunca se sirven directo, solo por /tinta/comprobante, que
 *     exige sesión del panel.
 *
 * Cada almacén tiene su token. Al conectar el segundo almacén al proyecto en
 * Vercel, se le pone el prefijo BLOB_PRIVADO para que no pise al primero.
 */
const TOKEN_PUBLICO = process.env.BLOB_READ_WRITE_TOKEN ?? "";
const TOKEN_PRIVADO = process.env.BLOB_PRIVADO_READ_WRITE_TOKEN ?? "";

export const hayGaleria = Boolean(TOKEN_PUBLICO);
export const hayComprobantes = Boolean(TOKEN_PRIVADO);

/**
 * Los bytes mandan, no la extensión: los iPhone entregan ".PNG" que en
 * realidad son JPEG, y un archivo con otra cosa adentro no se guarda.
 */
export function tipoReal(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | null {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return "image/webp";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  return null;
}

const EXTENSION = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" } as const;

export async function guardarComprobante(citaId: number, archivo: File): Promise<string> {
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const tipo = tipoReal(bytes);
  if (!tipo) throw new Error("El archivo no es una foto ni un PDF.");
  const r = await put(`comprobantes/cita-${citaId}/${Date.now()}.${EXTENSION[tipo]}`, Buffer.from(bytes), {
    access: "private",
    contentType: tipo,
    addRandomSuffix: true,
    token: TOKEN_PRIVADO,
  });
  return r.pathname;
}

export async function leerComprobante(ruta: string) {
  return get(ruta, { access: "private", token: TOKEN_PRIVADO });
}

export async function borrarComprobante(ruta: string): Promise<void> {
  await del(ruta, { token: TOKEN_PRIVADO });
}

export async function guardarFoto(archivo: File): Promise<{ url: string; ruta: string }> {
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const tipo = tipoReal(bytes);
  if (!tipo || tipo === "application/pdf") throw new Error("El archivo no es una foto.");
  const r = await put(`galeria/${Date.now()}.${EXTENSION[tipo]}`, Buffer.from(bytes), {
    access: "public",
    contentType: tipo,
    addRandomSuffix: true,
    token: TOKEN_PUBLICO,
  });
  return { url: r.url, ruta: r.pathname };
}

export async function borrarFoto(url: string): Promise<void> {
  await del(url, { token: TOKEN_PUBLICO });
}
