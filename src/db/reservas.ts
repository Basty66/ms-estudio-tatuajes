import "server-only";
import { sql } from "@/db/conexion";
import { ahoraChile, hoyChile, sumarDias } from "@/lib/admin/fecha";
import { estadoDia, type Cupo, type EstadoDia, type Ocupado, type Reservas } from "@/lib/reservas";

/**
 * Lo que necesita el calendario de la web: qué cupos están tomados y cuáles
 * quedan libres. Las horas pedidas que nadie confirmó a tiempo se liberan
 * antes de mirar, así el calendario nunca muestra ocupado algo que ya venció.
 */

/** Libera las horas pedidas desde la web que pasaron su plazo sin confirmarse. */
export async function liberarVencidas(horas: number): Promise<number> {
  const filas = (await sql`
    UPDATE citas SET estado = 'cancelada'
    WHERE estado = 'solicitada' AND creada_en < NOW() - (${horas} || ' hours')::INTERVAL
    RETURNING id
  `) as Array<{ id: number }>;
  return filas.length;
}

/** Lo tomado entre dos días (citas, horas pedidas y bloqueos). Sin nombres: solo cuándo. */
export async function ocupadosEntre(desde: string, hasta: string): Promise<Ocupado[]> {
  return (await sql`
    SELECT to_char(inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio, to_char(fin, 'YYYY-MM-DD"T"HH24:MI') AS fin, tipo = 'bloqueo' AS bloqueo
    FROM citas
    WHERE estado IN ('solicitada', 'confirmada', 'completada') AND inicio < (${hasta}::DATE + 1) AND fin > ${desde}::DATE
  `) as Ocupado[];
}

/** `horas`: los cupos libres, lo que se puede pedir. */
export type DiaLibre = { fecha: string; estado: EstadoDia; cupos: Cupo[]; horas: string[] };

/** Día por día, desde hoy y por las semanas que se ofrecen, cada cupo y si está libre. */
export async function disponibilidad(r: Reservas): Promise<DiaLibre[]> {
  await liberarVencidas(r.vence);
  const hoy = hoyChile();
  const hasta = sumarDias(hoy, r.semanas * 7 - 1);
  const [ocupados, ahora] = [await ocupadosEntre(hoy, hasta), ahoraChile()];
  const dias: DiaLibre[] = [];
  for (let f = hoy; f <= hasta; f = sumarDias(f, 1)) {
    const { estado, cupos } = estadoDia(r, f, ocupados, ahora);
    dias.push({ fecha: f, estado, cupos, horas: cupos.filter((c) => c.libre).map((c) => c.hora) });
  }
  return dias;
}
