import { createHash } from "node:crypto";
import { sql } from "@/db/conexion";
import { leerContenido } from "@/db/contenido";
import { pedidoPorToken } from "@/db/consentimientos";
import { borrarPrivado, guardarFirma, hayPrivado } from "@/lib/admin/almacen";
import { avisar } from "@/lib/admin/avisos";
import { hoyChile } from "@/lib/admin/fecha";
import { nombreArchivo, pdfConsentimiento } from "@/lib/admin/pdf";
import { PANEL } from "@/lib/admin/ruta";
import { normalizarTelefono } from "@/lib/admin/telefono";
import {
  alertasDe,
  armarTexto,
  edad,
  EDAD_MINIMA,
  MAYORIA_DE_EDAD,
  normalizarRut,
  preguntasPara,
  RELACIONES,
  type DatosPersona,
  type Firma,
  type Salud,
} from "@/lib/consentimiento";

/**
 * La firma del consentimiento, desde el link que el cliente recibió por
 * WhatsApp (o desde "Firmar aquí" en el teléfono del estudio).
 *
 * Es una puerta abierta a internet, sin sesión: la llave es el token del
 * link, que se compara por su hash, sirve una sola vez y vence. Todo lo que
 * llega se revisa acá de nuevo; lo que diga el navegador no obliga a nada.
 *
 * Responde el PDF firmado: es la copia que se lleva el cliente.
 */
export const dynamic = "force-dynamic";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_FIRMA = 300 * 1024;

