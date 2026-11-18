import { Cotizador } from "@/componentes/sitio/Cotizador";
import { Cuidados } from "@/componentes/sitio/Cuidados";
import { Hero } from "@/componentes/sitio/Hero";
import { Laser } from "@/componentes/sitio/Laser";
import { Marquesina } from "@/componentes/sitio/Marquesina";
import { Pie } from "@/componentes/sitio/Pie";
import { Preguntas } from "@/componentes/sitio/Preguntas";
import { Proceso } from "@/componentes/sitio/Proceso";
import { Tatuador } from "@/componentes/sitio/Tatuador";
import { Trabajos } from "@/componentes/sitio/Trabajos";
import { leerContenido } from "@/db/contenido";
import type { Contenido, Foto } from "@/lib/contenido";
import { PARED, PROCESO, type Trabajo } from "@/lib/estudio";
import { SITIO } from "@/lib/sitio";

/** La portada se rehace cada hora, y al instante cuando se cambia algo de la web en el panel. */
export const revalidate = 3600;

/**
 * Los trabajos de la galería del panel. La base se importa recién acá
 * adentro: si falta la conexión o la base no responde, la portada sale igual
 * con los trabajos de muestra en vez de caerse.
 */
async function trabajosDeLaGaleria(): Promise<Trabajo[] | undefined> {
  try {
    const { galeria } = await import("@/db/panel");
    const fotos = await galeria(true);
    if (fotos.length === 0) return undefined;
    return fotos.map((f) => ({ src: f.url, alt: f.alt, estilo: f.estilo, zona: f.zona, ancho: f.ancho, alto: f.alto }));
  } catch {
    return undefined;
  }
}

/**
 * Datos estructurados para Google: la ficha del estudio (para "tatuajes en
 * Melipilla" y el mapa) y las preguntas frecuentes. Todo sale de los mismos
 * datos que se ven en la página.
 */
const DIAS_SCHEMA = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const datosEstructurados = ({ estudio, preguntas, reservas }: Contenido) => [
  {
    "@context": "https://schema.org",
    "@type": "TattooParlor",
    name: estudio.nombreLargo,
    alternateName: `${estudio.nombre} Studio`,
    url: SITIO,
    image: `${SITIO}/images/tatuaje3.jpg`,
    telephone: `+${estudio.whatsapp}`,
    ...(estudio.correo ? { email: estudio.correo } : {}),
    priceRange: "$$",
    areaServed: estudio.comuna,
    hasMap: estudio.comoLlegar,
    // El horario sale de los cupos del panel: desde el primer cupo hasta que termina la jornada.
    openingHoursSpecification: reservas.dias.flatMap((d, i) =>
      d.abierto && d.cupos.length ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: DIAS_SCHEMA[i], opens: d.cupos[0], closes: d.hasta }] : [],
    ),
    makesOffer: ["Tatuajes", "Borrado de tatuajes con láser", "Retoques"].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
    address: {
      "@type": "PostalAddress",
      streetAddress: estudio.direccion,
      addressLocality: estudio.comuna,
      addressRegion: "Región Metropolitana",
      addressCountry: "CL",
    },
    geo: { "@type": "GeoCoordinates", latitude: -33.6915605, longitude: -71.2191188 },
    sameAs: [`https://instagram.com/${estudio.instagram}`],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((q) => ({ "@type": "Question", name: q.titulo, acceptedAnswer: { "@type": "Answer", text: q.texto } })),
  },
];

export default async function Inicio() {
  const [trabajos, contenido] = await Promise.all([trabajosDeLaGaleria(), leerContenido()]);
  const { fotos } = contenido;
  // Los lugares de fábrica siempre tienen foto: solo los estilos del cotizador pueden quedar sin una.
  const fija = (clave: string) => fotos[clave] as Foto;
  // La pared del hero (escritorio) usa primero los trabajos de la galería y completa con los de fábrica.
  const pared = trabajos ? [...trabajos.map((t) => ({ tipo: "foto" as const, src: t.src, alt: "" })), ...PARED].slice(0, PARED.length) : PARED;

  return (
    <>
      <script
        type="application/ld+json"
        // Se escapa "<" para que ningún texto pueda cerrar la etiqueta.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(contenido)).replace(/</g, "\\u003c") }}
      />
      <Hero pared={pared} />
      <Marquesina />
      <Trabajos trabajos={trabajos} antes={fija("comparar-stencil")} despues={fija("comparar-final")} />
      <Tatuador textos={contenido.tatuador} grande={fija("tatuador-1")} chica={fija("tatuador-2")} />
      <Cotizador precios={contenido.precios} fotos={fotos} gracias={{ titulo: contenido.mensajes.graciasTitulo, nota: contenido.mensajes.graciasNota }}
        reservas={{ activas: contenido.reservas.activas, titulo: contenido.mensajes.reservaTitulo, nota: contenido.mensajes.reservaNota }}
      />
      <Proceso pasos={PROCESO.map((p, i) => ({ paso: p.paso, texto: p.texto, foto: fija(`proceso-${i + 1}`) }))} />
      <Laser />
      <Cuidados cuidados={contenido.cuidados} />
      <Preguntas preguntas={contenido.preguntas} />
      <Pie estudio={contenido.estudio} />
    </>
  );
}
