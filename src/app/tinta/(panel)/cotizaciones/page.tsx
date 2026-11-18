import Link from "next/link";
import { AccionesCotizacion } from "@/componentes/panel/AccionesCotizacion";
import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { Buscar } from "@/componentes/panel/Iconos";
import { MarcarVistas } from "@/componentes/panel/MarcarVistas";
import { leerContenido } from "@/db/contenido";
import { cotizaciones, resumenCotizaciones, type EstadoCotizacion } from "@/db/panel";
import { nombreDonde, nombreEstilo, nombreZona, textoCotizacion } from "@/lib/admin/etiquetas";
import { fechaCorta, hora, hoyChile, sumarDias } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { rellenar } from "@/lib/contenido";
import { sinNombre } from "@/lib/sesiones";

export const dynamic = "force-dynamic";

const FILTROS: Array<{ id: EstadoCotizacion | null; texto: string }> = [
  { id: "nueva", texto: "Nuevas" },
  { id: "respondida", texto: "Respondidas" },
  { id: "agendada", texto: "Agendadas" },
  { id: null, texto: "Todas" },
];

const ESTADO: Record<EstadoCotizacion, { texto: string; clase: string }> = {
  nueva: { texto: "Nueva", clase: "border-stencil/60 bg-stencil/15 text-piel" },
  respondida: { texto: "Respondida", clase: "border-linea text-ceniza" },
  agendada: { texto: "Agendada", clase: "border-[#34d399]/40 bg-[#34d399]/10 text-[#6ee7b7]" },
  descartada: { texto: "Descartada", clase: "border-linea text-ceniza/70" },
};

/**
 * Lo que la gente cotiza en la web. No trae nombre ni teléfono: la persona
 * escribe por WhatsApp con su código (MS-XXXX). Acá se busca ese código, se
 * responde con un mensaje listo y, si agenda, se crea la cita con lo cotizado.
 */
