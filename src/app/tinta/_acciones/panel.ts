"use server";

import { revalidatePath } from "next/cache";
import { esChoqueDeHoras, sql } from "@/db/conexion";
import { borrarPrivado, borrarFoto as borrarArchivoFoto, guardarComprobante, guardarFoto, hayPrivado, hayGaleria } from "@/lib/admin/almacen";
import { esFecha, esHora, sumarMinutos } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";
import { usuarioActual } from "@/lib/admin/sesion";
import { normalizarTelefono } from "@/lib/admin/telefono";
import { ESTILOS_PRECIO, TAMANOS, ZONAS } from "@/lib/precios";

/**
 * Lo que se escribe desde el panel.
 *
 * Todo lo que exporta un archivo "use server" se puede invocar desde afuera,
 * desde cualquier página: por eso CADA acción comprueba la sesión, incluso
 * las que solo leen, y revalida cada dato. Lo que diga el formulario no
 * obliga a nada.
 *
 * Quien firma sale de la sesión, nunca de un dato del cliente.
 */
type Respuesta<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const SIN_SESION = { ok: false as const, error: "La sesión se cerró o el panel se bloqueó. Vuelve a entrar." };

async function operador() {
  return usuarioActual();
}

const entero = (v: unknown, min: number, max: number): number | null => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const texto = (v: unknown, max: number): string | null => {
  const t = typeof v === "string" ? v.trim().slice(0, max) : "";
  return t === "" ? null : t;
};
const deLista = <T extends string>(v: unknown, lista: readonly { id: T }[]): T | null =>
  lista.some((x) => x.id === v) ? (v as T) : null;

const TIPOS = ["tatuaje", "laser", "retoque"] as const;
const ESTADOS = ["confirmada", "completada", "cancelada", "no_vino"] as const;

function refrescar(...rutas: string[]) {
  revalidatePath(PANEL, "layout");
  for (const r of rutas) revalidatePath(r);
}

/** Con quién choca una hora, para decirlo con nombre y no con un código de error. */
async function conQuienChoca(inicio: string, fin: string, salvo: number | null): Promise<string> {
  const [f] = (await sql`
    SELECT c.tipo, cl.nombre, to_char(c.inicio, 'HH24:MI') AS desde, to_char(c.fin, 'HH24:MI') AS hasta
    FROM citas c LEFT JOIN clientes cl ON cl.id = c.cliente_id
    WHERE c.estado IN ('confirmada', 'completada') AND c.rango && tsrange(${inicio}::TIMESTAMP, ${fin}::TIMESTAMP)
      AND c.id IS DISTINCT FROM ${salvo}::INT
    LIMIT 1
  `) as Array<{ tipo: string; nombre: string | null; desde: string; hasta: string }>;
  if (!f) return "Esa hora choca con otra cita.";
  return f.tipo === "bloqueo"
    ? `Esa hora está bloqueada (${f.desde} a ${f.hasta}).`
    : `Esa hora choca con la cita de ${f.nombre} (${f.desde} a ${f.hasta}).`;
}

/* ------------------------------------------------------- disponibilidad -- */

/**
 * Lo ocupado en un rango de días, para marcar en el formulario las horas que
 * ya están tomadas. Es solo ayuda visual: la garantía es el constraint.
 */
export async function ocupado(desde: string, hasta: string): Promise<Array<{ id: number; inicio: string; fin: string; quien: string }>> {
  if (!(await operador())) return [];
  if (!esFecha(desde) || !esFecha(hasta)) return [];
  return (await sql`
    SELECT c.id, to_char(c.inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio, to_char(c.fin, 'YYYY-MM-DD"T"HH24:MI') AS fin,
           COALESCE(cl.nombre, COALESCE(c.descripcion, 'Bloqueado')) AS quien
    FROM citas c LEFT JOIN clientes cl ON cl.id = c.cliente_id
    WHERE c.estado IN ('solicitada', 'confirmada', 'completada') AND c.inicio < (${hasta}::DATE + 1) AND c.fin > ${desde}::DATE
    ORDER BY c.inicio
  `) as Array<{ id: number; inicio: string; fin: string; quien: string }>;
}