const error = (mensaje: string, status = 400) => Response.json({ error: mensaje }, { status });
const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export async function POST(request: Request) {
  if (!hayPrivado) return error("El estudio todavía no puede recibir firmas. Avísale por WhatsApp.", 503);

  let cuerpo: Partial<Firma> & { token?: unknown; estudio?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return error("No llegó bien el formulario. Vuelve a enviarlo.");
  }

  const token = typeof cuerpo.token === "string" ? cuerpo.token : "";
  if (!/^[\w-]{40,64}$/.test(token)) return error("Este link no sirve. Pide uno nuevo por WhatsApp.", 404);
  const hash = createHash("sha256").update(token).digest("hex");
  const pedido = await pedidoPorToken(hash);
  if (!pedido) return error("Este link ya se usó o venció. Pide uno nuevo por WhatsApp.", 410);

  // --- Datos de la persona
  const d = (cuerpo.datos ?? {}) as Partial<DatosPersona>;
  const nombre = texto(d.nombre, 80);
  const rut = normalizarRut(String(d.rut ?? ""));
  const nacimiento = String(d.nacimiento ?? "");
  const telefono = normalizarTelefono(String(d.telefono ?? ""));
  const hoy = hoyChile();
  if (nombre.length < 3) return error("Escribe tu nombre completo.");
  if (!rut) return error("Revisa el RUT: el dígito verificador no calza.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nacimiento) || Number.isNaN(Date.parse(nacimiento)) || nacimiento >= hoy) return error("Revisa tu fecha de nacimiento.");
  const anios = edad(nacimiento, hoy);
  if (anios > 110) return error("Revisa tu fecha de nacimiento.");
  if (anios < EDAD_MINIMA) return error(`El estudio tatúa desde los ${EDAD_MINIMA} años.`);
  if (!telefono) return error("Revisa tu teléfono. Ej.: 9 1234 5678.");

  let representante: DatosPersona["representante"] = null;
  if (anios < MAYORIA_DE_EDAD) {
    const r = (d.representante ?? {}) as Partial<NonNullable<DatosPersona["representante"]>>;
    const rnombre = texto(r.nombre, 80);
    const rrut = normalizarRut(String(r.rut ?? ""));
    const relacion = RELACIONES.find((x) => x.id === r.relacion)?.id;
    if (rnombre.length < 3 || !relacion) return error("Faltan los datos de tu madre, padre o tutor legal.");
    if (!rrut) return error("Revisa el RUT de tu representante: el dígito verificador no calza.");
    if (rrut === rut) return error("El RUT del representante no puede ser el tuyo.");
    representante = { nombre: rnombre, rut: rrut, relacion };
  }
  const datos: DatosPersona = { nombre, rut, nacimiento, telefono, representante };

  // --- Salud: cada pregunta, contestada a propósito
  const tipo = pedido.tipo;
  const llegadas = (cuerpo.salud?.respuestas ?? {}) as Record<string, { si?: unknown; detalle?: unknown }>;
  const salud: Salud = { respuestas: {}, otras: texto(cuerpo.salud?.otras, 300) };
  for (const p of preguntasPara(tipo)) {
    const r = llegadas[p.id];
    if (typeof r?.si !== "boolean") return error("Te faltó contestar una pregunta de salud.");
    const detalle = r.si ? texto(r.detalle, 200) : "";
    if (r.si && p.detalle && !detalle) return error(`Cuéntanos en "${p.texto}" ${p.detalle.toLowerCase()}`);
    salud.respuestas[p.id] = detalle ? { si: r.si, detalle } : { si: r.si };
  }

  // --- Lo aceptado
  const a = cuerpo.acepta ?? ({} as Partial<Firma["acepta"]>);
  if (a.acepto !== true) return error("Para seguir tienes que aceptar los riesgos y los compromisos.");
  if (representante && a.representante !== true) return error("Tu representante tiene que aceptar que te autoriza y que estará contigo en la sesión.");
  if (a.datos !== true) return error("Sin tu autorización para guardar los datos no podemos registrar el consentimiento.");
  const permiteFotos = cuerpo.permiteFotos === true;

  // --- Firma
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(typeof cuerpo.firma === "string" ? cuerpo.firma : "");
  const png = m ? new Uint8Array(Buffer.from(m[1], "base64")) : null;
  if (!png || png.length < 200 || png.length > MAX_FIRMA || !PNG.every((b, i) => png[i] === b)) return error("No llegó la firma. Firma de nuevo en el recuadro.");

  // --- Guardar: primero el archivo; si la fila no se puede escribir, se borra.
  const { consentimiento, estudio } = await leerContenido();
  const aceptado = armarTexto(consentimiento, tipo, estudio.responsable);
  const version = `v1-${createHash("sha256").update(JSON.stringify(aceptado)).digest("hex").slice(0, 8)}`;
  const huella = createHash("sha256")
    .update(JSON.stringify({ datos, salud, permiteFotos, aceptado, version }))
    .update(createHash("sha256").update(png).digest("hex"))
    .digest("hex");
  const alertas = alertasDe(salud, tipo);
  const donde = cuerpo.estudio === true ? "estudio" : "link";

  let ruta: string;
  try {
    ruta = await guardarFirma(pedido.cita_id, png);
  } catch {
    return error("No se pudo guardar la firma. Vuelve a intentarlo en un momento.", 503);
  }

  const filas = (await sql`
    UPDATE consentimientos
    SET firmado_en = NOW(), donde = ${donde}, datos = ${JSON.stringify(datos)}::JSONB, salud = ${JSON.stringify(salud)}::JSONB,
        alertas = ${alertas}, permite_fotos = ${permiteFotos}, texto = ${JSON.stringify(aceptado)}::JSONB, version = ${version},
        firma = ${ruta}, huella = ${huella}, token_hash = NULL, vence_en = NULL,
        conservar_hasta = ((NOW() AT TIME ZONE 'America/Santiago')::DATE + INTERVAL '5 years')::DATE
    WHERE id = ${pedido.id} AND token_hash = ${hash} AND firmado_en IS NULL
    RETURNING to_char(firmado_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS firmado_en, conservar_hasta::TEXT AS conservar_hasta
  `) as Array<{ firmado_en: string; conservar_hasta: string }>;
  if (filas.length === 0) {
    await borrarPrivado(ruta).catch(() => undefined);
    return error("Este link ya se usó. Si no fuiste tú, avísale al estudio.", 409);
  }

  if (donde === "link") {
    await avisar({
      titulo: `${nombre.split(" ")[0]} firmó el consentimiento`,
      cuerpo: alertas.length ? `Ojo antes de empezar: ${alertas.join(" · ")}` : "Sin alertas de salud.",
      url: `${PANEL}/cita/${pedido.cita_id}`,
      tag: `consentimiento-${pedido.cita_id}`,
    }).catch(() => undefined);
  }

  const pdf = await pdfConsentimiento(
    { ...pedido, ...filas[0], datos, salud, permite_fotos: permiteFotos, texto: aceptado, version, huella, estudio },
    png,
  );
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombreArchivo(nombre, filas[0].firmado_en)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
