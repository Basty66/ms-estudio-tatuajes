export const config = { runtime: "edge" }

/**
 * Formatea una fecha a "YYYY-MM-DD" usando los componentes locales del objeto Date,
 * evitando el desfase de un día que produce toISOString() (que convierte a UTC).
 */
export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Parsea una fecha en formato "YYYY-MM-DD". Devuelve null si es inválida.
 * Solo se acepta el formato ISO corto; el frontend siempre envía este formato.
 */
export function parseDateStr(fecha: string): { dateStr: string; dayOfWeek: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha.trim())
  if (!match) return null

  const year = parseInt(match[1])
  const month = parseInt(match[2]) - 1
  const day = parseInt(match[3])

  // Construimos con mediodía local para evitar cualquier ambigüedad de DST
  const dateObj = new Date(year, month, day, 12, 0, 0)

  // Validar que la fecha exista realmente (ej. rechazar 2026-02-31)
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month ||
    dateObj.getDate() !== day
  ) {
    return null
  }

  return { dateStr: toDateStr(dateObj), dayOfWeek: dateObj.getDay() }
}

/**
 * Fecha de hoy en formato "YYYY-MM-DD" (hora local del servidor).
 */
export function todayStr(): string {
  return toDateStr(new Date())
}