/* ----------------------------------------------------------- clientes -- */

export async function buscarClientes(q: string): Promise<Array<{ id: number; nombre: string; telefono: string | null }>> {
  if (!(await operador())) return [];
  const t = String(q ?? "").trim().toLowerCase();
  if (t.length < 2) return [];
  const digitos = t.replace(/\D/g, "");
  return (await sql`
    SELECT id, nombre, telefono FROM clientes
    WHERE lower(nombre) LIKE ${`%${t}%`} OR (${digitos.length >= 3} AND telefono LIKE ${`%${digitos}%`})
    ORDER BY nombre LIMIT 8
  `) as Array<{ id: number; nombre: string; telefono: string | null }>;
}

export async function guardarCliente(datos: { id: number; nombre: string; telefono: string; instagram: string; notas: string }): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  const id = entero(datos.id, 1, 2e9);
  const nombre = texto(datos.nombre, 80);
  if (!id || !nombre) return { ok: false, error: "Falta el nombre." };
  const telefono = datos.telefono?.trim() ? normalizarTelefono(datos.telefono) : null;
  if (datos.telefono?.trim() && !telefono) return { ok: false, error: "El teléfono no parece chileno. Ej.: 9 1234 5678." };
  try {
    await sql`
      UPDATE clientes SET nombre = ${nombre}, telefono = ${telefono},
             instagram = ${texto(datos.instagram, 40)?.replace(/^@/, "") ?? null}, notas = ${texto(datos.notas, 2000)}
      WHERE id = ${id}
    `;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { ok: false, error: "Ese teléfono ya es de otro cliente." };
    throw e;
  }
  refrescar(`${PANEL}/cliente/${id}`);
  return { ok: true };
}

/* -------------------------------------------------------------- citas -- */

export type DatosCita = {
  clienteId?: number | null;
  nombre?: string;
  telefono?: string;
  tipo: string;
  fecha: string;
  hora: string;
  duracion: number;
  zona?: string | null;
  lado?: string | null;
  tamano?: string | null;
  estilo?: string | null;
  descripcion?: string;
  precio?: number | null;
  notas?: string;
  abono?: number | null;
  medioAbono?: string;
  /** Si se agenda desde una cotización de la web: queda unida a esta cita. */
  cotizacion?: number | null;
};

function validarCita(d: DatosCita) {
  const tipo = TIPOS.find((t) => t === d.tipo);
  if (!tipo) return { error: "Elige qué tipo de sesión es." };
  if (!esFecha(d.fecha) || !esHora(d.hora)) return { error: "Revisa la fecha y la hora." };
  const duracion = entero(d.duracion, 15, 12 * 60);
  if (!duracion) return { error: "La duración tiene que ser entre 15 minutos y 12 horas." };
  const inicio = `${d.fecha}T${d.hora}`;
  const precio = d.precio == null || (d.precio as unknown) === "" ? null : entero(d.precio, 0, 50_000_000);
  if (d.precio != null && (d.precio as unknown) !== "" && precio === null) return { error: "El precio no es un número válido." };
  return {
    valores: {
      tipo,
      inicio,
      fin: sumarMinutos(inicio, duracion),
      zona: deLista(d.zona, ZONAS),
      lado: d.lado === "izq" || d.lado === "der" ? d.lado : null,
      tamano: deLista(d.tamano, TAMANOS),
      estilo: deLista(d.estilo, ESTILOS_PRECIO),
      descripcion: texto(d.descripcion, 600),
      precio,
      notas: texto(d.notas, 2000),
    },
  };
}

/**
 * Agenda una cita. Si el cliente es nuevo se crea en el mismo paso, y si el
 * teléfono ya existe se usa ese cliente: el mismo número escrito de otra forma
 * no duplica a nadie. Con abono, queda anotado como primer pago.
 *
 * Todo va en UNA sola sentencia: si la hora choca, no queda un cliente
 * huérfano ni un abono suelto.
 */
