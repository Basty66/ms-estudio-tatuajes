import { normalizarTextosConsentimiento, TEXTOS_CONSENTIMIENTO_BASE, type TextosConsentimiento } from "./consentimiento";
import { ALERTAS, CUIDADOS, ESTUDIO, EVITAR, PREGUNTAS, PROCESO } from "./estudio";
import { ESTILOS_PRECIO, normalizarPrecios, PRECIOS_BASE, type EstiloPrecio, type Precios } from "./precios";

/**
 * El contenido de la web que se cambia desde el panel (sección "Web").
 *
 * Cada bloque se guarda como JSON en la tabla `contenido`; lo que no se ha
 * tocado sale de los valores de fábrica de abajo. `mezclar` revisa lo guardado
 * campo por campo: un bloque mal formado no deja la portada en blanco, vuelve
 * a su valor de fábrica.
 *
 * Sin "use client" ni "server-only": lo leen la portada, el panel y el API.
 */

export type Par = { titulo: string; texto: string };

export type DatosEstudio = {
  nombre: string;
  nombreLargo: string;
  whatsapp: string;
  instagram: string;
  direccion: string;
  comuna: string;
  mapa: string;
  comoLlegar: string;
  /** Link de Google para dejar una reseña. Vacío: no se ofrece pedirla. */
  resenas: string;
  /** Quién responde por los datos personales (consentimiento y privacidad). */
  responsable: string;
  correo: string;
};

export type TextosTatuador = {
  frase: string;
  datos: Par[];
  especialidades: string[];
  trayectoria: Par[];
  lugar: Par[];
};

export type TextosCuidados = {
  etapas: Array<{ cuando: string; corto: string; pasos: string[] }>;
  evitar: string[];
  alertas: string[];
};

/**
 * Los mensajes de WhatsApp que arma el panel. Las palabras entre llaves se
 * reemplazan al mandarlos ({nombre}, {fecha}…). Una línea cuya llave queda
 * sin valor no se manda: "Abono recibido: {abono}" desaparece si no hay abono.
 */
export type Mensajes = {
  confirmacion: string;
  recordatorio: string;
  consentimiento: string;
  dia1: string;
  dia7: string;
  dia30: string;
  laser1: string;
  laserProxima: string;
  resena: string;
};

export type Foto = { src: string; ancho: number; alto: number; alt: string };

/** Una foto subida desde el panel: además de la foto, la ruta en el almacén para poder borrarla. */
export type FotoSubida = Foto & { ruta: string };

const foto = (src: string, alt: string, ancho = 720, alto = 900): Foto => ({ src, alt, ancho, alto });

/**
 * Los lugares de la web que llevan una foto fija. Las del portafolio no van
 * acá: esas son la galería del panel.
 */
export const LUGARES_FOTO = [
  { clave: "tatuador-1", grupo: "El tatuador", titulo: "Retrato grande", foto: foto("/trabajos/tatuador-1.jpg", "Matness tatuando en su estudio, con la máquina en la mano") },
  { clave: "tatuador-2", grupo: "El tatuador", titulo: "Retrato chico", foto: foto("/trabajos/tatuador-2.jpg", "Matness trabajando bajo la luz azul del estudio") },
  { clave: "comparar-stencil", grupo: "Del stencil a la piel", titulo: "Antes: el stencil", foto: foto("/trabajos/comparar-stencil.jpg", "Stencil puesto en la piel, antes de tatuar") },
  { clave: "comparar-final", grupo: "Del stencil a la piel", titulo: "Después: el tatuaje", foto: foto("/trabajos/comparar-final.jpg", "Lettering a mano alzada en el cuello") },
  ...PROCESO.map((p, i) => ({ clave: `proceso-${i + 1}`, grupo: "Una sesión", titulo: `${i + 1} · ${p.paso}`, foto: foto(p.src, `${p.paso}: ${p.texto}`) })),
  ...ESTILOS_PRECIO.map((e) => ({
    clave: `estilo-${e.id}`,
    grupo: "Cotizador: un ejemplo por estilo",
    titulo: e.nombre,
    foto: (
      {
        fineline: foto("/images/tatuaje2.jpg", "Fineline", 1440, 1440),
        lettering: foto("/trabajos/pared-01.jpg", "Lettering"),
        blackwork: foto("/images/tatuaje3.jpg", "Blackwork", 1440, 1440),
        color: foto("/trabajos/pared-02.jpg", "Color"),
      } as Partial<Record<EstiloPrecio, Foto>>
    )[e.id] ?? null,
  })),
] as Array<{ clave: string; grupo: string; titulo: string; foto: Foto | null }>;

