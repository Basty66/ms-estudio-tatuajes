import Link from "next/link";
import { Encabezado } from "@/componentes/panel/Encabezado";
import { Burbuja, Documento, Externo, Flecha, Gota, Imagen, Personas, Precio, Pregunta, Telefono } from "@/componentes/panel/Iconos";
import { cambiosDelContenido } from "@/db/contenido";
import { galeria } from "@/db/panel";
import { hayGaleria } from "@/lib/admin/almacen";
import { fechaCorta } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import type { ClaveBloque } from "@/lib/contenido";

export const dynamic = "force-dynamic";

type Parte = { href: string; clave?: ClaveBloque; texto: string; detalle: string; Icono: (p: { className?: string }) => React.ReactNode };

/** Lo que se ve en la web, y lo que el cliente recibe por fuera de ella (el link para firmar y los WhatsApp). */
const GRUPOS: Array<{ titulo: string; partes: Parte[] }> = [
  {
    titulo: "En la web",
    partes: [
      { href: `${PANEL}/galeria`, texto: "Trabajos", detalle: "El portafolio: subir, ordenar y ocultar fotos", Icono: Imagen },
      { href: `${PANEL}/web/fotos`, clave: "fotos", texto: "Fotos de la web", detalle: "Retratos, antes y después, una sesión y el cotizador", Icono: Imagen },
      { href: `${PANEL}/web/precios`, clave: "precios", texto: "Precios del cotizador", detalle: "Tamaños, recargo por estilo y por zona", Icono: Precio },
      { href: `${PANEL}/web/tatuador`, clave: "tatuador", texto: "El tatuador", detalle: "Presentación, datos y cómo trabajas", Icono: Personas },
      { href: `${PANEL}/web/preguntas`, clave: "preguntas", texto: "Preguntas frecuentes", detalle: "Lo que la gente pregunta antes de escribir", Icono: Pregunta },
      { href: `${PANEL}/web/cuidados`, clave: "cuidados", texto: "Cuidados", detalle: "Las cuatro etapas, qué evitar y cuándo avisar", Icono: Gota },
      { href: `${PANEL}/web/estudio`, clave: "estudio", texto: "Contacto y datos", detalle: "WhatsApp, dirección, reseñas y quién cuida los datos", Icono: Telefono },
    ],
  },
  {
    titulo: "Con tus clientes",
    partes: [
      { href: `${PANEL}/web/consentimiento`, clave: "consentimiento", texto: "Consentimiento", detalle: "Riesgos y compromisos que aceptan al firmar", Icono: Documento },
      { href: `${PANEL}/web/mensajes`, clave: "mensajes", texto: "Mensajes de WhatsApp", detalle: "Confirmar, recordar, pedir firma, cuidados y reseña", Icono: Burbuja },
    ],
  },
];

/** Todo lo que ven los clientes y se cambia sin tocar código. */
export default async function Web() {
  await operadorDelPanel();
  const [cambios, fotos] = await Promise.all([cambiosDelContenido(), galeria()]);

  return (
    <>
      <Encabezado volver={`${PANEL}/mas`} titulo="Web" />

      {!hayGaleria && (
        <p className="mb-4 rounded-2xl border border-[#f59e0b]/40 bg-[#f59e0b]/[0.06] p-4 text-[14px] text-[#fbbf24]">
          Los textos y precios ya se pueden cambiar. Para subir fotos falta conectar el almacén de fotos en Vercel.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-8">
        {GRUPOS.map((g) => (
          <section key={g.titulo}>
            <h2 className="mb-3 px-1 text-[12px] font-semibold tracking-[0.16em] text-ceniza uppercase">{g.titulo}</h2>
            <ul className="overflow-hidden rounded-3xl border border-linea bg-hollin/70">
              {g.partes.map(({ href, clave, texto, detalle, Icono }) => {
                const cambio = clave ? cambios[clave] : undefined;
                const estado = href.endsWith("/galeria")
                  ? `${fotos.filter((f) => f.visible).length} en la web`
                  : cambio
                    ? `Cambiado el ${fechaCorta(cambio.cuando)}`
                    : null;
                return (
                  <li key={href} className="border-b border-linea/70 last:border-0">
                    <Link href={href} className="group flex min-h-16 items-center gap-4 px-4 py-3 transition-colors hover:bg-tinta/40 sm:px-5">
                      <Icono className="size-5 shrink-0 text-stencil-claro" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{texto}</span>
                        <span className="block truncate text-[13px] text-ceniza">{estado ? `${estado} · ${detalle.toLowerCase()}` : detalle}</span>
                      </span>
                      <Flecha className="size-4 shrink-0 text-ceniza transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <a href="/" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center justify-center gap-1.5 text-[14px] text-ceniza hover:text-piel">
        Ver la web <Externo className="size-4" />
      </a>
    </>
  );
}
