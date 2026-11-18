import "server-only";
import { sql } from "@/db/conexion";
import type { DatosPersona, Salud, TextoAceptado, TipoProcedimiento } from "@/lib/consentimiento";

/**
 * Lecturas del consentimiento informado y del seguimiento después de la
 * sesión. Las escrituras: el pedido y el borrado en
 * src/app/tinta/_acciones/consentimientos.ts (con sesión), la firma en
 * src/app/api/consentimiento (con el token del link).
 */

export type ResumenConsentimiento = {
  id: number;
  estado: "firmado" | "pendiente" | "vencido";
  pedido_en: string;
  vence_en: string | null;
  firmado_en: string | null;
  donde: "link" | "estudio" | null;
  alertas: string[];
  permite_fotos: boolean | null;
  menor: boolean;
};

const RESUMEN = sql.unsafe(`
  k.id,
  CASE WHEN k.firmado_en IS NOT NULL THEN 'firmado' WHEN k.vence_en > NOW() THEN 'pendiente' ELSE 'vencido' END AS estado,
  to_char(k.pedido_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS pedido_en,
  to_char(k.vence_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS vence_en,
  to_char(k.firmado_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS firmado_en,
  k.donde, k.alertas, k.permite_fotos,
  COALESCE(k.datos->'representante' <> 'null'::JSONB, FALSE) AS menor
`);

/**
 * El consentimiento de una cita: el suyo si está vigente; si no, el firmado en
 * otra sesión del mismo trabajo (`heredado`: vale para todo el tatuaje y no se
 * anula desde esta sesión).
 */
export async function consentimientoDeCita(citaId: number): Promise<(ResumenConsentimiento & { heredado: boolean; de_sesion: string | null }) | null> {
  const [f] = (await sql`
    SELECT ${RESUMEN}, k.cita_id <> ${citaId} AS heredado,
           CASE WHEN k.cita_id <> ${citaId} THEN (SELECT to_char(inicio, 'YYYY-MM-DD"T"HH24:MI') FROM citas WHERE id = k.cita_id) END AS de_sesion
    FROM consentimientos k
    WHERE k.cita_id = ${citaId}
       OR (k.firmado_en IS NOT NULL AND k.cita_id IN (
            SELECT s.id FROM citas s, citas c
            WHERE c.id = ${citaId} AND (s.id = COALESCE(c.trabajo_id, c.id) OR s.trabajo_id = COALESCE(c.trabajo_id, c.id))))
    ORDER BY (k.cita_id = ${citaId} AND (k.firmado_en IS NOT NULL OR k.vence_en > NOW())) DESC, k.firmado_en DESC NULLS LAST
    LIMIT 1
  `) as Array<ResumenConsentimiento & { heredado: boolean; de_sesion: string | null }>;
  return f ?? null;
}

export async function consentimientosDeCliente(clienteId: number): Promise<Array<ResumenConsentimiento & { cita_id: number; inicio: string; tipo: TipoProcedimiento }>> {
  return (await sql`
    SELECT ${RESUMEN}, c.id AS cita_id, c.tipo, to_char(c.inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio
    FROM consentimientos k JOIN citas c ON c.id = k.cita_id
    WHERE k.cliente_id = ${clienteId} AND k.firmado_en IS NOT NULL
    ORDER BY k.firmado_en DESC
  `) as Array<ResumenConsentimiento & { cita_id: number; inicio: string; tipo: TipoProcedimiento }>;
}

/** Lo que la página pública necesita para mostrar el formulario. Nada de salud ni RUT: el link se puede reenviar. */
export type Pedido = {
  id: number;
  cita_id: number;
  nombre: string;
  telefono: string | null;
  tipo: TipoProcedimiento;
  inicio: string;
  zona: string | null;
  lado: string | null;
  descripcion: string | null;
};