export type Fotos = Record<string, Foto | null>;

export type Contenido = {
  estudio: DatosEstudio;
  precios: Precios;
  tatuador: TextosTatuador;
  preguntas: Par[];
  cuidados: TextosCuidados;
  fotos: Fotos;
  consentimiento: TextosConsentimiento;
  mensajes: Mensajes;
};

export type ClaveBloque = keyof Contenido;
export const BLOQUES: ClaveBloque[] = ["estudio", "precios", "tatuador", "preguntas", "cuidados", "fotos", "consentimiento", "mensajes"];

export const CONTENIDO_BASE: Contenido = {
  estudio: { ...ESTUDIO, resenas: "", responsable: ESTUDIO.nombreLargo, correo: "" },
  precios: PRECIOS_BASE,
  tatuador: {
    frase: "Transformo ideas en arte sobre la piel. Cada tatuaje es una pieza única, diseñada para ti y hecha con los estándares más altos de calidad e higiene.",
    datos: [
      { titulo: "+5 años", texto: "tatuando en Melipilla" },
      { titulo: "Formado", texto: "junto a artistas reconocidos de Chile" },
      { titulo: "Convenciones", texto: "nacionales e internacionales" },
    ],
    especialidades: ["Lettering", "Fineline", "Black & grey", "Microrrealismo", "Realismo", "Blackwork"],
    trayectoria: [
      { titulo: "Formación", texto: "Aprende el oficio junto a artistas reconocidos de la escena chilena." },
      { titulo: "Convenciones", texto: "Tatúa en convenciones nacionales e internacionales." },
      { titulo: "Estudio propio", texto: `Abre su estudio privado en ${ESTUDIO.direccion}, ${ESTUDIO.comuna}.` },
      { titulo: "Borrado láser", texto: "Suma el láser para borrar o aclarar antes de un cover." },
      { titulo: "Hoy", texto: "Lettering, fineline, black & grey y láser, todo en un mismo estudio." },
    ],
    lugar: [
      { titulo: "Un solo tatuador", texto: "de la cotización a los cuidados, hablas siempre con la misma persona" },
      { titulo: "Material desechable", texto: "agujas, grips y tintas de un solo uso, abiertos frente a ti" },
      { titulo: "Diseño propio", texto: "lo ves y lo apruebas antes de la sesión" },
      { titulo: "Estudio privado", texto: "con hora reservada, el espacio es tuyo mientras te tatúas" },
    ],
  },
  preguntas: PREGUNTAS.map((q) => ({ titulo: q.p, texto: q.r })),
  cuidados: {
    etapas: CUIDADOS.map((c) => ({ cuando: c.cuando, corto: c.corto, pasos: [...c.pasos] })),
    evitar: [...EVITAR],
    alertas: [...ALERTAS],
  },
  fotos: Object.fromEntries(LUGARES_FOTO.map((l) => [l.clave, l.foto])),
  consentimiento: TEXTOS_CONSENTIMIENTO_BASE,
  mensajes: {
    confirmacion: [
      "Hola {nombre}, te confirmo tu hora en {estudio}.",
      "",
      "*Cuándo:* {fecha}",
      "*Duración:* aprox. {duracion}",
      "*Dónde:* {direccion}",
      "*Valor:* {valor}",
      "*Abono recibido:* {abono}",
      "*Saldo el día de la sesión:* {saldo}",
      "",
      "Antes de venir: come bien, toma agua y evita el alcohol 24 h antes.",
      "Cuidados después de la sesión: {cuidados}",
    ].join("\n"),
    recordatorio: "Hola {nombre}, te recuerdo tu sesión {cuando} en {direccion}.\nEl saldo es {saldo} (efectivo o transferencia).\nSi necesitas cambiar algo, avísame por acá.",
    consentimiento: "Hola {nombre}. Antes de tu sesión del {fecha}, llena y firma tu consentimiento acá. Toma dos minutos:\n{link}",
    dia1: "Hola {nombre}, ¿cómo amaneció el tatuaje? Lávalo con jabón neutro 2 o 3 veces al día y ponle una capa delgada de crema. Los cuidados, paso a paso: {cuidados}\nCualquier duda, escríbeme.",
    dia7: "Hola {nombre}, ya va una semana. Es normal que pique y se pele: no lo rasques y sigue hidratando. Nada de sol, piscina ni mar hasta que sane del todo.",
    dia30: "Hola {nombre}, a esta altura ya debería estar sano. Desde ahora, protector solar cada vez que le dé el sol para que se mantenga nítido. ¿Me mandas una foto de cómo quedó?",
    laser1: "Hola {nombre}, ¿cómo amaneció la zona del láser? Es normal que esté roja, hinchada o con pequeñas ampollas. No las revientes, mantén la zona limpia y seca, y protégela del sol. Cualquier duda, escríbeme.",
    laserProxima: "Hola {nombre}, ya pasaron seis semanas desde tu sesión de láser: la piel está lista para la siguiente. ¿Te agendo una hora?",
    resena: "Hola {nombre}, gracias por confiar en mí. Si te gustó el resultado, me ayudas mucho dejando una reseña en Google:\n{link}",
  },
};

