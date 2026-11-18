import "server-only";
import { sql } from "@/db/conexion";

/**
 * Lecturas del panel. Las escrituras viven en src/app/tinta/_acciones/panel.ts y
 * cada una comprueba la sesión antes de tocar nada.
 *
 * Las horas salen como texto ("2026-11-10T15:00"), nunca como Date: ver
 * src/lib/admin/fecha.ts.
 */

export type Cita = {
  id: number;
  cliente_id: number | null;
  cliente: string | null;
  telefono: string | null;
  tipo: "tatuaje" | "laser" | "retoque" | "bloqueo";
  /** "solicitada": pedida desde la web, aparta la hora hasta que se confirma. */
  estado: "solicitada" | "confirmada" | "completada" | "cancelada" | "no_vino";
  origen: "panel" | "web";
  creada: string;
  inicio: string;
  fin: string;
  zona: string | null;
  lado: "izq" | "der" | null;
  tamano: string | null;
  estilo: string | null;
  descripcion: string | null;
  precio: number | null;
  pagado: number;
  saldo: number | null;
  notas: string | null;
  creada_por: string;
  /** Null: nunca se pidió (o el link venció sin firmarse). */
  consentimiento: "firmado" | "pendiente" | null;
  /** Las alertas de salud del consentimiento firmado. */
  alertas: string[];
  /** La primera cita del trabajo, si esta es una sesión siguiente. */
  trabajo_id: number | null;
  /** Cuántas sesiones se acordaron (null o 1: una sola). */
  sesiones: number | null;
  /** El valor final del trabajo completo; `precio` es lo de esta sesión. */
  valor_final: number | null;
  /** Qué sesión es, contando las vivas del trabajo por fecha. */
  sesion: number;
};

// Columnas fijas: se escriben una vez y se usan en cada consulta de citas.
const COLUMNAS = sql.unsafe(`
  c.id, c.cliente_id, cl.nombre AS cliente, cl.telefono, c.tipo, c.estado,
  to_char(c.inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio,
  to_char(c.fin, 'YYYY-MM-DD"T"HH24:MI') AS fin,
  c.zona, c.lado, c.tamano, c.estilo, c.descripcion, c.precio, c.pagado, c.saldo, c.notas, c.creada_por, c.origen,
  to_char(c.creada_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS creada,
  k.estado AS consentimiento, COALESCE(k.alertas, '{}') AS alertas,
  c.trabajo_id, c.sesiones, c.valor_final,
  CASE WHEN c.trabajo_id IS NULL AND COALESCE(c.sesiones, 1) <= 1 THEN 1
       ELSE (SELECT COUNT(*)::INT FROM citas s
             WHERE (s.id = COALESCE(c.trabajo_id, c.id) OR s.trabajo_id = COALESCE(c.trabajo_id, c.id))
               AND s.estado IN ('solicitada', 'confirmada', 'completada') AND (s.inicio, s.id) <= (c.inicio, c.id)) END AS sesion
`);

// El consentimiento de cada cita: el suyo si lo tiene vigente; si no, el firmado en otra sesión del
// mismo trabajo (vale para todo el tatuaje, con sus alertas de salud). Va con LEFT JOIN LATERAL en cada consulta.
const CONSENTIMIENTO = sql.unsafe(`
  LEFT JOIN LATERAL (
    SELECT CASE WHEN x.firmado_en IS NOT NULL THEN 'firmado' WHEN x.vence_en > NOW() THEN 'pendiente' END AS estado, x.alertas
    FROM consentimientos x
    WHERE x.cita_id = c.id
       OR (x.firmado_en IS NOT NULL AND x.cita_id IN (
            SELECT s.id FROM citas s WHERE s.id = COALESCE(c.trabajo_id, c.id) OR s.trabajo_id = COALESCE(c.trabajo_id, c.id)))
    ORDER BY (x.cita_id = c.id AND (x.firmado_en IS NOT NULL OR x.vence_en > NOW())) DESC, x.firmado_en DESC NULLS LAST
    LIMIT 1
  ) k ON TRUE
`);