export async function pedidoPorToken(tokenHash: string): Promise<Pedido | null> {
  const [f] = (await sql`
    SELECT k.id, k.cita_id, cl.nombre, cl.telefono, c.tipo, to_char(c.inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio,
           c.zona, c.lado, c.descripcion
    FROM consentimientos k JOIN citas c ON c.id = k.cita_id JOIN clientes cl ON cl.id = k.cliente_id
    WHERE k.token_hash = ${tokenHash} AND k.firmado_en IS NULL AND k.vence_en > NOW()
      AND c.estado IN ('confirmada', 'completada') AND c.tipo <> 'bloqueo'
  `) as Pedido[];
  return f ?? null;
}

/** Todo lo firmado, para armar el PDF. */
export type ConsentimientoFirmado = {
  id: number;
  cita_id: number;
  cliente_id: number;
  tipo: TipoProcedimiento;
  inicio: string;
  zona: string | null;
  lado: string | null;
  descripcion: string | null;
  firmado_en: string;
  donde: "link" | "estudio";
  datos: DatosPersona;
  salud: Salud;
  alertas: string[];
  permite_fotos: boolean;
  texto: TextoAceptado;
  version: string;
  firma: string;
  huella: string;
  conservar_hasta: string;
};

export async function consentimientoFirmado(id: number): Promise<ConsentimientoFirmado | null> {
  const [f] = (await sql`
    SELECT k.id, k.cita_id, k.cliente_id, c.tipo, to_char(c.inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio, c.zona, c.lado, c.descripcion,
           to_char(k.firmado_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS firmado_en,
           k.donde, k.datos, k.salud, k.alertas, k.permite_fotos, k.texto, k.version, k.firma, k.huella,
           k.conservar_hasta::TEXT AS conservar_hasta
    FROM consentimientos k JOIN citas c ON c.id = k.cita_id
    WHERE k.id = ${id} AND k.firmado_en IS NOT NULL
  `) as ConsentimientoFirmado[];
  return f ?? null;
}

// --------------------------------------------------------- seguimiento --

export type Etapa = "dia1" | "dia7" | "dia30" | "resena" | "laser1" | "laserProxima" | "siguienteSesion";
type EtapaConFecha = Exclude<Etapa, "resena">;

/**
 * Cuándo toca cada mensaje, en días desde la sesión. Pasado el margen ya no
 * se ofrece en "Hoy". El láser se cuida distinto y se repite: cuidados al día
 * siguiente y, a las seis semanas, ofrecer la próxima sesión.
 *
 * En un trabajo de varias sesiones, la que no es la última no lleva "un mes"
 * (todavía no está terminado) sino "siguiente sesión", y nada de lo que
 * propone otra sesión se ofrece si la siguiente ya está agendada.
 */
export const ETAPAS: Array<{ id: EtapaConFecha; texto: string; dia: number; hasta: number; laser: boolean; cuando: "final" | "entre" | "siempre" }> = [
  { id: "dia1", texto: "Día siguiente", dia: 1, hasta: 3, laser: false, cuando: "siempre" },
  { id: "dia7", texto: "Una semana", dia: 7, hasta: 10, laser: false, cuando: "siempre" },
  { id: "dia30", texto: "Un mes", dia: 30, hasta: 35, laser: false, cuando: "final" },
  { id: "siguienteSesion", texto: "Siguiente sesión", dia: 21, hasta: 35, laser: false, cuando: "entre" },
  { id: "laser1", texto: "Día siguiente", dia: 1, hasta: 3, laser: true, cuando: "siempre" },
  { id: "laserProxima", texto: "Próxima sesión", dia: 42, hasta: 56, laser: true, cuando: "entre" },
];

/**
 * Los mensajes de después de una sesión. `final`: es la última del trabajo (o
 * la única); `haySiguiente`: la próxima ya está agendada. El láser sin plan de
 * sesiones cuenta como "entre": siempre se le ofrece volver.
 */