export async function crearCita(d: DatosCita): Promise<Respuesta<{ id: number }>> {
  const u = await operador();
  if (!u) return SIN_SESION;
  const v = validarCita(d);
  if ("error" in v) return { ok: false, error: v.error ?? "Revisa los datos." };
  const c = v.valores;

  const clienteId = d.clienteId ? entero(d.clienteId, 1, 2e9) : null;
  const nombre = texto(d.nombre, 80);
  const telefono = d.telefono?.trim() ? normalizarTelefono(d.telefono) : null;
  if (!clienteId && !nombre) return { ok: false, error: "Falta el nombre del cliente." };
  if (d.telefono?.trim() && !telefono) return { ok: false, error: "El teléfono no parece chileno. Ej.: 9 1234 5678." };

  const abono = d.abono ? entero(d.abono, 1, 50_000_000) : null;
  const cotizacion = d.cotizacion ? entero(d.cotizacion, 1, 2e9) : null;
  if (d.abono && !abono) return { ok: false, error: "El abono no es un número válido." };
  const medio = d.medioAbono === "efectivo" ? "efectivo" : "transferencia";

  try {
    const [fila] = (await sql`
      WITH nuevo AS (
        INSERT INTO clientes (nombre, telefono, creado_por)
        SELECT ${nombre}, ${telefono}, ${u.nombre}
        WHERE ${clienteId}::INT IS NULL
        ON CONFLICT (telefono) WHERE telefono IS NOT NULL DO UPDATE SET telefono = EXCLUDED.telefono
        RETURNING id
      ),
      quien AS (
        SELECT ${clienteId}::INT AS id WHERE ${clienteId}::INT IS NOT NULL
        UNION ALL SELECT id FROM nuevo
      ),
      cita AS (
        INSERT INTO citas (cliente_id, tipo, inicio, fin, zona, lado, tamano, estilo, descripcion, precio, notas, creada_por)
        SELECT id, ${c.tipo}, ${c.inicio}::TIMESTAMP, ${c.fin}::TIMESTAMP, ${c.zona}, ${c.lado}, ${c.tamano}, ${c.estilo},
               ${c.descripcion}, ${c.precio}, ${c.notas}, ${u.nombre}
        FROM quien
        RETURNING id
      ),
      pago AS (
        INSERT INTO pagos (cita_id, monto, tipo, medio, anotado_por)
        SELECT id, ${abono}::INT, 'abono', ${medio}, ${u.nombre} FROM cita WHERE ${abono}::INT IS NOT NULL
      ),
      desde AS (
        UPDATE cotizaciones SET estado = 'agendada', cita_id = cita.id, vista = TRUE
        FROM cita WHERE cotizaciones.id = ${cotizacion}::INT
      )
      SELECT id FROM cita
    `) as Array<{ id: number }>;
    if (!fila) return { ok: false, error: "No se encontró al cliente." };
    refrescar(`${PANEL}/agenda`, `${PANEL}/cotizaciones`);
    return { ok: true, id: fila.id };
  } catch (e) {
    if (esChoqueDeHoras(e)) return { ok: false, error: await conQuienChoca(c.inicio, c.fin, null) };
    throw e;
  }
}

export async function editarCita(id: number, d: DatosCita): Promise<Respuesta> {
  const u = await operador();
  if (!u) return SIN_SESION;
  const citaId = entero(id, 1, 2e9);
  if (!citaId) return { ok: false, error: "Esa cita no existe." };
  const v = validarCita(d);
  if ("error" in v) return { ok: false, error: v.error ?? "Revisa los datos." };
  const c = v.valores;
  try {
    await sql`
      UPDATE citas SET tipo = ${c.tipo}, inicio = ${c.inicio}::TIMESTAMP, fin = ${c.fin}::TIMESTAMP, zona = ${c.zona},
             lado = ${c.lado}, tamano = ${c.tamano}, estilo = ${c.estilo}, descripcion = ${c.descripcion},
             precio = ${c.precio}, notas = ${c.notas}
      WHERE id = ${citaId} AND tipo <> 'bloqueo'
    `;
  } catch (e) {
    if (esChoqueDeHoras(e)) return { ok: false, error: await conQuienChoca(c.inicio, c.fin, citaId) };
    throw e;
  }
  refrescar(`${PANEL}/cita/${citaId}`, `${PANEL}/agenda`);
  return { ok: true };
}

