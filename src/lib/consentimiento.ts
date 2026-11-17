/**
 * El consentimiento informado: preguntas de salud, textos que se aceptan y
 * las reglas que comparten el formulario (navegador) y el API (servidor).
 *
 * Sin "use client" ni "server-only": lo usan los dos lados.
 *
 * Lo que se pregunta es lo mínimo que cambia cómo se trabaja (Ley 21.719:
 * los datos de salud son sensibles y se pide solo lo necesario). No se
 * pregunta por VIH ni hepatitis: con material desechable y bioseguridad
 * universal se trabaja igual con todos, así que el dato no cambia nada y
 * solo expone a la persona. "Alcohol o drogas hoy" pasó a ser un compromiso:
 * el formulario se puede llenar días antes.
 */

export const EDAD_MINIMA = 16;
export const MAYORIA_DE_EDAD = 18;
export const ANIOS_QUE_SE_GUARDA = 5;
export const DIAS_QUE_DURA_EL_LINK = 7;

export type TipoProcedimiento = "tatuaje" | "laser" | "retoque";

export type PreguntaSalud = {
  id: string;
  texto: string;
  ayuda?: string;
  /** Si con "Sí" se pide detalle, el rótulo del campo. */
  detalle?: string;
  /** Cómo se ve en la ficha de la cita. */
  alerta: string;
  /** Lo que más cambia la sesión: va primero y en rojo. */
  urgente?: boolean;
  solo?: TipoProcedimiento[];
};

export const PREGUNTAS_SALUD: PreguntaSalud[] = [
  {
    id: "alergias",
    texto: "¿Tienes alguna alergia?",
    ayuda: "Látex, pigmentos, anestésicos, metales, antisépticos o medicamentos.",
    detalle: "¿A qué?",
    alerta: "Alergia",
    urgente: true,
  },
  {
    id: "coagulacion",
    texto: "¿Tienes problemas de coagulación o tomas anticoagulantes?",
    ayuda: "Incluye aspirina u otros que adelgacen la sangre, si los tomas seguido.",
    alerta: "Coagulación o anticoagulantes",
    urgente: true,
  },
  { id: "diabetes", texto: "¿Tienes diabetes?", alerta: "Diabetes" },
  { id: "corazon", texto: "¿Tienes alguna enfermedad del corazón?", alerta: "Enfermedad del corazón" },
  { id: "epilepsia", texto: "¿Tienes epilepsia o te has desmayado con agujas o sangre?", alerta: "Epilepsia o desmayos" },
  { id: "embarazo", texto: "¿Estás embarazada o dando pecho?", alerta: "Embarazo o lactancia", urgente: true },
  {
    id: "piel",
    texto: "¿Tienes queloides, psoriasis u otro problema de piel en la zona?",
    detalle: "¿Qué tienes?",
    alerta: "Piel",
  },
  {
    id: "sol",
    texto: "¿Te ha dado el sol en la zona o usaste autobronceante en las últimas 2 semanas?",
    alerta: "Sol o autobronceante reciente",
    solo: ["laser"],
  },
  {
    id: "medicamentos",
    texto: "¿Tomas algún medicamento?",
    ayuda: "Incluye isotretinoína (para el acné) y tratamientos de piel.",
    detalle: "¿Cuál?",
    alerta: "Medicamentos",
  },
];

export const preguntasPara = (tipo: TipoProcedimiento) => PREGUNTAS_SALUD.filter((p) => !p.solo || p.solo.includes(tipo));

export type RespuestasSalud = Record<string, { si: boolean; detalle?: string }>;
export type Salud = { respuestas: RespuestasSalud; otras: string };

/** "Alergia: látex", en el orden de las preguntas, con las urgentes primero. */
export function alertasDe(salud: Salud, tipo: TipoProcedimiento): string[] {
  const preguntas = preguntasPara(tipo);
  const marcadas = preguntas
    .filter((p) => salud.respuestas[p.id]?.si)
    .sort((a, b) => Number(Boolean(b.urgente)) - Number(Boolean(a.urgente)))
    .map((p) => {
      const d = salud.respuestas[p.id]?.detalle?.trim();
      return d ? `${p.alerta}: ${d}` : p.alerta;
    });
  if (salud.otras.trim()) marcadas.push(`Otro: ${salud.otras.trim()}`);
  return marcadas;
}

/** Las alertas que no pueden pasar inadvertidas antes de empezar. */
export const esUrgente = (alerta: string) =>
  PREGUNTAS_SALUD.some((p) => p.urgente && alerta.startsWith(p.alerta));

// --------------------------------------------------------------- textos --

/** Lo que el estudio cambia desde el panel (Web → Consentimiento). */
export type TextosConsentimiento = {
  riesgosTatuaje: string[];
  riesgosLaser: string[];
  compromisos: string[];
};

export const TEXTOS_CONSENTIMIENTO_BASE: TextosConsentimiento = {
  riesgosTatuaje: [
    "Es permanente. Quitarlo exige varias sesiones de láser y puede que no salga del todo.",
    "Si no sigo los cuidados, se puede infectar.",
    "Puedo tener una reacción alérgica a la tinta, incluso tiempo después.",
    "La piel puede cicatrizar con relieve o queloide, y el color puede sanar parejo o no.",
    "Hinchazón, enrojecimiento y molestia los primeros días son normales.",
  ],
  riesgosLaser: [
    "Se necesitan varias sesiones y puede que la tinta no salga del todo.",
    "Los primeros días puede haber ampollas, costras e hinchazón.",
    "La piel se puede aclarar u oscurecer, a veces para siempre.",
    "Puede quedar textura o cicatriz, sobre todo si no sigo los cuidados.",
  ],
  compromisos: [
    "No llegar bajo los efectos del alcohol o de drogas.",
    "Avisar antes de la sesión si cambia algo de mi salud.",
    "Seguir los cuidados que me indiquen y consultar si veo algo raro.",
  ],
};

