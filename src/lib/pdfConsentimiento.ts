export interface DatosConsentimientoPdf {
  nombre: string
  rut: string
  fechaNacimiento: string
  telefono: string
  email?: string
  zonaTatuaje?: string
  descripcionTatuaje?: string
  saludMarcadas: string[]
  alergiasDetalle?: string
  medicamentos?: string
  firmaUrl: string
  firmadoEn?: string
  origen: "cliente" | "admin"
  // Autorización parental
  menorEdad?: boolean
  nombrePadre?: string
  rutPadre?: string
  carnetPadreUrl?: string
}

const COLOR_DARK: [number, number, number] = [5, 6, 8]
const COLOR_CYAN: [number, number, number] = [0, 229, 255]
const COLOR_GRAY: [number, number, number] = [110, 110, 118]
const COLOR_TEXT: [number, number, number] = [28, 30, 34]

export async function descargarPdfConsentimiento(d: DatosConsentimientoPdf) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const W = 210
  const M = 20
  const CONTENT = W - M * 2

  // Header oscuro con acento neón
  doc.setFillColor(...COLOR_DARK)
  doc.rect(0, 0, W, 30, "F")
  doc.setFillColor(...COLOR_CYAN)
  doc.rect(0, 30, W, 1.2, "F")

  // Logo: caja MS + nombre
  doc.setFillColor(...COLOR_CYAN)
  doc.roundedRect(M, 8, 13, 13, 1.5, 1.5, "F")
  doc.setTextColor(...COLOR_DARK)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("MS", M + 6.5, 17.8, { align: "center" })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(17)
  doc.text("MATNESS", M + 19, 15.5)
  doc.setTextColor(...COLOR_CYAN)
  doc.setFontSize(7.5)
  doc.text("TATTOO STUDIO", M + 19, 20)
  doc.setTextColor(150, 155, 165)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("MS Estudio de Tatuajes · Melipilla, Chile", M + 19, 25)

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("CONSENTIMIENTO", W - M, 13, { align: "right" })
  doc.setTextColor(...COLOR_CYAN)
  doc.setFontSize(11)
  doc.text("INFORMADO", W - M, 19, { align: "right" })
  doc.setTextColor(150, 155, 165)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("Tatuaje permanente", W - M, 25, { align: "right" })

  let y = 46

  const title = (t: string) => {
    if (y > 265) {
      doc.addPage()
      y = 20
    }
    doc.setTextColor(...COLOR_CYAN)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(t.toUpperCase(), M, y)
    doc.setDrawColor(...COLOR_CYAN)
    doc.setLineWidth(0.4)
    doc.line(M, y + 1.8, W - M, y + 1.8)
    y += 9
  }

  const field = (label: string, value: string) => {
    if (y > 265) {
      doc.addPage()
      y = 20
    }
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...COLOR_GRAY)
    doc.setFontSize(8)
    doc.text(label.toUpperCase(), M, y)
    doc.setTextColor(...COLOR_TEXT)
    doc.setFontSize(9.5)
    const lines = doc.splitTextToSize(value || "—", CONTENT) as string[]
    doc.text(lines, M, y + 4.5)
    y += 5 + lines.length * 4.6
  }

  const bullets = (label: string, items: string[], vacio: string) => {
    title(label)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...COLOR_TEXT)
    doc.setFontSize(9.5)
    const lista = items.length > 0 ? items : [vacio]
    const lines = doc.splitTextToSize(lista.map((i) => `•  ${i}`).join("\n"), CONTENT) as string[]
    doc.text(lines, M, y)
    y += lines.length * 4.6 + 4
  }

  // ─── Datos personales ───
  title("Datos personales")
  field("Nombre completo", d.nombre)
  field("RUT", d.rut)
  field("Fecha de nacimiento", d.fechaNacimiento)
  field("Teléfono", d.telefono)
  field("Email", d.email || "")

  // ─── Datos del tatuaje ───
  title("Datos del tatuaje")
  field("Zona del cuerpo", d.zonaTatuaje || "")
  field("Descripción", d.descripcionTatuaje || "")

  // ─── Declaración de salud ───
  bullets(
    "Declaración de salud",
    d.saludMarcadas,
    "No señaló condiciones de salud relevantes.",
  )
  if (d.alergiasDetalle) field("Detalle de alergias", d.alergiasDetalle)
  if (d.medicamentos) field("Medicamentos", d.medicamentos)

  // ─── Autorización Parental (si aplica) ───
  if (d.menorEdad && d.nombrePadre) {
    title("Autorización Parental")
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...COLOR_TEXT)
    doc.setFontSize(9.5)
    const textoMenor = "El/la suscribiente, menor de edad, cuenta con el consentimiento de su padre/madre responsable para la realización del tatuaje."
    const lines = doc.splitTextToSize(textoMenor, CONTENT) as string[]
    doc.text(lines, M, y)
    y += lines.length * 4.6 + 4

    field("Nombre del padre/madre", d.nombrePadre)
    field("RUT del padre/madre", d.rutPadre || "")
  }

  // ─── Declaraciones ───
  const declaraciones = [
    "Entiendo que un tatuaje es permanente y conozco los riesgos (infección, reacción alérgica, cicatrización).",
    "Me comprometo a seguir las indicaciones de cuidado post-tatuaje del estudio.",
    "Declaro que toda la información entregada es verdadera y completa.",
    "Autorizo el tratamiento de mis datos personales para fines del servicio.",
  ]

  if (d.menorEdad) {
    declaraciones.unshift("Soy menor de 18 años cuento con autorización de mi padre/madre responsable.")
  } else {
    declaraciones.unshift("Confirmo que soy mayor de 18 años.")
  }

  bullets("Declaraciones", declaraciones, "")

  // ─── Firma ───
  title("Firma")
  doc.setDrawColor(150, 155, 165)
  doc.setLineWidth(0.3)
  doc.roundedRect(M, y, 70, 32, 1.5, 1.5, "S")
  try {
    doc.addImage(d.firmaUrl, "PNG", M + 4, y + 4, 62, 24, undefined, "FAST")
  } catch { /* firma ilegible: se omite la imagen */ }
  y += 37
  field("Firmado electrónicamente", d.firmadoEn || new Date().toLocaleString("es-CL"))

  // ─── Footer ───
  doc.setDrawColor(...COLOR_CYAN)
  doc.setLineWidth(0.4)
  doc.line(M, 272, W - M, 272)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_GRAY)
  doc.text(
    d.origen === "admin"
      ? "Documento oficial del estudio · Copia administrativa"
      : "Documento generado automáticamente · Copia para el cliente",
    M, 277,
  )
  doc.text("MS Estudio de Tatuajes · Matness Tattoos · Melipilla, Chile", M, 282)

  doc.save(`consentimiento-${String(d.nombre || "cliente").replace(/[^a-zA-Z0-9_]/g, "-").toLowerCase()}.pdf`)
}
