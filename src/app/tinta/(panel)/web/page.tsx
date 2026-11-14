import Link from "next/link";
import { Encabezado } from "@/componentes/panel/Encabezado";
import { Flecha, Gota, Imagen, Personas, Precio, Pregunta, Telefono } from "@/componentes/panel/Iconos";
import { cambiosDelContenido } from "@/db/contenido";
import { galeria } from "@/db/panel";
import { hayGaleria } from "@/lib/admin/almacen";
import { fechaCorta } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import type { ClaveBloque } from "@/lib/contenido";

export const dynamic = "force-dynamic";

const PARTES: Array<{ href: string; clave?: ClaveBloque; texto: string; detalle: string; Icono: (p: { className?: string }) => React.ReactNode }> = [
  { href: `${PANEL}/galeria`, texto: "Trabajos", detalle: "El portafolio: subir, ordenar y ocultar fotos", Icono: Imagen },
  { href: `${PANEL}/web/fotos`, clave: "fotos", texto: "Fotos de la web", detalle: "Retratos, antes y después, una sesión y el cotizador", Icono: Imagen },
  { href: `${PANEL}/web/precios`, clave: "precios", texto: "Precios del cotizador", detalle: "Tamaños, recargo por estilo y por zona", Icono: Precio },
  { href: `${PANEL}/web/estudio`, clave: "estudio", texto: "Contacto y dirección", detalle: "WhatsApp, Instagram y dónde queda el estudio", Icono: Telefono },
  { href: `${PANEL}/web/tatuador`, clave: "tatuador", texto: "El tatuador", detalle: "Presentación, especialidades y trayectoria", Icono: Personas },
  { href: `${PANEL}/web/preguntas`, clave: "preguntas", texto: "Preguntas frecuentes", detalle: "Lo que la gente pregunta antes de escribir", Icono: Pregunta },
  { href: `${PANEL}/web/cuidados`, clave: "cuidados", texto: "Cuidados", detalle: "Las cuatro etapas, qué evitar y cuándo avisar", Icono: Gota },
];

/** Todo lo que se ve en la web y se cambia sin tocar código. */
export default async function Web() {
  await operadorDelPanel();
  const [cambios, fotos] = await Promise.all([cambiosDelContenido(), galeria()]);

  return (
    <>
      <Encabezado volver={`${PANEL}/mas`} etiqueta="Lo que se ve en la web" titulo="Web" />

      {!hayGaleria && (
        <p className="mb-4 rounded-2xl border border-[#f59e0b]/40 bg-[#f59e0b]/[0.06] p-4 text-[14px] text-[#fbbf24]">
          Los textos y precios ya se pueden cambiar. Para subir fotos falta conectar el almacén de fotos en Vercel.
        </p>
      )}

      <ul className="grid gap-2 lg:grid-cols-2">
        {PARTES.map(({ href, clave, texto, detalle, Icono }) => {
          const cambio = clave ? cambios[clave] : undefined;
          return (
            <li key={href}>
              <Link href={href} className="group flex h-full items-center gap-4 rounded-2xl border border-linea bg-hollin/60 p-4 transition-colors hover:border-stencil/60">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-linea bg-tinta text-stencil-claro">
                  <Icono className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{texto}</span>
                  <span className="block text-[13px] leading-snug text-ceniza">{detalle}</span>
                  <span className="mt-1 block text-[12px] text-ceniza/80">
                    {href.endsWith("/galeria")
                      ? `${fotos.filter((f) => f.visible).length} en la web`
                      : cambio
                        ? `Cambiado el ${fechaCorta(cambio.cuando)} por ${cambio.quien}`
                        : "Como venía de fábrica"}
                  </span>
                </span>
                <Flecha className="size-4 shrink-0 text-ceniza transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>

      <a href="/" target="_blank" rel="noopener noreferrer" className="mt-6 block text-center text-[14px] text-ceniza hover:text-piel">
        Ver la web ↗
      </a>
    </>
  );
}
