import { sumarMinutos } from "@/lib/admin/fecha";

/**
 * Reservas desde la web: los cupos de cada día y las reglas para pedir hora.
 * Se cambia desde el panel (Web → Horario y reservas); acá están los valores
 * de partida y el cálculo de cupos libres.
 *
 * Sin "use client" ni "server-only": lo usan la web, el panel y el API.
 * Las horas son de Chile y viajan como texto ("2026-11-20T15:00"), igual que
 * en la agenda: comparar textos con ese formato es comparar instantes.
 */

/**
 * Un día de atención: las horas en que puede empezar una sesión (cupos) y a
 * qué hora termina la jornada. Cuánto dura cada tatuaje lo decide el tatuador
 * al confirmar: un cupo aparta desde su hora hasta el cupo siguiente (o hasta
 * el término), y si la sesión se alarga y pisa el siguiente, ese se cierra solo.
 */
export type DiaAtencion = { abierto: boolean; cupos: string[]; hasta: string };

export type Reservas = {
  /** Apagado, la web no ofrece elegir día y hora: solo WhatsApp. */
  activas: boolean;
  /** De lunes (0) a domingo (6). */
  dias: DiaAtencion[];
  /** Horas mínimas entre que se pide y la sesión. */
  anticipacion: number;
  /** Cuántas semanas hacia adelante se pueden elegir. */
  semanas: number;
  /** Horas que una hora pedida queda apartada sin confirmar. */
  vence: number;
};

export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

/** Tope de cupos por día: más no caben en el calendario ni en una jornada. */
export const MAX_CUPOS = 6;

export const RESERVAS_BASE: Reservas = {
  activas: true,
  dias: [
    ...Array.from({ length: 5 }, () => ({ abierto: true, cupos: ["11:00", "16:00"], hasta: "20:00" })),
    { abierto: true, cupos: ["12:00"], hasta: "18:00" },
    { abierto: false, cupos: ["12:00"], hasta: "18:00" },
  ],
  anticipacion: 24,
  semanas: 6,
  vence: 48,
};

const esHoraValida = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const entre = (v: unknown, min: number, max: number, base: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : base;
};

export function normalizarReservas(v: unknown): Reservas {
  const g = (v ?? {}) as Partial<Record<keyof Reservas, unknown>>;
  const b = RESERVAS_BASE;
  const dias = b.dias.map((base, i) => {
    const d = (Array.isArray(g.dias) ? g.dias[i] : null) as Partial<DiaAtencion> | null;
    const hasta = esHoraValida(d?.hasta) ? d.hasta : base.hasta;
    // Lo guardado antes de los cupos (desde/hasta) vuelve a los cupos de fábrica.
    const cupos = Array.isArray(d?.cupos) ? [...new Set(d.cupos.filter(esHoraValida))].sort().filter((c) => c < hasta).slice(0, MAX_CUPOS) : base.cupos;
    return { abierto: typeof d?.abierto === "boolean" ? d.abierto : base.abierto, cupos, hasta };
  });
  return {
    activas: typeof g.activas === "boolean" ? g.activas : b.activas,
    dias,
    anticipacion: entre(g.anticipacion, 0, 168, b.anticipacion),
    semanas: entre(g.semanas, 1, 12, b.semanas),
    vence: entre(g.vence, 6, 168, b.vence),
  };
}

/** Lunes = 0, domingo = 6, de una fecha "YYYY-MM-DD". */
export function diaSemana(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return (new Date(a, m - 1, d).getDay() + 6) % 7;
}

/** Lo tomado en la agenda. `bloqueo`: el tatuador cerró ese rato (vacaciones, convención, trámite). */
export type Ocupado = { inicio: string; fin: string; bloqueo?: boolean };

/** Hasta dónde aparta un cupo: el cupo siguiente del día o el término de la jornada. */
export function finDeCupo(dia: DiaAtencion, fecha: string, cupo: string): string {
  return `${fecha}T${dia.cupos.find((c) => c > cupo) ?? dia.hasta}`;
}

/**
 * Cómo se ve un día en el calendario de la web:
 *   libre / ultimo: hay cupos (ultimo = queda uno de varios)
 *   completo:       se atiende, pero los cupos ya se tomaron
 *   bloqueado:      el tatuador lo bloqueó
 *   cerrado:        ese día de la semana no se atiende
 *   pronto:         ya no alcanza la anticipación (hoy, mañana temprano)
 */
export type EstadoDia = "libre" | "ultimo" | "completo" | "bloqueado" | "cerrado" | "pronto";

export type Cupo = { hora: string; libre: boolean };

export function estadoDia(r: Reservas, fecha: string, ocupados: Ocupado[], ahora: string): { estado: EstadoDia; cupos: Cupo[] } {
  const dia = r.dias[diaSemana(fecha)];
  if (!dia?.abierto || dia.cupos.length === 0) return { estado: "cerrado", cupos: [] };
  const libres = cuposLibres(r, fecha, ocupados, ahora);
  const cupos = dia.cupos.map((hora) => ({ hora, libre: libres.includes(hora) }));
  if (libres.length > 0) return { estado: libres.length === 1 && dia.cupos.length > 1 ? "ultimo" : "libre", cupos };
  // Sin cupos: ¿porque ya no alcanza la anticipación, porque está bloqueado o porque se llenó?
  if (cuposLibres(r, fecha, [], ahora).length === 0) return { estado: "pronto", cupos };
  const abre = `${fecha}T${dia.cupos[0]}`;
  const cierra = `${fecha}T${dia.hasta}`;
  const bloqueado = ocupados.some((o) => o.bloqueo && o.inicio < cierra && abre < o.fin);
  return { estado: bloqueado ? "bloqueado" : "completo", cupos };
}

/**
 * Los cupos que se pueden pedir ese día: con la anticipación pedida y sin que
 * nada de la agenda (citas, horas pedidas y bloqueos) pise lo que el cupo aparta.
 */
export function cuposLibres(r: Reservas, fecha: string, ocupados: Ocupado[], ahora: string): string[] {
  const dia = r.dias[diaSemana(fecha)];
  if (!dia?.abierto) return [];
  const desdeMinimo = sumarMinutos(ahora, r.anticipacion * 60);
  return dia.cupos.filter((cupo) => {
    const inicio = `${fecha}T${cupo}`;
    const fin = finDeCupo(dia, fecha, cupo);
    return inicio >= desdeMinimo && !ocupados.some((o) => o.inicio < fin && inicio < o.fin);
  });
}