export default async function Cotizaciones({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  await operadorDelPanel();
  const p = await searchParams;
  const q = (p.q ?? "").slice(0, 40);
  // Buscando, se busca en todas; sin buscar, se parte por las nuevas.
  const estado = p.estado === "todas" || q ? null : (FILTROS.find((f) => f.id === p.estado)?.id ?? "nueva");
  const [lista, conteo, todas, { mensajes }] = await Promise.all([cotizaciones({ estado, q }), resumenCotizaciones(), cotizaciones({ limite: 200 }), leerContenido()]);
  const hoy = hoyChile();
  const total = conteo.nueva + conteo.respondida + conteo.agendada + conteo.descartada;

  const cuenta = (clave: (c: (typeof todas)[number]) => string | null) => {
    const m = new Map<string, number>();
    for (const c of todas) {
      const k = clave(c);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 3);
  };
  const zonas = cuenta((c) => nombreZona(c.zona));
  const estilos = cuenta((c) => (c.tipo === "laser" ? "Borrado láser" : nombreEstilo(c.estilo)));
  const cuando = (instante: string) => {
    const dia = instante.slice(0, 10);
    return `${dia === hoy ? "hoy" : dia === sumarDias(hoy, -1) ? "ayer" : fechaCorta(dia)} · ${hora(instante)}`;
  };
  const enlace = (id: EstadoCotizacion | null) => `${PANEL}/cotizaciones${id === "nueva" ? "" : `?estado=${id ?? "todas"}`}`;

  return (
    <>
      <MarcarVistas hay={todas.some((c) => !c.vista)} />
      <Encabezado volver={`${PANEL}/mas`} etiqueta={conteo.nueva ? `${conteo.nueva} por responder` : "Desde la web"} titulo="Cotizaciones" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] xl:items-start xl:gap-5">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Llega un WhatsApp con "MS-K7Q2": se escribe acá y aparece. */}
          <form action={`${PANEL}/cotizaciones`} className="relative">
            <Buscar className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ceniza" />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Código (MS-K7Q2) o lo que escribió"
              autoCapitalize="characters"
              className="min-h-12 w-full rounded-2xl border border-linea bg-hollin/70 pr-4 pl-12 text-[16px] text-piel placeholder:text-ceniza/60 focus:border-stencil focus:outline-none"
            />
          </form>

          {q ? (
            <Link href={`${PANEL}/cotizaciones`} className="self-start text-[13px] text-stencil-claro">
              Quitar la búsqueda
            </Link>
          ) : (
            <nav aria-label="Filtrar" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              {FILTROS.map((f) => {
                const activo = f.id === estado;
                return (
                  <Link
                    key={f.texto}
                    href={enlace(f.id)}
                    aria-current={activo ? "page" : undefined}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition-colors ${
                      activo ? "border-stencil bg-stencil/20 text-piel" : "border-linea text-ceniza hover:text-piel"
                    }`}
                  >
                    {f.texto}
                    <span className="text-[12px] font-normal tabular-nums opacity-80">{f.id ? conteo[f.id] : total}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {lista.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-linea px-4 py-8 text-center text-ceniza">
              {q
                ? `Ninguna cotización con "${q}". Revisa el código que te mandaron.`
                : total === 0
                  ? "Todavía nadie ha cotizado. Aparecen acá cuando alguien toca “Pedir hora” en el cotizador de la web."
                  : estado === "nueva"
                    ? "Nada por responder: estás al día."
                    : "No hay cotizaciones en este estado."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lista.map((c) => {
                const t = textoCotizacion(c);
                // Sin código, "de la web": si quedara vacío, la línea entera no se mandaría.
                const respuesta = rellenar(sinNombre(mensajes.respuestaCotizacion), { codigo: c.codigo ?? "de la web", detalle: t.detalle, rango: t.rango });
                return (
                  <li
                    key={c.id}
                    className={`rounded-2xl border p-4 ${c.estado === "nueva" ? "border-stencil/50 bg-stencil/[0.07]" : "border-linea bg-hollin/60"} ${c.estado === "descartada" ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {c.codigo && <span className="font-semibold tracking-[0.04em] tabular-nums">{c.codigo}</span>}
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ESTADO[c.estado].clase}`}>{ESTADO[c.estado].texto}</span>
                      <span className="ml-auto shrink-0 text-[12px] text-ceniza first-letter:uppercase">{cuando(c.creada)}</span>
                    </div>
                    <p className="mt-2 font-semibold">
                      {c.tipo === "laser" && <span className="text-[#a78bfa]">Láser · </span>}
                      {nombreDonde(c.zona, c.lado)}
                    </p>
                    <p className="text-[14px] text-ceniza first-letter:uppercase">
                      {c.tipo === "laser" ? t.detalle.replace(/^borrado láser de un tatuaje /, "") : t.detalle} · <span className="text-piel tabular-nums">{t.rango}</span>
                    </p>
                    {c.idea && <p className="mt-2 text-[15px] whitespace-pre-line">“{c.idea}”</p>}
                    <div className="mt-3 border-t border-linea/70 pt-3">
                      <AccionesCotizacion id={c.id} estado={c.estado} respuesta={respuesta} citaId={c.cita_id} propuesta={mensajes.propuesta} datosAbono={mensajes.datosAbono} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {total > 0 && (
          <div className="flex flex-col gap-4">
            <Tarjeta>
              <TituloBloque>Cuántas terminan en cita</TituloBloque>
              <p className="text-[28px] leading-none font-semibold tabular-nums">
                {Math.round((conteo.agendada / total) * 100)}
                <span className="text-[18px] text-ceniza">%</span>
              </p>
              <p className="mt-1 text-[13px] text-ceniza">
                {conteo.agendada} de {total} cotizaciones se agendaron.
              </p>
            </Tarjeta>
            <Tarjeta>
              <TituloBloque>Lo que más piden</TituloBloque>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[14px]">
                {[zonas, estilos].map((l, i) => (
                  <ul key={i} className="flex flex-col gap-1">
                    {l.map(([n, v]) => (
                      <li key={n} className="flex justify-between gap-2">
                        <span className="truncate">{n}</span>
                        <span className="text-ceniza tabular-nums">{v}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </Tarjeta>
          </div>
        )}
      </div>
    </>
  );
}
