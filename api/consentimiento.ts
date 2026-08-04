import { neon } from "@neondatabase/serverless"
import { notifyArtist, escapeHtml } from "./lib/telegram"
import { checkRateLimit, getClientIp, tooManyRequests } from "./lib/ratelimit"

export const config = { runtime: "edge" }

const MAX_TEXTO = 100
const MAX_TEXTO_LARGO = 1000
const MAX_FIRMA_LEN = 300_000 // ~225 KB de firma en base64

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!checkRateLimit(`consentimiento:${ip}`, 5, 60_000)) {
      return tooManyRequests()
    }

    const data = await request.json()

    const {
      nombre,
      rut,
      fecha_nacimiento,
      telefono,
      email,
      direccion,
      zona_tatuaje,
      descripcion_tatuaje,
      mayor_edad,
      menor_edad,
      nombre_padre,
      rut_padre,
      carnet_padre_url,
      bajo_efectos,
      embarazo_lactancia,
      problemas_coagulacion,
      diabetes,
      alergias,
      alergias_detalle,
      enfermedad_cardiaca,
      epilepsia,
      vih_hepatitis,
      medicamentos,
      condiciones_otras,
      acepta_riesgos,
      acepta_cuidados,
      acepta_veracidad,
      acepta_datos,
      firma_url,
      agendamiento_id,
    } = data

    // Validaciones obligatorias
    if (!nombre || !rut || !fecha_nacimiento || !telefono || !firma_url) {
      return Response.json(
        { success: false, error: "Faltan campos obligatorios" },
        { status: 400 },
      )
    }
    if (typeof nombre !== "string" || nombre.length > MAX_TEXTO) {
      return Response.json({ success: false, error: "Nombre inválido" }, { status: 400 })
    }
    if (typeof rut !== "string" || rut.length > 20) {
      return Response.json({ success: false, error: "RUT inválido" }, { status: 400 })
    }
    if (!/^\+56\d{9}$/.test(telefono)) {
      return Response.json({ success: false, error: "Teléfono inválido" }, { status: 400 })
    }
    if (typeof firma_url !== "string" || !firma_url.startsWith("data:image") || firma_url.length > MAX_FIRMA_LEN) {
      return Response.json({ success: false, error: "Firma inválida" }, { status: 400 })
    }

    // Validar edad - debe ser mayor O menor con parental
    if (!mayor_edad && !menor_edad) {
      return Response.json(
        { success: false, error: "Debes confirmar si eres mayor o menor de edad" },
        { status: 400 },
      )
    }

    // Si es menor, validar datos del padre
    if (menor_edad) {
      if (!nombre_padre || !rut_padre) {
        return Response.json(
          { success: false, error: "Los datos del padre/madre responsable son obligatorios para menores" },
          { status: 400 },
        )
      }
      if (typeof nombre_padre !== "string" || nombre_padre.length > MAX_TEXTO) {
        return Response.json({ success: false, error: "Nombre del padre inválido" }, { status: 400 })
      }
      if (typeof rut_padre !== "string" || rut_padre.length > 20) {
        return Response.json({ success: false, error: "RUT del padre inválido" }, { status: 400 })
      }
      if (typeof carnet_padre_url !== "string" || carnet_padre_url.length > 1_000_000) {
        return Response.json({ success: false, error: "Imagen del carnet inválida" }, { status: 400 })
      }
    }

    if (!acepta_riesgos || !acepta_cuidados || !acepta_veracidad || !acepta_datos) {
      return Response.json(
        { success: false, error: "Debes aceptar todas las declaraciones" },
        { status: 400 },
      )
    }

    // Validar fecha de nacimiento y calcular edad
    const nac = new Date(fecha_nacimiento + "T12:00:00")
    if (isNaN(nac.getTime())) {
      return Response.json({ success: false, error: "Fecha de nacimiento inválida" }, { status: 400 })
    }
    const hoy = new Date()
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--

    // Si dice mayor pero es menor, rechazar
    if (mayor_edad && edad < 18) {
      return Response.json(
        { success: false, error: "Indicaste que eres mayor de edad pero tienes menos de 18 años" },
        { status: 400 },
      )
    }

    // Si dice menor pero es mayor, también es válido (puede tener 17 años)
    if (menor_edad && edad >= 18) {
      return Response.json(
        { success: false, error: "Indicaste que eres menor de edad pero tienes 18 o más años" },
        { status: 400 },
      )
    }

    const clip = (v: unknown, max: number) =>
      typeof v === "string" ? v.slice(0, max) : ""

    const sql = neon(process.env.NEON_DATABASE_URL!)

    const result = await sql`
      INSERT INTO consentimientos (
        nombre, rut, fecha_nacimiento, telefono, email, direccion,
        zona_tatuaje, descripcion_tatuaje,
        mayor_edad, menor_edad, nombre_padre, rut_padre, carnet_padre_url,
        bajo_efectos, embarazo_lactancia, problemas_coagulacion,
        diabetes, alergias, alergias_detalle, enfermedad_cardiaca, epilepsia,
        vih_hepatitis, medicamentos, condiciones_otras,
        acepta_riesgos, acepta_cuidados, acepta_veracidad, acepta_datos,
        firma_url, ip_firma, agendamiento_id
      ) VALUES (
        ${clip(nombre, MAX_TEXTO)}, ${clip(rut, 20)}, ${fecha_nacimiento}, ${telefono},
        ${clip(email, MAX_TEXTO)}, ${clip(direccion, MAX_TEXTO_LARGO)},
        ${clip(zona_tatuaje, MAX_TEXTO)}, ${clip(descripcion_tatuaje, MAX_TEXTO_LARGO)},
        ${!!mayor_edad}, ${!!menor_edad},
        ${clip(nombre_padre || "", MAX_TEXTO)}, ${clip(rut_padre || "", 20)}, ${carnet_padre_url || ""},
        ${!!bajo_efectos}, ${!!embarazo_lactancia}, ${!!problemas_coagulacion},
        ${!!diabetes}, ${!!alergias}, ${clip(alergias_detalle, MAX_TEXTO_LARGO)},
        ${!!enfermedad_cardiaca}, ${!!epilepsia}, ${!!vih_hepatitis},
        ${clip(medicamentos, MAX_TEXTO_LARGO)}, ${clip(condiciones_otras, MAX_TEXTO_LARGO)},
        ${!!acepta_riesgos}, ${!!acepta_cuidados}, ${!!acepta_veracidad}, ${!!acepta_datos},
        ${firma_url}, ${ip},
        ${agendamiento_id ? parseInt(String(agendamiento_id)) : null}
      )
      RETURNING id
    `

    // Alerta médica si hay condiciones relevantes
    const alertas: string[] = []
    if (alergias) alertas.push("Alergias")
    if (problemas_coagulacion) alertas.push("Coagulación")
    if (diabetes) alertas.push("Diabetes")
    if (enfermedad_cardiaca) alertas.push("Cardíaca")
    if (epilepsia) alertas.push("Epilepsia")
    if (vih_hepatitis) alertas.push("VIH/Hepatitis")
    if (embarazo_lactancia) alertas.push("Embarazo/Lactancia")

    const esMenor = menor_edad && nombre_padre

    await notifyArtist(
      `<b>📋 CONSENTIMIENTO FIRMADO</b>\n` +
      `<b>Cliente:</b> ${escapeHtml(nombre)}\n` +
      `<b>RUT:</b> ${escapeHtml(rut)}\n` +
      `<b>Teléfono:</b> <a href="https://wa.me/${telefono.replace(/\+/g, "")}">${telefono}</a>\n` +
      (zona_tatuaje ? `<b>Zona:</b> ${escapeHtml(zona_tatuaje)}\n` : "") +
      (esMenor ? `\n👶 <b>MENOR DE EDAD</b>\n<b>Padre/Madre:</b> ${escapeHtml(nombre_padre)}\n<b>RUT:</b> ${escapeHtml(rut_padre)}\n` : "") +
      (alertas.length > 0 ? `⚠️ <b>ATENCIÓN MÉDICA:</b> ${escapeHtml(alertas.join(", "))}` : ""),
    )

    return Response.json({ success: true, id: result[0]?.id })
  } catch (error) {
    console.error("consentimiento error:", String(error))
    return Response.json({ success: false, error: "Error al guardar el consentimiento" }, { status: 500 })
  }
}
