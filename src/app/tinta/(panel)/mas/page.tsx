import Link from "next/link";
import { Encabezado } from "@/componentes/panel/Encabezado";
import { Externo, Flecha } from "@/componentes/panel/Iconos";
import { SECUNDARIAS } from "@/componentes/panel/secciones";
import { cotizacionesSinVer } from "@/db/panel";
import { operadorDelPanel } from "@/lib/admin/panel";

export const dynamic = "force-dynamic";

/** En el teléfono, lo que no cabe en la barra de abajo. */
export default async function Mas() {
  const yo = await operadorDelPanel();
  const sinVer = await cotizacionesSinVer();
  return (
    <>
      <Encabezado etiqueta={yo.nombre} titulo="Más" />
      <ul className="overflow-hidden rounded-3xl border border-linea bg-hollin/70">
        {SECUNDARIAS.map(({ href, texto, detalle, Icono }) => (
          <li key={href} className="border-b border-linea/70 last:border-0">
            <Link href={href} className="group flex min-h-16 items-center gap-4 px-4 py-3 transition-colors hover:bg-tinta/40 sm:px-5">
              <Icono className="size-5 shrink-0 text-stencil-claro" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  {texto}
                  {texto === "Cotizaciones" && sinVer > 0 && <span className="rounded-full bg-stencil px-2 text-[12px] text-piel">{sinVer}</span>}
                </span>
                <span className="block truncate text-[13px] text-ceniza">{detalle}</span>
              </span>
              <Flecha className="size-4 shrink-0 text-ceniza transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
      <a href="/" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center justify-center gap-1.5 text-[14px] text-ceniza hover:text-piel">
        Ver la web <Externo className="size-4" />
      </a>
    </>
  );
}
