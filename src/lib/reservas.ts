import { sumarMinutos } from "@/lib/admin/fecha";
import { TAMANOS, type Tamano } from "@/lib/precios";

/**
 * Reservas desde la web: cuándo atiende el estudio, cuánto dura cada sesión y
 * las reglas para pedir hora. Se cambia desde el panel (Web → Horario y
 * reservas); acá están los valores de partida y el cálculo de horas libres.
 *
 * Sin "use client" ni "server-only": lo usan la web, el panel y el API.
 * Las horas son de Chile y viajan como texto ("2026-11-20T15:00"), igual que
 * en la agenda: comparar textos con ese formato es comparar instantes.
 */

export type DiaAtencion = { abierto: boolean; desde: string; hasta: string };

export type Reservas = {
  /** Apagado, la web no ofrece elegir día y hora: solo WhatsApp. */
  activas: boolean;
  /** De lunes (0) a domingo (6). */
  dias: DiaAtencion[];
  /** Minutos de una sesión según el tamaño del tatuaje. */
  duraciones: Record<Tamano, number>;
  /** Minutos de una sesión de láser. */
  laser: number;
  /** Cada cuántos minutos se ofrece una hora de inicio. */
  intervalo: 30 | 60;
  /** Horas mínimas entre que se pide y la sesión. */
  anticipacion: number;
  /** Cuántas semanas hacia adelante se pueden elegir. */
  semanas: number;
  /** Horas que una hora pedida queda apartada sin confirmar. */
  vence: number;
};

export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

export const RESERVAS_BASE: Reservas = {
  activas: true,
  dias: [
    ...Array.from({ length: 5 }, () => ({ abierto: true, desde: "11:00", hasta: "20:00" })),
    { abierto: true, desde: "11:00", hasta: "18:00" },
    { abierto: false, desde: "11:00", hasta: "18:00" },
  ],
  duraciones: { pequeno: 60, mediano: 180, grande: 300, manga: 360 },
  laser: 60,
  intervalo: 60,
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
    const desde = esHoraValida(d?.desde) ? d.desde : base.desde;
    const hasta = esHoraValida(d?.hasta) ? d.hasta : base.hasta;
    return { abierto: typeof d?.abierto === "boolean" ? d.abierto : base.abierto, desde, hasta: hasta > desde ? hasta : base.hasta };
  });
  const duraciones = { ...b.duraciones };
  const gd = (g.duraciones ?? {}) as Record<string, unknown>;
  for (const t of TAMANOS) duraciones[t.id] = entre(gd[t.id], 30, 720, b.duraciones[t.id]);
  return {
    activas: typeof g.activas === "boolean" ? g.activas : b.activas,
    dias,
    duraciones,
    laser: entre(g.laser, 15, 480, b.laser),
    intervalo: g.intervalo === 30 ? 30 : 60,
    anticipacion: entre(g.anticipacion, 0, 168, b.anticipacion),
    semanas: entre(g.semanas, 1, 12, b.semanas),
    vence: entre(g.vence, 6, 168, b.vence),
  };
}

/** Cuánto dura lo que se cotizó. */
export const duracionDe = (r: Reservas, tipo: "tatuaje" | "laser", tamano: Tamano) => (tipo === "laser" ? r.laser : r.duraciones[tamano]);

/** Lunes = 0, domingo = 6, de una fecha "YYYY-MM-DD". */
export function diaSemana(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return (new Date(a, m - 1, d).getDay() + 6) % 7;
}

/** Lo tomado en la agenda. `bloqueo`: el tatuador cerró ese rato (vacaciones, convención, trámite). */
export type Ocupado = { inicio: string; fin: string; bloqueo?: boolean };

/**
 * Cómo se ve un día en el calendario de la web:
 *   libre / pocas: hay horas (pocas = una o dos)
 *   completo:      se atiende, pero las citas ya lo llenaron
 *   bloqueado:     el tatuador lo bloqueó
 *   cerrado:       ese día de la semana no se atiende
 *   pronto:        ya no alcanza la anticipación (hoy, mañana temprano)
 */
export type EstadoDia = "libre" | "pocas" | "completo" | "bloqueado" | "cerrado" | "pronto";

export function estadoDia(r: Reservas, fecha: string, duracion: number, ocupados: Ocupado[], ahora: string): { estado: EstadoDia; horas: string[] } {
  const dia = r.dias[diaSemana(fecha)];
  if (!dia?.abierto) return { estado: "cerrado", horas: [] };
  const horas = horasLibres(r, fecha, duracion, ocupados, ahora);
  if (horas.length > 0) return { estado: horas.length <= 2 ? "pocas" : "libre", horas };
  // Sin horas: ¿porque ya no alcanza la anticipación, porque está bloqueado o porque se llenó?
  const sinAgenda = horasLibres(r, fecha, duracion, [], ahora);
  if (sinAgenda.length === 0) return { estado: "pronto", horas: [] };
  const abre = `${fecha}T${dia.desde}`;
  const cierra = `${fecha}T${dia.hasta}`;
  const bloqueado = ocupados.some((o) => o.bloqueo && o.inicio < cierra && abre < o.fin);
  return { estado: bloqueado ? "bloqueado" : "completo", horas: [] };
}

/**
 * Las horas en que puede empezar una sesión de `duracion` minutos ese día:
 * dentro del horario, con la anticipación pedida y sin pisar nada de la
 * agenda (citas, horas pedidas y bloqueos).
 */
export function horasLibres(r: Reservas, fecha: string, duracion: number, ocupados: Ocupado[], ahora: string): string[] {
  const dia = r.dias[diaSemana(fecha)];
  if (!dia?.abierto) return [];
  const desdeMinimo = sumarMinutos(ahora, r.anticipacion * 60);
  const libres: string[] = [];
  for (let inicio = `${fecha}T${dia.desde}`; sumarMinutos(inicio, duracion) <= `${fecha}T${dia.hasta}`; inicio = sumarMinutos(inicio, r.intervalo)) {
    const fin = sumarMinutos(inicio, duracion);
    if (inicio < desdeMinimo) continue;
    if (ocupados.some((o) => o.inicio < fin && inicio < o.fin)) continue;
    libres.push(inicio.slice(11, 16));
  }
  return libres;
}

/** "3 h", "1 h 30 min", "45 min" */
export function textoDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}