/** Citas que tocan el rango de días [desde, hasta], canceladas incluidas si se piden. */
export async function citasEntre(desde: string, hasta: string, conCanceladas = false): Promise<Cita[]> {
  return (await sql`
    SELECT ${COLUMNAS}
    FROM citas_con_saldo c LEFT JOIN clientes cl ON cl.id = c.cliente_id ${CONSENTIMIENTO}
    WHERE c.inicio < (${hasta}::DATE + 1) AND c.fin > ${desde}::DATE
      AND (${conCanceladas} OR c.estado NOT IN ('cancelada'))
    ORDER BY c.inicio
  `) as Cita[];
}

export async function cita(id: number): Promise<Cita | null> {
  const [fila] = (await sql`
    SELECT ${COLUMNAS}
    FROM citas_con_saldo c LEFT JOIN clientes cl ON cl.id = c.cliente_id ${CONSENTIMIENTO}
    WHERE c.id = ${id}
  `) as Cita[];
  return fila ?? null;
}

export async function citasDeCliente(clienteId: number): Promise<Cita[]> {
  return (await sql`
    SELECT ${COLUMNAS}
    FROM citas_con_saldo c LEFT JOIN clientes cl ON cl.id = c.cliente_id ${CONSENTIMIENTO}
    WHERE c.cliente_id = ${clienteId}
    ORDER BY c.inicio DESC
  `) as Cita[];
}

/**
 * Lo que hay que cobrar: citas de hoy o anteriores que todavía deben plata.
 * Las futuras no cuentan: ese saldo se cobra el día de la sesión.
 */
export async function saldosPendientes(): Promise<Cita[]> {
  return (await sql`
    SELECT ${COLUMNAS}
    FROM citas_con_saldo c LEFT JOIN clientes cl ON cl.id = c.cliente_id ${CONSENTIMIENTO}
    WHERE c.estado IN ('confirmada', 'completada') AND c.saldo > 0 AND c.tipo <> 'bloqueo'
      AND c.inicio < (NOW() AT TIME ZONE 'America/Santiago')::DATE + 1
    ORDER BY c.inicio
  `) as Cita[];
}

/** Saldos de citas futuras: plata que va a entrar si todo sale como está agendado. */
export async function saldosPorVenir(): Promise<number> {
  const [f] = (await sql`
    SELECT COALESCE(SUM(saldo), 0)::INT AS total FROM citas_con_saldo
    WHERE estado = 'confirmada' AND tipo <> 'bloqueo' AND inicio >= (NOW() AT TIME ZONE 'America/Santiago')::DATE + 1
  `) as Array<{ total: number }>;
  return f.total;
}

/** Citas que ya terminaron y siguen "confirmadas": falta decir si se hicieron. */
export async function sinCerrar(): Promise<Cita[]> {
  return (await sql`
    SELECT ${COLUMNAS}
    FROM citas_con_saldo c LEFT JOIN clientes cl ON cl.id = c.cliente_id ${CONSENTIMIENTO}
    WHERE c.estado = 'confirmada' AND c.tipo <> 'bloqueo' AND c.fin < NOW() AT TIME ZONE 'America/Santiago'
    ORDER BY c.inicio DESC
    LIMIT 20
  `) as Cita[];
}

export type Pago = {
  id: number;
  monto: number;
  tipo: "abono" | "saldo" | "otro";
  medio: "transferencia" | "efectivo" | "otro";
  comprobante: string | null;
  fecha: string;
  anotado_por: string;
};

export async function pagosDeCita(citaId: number): Promise<Pago[]> {
  return (await sql`
    SELECT id, monto, tipo, medio, comprobante, fecha::TEXT AS fecha, anotado_por
    FROM pagos WHERE cita_id = ${citaId} ORDER BY creado_en
  `) as Pago[];
}

