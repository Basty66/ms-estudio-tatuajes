import "server-only";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { GOTICA_TTF } from "@/lib/admin/fuente-gotica";
import { nombreDonde } from "@/lib/admin/etiquetas";
import { fechaLarga, hora } from "@/lib/admin/fecha";
import { formatearTelefono } from "@/lib/admin/telefono";
import { formatearRut, RELACIONES, type DatosPersona, type Salud, type TextoAceptado, type TipoProcedimiento } from "@/lib/consentimiento";

/**
 * El consentimiento firmado, en PDF.
 *
 * Se arma cada vez que se pide, con lo que quedó guardado al firmar (los
 * datos, las respuestas, la copia exacta del texto aceptado y la firma). No
 * se guarda un PDF aparte: habría dos copias de lo mismo que mantener y
 * borrar a tiempo.
 *
 * Lleva la marca de la web: el nombre y el título en la gótica del estudio,
 * la estrella y el azul insignia. El cuerpo va en Helvetica, que se lee bien
 * impresa y solo sabe el alfabeto latino: lo demás se quita antes de escribir.
 */
export type DatosPdf = {
  tipo: TipoProcedimiento;
  inicio: string;
  zona: string | null;
  lado: string | null;
  descripcion: string | null;
  firmado_en: string;
  datos: DatosPersona;
  salud: Salud;
  permite_fotos: boolean;
  texto: TextoAceptado;
  version: string;
  huella: string;
  conservar_hasta: string;
  estudio: { nombreLargo: string; direccion: string; comuna: string; whatsapp: string };
};

const TINTA = rgb(0.07, 0.08, 0.11);
const GRIS = rgb(0.38, 0.41, 0.47);
const AZUL = rgb(0.18, 0.42, 1);
const LINEA = rgb(0.85, 0.87, 0.9);

/** La estrella de cuatro puntas del estudio (la misma de la web), en una grilla de 64. */
const ESTRELLA = "M32 2 C34 24 40 30 62 32 C40 34 34 40 32 62 C30 40 24 34 2 32 C24 30 30 24 32 2 Z";

const ANCHO = 595.28; // A4
const ALTO = 841.89;
const MARGEN = 56;
const UTIL = ANCHO - MARGEN * 2;

/** Lo que Helvetica (WinAnsi) no sabe escribir se quita, en vez de romper el PDF. */
const PERMITIDOS = new Set("–—‘’“”•…€¿¡");
/** "martes 17 de noviembre de 2026": en un documento la fecha lleva el año. */
const conAnio = (iso: string) => `${fechaLarga(iso)} de ${iso.slice(0, 4)}`;

const limpiar = (t: string) =>
  [...t.normalize("NFC")].filter((ch) => ch === "\n" || (ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) < 256) || PERMITIDOS.has(ch)).join("").trim();

