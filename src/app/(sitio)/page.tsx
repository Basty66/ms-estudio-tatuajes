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
import { ESTUDIO, PREGUNTAS, type Trabajo } from "@/lib/estudio";

/** La portada se rehace cada hora, y al instante cuando se sube o se oculta una foto en el panel. */
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
const SITIO = "https://tatuajes-azure.vercel.app";
const DATOS_ESTRUCTURADOS = [
  {
    "@context": "https://schema.org",
    "@type": "TattooParlor",
    name: ESTUDIO.nombreLargo,
    alternateName: `${ESTUDIO.nombre} Studio`,
    url: SITIO,
    image: `${SITIO}/images/tatuaje3.jpg`,
    telephone: `+${ESTUDIO.whatsapp}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: ESTUDIO.direccion,
      addressLocality: ESTUDIO.comuna,
      addressRegion: "Región Metropolitana",
      addressCountry: "CL",
    },
    geo: { "@type": "GeoCoordinates", latitude: -33.6915605, longitude: -71.2191188 },
    sameAs: [`https://instagram.com/${ESTUDIO.instagram}`],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PREGUNTAS.map((q) => ({ "@type": "Question", name: q.p, acceptedAnswer: { "@type": "Answer", text: q.r } })),
  },
];

export default async function Inicio() {
  const trabajos = await trabajosDeLaGaleria();
  return (
    <>
      <script
        type="application/ld+json"
        // Se escapa "<" para que ningún texto pueda cerrar la etiqueta.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(DATOS_ESTRUCTURADOS).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <Marquesina />
      <Trabajos trabajos={trabajos} />
      <Tatuador />
      <Proceso />
      <Cotizador />
      <Laser />
      <Cuidados />
      <Preguntas />
      <Pie />
    </>
  );
}