export type Cliente = {
  id: number;
  nombre: string;
  telefono: string | null;
  instagram: string | null;
  notas: string | null;
  citas: number;
  ultima: string | null;
  proxima: string | null;
};

export async function clientes(busqueda = ""): Promise<Cliente[]> {
  const q = `%${busqueda.trim().toLowerCase()}%`;
  return (await sql`
    SELECT cl.id, cl.nombre, cl.telefono, cl.instagram, cl.notas,
           COUNT(c.id) FILTER (WHERE c.estado <> 'cancelada')::INT AS citas,
           to_char(MAX(c.inicio) FILTER (WHERE c.inicio < NOW() AT TIME ZONE 'America/Santiago'), 'YYYY-MM-DD') AS ultima,
           to_char(MIN(c.inicio) FILTER (WHERE c.inicio >= NOW() AT TIME ZONE 'America/Santiago' AND c.estado = 'confirmada'), 'YYYY-MM-DD"T"HH24:MI') AS proxima
    FROM clientes cl LEFT JOIN citas c ON c.cliente_id = cl.id
    WHERE ${busqueda.trim() === ""} OR lower(cl.nombre) LIKE ${q} OR cl.telefono LIKE ${q} OR lower(cl.instagram) LIKE ${q}
    GROUP BY cl.id
    ORDER BY MAX(c.inicio) DESC NULLS LAST, cl.nombre
    LIMIT 200
  `) as Cliente[];
}

export async function cliente(id: number): Promise<Cliente | null> {
  const [fila] = (await sql`
    SELECT id, nombre, telefono, instagram, notas, 0 AS citas, NULL AS ultima, NULL AS proxima
    FROM clientes WHERE id = ${id}
  `) as Cliente[];
  return fila ?? null;
}

export type Gasto = { id: number; fecha: string; categoria: string; descripcion: string | null; monto: number; anotado_por: string };

export async function resumenMes(mes: string) {
  const desde = `${mes}-01`;
  const [ingresos, gastos] = await Promise.all([
    sql`
      SELECT COALESCE(SUM(monto), 0)::INT AS total, COUNT(*)::INT AS cuantos,
             COALESCE(SUM(monto) FILTER (WHERE medio = 'transferencia'), 0)::INT AS transferencia,
             COALESCE(SUM(monto) FILTER (WHERE medio = 'efectivo'), 0)::INT AS efectivo
      FROM pagos WHERE fecha >= ${desde}::DATE AND fecha < (${desde}::DATE + INTERVAL '1 month')
    `,
    sql`
      SELECT id, fecha::TEXT AS fecha, categoria, descripcion, monto, anotado_por
      FROM gastos WHERE fecha >= ${desde}::DATE AND fecha < (${desde}::DATE + INTERVAL '1 month')
      ORDER BY fecha DESC, id DESC
    `,
  ]);
  const i = ingresos[0] as { total: number; cuantos: number; transferencia: number; efectivo: number };
  return { ingresos: i, gastos: gastos as Gasto[] };
}

export async function pagosDelMes(mes: string) {
  return (await sql`
    SELECT p.id, p.monto, p.tipo, p.medio, p.fecha::TEXT AS fecha, p.cita_id, cl.nombre AS cliente
    FROM pagos p JOIN citas c ON c.id = p.cita_id LEFT JOIN clientes cl ON cl.id = c.cliente_id
    WHERE p.fecha >= ${`${mes}-01`}::DATE AND p.fecha < (${`${mes}-01`}::DATE + INTERVAL '1 month')
    ORDER BY p.fecha DESC, p.id DESC
  `) as Array<{ id: number; monto: number; tipo: string; medio: string; fecha: string; cita_id: number; cliente: string | null }>;
}

