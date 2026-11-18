/**
 * Feriados nacionales de Chile, calculados con las reglas de la ley para
 * cualquier año (así no hay que actualizar una lista cada diciembre):
 *
 * - Fijos: 1 ene, 1 may, 21 may, 16 jul, 15 ago, 18 y 19 sep, 1 nov, 8 y 25 dic.
 * - Semana Santa: viernes y sábado antes de Pascua.
 * - San Pedro y San Pablo (29 jun) y Encuentro de Dos Mundos (12 oct), Ley
 *   19.668: si caen martes, miércoles o jueves pasan al lunes de esa semana; si
 *   caen viernes, al lunes siguiente.
 * - Iglesias Evangélicas (31 oct), Ley 20.299: si cae martes pasa al viernes
 *   27; si cae miércoles, al viernes 2 de noviembre.
 * - Pueblos Indígenas, Ley 21.357: el día del solsticio de invierno.
 * - 17 de septiembre si cae lunes y 20 si cae viernes.
 *
 * Las elecciones y los feriados regionales no van: esos días se bloquean a mano.
 * Sin "server-only": lo usan el calendario de la web, el API y el panel.
 */

const dos = (n: number) => String(n).padStart(2, "0");
const fecha = (a: number, m: number, d: number) => {
  const f = new Date(Date.UTC(a, m - 1, d));
  return `${f.getUTCFullYear()}-${dos(f.getUTCMonth() + 1)}-${dos(f.getUTCDate())}`;
};
const diaSemana = (a: number, m: number, d: number) => new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher). */
function pascua(a: number): [number, number] {
  const b = a % 19, c = Math.floor(a / 100), d = a % 100;
  const e = Math.floor(c / 4), f = c % 4, g = Math.floor((c + 8) / 25), h = Math.floor((c - g + 1) / 3);
  const i = (19 * b + c - e - h + 15) % 30, k = Math.floor(d / 4), l = d % 4;
  const m = (32 + 2 * f + 2 * k - i - l) % 7, n = Math.floor((b + 11 * i + 22 * m) / 451);
  const mes = Math.floor((i + m - 7 * n + 114) / 31), dia = ((i + m - 7 * n + 114) % 31) + 1;
  return [mes, dia];
}

/** Ley 19.668: martes a jueves → lunes de esa semana; viernes → lunes siguiente. */
function alLunes(a: number, m: number, d: number): string {
  const s = diaSemana(a, m, d);
  if (s >= 2 && s <= 4) return fecha(a, m, d - (s - 1));
  if (s === 5) return fecha(a, m, d + 3);
  return fecha(a, m, d);
}

/** Día del solsticio de invierno en Chile; fuera de la tabla, el 21 (el más común). */
const SOLSTICIO: Record<number, number> = { 2025: 20, 2026: 21, 2027: 21, 2028: 20, 2029: 20, 2030: 21, 2031: 21, 2032: 20 };

const cache = new Map<number, Map<string, string>>();

/** Los feriados de un año: fecha "YYYY-MM-DD" → nombre. */
export function feriadosDe(a: number): Map<string, string> {
  const listo = cache.get(a);
  if (listo) return listo;
  const f = new Map<string, string>();
  const fijo = (m: number, d: number, nombre: string) => f.set(fecha(a, m, d), nombre);
  fijo(1, 1, "Año Nuevo");
  const [pm, pd] = pascua(a);
  f.set(fecha(a, pm, pd - 2), "Viernes Santo");
  f.set(fecha(a, pm, pd - 1), "Sábado Santo");
  fijo(5, 1, "Día del Trabajo");
  fijo(5, 21, "Glorias Navales");
  fijo(6, SOLSTICIO[a] ?? 21, "Pueblos Indígenas");
  f.set(alLunes(a, 6, 29), "San Pedro y San Pablo");
  fijo(7, 16, "Virgen del Carmen");
  fijo(8, 15, "Asunción de la Virgen");
  if (diaSemana(a, 9, 17) === 1) fijo(9, 17, "Fiestas Patrias");
  fijo(9, 18, "Independencia Nacional");
  fijo(9, 19, "Glorias del Ejército");
  if (diaSemana(a, 9, 20) === 5) fijo(9, 20, "Fiestas Patrias");
  f.set(alLunes(a, 10, 12), "Encuentro de Dos Mundos");
  const s31 = diaSemana(a, 10, 31);
  f.set(s31 === 2 ? fecha(a, 10, 27) : s31 === 3 ? fecha(a, 11, 2) : fecha(a, 10, 31), "Iglesias Evangélicas");
  fijo(11, 1, "Todos los Santos");
  fijo(12, 8, "Inmaculada Concepción");
  fijo(12, 25, "Navidad");
  cache.set(a, f);
  return f;
}

/** El nombre del feriado de una fecha "YYYY-MM-DD", o null. */
export const feriado = (dia: string): string | null => feriadosDe(Number(dia.slice(0, 4))).get(dia.slice(0, 10)) ?? null;