/** Cuánto cabe en cada cosa: lo que se escribe en el panel se recorta a esto. */
export const LARGO = { titulo: 40, texto: 400, frase: 240, item: 160 } as const;

// ------------------------------------------------------------ revisión --

const texto = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().replace(/\s+\n/g, "\n").slice(0, max) : "");

const textos = (v: unknown, max: number, tope: number): string[] =>
  Array.isArray(v) ? v.map((x) => texto(x, max)).filter(Boolean).slice(0, tope) : [];

const pares = (v: unknown, tope: number, largoTexto: number = LARGO.texto): Par[] =>
  Array.isArray(v)
    ? v
        .map((x) => ({ titulo: texto(x?.titulo, LARGO.titulo), texto: texto(x?.texto, largoTexto) }))
        .filter((p) => p.titulo && p.texto)
        .slice(0, tope)
    : [];

/** Si lo guardado quedó vacío, manda lo de fábrica: la web nunca muestra una sección hueca. */
const oBase = <T>(valor: T[], base: T[]): T[] => (valor.length ? valor : base);

/** Un mapa que ubica la dirección escrita, para cuando el estudio se cambia de local. */
function mapas(direccion: string, comuna: string): Pick<DatosEstudio, "mapa" | "comoLlegar"> {
  const base = CONTENIDO_BASE.estudio;
  if (direccion === base.direccion && comuna === base.comuna) return { mapa: base.mapa, comoLlegar: base.comoLlegar };
  const q = encodeURIComponent(`${direccion}, ${comuna}, Chile`);
  return { mapa: `https://maps.google.com/maps?q=${q}&output=embed`, comoLlegar: `https://www.google.com/maps/search/?api=1&query=${q}` };
}

/** Solo links de Google: el botón de reseñas no puede mandar a cualquier parte. */
export const esLinkDeResenas = (v: string) =>
  /^https:\/\/(g\.page|maps\.app\.goo\.gl|goo\.gl|search\.google\.com|www\.google\.com|google\.com|maps\.google\.com|www\.google\.cl|google\.cl)\/\S+$/i.test(v);

export const esCorreo = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);

export function normalizarEstudio(v: unknown): DatosEstudio {
  const g = (v ?? {}) as Record<string, unknown>;
  const base = CONTENIDO_BASE.estudio;
  const whatsapp = texto(g.whatsapp, 15).replace(/\D/g, "");
  const instagram = texto(g.instagram, 40).replace(/^@/, "");
  const direccion = texto(g.direccion, 80) || base.direccion;
  const comuna = texto(g.comuna, 40) || base.comuna;
  const resenas = texto(g.resenas, 300);
  const correo = texto(g.correo, 120);
  return {
    ...base,
    whatsapp: /^56\d{9}$/.test(whatsapp) ? whatsapp : base.whatsapp,
    instagram: /^[A-Za-z0-9._]{1,30}$/.test(instagram) ? instagram : base.instagram,
    direccion,
    comuna,
    ...mapas(direccion, comuna),
    resenas: esLinkDeResenas(resenas) ? resenas : "",
    responsable: texto(g.responsable, 80) || base.responsable,
    correo: esCorreo(correo) ? correo : "",
  };
}

export function normalizarTatuador(v: unknown): TextosTatuador {
  const g = (v ?? {}) as Record<string, unknown>;
  const base = CONTENIDO_BASE.tatuador;
  return {
    frase: texto(g.frase, LARGO.frase) || base.frase,
    datos: oBase(pares(g.datos, 3, LARGO.item), base.datos),
    especialidades: oBase(textos(g.especialidades, LARGO.titulo, 12), base.especialidades),
    trayectoria: oBase(pares(g.trayectoria, 8, LARGO.item), base.trayectoria),
    lugar: oBase(pares(g.lugar, 4, LARGO.item), base.lugar),
  };
}