export type Foto = {
  id: number;
  url: string;
  alt: string;
  estilo: string;
  zona: string;
  ancho: number;
  alto: number;
  visible: boolean;
  orden: number;
};

export async function galeria(soloVisibles = false): Promise<Foto[]> {
  return (await sql`
    SELECT id, url, alt, estilo, zona, ancho, alto, visible, orden
    FROM galeria WHERE NOT ${soloVisibles} OR visible
    ORDER BY orden, creada_en DESC
  `) as Foto[];
}

export type Cotizacion = {
  id: number;
  tipo: "tatuaje" | "laser";
  codigo: string | null;
  estado: EstadoCotizacion;
  cita_id: number | null;
  sesiones_min: number | null;
  sesiones_max: number | null;
  zona: string;
  lado: "izq" | "der" | null;
  tamano: string;
  estilo: string;
  idea: string | null;
  minimo: number;
  maximo: number;
  vista: boolean;
  creada: string;
};

export type EstadoCotizacion = "nueva" | "respondida" | "agendada" | "descartada";

const COLUMNAS_COTIZACION = sql.unsafe(`
  id, tipo, codigo, estado, cita_id, sesiones_min, sesiones_max, zona, lado, tamano, estilo, idea, minimo, maximo, vista,
  to_char(creada_en AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD"T"HH24:MI') AS creada
`);

/**
 * Las cotizaciones, filtradas por estado y buscadas por código o por lo que
 * escribió la persona. El código se busca sin importar mayúsculas ni si
 * escribieron "MS-" o no: "k7q2" encuentra "MS-K7Q2".
 */
/** Las horas pedidas desde la web que esperan confirmación, la más próxima primero. */
export async function porConfirmar(): Promise<Cita[]> {
  return (await sql`
    SELECT ${COLUMNAS}
    FROM citas_con_saldo c LEFT JOIN clientes cl ON cl.id = c.cliente_id ${CONSENTIMIENTO}
    WHERE c.estado = 'solicitada'
    ORDER BY c.inicio
  `) as Cita[];
}

export async function cotizaciones({ estado = null, q = "", limite = 80 }: { estado?: EstadoCotizacion | null; q?: string; limite?: number } = {}): Promise<Cotizacion[]> {
  const t = q.trim().toLowerCase().replace(/^ms-?/, "");
  return (await sql`
    SELECT ${COLUMNAS_COTIZACION}
    FROM cotizaciones
    WHERE (${estado}::TEXT IS NULL OR estado = ${estado})
      AND (${t} = '' OR lower(codigo) LIKE ${`%${t}%`} OR lower(idea) LIKE ${`%${t}%`})
    ORDER BY creada_en DESC LIMIT ${limite}
  `) as Cotizacion[];
}

export async function cotizacion(id: number): Promise<Cotizacion | null> {
  const [f] = (await sql`SELECT ${COLUMNAS_COTIZACION} FROM cotizaciones WHERE id = ${id}`) as Cotizacion[];
  return f ?? null;
}

/** De qué cotización vino una cita, si vino de una. */
export async function cotizacionDeCita(citaId: number): Promise<Cotizacion | null> {
  const [f] = (await sql`SELECT ${COLUMNAS_COTIZACION} FROM cotizaciones WHERE cita_id = ${citaId} ORDER BY creada_en DESC LIMIT 1`) as Cotizacion[];
  return f ?? null;
}

/** Cuántas hay en cada estado, para los filtros, y cuántas terminaron en cita. */
export async function resumenCotizaciones(): Promise<Record<EstadoCotizacion, number>> {
  const filas = (await sql`SELECT estado, COUNT(*)::INT AS n FROM cotizaciones GROUP BY estado`) as Array<{ estado: EstadoCotizacion; n: number }>;
  const r = { nueva: 0, respondida: 0, agendada: 0, descartada: 0 };
  for (const f of filas) r[f.estado] = f.n;
  return r;
}

