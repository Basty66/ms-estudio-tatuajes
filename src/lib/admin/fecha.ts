/**
 * Fechas del panel, siempre en hora de Chile.
 *
 * Las citas se guardan como hora local sin zona ("2026-11-10T15:00") y viajan
 * como texto: así nunca pasan por un Date en UTC del servidor, que es como
 * una cita de las 23:00 termina apareciendo al día siguiente.
 */
export const ZONA_HORARIA = "America/Santiago";

/** "2026-11-10" en Chile, ahora. */
export function hoyChile(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(new Date());
}

/** "2026-11-10T15:42" en Chile, ahora: el mismo formato que las citas, para compararlas como texto. */
export function ahoraChile(): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Suma días a una fecha "YYYY-MM-DD" sin pasar por zonas horarias. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function partes(fecha: string) {
  const [a, m, d] = fecha.slice(0, 10).split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return { a, m, d, dia };
}

/** "martes 10 de noviembre" */
export function fechaLarga(fecha: string): string {
  const { m, d, dia } = partes(fecha);
  return `${DIAS[dia]} ${d} de ${MESES[m - 1]}`;
}

/** "mar 10 nov" */
export function fechaCorta(fecha: string): string {
  const { m, d, dia } = partes(fecha);
  return `${DIAS[dia].slice(0, 3)} ${d} ${MESES[m - 1].slice(0, 3)}`;
}

/** "Hoy", "Mañana", "Ayer" o la fecha larga. */
export function fechaRelativa(fecha: string, hoy = hoyChile()): string {
  const f = fecha.slice(0, 10);
  if (f === hoy) return "Hoy";
  if (f === sumarDias(hoy, 1)) return "Mañana";
  if (f === sumarDias(hoy, -1)) return "Ayer";
  return fechaLarga(f);
}

/** "noviembre 2026" */
export function nombreMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return `${MESES[m - 1]} ${a}`;
}

/** El mes anterior (-1) o siguiente (1) a "2026-11". */
export function mesVecino(mes: string, paso: number): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + paso, 1)).toISOString().slice(0, 7);
}

/** "15:00" de "2026-11-10T15:00" */
export const hora = (instante: string) => instante.slice(11, 16);

/** Minutos entre dos instantes locales del mismo formato. */
export function minutosEntre(desde: string, hasta: string): number {
  const a = Date.parse(`${desde}:00Z`);
  const b = Date.parse(`${hasta}:00Z`);
  return Math.round((b - a) / 60000);
}

/** Suma minutos a "2026-11-10T15:00" y devuelve el mismo formato. */
export function sumarMinutos(instante: string, minutos: number): string {
  return new Date(Date.parse(`${instante}:00Z`) + minutos * 60000).toISOString().slice(0, 16);
}

export function duracionTexto(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export const esFecha = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const esHora = (s: unknown): s is string => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const esMes = (s: unknown): s is string => typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
