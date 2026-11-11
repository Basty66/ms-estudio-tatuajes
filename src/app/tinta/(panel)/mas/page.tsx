import Link from "next/link";
import { Encabezado } from "@/componentes/panel/Encabezado";
import { Flecha } from "@/componentes/panel/Iconos";
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
      <ul className="flex flex-col gap-2">
        {SECUNDARIAS.map(({ href, texto, detalle, Icono }) => (
          <li key={href}>
            <Link href={href} className="group flex items-center gap-4 rounded-2xl border border-linea bg-hollin/60 p-4 hover:border-stencil/60">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-linea bg-tinta text-stencil-claro">
                <Icono className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  {texto}
                  {texto === "Cotizaciones" && sinVer > 0 && <span className="rounded-full bg-stencil px-2 text-[12px] text-piel">{sinVer}</span>}
                </span>
                <span className="block truncate text-[13px] text-ceniza">{detalle}</span>
              </span>
              <Flecha className="size-4 text-ceniza transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
      <a href="/" target="_blank" rel="noopener noreferrer" className="mt-6 block text-center text-[14px] text-ceniza hover:text-piel">
        Ver la web ↗
      </a>
    </>
  );
}