export async function cotizacionesSinVer(): Promise<number> {
  const [f] = (await sql`SELECT COUNT(*)::INT AS n FROM cotizaciones WHERE NOT vista`) as Array<{ n: number }>;
  return f.n;
}

// ------------------------------------------------------------- trabajos --

export type SesionDeTrabajo = {
  id: number;
  inicio: string;
  fin: string;
  estado: Cita["estado"];
  precio: number | null;
  pagado: number;
  saldo: number | null;
};

/** Todas las citas de un trabajo (la primera y las siguientes), canceladas incluidas, por fecha. */
export async function sesionesDeTrabajo(raiz: number): Promise<SesionDeTrabajo[]> {
  return (await sql`
    SELECT id, to_char(inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio, to_char(fin, 'YYYY-MM-DD"T"HH24:MI') AS fin,
           estado, precio, pagado, saldo
    FROM citas_con_saldo
    WHERE id = ${raiz} OR trabajo_id = ${raiz}
    ORDER BY inicio, id
  `) as SesionDeTrabajo[];
}

export type TrabajoAbierto = {
  id: number;
  tipo: Cita["tipo"];
  zona: string | null;
  lado: "izq" | "der" | null;
  tamano: string | null;
  estilo: string | null;
  descripcion: string | null;
  sesiones: number;
  valor_final: number | null;
  /** Sesiones vivas (pedidas, confirmadas o hechas). */
  vivas: number;
  /** Lo que ya tienen asignado esas sesiones: lo que falta para el valor final va en la última. */
  asignado: number;
  /** Minutos de la última sesión, para proponer lo mismo. */
  minutos: number;
};

// Lo acordado de un trabajo (en su primera cita) y cuánto lleva: va en las dos consultas de abajo.
const TRABAJO = sql.unsafe(`
  SELECT r.id, r.tipo, r.zona, r.lado, r.tamano, r.estilo, r.descripcion, COALESCE(r.sesiones, 1) AS sesiones, r.valor_final,
         t.vivas, t.asignado, t.minutos, r.cliente_id, cl.nombre AS cliente, cl.telefono
  FROM citas r
  JOIN clientes cl ON cl.id = r.cliente_id
  CROSS JOIN LATERAL (
    SELECT COUNT(*)::INT AS vivas, COALESCE(SUM(s.precio), 0)::INT AS asignado,
           COALESCE((ARRAY_AGG(EXTRACT(EPOCH FROM s.fin - s.inicio)::INT / 60 ORDER BY s.inicio DESC))[1], 180) AS minutos
    FROM citas s
    WHERE (s.id = r.id OR s.trabajo_id = r.id) AND s.estado IN ('solicitada', 'confirmada', 'completada')
  ) t
`);

/** El trabajo de un cliente al que todavía le faltan sesiones por agendar (el más reciente). */
export async function trabajoAbiertoDe(clienteId: number): Promise<TrabajoAbierto | null> {
  const [f] = (await sql`
    ${TRABAJO}
    WHERE r.cliente_id = ${clienteId} AND r.trabajo_id IS NULL AND r.sesiones > 1 AND t.vivas < r.sesiones
    ORDER BY r.inicio DESC
    LIMIT 1
  `) as TrabajoAbierto[];
  return f ?? null;
}

/** El trabajo de cualquier cita (la primera o una siguiente), para agendar otra sesión. */
export async function trabajoDe(citaId: number): Promise<(TrabajoAbierto & { cliente_id: number; cliente: string; telefono: string | null }) | null> {
  const [f] = (await sql`
    ${TRABAJO}
    WHERE r.id = (SELECT COALESCE(trabajo_id, id) FROM citas WHERE id = ${citaId}) AND r.tipo <> 'bloqueo'
  `) as Array<TrabajoAbierto & { cliente_id: number; cliente: string; telefono: string | null }>;
  return f ?? null;
}