export async function cambiarEstadoCita(id: number, estado: string): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  const citaId = entero(id, 1, 2e9);
  const nuevo = ESTADOS.find((e) => e === estado);
  if (!citaId || !nuevo) return { ok: false, error: "No se pudo cambiar." };
  try {
    await sql`UPDATE citas SET estado = ${nuevo} WHERE id = ${citaId}`;
  } catch (e) {
    // Reactivar una cancelada puede chocar con otra que se agendó después.
    if (esChoqueDeHoras(e)) return { ok: false, error: "Esa hora ya la ocupó otra cita. Cámbiale la hora antes de reactivarla." };
    throw e;
  }
  refrescar(`${PANEL}/cita/${citaId}`, `${PANEL}/agenda`);
  return { ok: true };
}

/* ------------------------------------------------------------ bloqueos -- */

export async function crearBloqueo(fecha: string, desde: string, hasta: string, motivo: string): Promise<Respuesta> {
  const u = await operador();
  if (!u) return SIN_SESION;
  if (!esFecha(fecha) || !esHora(desde) || !esHora(hasta) || hasta <= desde) return { ok: false, error: "Revisa el horario." };
  const inicio = `${fecha}T${desde}`;
  const fin = `${fecha}T${hasta}`;
  try {
    await sql`
      INSERT INTO citas (tipo, inicio, fin, descripcion, creada_por)
      VALUES ('bloqueo', ${inicio}::TIMESTAMP, ${fin}::TIMESTAMP, ${texto(motivo, 120)}, ${u.nombre})
    `;
  } catch (e) {
    if (esChoqueDeHoras(e)) return { ok: false, error: await conQuienChoca(inicio, fin, null) };
    throw e;
  }
  refrescar(`${PANEL}/agenda`);
  return { ok: true };
}

export async function quitarBloqueo(id: number): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  const citaId = entero(id, 1, 2e9);
  if (!citaId) return { ok: false, error: "No existe." };
  await sql`DELETE FROM citas WHERE id = ${citaId} AND tipo = 'bloqueo'`;
  refrescar(`${PANEL}/agenda`);
  return { ok: true };
}

/* --------------------------------------------------------------- pagos -- */

