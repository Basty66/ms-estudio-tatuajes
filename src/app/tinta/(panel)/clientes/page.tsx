import Link from "next/link";
import { Encabezado } from "@/componentes/panel/Encabezado";
import { Buscar, Flecha } from "@/componentes/panel/Iconos";
import { clientes } from "@/db/panel";
import { fechaCorta, hora, hoyChile } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { formatearTelefono } from "@/lib/admin/telefono";

export const dynamic = "force-dynamic";

/** Todos los que han venido, los más recientes primero. Busca por nombre, teléfono o Instagram. */
export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await operadorDelPanel();
  const q = ((await searchParams).q ?? "").slice(0, 60);
  const lista = await clientes(q);
  const hoy = hoyChile();

  return (
    <>
      <Encabezado etiqueta={`${lista.length} ${lista.length === 1 ? "persona" : "personas"}`} titulo="Clientes" />
      <form className="relative mb-4" role="search">
        <Buscar className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ceniza" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Nombre, teléfono o @instagram"
          autoComplete="off"
          className="min-h-12 w-full rounded-2xl border border-linea bg-hollin/70 pr-4 pl-12 text-[16px] placeholder:text-ceniza/60 focus:border-stencil focus:outline-none"
        />
      </form>
      {lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linea px-4 py-8 text-center text-ceniza">
          {q ? "Nadie con ese nombre o teléfono." : "Todavía no hay clientes. Se crean solos al agendar."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((c) => (
            <li key={c.id}>
              <Link href={`${PANEL}/cliente/${c.id}`} className="group flex items-center gap-3 rounded-2xl border border-linea bg-hollin/60 p-3 pl-4 hover:border-stencil/60">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2f6bff,#0c1f6b)] font-gotica text-lg">
                  {c.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.nombre}</span>
                  <span className="block truncate text-[13px] text-ceniza">
                    {c.telefono ? formatearTelefono(c.telefono) : c.instagram ? `@${c.instagram}` : "Sin contacto"}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[12px] leading-tight text-ceniza">
                  {c.proxima ? (
                    <span className="text-stencil-claro capitalize">
                      {c.proxima.slice(0, 10) === hoy ? "hoy" : fechaCorta(c.proxima)} {hora(c.proxima)}
                    </span>
                  ) : (
                    <span>
                      {c.citas} {c.citas === 1 ? "cita" : "citas"}
                    </span>
                  )}
                </span>
                <Flecha className="size-4 shrink-0 text-ceniza transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