const linea = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
const lineas = (v: unknown, tope: number) => (Array.isArray(v) ? v.map((x) => linea(x, 200)).filter(Boolean).slice(0, tope) : []);

export function normalizarTextosConsentimiento(v: unknown): TextosConsentimiento {
  const g = (v ?? {}) as Record<string, unknown>;
  const b = TEXTOS_CONSENTIMIENTO_BASE;
  const o = (x: string[], base: string[]) => (x.length ? x : base);
  return {
    riesgosTatuaje: o(lineas(g.riesgosTatuaje, 10), b.riesgosTatuaje),
    riesgosLaser: o(lineas(g.riesgosLaser, 10), b.riesgosLaser),
    compromisos: o(lineas(g.compromisos, 8), b.compromisos),
  };
}

const PROCEDIMIENTO: Record<TipoProcedimiento, string> = {
  tatuaje: "el tatuaje",
  retoque: "el retoque del tatuaje",
  laser: "la sesión de borrado láser",
};

/**
 * La copia exacta de lo que la persona lee y acepta. Se guarda con la firma:
 * el PDF se arma con esto, aunque después el estudio cambie los textos.
 */
export type TextoAceptado = {
  titulo: string;
  responsable: string;
  procedimiento: string;
  riesgos: string[];
  compromisos: string[];
  /**
   * Lo que se marca. `acepto` junta riesgos, compromisos y veracidad en una
   * sola casilla; los datos van aparte porque la ley pide ese consentimiento
   * separado, y las fotos son opcionales.
   */
  declaraciones: { acepto: string; datos: string; fotos: string; representante: string };
  preguntas: Array<{ id: string; texto: string }>;
};

export function armarTexto(textos: TextosConsentimiento, tipo: TipoProcedimiento, responsable: string): TextoAceptado {
  const procedimiento = PROCEDIMIENTO[tipo];
  return {
    titulo: tipo === "laser" ? "Consentimiento informado para borrado láser" : "Consentimiento informado para tatuaje",
    responsable,
    procedimiento,
    riesgos: tipo === "laser" ? textos.riesgosLaser : textos.riesgosTatuaje,
    compromisos: textos.compromisos,
    declaraciones: {
      acepto: `Me explicaron en qué consiste ${procedimiento}. Acepto sus riesgos, me comprometo a lo anterior y lo que respondí sobre mi salud es verdad y está completo.`,
      datos: `Autorizo a ${responsable} a guardar mis datos personales y de salud solo para evaluar si puedo hacerme ${procedimiento} de forma segura y como respaldo de este consentimiento. Se guardan ${ANIOS_QUE_SE_GUARDA} años y después se borran. Puedo pedir verlos, corregirlos o borrarlos cuando quiera.`,
      fotos: "Autorizo publicar fotos del trabajo terminado en la web y las redes del estudio. Puedo retirar este permiso cuando quiera.",
      representante: `Represento legalmente a quien se hace ${procedimiento}, lo autorizo y estaré presente durante toda la sesión.`,
    },
    preguntas: preguntasPara(tipo).map((p) => ({ id: p.id, texto: p.texto })),
  };
}

// ------------------------------------------------------------ personas --

/** Edad cumplida a una fecha (ambas "YYYY-MM-DD"). */
export function edad(nacimiento: string, hoy: string): number {
  const [a, m, d] = nacimiento.split("-").map(Number);
  const [ha, hm, hd] = hoy.split("-").map(Number);
  return ha - a - (hm < m || (hm === m && hd < d) ? 1 : 0);
}

/** "12.345.678-5" → "12345678-5", o null si el dígito verificador no calza. */
export function normalizarRut(entrada: string): string | null {
  const limpio = (entrada ?? "").replace(/[.\s-]/g, "").toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(limpio)) return null;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === esperado ? `${cuerpo}-${dv}` : null;
}

/** "12345678-5" → "12.345.678-5" */
export function formatearRut(rut: string): string {
  const [cuerpo, dv] = rut.split("-");
  if (!cuerpo || !dv) return rut;
  return `${Number(cuerpo).toLocaleString("es-CL")}-${dv}`;
}

export type Representante = { nombre: string; rut: string; relacion: "madre" | "padre" | "tutor" };

export const RELACIONES: Array<{ id: Representante["relacion"]; texto: string }> = [
  { id: "madre", texto: "Madre" },
  { id: "padre", texto: "Padre" },
  { id: "tutor", texto: "Tutor legal" },
];

export type DatosPersona = {
  nombre: string;
  rut: string;
  nacimiento: string;
  telefono: string;
  representante: Representante | null;
};

/** Lo que manda el formulario al firmar. */
export type Firma = {
  datos: DatosPersona;
  salud: Salud;
  /** `representante` solo cuenta (y es obligatorio) si es menor de edad. */
  acepta: { acepto: boolean; datos: boolean; representante: boolean };
  permiteFotos: boolean;
  /** PNG del trazo, como data URL. */
  firma: string;
};