/** Va por FormData porque puede traer la foto del comprobante. */
export async function registrarPago(formulario: FormData): Promise<Respuesta> {
  const u = await operador();
  if (!u) return SIN_SESION;
  const citaId = entero(formulario.get("cita"), 1, 2e9);
  const monto = entero(formulario.get("monto"), 1, 50_000_000);
  const tipo = ["abono", "saldo", "otro"].find((t) => t === formulario.get("tipo"));
  const medio = ["transferencia", "efectivo", "otro"].find((m) => m === formulario.get("medio"));
  if (!citaId || !monto || !tipo || !medio) return { ok: false, error: "Revisa el monto y cómo se pagó." };

  const archivo = formulario.get("comprobante");
  let ruta: string | null = null;
  if (archivo instanceof File && archivo.size > 0) {
    if (!hayPrivado) return { ok: false, error: "Falta conectar el almacén privado de comprobantes en Vercel." };
    if (archivo.size > 4 * 1024 * 1024) return { ok: false, error: "El archivo pesa más de 4 MB." };
    try {
      ruta = await guardarComprobante(citaId, archivo);
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  const filas = (await sql`
    INSERT INTO pagos (cita_id, monto, tipo, medio, comprobante, anotado_por)
    SELECT id, ${monto}, ${tipo}, ${medio}, ${ruta}, ${u.nombre} FROM citas WHERE id = ${citaId} AND tipo <> 'bloqueo'
    RETURNING id
  `) as Array<{ id: number }>;
  if (filas.length === 0) {
    if (ruta) await borrarPrivado(ruta).catch(() => undefined);
    return { ok: false, error: "Esa cita no existe." };
  }
  refrescar(`${PANEL}/cita/${citaId}`, `${PANEL}/finanzas`);
  return { ok: true };
}

/** Primero el archivo, después la fila: al revés, un fallo deja archivos sin dueño ocupando espacio. */
export async function borrarPago(id: number): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  const pagoId = entero(id, 1, 2e9);
  if (!pagoId) return { ok: false, error: "No existe." };
  const [p] = (await sql`SELECT cita_id, comprobante FROM pagos WHERE id = ${pagoId}`) as Array<{ cita_id: number; comprobante: string | null }>;
  if (!p) return { ok: true };
  if (p.comprobante) {
    try {
      await borrarPrivado(p.comprobante);
    } catch {
      return { ok: false, error: "No se pudo borrar el comprobante. Vuelve a intentarlo." };
    }
  }
  await sql`DELETE FROM pagos WHERE id = ${pagoId}`;
  refrescar(`${PANEL}/cita/${p.cita_id}`, `${PANEL}/finanzas`);
  return { ok: true };
}

/* -------------------------------------------------------------- gastos -- */

const CATEGORIAS = ["insumos", "arriendo", "servicios", "publicidad", "equipos", "otro"] as const;

export async function crearGasto(d: { fecha: string; categoria: string; monto: number; descripcion: string }): Promise<Respuesta> {
  const u = await operador();
  if (!u) return SIN_SESION;
  const categoria = CATEGORIAS.find((c) => c === d.categoria);
  const monto = entero(d.monto, 1, 50_000_000);
  if (!esFecha(d.fecha) || !categoria || !monto) return { ok: false, error: "Revisa la fecha, la categoría y el monto." };
  await sql`
    INSERT INTO gastos (fecha, categoria, descripcion, monto, anotado_por)
    VALUES (${d.fecha}::DATE, ${categoria}, ${texto(d.descripcion, 200)}, ${monto}, ${u.nombre})
  `;
  refrescar(`${PANEL}/finanzas`);
  return { ok: true };
}

export async function borrarGasto(id: number): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  const gastoId = entero(id, 1, 2e9);
  if (gastoId) await sql`DELETE FROM gastos WHERE id = ${gastoId}`;
  refrescar(`${PANEL}/finanzas`);
  return { ok: true };
}

/* ------------------------------------------------------------- galería -- */

export async function subirFoto(formulario: FormData): Promise<Respuesta> {
  const u = await operador();
  if (!u) return SIN_SESION;
  if (!hayGaleria) return { ok: false, error: "Falta conectar el almacén de la galería en Vercel." };
  const archivo = formulario.get("foto");
  const alt = texto(formulario.get("alt"), 160);
  const estilo = texto(formulario.get("estilo"), 30);
  const zona = texto(formulario.get("zona"), 30);
  const ancho = entero(formulario.get("ancho"), 1, 10000);
  const alto = entero(formulario.get("alto"), 1, 10000);
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "Elige una foto." };
  if (!alt || !estilo || !zona || !ancho || !alto) return { ok: false, error: "Completa la descripción, el estilo y la zona." };
  if (archivo.size > 4 * 1024 * 1024) return { ok: false, error: "La foto pesa más de 4 MB." };
  // Desde una cita: si el cliente firmó que NO se publiquen fotos, no se sube.
  const citaId = formulario.get("cita") ? entero(formulario.get("cita"), 1, 2e9) : null;
  if (citaId) {
    const [k] = (await sql`SELECT permite_fotos FROM consentimientos WHERE cita_id = ${citaId} AND firmado_en IS NOT NULL`) as Array<{ permite_fotos: boolean }>;
    if (k && !k.permite_fotos) return { ok: false, error: "En su consentimiento no autorizó publicar fotos." };
  }
  let subida: { url: string; ruta: string };
  try {
    subida = await guardarFoto(archivo);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  await sql`
    INSERT INTO galeria (url, ruta, alt, estilo, zona, ancho, alto, orden, subida_por, cita_id)
    VALUES (${subida.url}, ${subida.ruta}, ${alt}, ${estilo}, ${zona}, ${ancho}, ${alto},
            (SELECT COALESCE(MIN(orden), 0) - 1 FROM galeria), ${u.nombre}, ${citaId})
  `;
  refrescar(`${PANEL}/galeria`, "/", ...(citaId ? [`${PANEL}/cita/${citaId}`] : []));
  return { ok: true };
}

