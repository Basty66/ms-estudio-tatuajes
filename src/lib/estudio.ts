/**
 * Datos del estudio en un solo lugar. Todo lo que diga dónde está, cómo
 * contactar o qué se hace sale de acá, para que cambiar un número no sea
 * buscarlo en diez componentes.
 */
export const ESTUDIO = {
  nombre: "Matness",
  nombreLargo: "MS Estudio de Tatuajes",
  direccion: "Av. Manso 529, segundo piso",
  comuna: "Melipilla",
  whatsapp: "56964470668",
  instagram: "matness_tattoos",
  mapa:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3319.671837850001!2d-71.2191187651123!3d-33.6915605!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662550034d24fdb%3A0x17acc011bcc2a11e!2sMATNESS_TATTOOS!5e0!3m2!1ses!2sus!4v1785733217062!5m2!1ses!2sus",
  comoLlegar: "https://maps.app.goo.gl/?q=MATNESS_TATTOOS+Melipilla",
} as const;

export function enlaceWhatsapp(mensaje: string): string {
  return `https://wa.me/${ESTUDIO.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Las secciones de la portada, en el orden en que aparecen. De acá salen el
 * menú y el índice numerado de cada título: si se reordena la página, se
 * reordena esta lista y todo calza.
 */
export const SECCIONES = [
  { id: "trabajos", texto: "Trabajos", etiqueta: "Portafolio", detalle: "Lo último que salió del estudio", img: "/trabajos/pared-01.jpg", corto: true },
  { id: "tatuador", texto: "El tatuador", etiqueta: "Quién tatúa", detalle: "Su historia, su formación y su estudio", img: "/trabajos/tatuador-1.jpg", corto: true },
  { id: "proceso", texto: "Una sesión", etiqueta: "Paso a paso", detalle: "Del stencil a la piel, paso a paso", img: "/trabajos/pared-15.jpg", corto: true },
  { id: "cotiza", texto: "Cotiza", etiqueta: "Precio al instante", detalle: "Tu rango de precio en un minuto", img: "/trabajos/pared-02.jpg", corto: false },
  { id: "laser", texto: "Borrado láser", etiqueta: "Otro servicio", detalle: "Borrar del todo o aclarar para un cover", img: "/videos/laser.jpg", corto: true },
  { id: "cuidados", texto: "Cuidados", etiqueta: "Después de la sesión", detalle: "El primer mes, día por día", img: "/trabajos/pared-06.jpg", corto: false },
  { id: "preguntas", texto: "Preguntas", etiqueta: "Dudas frecuentes", detalle: "Dolor, pagos, edad y retoques", img: "/images/tatuaje3.jpg", corto: false },
] as const;

export type IdSeccion = (typeof SECCIONES)[number]["id"];

export const ESTILOS = ["Lettering", "Fineline", "Blackwork", "Black & grey", "Color", "Borrado láser"] as const;

export type Trabajo = {
  src: string;
  alt: string;
  estilo: string;
  zona: string;
  ancho: number;
  alto: number;
  /** Encuadre al recortar (object-position): dónde está el tatuaje en la foto. */
  foco?: string;
};

/** Mientras el panel no tenga galería cargada, se muestran estos. */
export const TRABAJOS: Trabajo[] = [
  {
    src: "/trabajos/pared-01.jpg",
    alt: "Lettering Everything en el cuello, recién terminado",
    estilo: "Lettering",
    zona: "Cuello",
    ancho: 720,
    alto: 900,
  },
  {
    src: "/images/tatuaje3.jpg",
    alt: "Anubis en blackwork sobre el hombro",
    estilo: "Blackwork",
    zona: "Hombro",
    ancho: 1440,
    alto: 1440,
  },
  {
    src: "/images/tatuaje2.jpg",
    alt: "Dos peces koi en fineline, uno en tinta roja y otro en negro, junto a una flor de lis",
    estilo: "Fineline",
    zona: "Antebrazo",
    ancho: 1440,
    alto: 1440,
    foco: "40% 70%",
  },
  {
    src: "/images/tatuaje1.jpg",
    alt: "Lettering God Father con sombreado en la pantorrilla",
    estilo: "Lettering",
    zona: "Pantorrilla",
    ancho: 1440,
    alto: 1800,
  },
  {
    src: "/trabajos/pared-02.jpg",
    alt: "Kanji en negro con flores de lycoris en tinta roja",
    estilo: "Color",
    zona: "Costado",
    ancho: 720,
    alto: 900,
  },
  {
    src: "/trabajos/pared-06.jpg",
    alt: "Tatuaje fineline pequeño en el brazo",
    estilo: "Fineline",
    zona: "Brazo",
    ancho: 720,
    alto: 900,
  },
];

/** Cuadros reales de una sesión, en orden: el proceso completo. */
export const PROCESO = [
  { src: "/trabajos/pared-15.jpg", paso: "Stencil", texto: "El diseño aprobado se calca sobre la piel. Si no queda perfecto, se vuelve a poner." },
  { src: "/trabajos/pared-03.jpg", paso: "Líneas", texto: "La máquina repasa el calco. Es la parte que define todo lo demás." },
  { src: "/trabajos/pared-07.jpg", paso: "Sombra y color", texto: "Se construye el volumen capa por capa, sin apurar la piel." },
  { src: "/trabajos/pared-01.jpg", paso: "Resultado", texto: "Limpieza, foto, film protector y tus cuidados por escrito." },
] as const;

export const CUIDADOS = [
  {
    cuando: "Primeras 24 horas",
    pasos: [
      "Deja el vendaje puesto entre 2 y 4 horas.",
      "Lava con agua tibia y jabón neutro, sin frotar.",
      "Seca con toques de papel absorbente, nunca con toalla.",
    ],
  },
  {
    cuando: "Días 1 a 7",
    pasos: [
      "Una capa fina de crema (Bepanthol o similar) 2 a 3 veces al día.",
      "Lava siempre antes de volver a aplicar crema.",
      "Entre el día 3 y el 7 se pela como una quemadura de sol. Es normal.",
    ],
  },
  {
    cuando: "Días 7 a 14",
    pasos: [
      "Sale piel nueva y el tatuaje puede verse opaco. El color vuelve.",
      "No te rasques ni saques las costras: se llevan la tinta.",
    ],
  },
  {
    cuando: "Día 30",
    pasos: [
      "Curado completo. Ya puedes tomar sol, siempre con protector.",
      "Si perdió color o detalle, coordinamos el retoque.",
    ],
  },
] as const;

export const EVITAR = [
  "Sol directo durante 3 a 4 semanas",
  "Piscina, mar y jacuzzi hasta que sane",
  "Ropa ajustada que roce el tatuaje",
  "Ejercicio intenso los primeros 3 días",
] as const;

export const ALERTAS = [
  "Enrojecimiento que se expande después del día 3",
  "Pus, mal olor o dolor intenso",
  "Fiebre: consulta a un médico de inmediato",
] as const;

export const PREGUNTAS = [
  {
    p: "¿Duele?",
    r: "Depende de la zona y de tu tolerancia. La mayoría lo describe como un rasguño o una vibración. Costillas, pies y codos son las zonas más sensibles.",
  },
  {
    p: "¿Cuánto cuesta?",
    r: "Depende del tamaño, el detalle, la zona y el tiempo. El cotizador de esta página te da un rango al instante, y el precio final lo confirmamos al ver el diseño.",
  },
  {
    p: "¿Cómo se paga?",
    r: "Efectivo o transferencia. La hora se reserva con un abono y el resto se paga el día de la sesión.",
  },
  {
    p: "¿El material es desechable?",
    r: "Sí. Agujas, grips, vasos de tinta y guantes son de un solo uso y se abren frente a ti.",
  },
  {
    p: "¿Puedo traer mi propio diseño?",
    r: "Claro. Mándalo por WhatsApp y lo revisamos. Si no tienes uno, lo diseño desde cero a partir de tu idea y te lo muestro antes de la sesión para que lo apruebes.",
  },
  {
    p: "¿Desde qué edad tatúas?",
    r: "Desde los 18 años, con consentimiento firmado. Entre los 16 y los 17 solo con autorización notarial y ambos padres presentes.",
  },
  {
    p: "¿Cuánto cuesta un retoque?",
    r: "Según el tamaño y la complejidad. Mándame una foto por WhatsApp y te paso el valor exacto.",
  },
  {
    p: "¿Haces borrado con láser?",
    r: "Sí. El láser rompe la tinta en partículas que el cuerpo elimina solo. Las sesiones se separan entre 4 y 8 semanas, y sirve tanto para borrar como para aclarar antes de un cover.",
  },
] as const;