export const etapasPara = (tipo: string, { final, haySiguiente, conPlan }: { final: boolean; haySiguiente: boolean; conPlan: boolean }) =>
  ETAPAS.filter((e) => {
    if (e.laser !== (tipo === "laser")) return false;
    if (e.cuando === "final") return final;
    if (e.cuando === "entre") return !haySiguiente && (tipo === "laser" ? !(conPlan && final) : !final);
    return true;
  });

export async function seguimientosDeCita(citaId: number): Promise<Partial<Record<Etapa, string>>> {
  const filas = (await sql`
    SELECT etapa, to_char(enviado_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS cuando
    FROM seguimientos WHERE cita_id = ${citaId}
  `) as Array<{ etapa: Etapa; cuando: string }>;
  return Object.fromEntries(filas.map((f) => [f.etapa, f.cuando]));
}

/** `proxima`: "2 de 3", la sesión que toca agendar (solo en "siguiente sesión"). */
export type Pendiente = { cita_id: number; nombre: string; telefono: string; inicio: string; etapa: EtapaConFecha; proxima: string | null };

/** Los mensajes de después de la sesión que tocan hoy y no se han mandado: los del tatuaje y los del láser. */
export async function seguimientosDeHoy(hoy: string): Promise<Pendiente[]> {
  const etapas = JSON.stringify(ETAPAS.map((e) => ({ etapa: e.id, laser: e.laser, desde: e.dia, hasta: e.hasta, cuando: e.cuando })));
  // Por cada cita hecha: qué sesión fue, si es la última del trabajo y si la siguiente ya está agendada
  // (la misma regla que etapasPara).
  return (await sql`
    SELECT c.id AS cita_id, cl.nombre, cl.telefono, to_char(c.inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio, e.etapa,
           CASE WHEN e.etapa = 'siguienteSesion' THEN (t.numero + 1) || ' de ' || c.sesiones END AS proxima
    FROM citas c
    JOIN clientes cl ON cl.id = c.cliente_id
    CROSS JOIN LATERAL (
      SELECT COUNT(*) FILTER (WHERE (s.inicio, s.id) <= (c.inicio, c.id))::INT AS numero,
             COUNT(*) FILTER (WHERE s.inicio > c.inicio) > 0 AS hay_siguiente
      FROM citas s
      WHERE (s.id = COALESCE(c.trabajo_id, c.id) OR s.trabajo_id = COALESCE(c.trabajo_id, c.id))
        AND s.estado IN ('solicitada', 'confirmada', 'completada')
    ) t
    CROSS JOIN LATERAL (SELECT COALESCE(c.sesiones, 1) <= 1 OR t.numero >= c.sesiones AS final) f
    CROSS JOIN jsonb_to_recordset(${etapas}::JSONB) AS e(etapa TEXT, laser BOOLEAN, desde INT, hasta INT, cuando TEXT)
    WHERE c.estado = 'completada' AND cl.telefono IS NOT NULL
      AND (c.tipo = 'laser') = e.laser AND c.tipo <> 'bloqueo'
      AND (${hoy}::DATE - c.inicio::DATE) BETWEEN e.desde AND e.hasta
      AND CASE e.cuando
            WHEN 'final' THEN f.final
            WHEN 'entre' THEN NOT t.hay_siguiente AND CASE WHEN c.tipo = 'laser' THEN NOT (COALESCE(c.sesiones, 1) > 1 AND f.final) ELSE NOT f.final END
            ELSE TRUE END
      AND NOT EXISTS (SELECT 1 FROM seguimientos s WHERE s.cita_id = c.id AND s.etapa = e.etapa)
    ORDER BY e.desde, c.inicio
  `) as Pendiente[];
}

export type FotoDeCita = { id: number; url: string; alt: string; visible: boolean };

export async function fotosDeCita(citaId: number): Promise<FotoDeCita[]> {
  return (await sql`SELECT id, url, alt, visible FROM galeria WHERE cita_id = ${citaId} ORDER BY creada_en`) as FotoDeCita[];
}