export function normalizarPreguntas(v: unknown): Par[] {
  return oBase(
    Array.isArray(v)
      ? v.map((x) => ({ titulo: texto(x?.titulo, 120), texto: texto(x?.texto, 800) })).filter((p) => p.titulo && p.texto).slice(0, 20)
      : [],
    CONTENIDO_BASE.preguntas,
  );
}

export function normalizarCuidados(v: unknown): TextosCuidados {
  const g = (v ?? {}) as Record<string, unknown>;
  const base = CONTENIDO_BASE.cuidados;
  // Las etapas son cuatro: el recorrido de la web está dibujado para cuatro puntos.
  const etapas = base.etapas.map((b, i) => {
    const e = (Array.isArray(g.etapas) ? g.etapas[i] : null) as Record<string, unknown> | null;
    const pasos = textos(e?.pasos, LARGO.item, 6);
    return { cuando: texto(e?.cuando, LARGO.titulo) || b.cuando, corto: texto(e?.corto, 14) || b.corto, pasos: pasos.length ? pasos : b.pasos };
  });
  return { etapas, evitar: oBase(textos(g.evitar, LARGO.item, 8), base.evitar), alertas: oBase(textos(g.alertas, LARGO.item, 8), base.alertas) };
}

/** Solo fotos del almacén público: es lo único que next/image tiene permitido cargar de afuera. */
export const esFotoDelAlmacen = (src: unknown): src is string =>
  typeof src === "string" && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(src);

export function normalizarFotos(v: unknown): Fotos {
  const g = (v ?? {}) as Record<string, Partial<FotoSubida> | undefined>;
  const fotos: Fotos = { ...CONTENIDO_BASE.fotos };
  for (const l of LUGARES_FOTO) {
    const f = g[l.clave];
    const ancho = Math.round(Number(f?.ancho));
    const alto = Math.round(Number(f?.alto));
    if (f && esFotoDelAlmacen(f.src) && ancho > 0 && alto > 0) {
      fotos[l.clave] = { src: f.src, ancho, alto, alt: texto(f.alt, 160) || l.foto?.alt || l.titulo };
    }
  }
  return fotos;
}

export function normalizarMensajes(v: unknown): Mensajes {
  const g = (v ?? {}) as Record<string, unknown>;
  const base = CONTENIDO_BASE.mensajes;
  const m = (k: keyof Mensajes) => texto(g[k], 800) || base[k];
  return {
    confirmacion: m("confirmacion"),
    recordatorio: m("recordatorio"),
    consentimiento: m("consentimiento"),
    dia1: m("dia1"),
    dia7: m("dia7"),
    dia30: m("dia30"),
    laser1: m("laser1"),
    laserProxima: m("laserProxima"),
    resena: m("resena"),
  };
}

/** Las palabras entre llaves que entiende cada mensaje, para el editor del panel. */
export const LLAVES: Record<keyof Mensajes, string[]> = {
  confirmacion: ["nombre", "estudio", "fecha", "duracion", "direccion", "valor", "abono", "saldo", "cuidados"],
  recordatorio: ["nombre", "cuando", "direccion", "saldo"],
  consentimiento: ["nombre", "fecha", "link"],
  dia1: ["nombre", "cuidados"],
  dia7: ["nombre", "cuidados"],
  dia30: ["nombre", "cuidados"],
  laser1: ["nombre"],
  laserProxima: ["nombre"],
  resena: ["nombre", "link"],
};

/**
 * Reemplaza {nombre}, {fecha}… La línea que lleva una llave sin valor no se
 * manda entera: así "Abono recibido: {abono}" no aparece si no hubo abono.
 */
export function rellenar(plantilla: string, valores: Record<string, string>): string {
  return plantilla
    .split("\n")
    .filter((l) => !/\{(\w+)\}/.test(l) || [...l.matchAll(/\{(\w+)\}/g)].every((m) => valores[m[1]]))
    .map((l) => l.replace(/\{(\w+)\}/g, (_, k: string) => valores[k]).trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Junta lo guardado con lo de fábrica, bloque por bloque. */
export function mezclar(guardado: Partial<Record<ClaveBloque, unknown>>): Contenido {
  return {
    estudio: normalizarEstudio(guardado.estudio),
    precios: normalizarPrecios(guardado.precios),
    tatuador: normalizarTatuador(guardado.tatuador),
    preguntas: normalizarPreguntas(guardado.preguntas),
    cuidados: normalizarCuidados(guardado.cuidados),
    fotos: normalizarFotos(guardado.fotos),
    consentimiento: normalizarTextosConsentimiento(guardado.consentimiento),
    mensajes: normalizarMensajes(guardado.mensajes),
  };
}

export function enlaceWhatsapp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
