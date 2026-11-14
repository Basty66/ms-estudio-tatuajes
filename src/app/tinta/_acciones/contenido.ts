"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db/conexion";
import { bloqueGuardado } from "@/db/contenido";
import { borrarFoto, guardarFoto, hayGaleria } from "@/lib/admin/almacen";
import { usuarioActual } from "@/lib/admin/sesion";
import { normalizarTelefono } from "@/lib/admin/telefono";
import {
  LUGARES_FOTO,
  normalizarCuidados,
  normalizarEstudio,
  normalizarPreguntas,
  normalizarTatuador,
  type ClaveBloque,
  type FotoSubida,
} from "@/lib/contenido";
import { normalizarPrecios } from "@/lib/precios";

/**
 * Lo que se cambia de la web desde el panel (sección "Web").
 *
 * Igual que en panel.ts: todo lo que exporta este archivo se puede invocar
 * desde afuera, así que CADA acción comprueba la sesión y lo que llega se
 * revisa campo por campo antes de guardarlo. Lo que se guarda es lo ya
 * revisado, nunca lo que mandó el navegador.
 *
 * Al guardar se rehace la web al instante. Va con "layout" porque WhatsApp y
 * dirección viven en el layout del sitio y se ven en todas sus páginas.
 */
type Respuesta = { ok: true } | { ok: false; error: string };

const SIN_SESION = { ok: false as const, error: "La sesión se cerró o el panel se bloqueó. Vuelve a entrar." };

type BloqueDeTexto = Exclude<ClaveBloque, "fotos">;

async function guardar(clave: ClaveBloque, valor: unknown, quien: string) {
  await sql`
    INSERT INTO contenido (clave, valor, actualizado_por)
    VALUES (${clave}, ${JSON.stringify(valor)}::JSONB, ${quien})
    ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = NOW(), actualizado_por = EXCLUDED.actualizado_por
  `;
  revalidatePath("/", "layout");
}

/** Revisa un bloque de texto. Devuelve el valor limpio o el error que hay que mostrar. */
function revisar(clave: BloqueDeTexto, valor: unknown): { valor: unknown } | { error: string } {
  const v = (valor ?? {}) as Record<string, unknown>;
  switch (clave) {
    case "estudio": {
      const whatsapp = normalizarTelefono(String(v.whatsapp ?? ""));
      if (!whatsapp || !/^569\d{8}$/.test(whatsapp)) return { error: "El WhatsApp tiene que ser un celular chileno, como 9 1234 5678." };
      const instagram = String(v.instagram ?? "").trim().replace(/^@/, "");
      if (!/^[A-Za-z0-9._]{1,30}$/.test(instagram)) return { error: "El Instagram es solo el usuario, sin espacios: matness_tattoos." };
      if (!String(v.direccion ?? "").trim() || !String(v.comuna ?? "").trim()) return { error: "Falta la dirección o la comuna." };
      const e = normalizarEstudio({ ...v, whatsapp, instagram });
      return { valor: { whatsapp: e.whatsapp, instagram: e.instagram, direccion: e.direccion, comuna: e.comuna } };
    }
    case "precios":
      return { valor: normalizarPrecios(valor) };
    case "tatuador":
      if (!String(v.frase ?? "").trim()) return { error: "La frase de presentación no puede quedar vacía." };
      return { valor: normalizarTatuador(valor) };
    case "preguntas":
      if (!Array.isArray(valor) || !valor.some((q) => String(q?.titulo ?? "").trim() && String(q?.texto ?? "").trim()))
        return { error: "Deja al menos una pregunta con su respuesta." };
      return { valor: normalizarPreguntas(valor) };
    case "cuidados":
      return { valor: normalizarCuidados(valor) };
  }
}

export async function guardarContenido(clave: BloqueDeTexto, valor: unknown): Promise<Respuesta> {
  const u = await usuarioActual();
  if (!u) return SIN_SESION;
  if (!["estudio", "precios", "tatuador", "preguntas", "cuidados"].includes(clave)) return { ok: false, error: "No existe." };
  const r = revisar(clave, valor);
  if ("error" in r) return { ok: false, error: r.error };
  await guardar(clave, r.valor, u.nombre);
  return { ok: true };
}

/** Vuelve un bloque de texto a como venía de fábrica. */
export async function restaurarContenido(clave: BloqueDeTexto): Promise<Respuesta> {
  if (!(await usuarioActual())) return SIN_SESION;
  if (!["estudio", "precios", "tatuador", "preguntas", "cuidados"].includes(clave)) return { ok: false, error: "No existe." };
  await sql`DELETE FROM contenido WHERE clave = ${clave}`;
  revalidatePath("/", "layout");
  return { ok: true };
}

// --------------------------------------------------------------- fotos --

async function fotosGuardadas(): Promise<Record<string, FotoSubida>> {
  const v = await bloqueGuardado("fotos");
  return v && typeof v === "object" ? (v as Record<string, FotoSubida>) : {};
}

/**
 * Cambia la foto de un lugar fijo de la web (un retrato, un paso de la
 * sesión…). Primero se sube la nueva y se guarda; recién después se borra la
 * anterior, para que la web nunca quede apuntando a un archivo que ya no está.
 */
export async function cambiarFotoWeb(formulario: FormData): Promise<Respuesta> {
  const u = await usuarioActual();
  if (!u) return SIN_SESION;
  if (!hayGaleria) return { ok: false, error: "Falta conectar el almacén de fotos en Vercel." };
  const clave = String(formulario.get("clave") ?? "");
  const lugar = LUGARES_FOTO.find((l) => l.clave === clave);
  if (!lugar) return { ok: false, error: "Ese lugar de la web no existe." };
  const archivo = formulario.get("foto");
  const ancho = Math.round(Number(formulario.get("ancho")));
  const alto = Math.round(Number(formulario.get("alto")));
  const alt = String(formulario.get("alt") ?? "").trim().slice(0, 160);
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "Elige una foto." };
  if (archivo.size > 4 * 1024 * 1024) return { ok: false, error: "La foto pesa más de 4 MB." };
  if (!(ancho > 0 && ancho <= 10000 && alto > 0 && alto <= 10000)) return { ok: false, error: "No se pudo leer el tamaño de la foto." };
  if (alt.length < 3) return { ok: false, error: "Describe la foto en pocas palabras: la leen Google y quienes no ven." };

  let subida: { url: string; ruta: string };
  try {
    subida = await guardarFoto(archivo, "web");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const fotos = await fotosGuardadas();
  const anterior = fotos[clave];
  fotos[clave] = { src: subida.url, ruta: subida.ruta, ancho, alto, alt };
  await guardar("fotos", fotos, u.nombre);
  if (anterior?.ruta) await borrarFoto(anterior.src).catch(() => undefined);
  return { ok: true };
}

/** Vuelve un lugar a su foto de fábrica. Primero se borra el archivo, después el dato. */
export async function quitarFotoWeb(clave: string): Promise<Respuesta> {
  const u = await usuarioActual();
  if (!u) return SIN_SESION;
  const fotos = await fotosGuardadas();
  const actual = fotos[clave];
  if (!actual) return { ok: true };
  try {
    await borrarFoto(actual.src);
  } catch {
    return { ok: false, error: "No se pudo borrar la foto. Vuelve a intentarlo." };
  }
  delete fotos[clave];
  await guardar("fotos", fotos, u.nombre);
  return { ok: true };
}