export async function pdfConsentimiento(d: DatosPdf, firmaPng: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(limpiar(`${d.texto.titulo} · ${d.datos.nombre}`));
  doc.setAuthor(limpiar(d.texto.responsable));
  doc.setCreationDate(new Date());

  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
  const gotica = await doc.embedFont(Buffer.from(GOTICA_TTF, "base64"), { subset: true });
  const firma = await doc.embedPng(firmaPng);

  let pagina: PDFPage = doc.addPage([ANCHO, ALTO]);
  let y = ALTO - MARGEN;

  const nuevaPagina = () => {
    pagina = doc.addPage([ANCHO, ALTO]);
    y = ALTO - MARGEN;
  };
  const espacio = (alto: number) => {
    if (y - alto < MARGEN + 30) nuevaPagina();
  };

  /** Corta un texto en líneas que caben en `ancho`. */
  const cortar = (texto: string, fuente: PDFFont, tamano: number, ancho: number): string[] => {
    const salida: string[] = [];
    for (const parrafo of limpiar(texto).split("\n")) {
      let actual = "";
      for (const palabra of parrafo.split(/\s+/)) {
        const prueba = actual ? `${actual} ${palabra}` : palabra;
        if (fuente.widthOfTextAtSize(prueba, tamano) <= ancho) actual = prueba;
        else {
          if (actual) salida.push(actual);
          actual = palabra;
        }
      }
      salida.push(actual);
    }
    return salida;
  };

  const escribir = (texto: string, o: { fuente?: PDFFont; tamano?: number; color?: typeof TINTA; x?: number; ancho?: number; despues?: number } = {}) => {
    const fuente = o.fuente ?? normal;
    const tamano = o.tamano ?? 10;
    const x = o.x ?? MARGEN;
    const alto = tamano * 1.4;
    for (const l of cortar(texto, fuente, tamano, o.ancho ?? UTIL - (x - MARGEN))) {
      espacio(alto);
      pagina.drawText(l, { x, y: y - tamano, size: tamano, font: fuente, color: o.color ?? TINTA });
      y -= alto;
    }
    y -= o.despues ?? 0;
  };

  const estrella = (x: number, yArriba: number, tamano: number) =>
    pagina.drawSvgPath(ESTRELLA, { x, y: yArriba, scale: tamano / 64, color: AZUL, borderWidth: 0 });

  // Un título nunca queda solo al pie de la página: necesita espacio para él y un par de líneas.
  const titulo = (texto: string) => {
    espacio(80);
    y -= 14;
    pagina.drawLine({ start: { x: MARGEN, y }, end: { x: ANCHO - MARGEN, y }, thickness: 0.6, color: LINEA });
    y -= 14;
    estrella(MARGEN, y - 1.5, 7);
    escribir(texto.toUpperCase(), { fuente: negrita, tamano: 8.5, color: AZUL, x: MARGEN + 12, despues: 4 });
  };

  /**
   * Dos columnas que avanzan juntas: se mide primero la más alta y recién
   * después se dibuja, para que un salto de página no las separe.
   */
  const columnas = (izq: { texto: string; ancho: number; fuente?: PDFFont; tamano?: number; color?: typeof TINTA }, der: { texto: string; x: number; fuente?: PDFFont }) => {
    const ti = izq.tamano ?? 10;
    const li = cortar(izq.texto, izq.fuente ?? normal, ti, izq.ancho);
    const ld = cortar(der.texto || "—", der.fuente ?? normal, 10, ANCHO - MARGEN - der.x);
    const alto = Math.max(li.length * ti * 1.4, ld.length * 14);
    espacio(alto);
    li.forEach((l, i) => pagina.drawText(l, { x: MARGEN, y: y - ti - i * ti * 1.4, size: ti, font: izq.fuente ?? normal, color: izq.color ?? TINTA }));
    ld.forEach((l, i) => pagina.drawText(l, { x: der.x, y: y - 10 - i * 14, size: 10, font: der.fuente ?? normal, color: TINTA }));
    y -= alto + 3;
  };

  /** Rótulo a la izquierda, valor a la derecha. */
  const fila = (rotulo: string, valor: string) => columnas({ texto: rotulo, ancho: 130, tamano: 9, color: GRIS }, { texto: valor, x: MARGEN + 140 });

  const vineta = (texto: string) => {
    const lineas = cortar(texto, normal, 10, UTIL - 14);
    espacio(lineas.length * 14);
    pagina.drawText("•", { x: MARGEN + 2, y: y - 10, size: 10, font: normal, color: GRIS });
    lineas.forEach((l, i) => pagina.drawText(l, { x: MARGEN + 14, y: y - 10 - i * 14, size: 10, font: normal, color: TINTA }));
    y -= lineas.length * 14 + 2;
  };

  // --- Encabezado: el nombre en gótica, la estrella y el azul de la web.
  pagina.drawText("Matness", { x: MARGEN, y: y - 26, size: 30, font: gotica, color: TINTA });
  estrella(ANCHO - MARGEN - 16, y - 4, 16);
  const datosEstudio = limpiar(`${d.estudio.nombreLargo} · ${d.estudio.direccion}, ${d.estudio.comuna} · ${formatearTelefono(d.estudio.whatsapp)}`);
  pagina.drawText(datosEstudio, { x: MARGEN, y: y - 44, size: 8.5, font: normal, color: GRIS });
  y -= 58;
  pagina.drawRectangle({ x: MARGEN, y, width: UTIL, height: 1.4, color: AZUL });
  y -= 36;
  const [, para = ""] = /^Consentimiento informado\s*(.*)$/.exec(d.texto.titulo) ?? [];
  pagina.drawText("Consentimiento informado", { x: MARGEN, y, size: 26, font: gotica, color: TINTA });
  y -= 22;
  escribir(`${para.charAt(0).toUpperCase()}${para.slice(1)} · firmado el ${conAnio(d.firmado_en)} a las ${hora(d.firmado_en)}`, { tamano: 10, color: GRIS });

  // --- Persona
  titulo("Quién se lo hace");
  fila("Nombre", d.datos.nombre);
  fila("RUT", formatearRut(d.datos.rut));
  fila("Fecha de nacimiento", d.datos.nacimiento.split("-").reverse().join("-"));
  fila("Teléfono", formatearTelefono(d.datos.telefono));

  const r = d.datos.representante;
  if (r) {
    titulo("Representante legal (menor de edad)");
    fila("Nombre", r.nombre);
    fila("RUT", formatearRut(r.rut));
    fila("Relación", RELACIONES.find((x) => x.id === r.relacion)?.texto ?? r.relacion);
  }

  // --- Procedimiento
  titulo("Procedimiento");
  fila("Qué", d.texto.procedimiento.charAt(0).toUpperCase() + d.texto.procedimiento.slice(1));
  fila("Cuándo", `${conAnio(d.inicio)}, ${hora(d.inicio)}`);
  fila("Zona", nombreDonde(d.zona, d.lado) ?? "");
  if (d.descripcion) fila("Diseño", d.descripcion);

  // --- Salud
  titulo("Declaración de salud");
  for (const p of d.texto.preguntas) {
    const resp = d.salud.respuestas[p.id];
    const valor = resp ? (resp.si ? `Sí${resp.detalle ? `: ${resp.detalle}` : ""}` : "No") : "Sin respuesta";
    columnas({ texto: p.texto, ancho: UTIL - 160 }, { texto: valor, x: MARGEN + UTIL - 150, fuente: resp?.si ? negrita : normal });
  }
  if (d.salud.otras) fila("Algo más", d.salud.otras);

  // --- Riesgos y compromisos
  titulo("Riesgos que acepta");
  for (const x of d.texto.riesgos) vineta(x);
  titulo("Se compromete a");
  for (const x of d.texto.compromisos) vineta(x);

  // --- Declaraciones
  titulo("Declaraciones aceptadas");
  const declaraciones = [d.texto.declaraciones.acepto, d.texto.declaraciones.datos];
  if (r) declaraciones.push(d.texto.declaraciones.representante);
  for (const x of declaraciones) vineta(`[Sí] ${x}`);
  vineta(`[${d.permite_fotos ? "Sí" : "No"}] ${d.texto.declaraciones.fotos}`);

  // --- Firma
  titulo(r ? "Firma del representante legal" : "Firma");
  const escala = Math.min(220 / firma.width, 90 / firma.height);
  const fw = firma.width * escala;
  const fh = firma.height * escala;
  espacio(fh + 40);
  pagina.drawImage(firma, { x: MARGEN, y: y - fh, width: fw, height: fh });
  y -= fh + 4;
  pagina.drawLine({ start: { x: MARGEN, y }, end: { x: MARGEN + 240, y }, thickness: 0.6, color: GRIS });
  y -= 4;
  escribir(r ? r.nombre : d.datos.nombre, { tamano: 9, color: GRIS });

  // --- Pie en cada página: la marca a la izquierda, el respaldo a la derecha.
  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    const base = MARGEN - 26;
    p.drawLine({ start: { x: MARGEN, y: base + 14 }, end: { x: ANCHO - MARGEN, y: base + 14 }, thickness: 0.4, color: LINEA });
    p.drawSvgPath(ESTRELLA, { x: MARGEN, y: base + 7.5, scale: 7 / 64, color: AZUL, borderWidth: 0 });
    p.drawText("Matness", { x: MARGEN + 11, y: base, size: 10, font: gotica, color: TINTA });
    const pie = limpiar(
      `Versión ${d.version} · Huella ${d.huella.slice(0, 16)} · Se guarda hasta el ${d.conservar_hasta.split("-").reverse().join("-")} · ${i + 1}/${paginas.length}`,
    );
    p.drawText(pie, { x: ANCHO - MARGEN - normal.widthOfTextAtSize(pie, 7), y: base + 1, size: 7, font: normal, color: GRIS });
  });

  return doc.save();
}

/** "consentimiento-camila-rojas-2026-11-20.pdf" */
export function nombreArchivo(nombre: string, fecha: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `consentimiento-${base || "cliente"}-${fecha.slice(0, 10)}.pdf`;
}