export async function cambiarFoto(id: number, cambios: { visible?: boolean; mover?: -1 | 1 }): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  const fotoId = entero(id, 1, 2e9);
  if (!fotoId) return { ok: false, error: "No existe." };
  if (typeof cambios.visible === "boolean") await sql`UPDATE galeria SET visible = ${cambios.visible} WHERE id = ${fotoId}`;
  if (cambios.mover === -1 || cambios.mover === 1) {
    // Intercambia el orden con la vecina en esa dirección.
    await sql`
      WITH yo AS (SELECT id, orden FROM galeria WHERE id = ${fotoId}),
      vecina AS (
        SELECT g.id, g.orden FROM galeria g, yo
        WHERE CASE WHEN ${cambios.mover} < 0 THEN g.orden < yo.orden ELSE g.orden > yo.orden END
        ORDER BY CASE WHEN ${cambios.mover} < 0 THEN -g.orden ELSE g.orden END LIMIT 1
      )
      UPDATE galeria g SET orden = CASE WHEN g.id = yo.id THEN vecina.orden ELSE yo.orden END
      FROM yo, vecina WHERE g.id IN (yo.id, vecina.id)
    `;
  }
  refrescar(`${PANEL}/galeria`, "/");
  return { ok: true };
}

/** Corregir lo que dice una foto ya subida, sin volver a subirla. */
export async function editarFoto(id: number, datos: { alt: string; estilo: string; zona: string }): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  const fotoId = entero(id, 1, 2e9);
  const alt = texto(datos.alt, 160);
  const estilo = texto(datos.estilo, 30);
  const zona = texto(datos.zona, 30);
  if (!fotoId) return { ok: false, error: "No existe." };
  if (!alt || alt.length < 3 || !estilo || !zona) return { ok: false, error: "Completa la descripción, el estilo y la zona." };
  await sql`UPDATE galeria SET alt = ${alt}, estilo = ${estilo}, zona = ${zona} WHERE id = ${fotoId}`;
  refrescar(`${PANEL}/galeria`, "/");
  return { ok: true };
}

export async function borrarFoto(id: number): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  const fotoId = entero(id, 1, 2e9);
  if (!fotoId) return { ok: false, error: "No existe." };
  const [f] = (await sql`SELECT url FROM galeria WHERE id = ${fotoId}`) as Array<{ url: string }>;
  if (!f) return { ok: true };
  try {
    await borrarArchivoFoto(f.url);
  } catch {
    return { ok: false, error: "No se pudo borrar la foto. Vuelve a intentarlo." };
  }
  await sql`DELETE FROM galeria WHERE id = ${fotoId}`;
  refrescar(`${PANEL}/galeria`, "/");
  return { ok: true };
}

/* -------------------------------------------------------- cotizaciones -- */

/** En qué va una cotización. "agendada" no se pone a mano: la pone crearCita al agendar desde ella. */
export async function cambiarEstadoCotizacion(id: number, estado: string): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  const cotId = entero(id, 1, 2e9);
  const nuevo = ["nueva", "respondida", "descartada"].find((e) => e === estado);
  if (!cotId || !nuevo) return { ok: false, error: "No se pudo cambiar." };
  await sql`UPDATE cotizaciones SET estado = ${nuevo}, vista = TRUE WHERE id = ${cotId} AND estado <> 'agendada'`;
  refrescar(`${PANEL}/cotizaciones`);
  return { ok: true };
}

export async function marcarCotizacionesVistas(): Promise<Respuesta> {
  if (!(await operador())) return SIN_SESION;
  await sql`UPDATE cotizaciones SET vista = TRUE WHERE NOT vista`;
  refrescar(`${PANEL}/cotizaciones`);
  return { ok: true };
}
