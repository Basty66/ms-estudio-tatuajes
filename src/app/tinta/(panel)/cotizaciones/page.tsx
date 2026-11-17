import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { MarcarVistas } from "@/componentes/panel/MarcarVistas";
import { cotizaciones } from "@/db/panel";
import { clp, nombreDonde, nombreEstilo, nombreTamano, nombreZona } from "@/lib/admin/etiquetas";
import { fechaCorta, hora, hoyChile, sumarDias } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { OBJETIVOS_LASER } from "@/lib/precios";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

/**
 * Lo que la gente cotiza en la web antes de escribir. No trae nombre ni
 * teléfono (eso llega por WhatsApp): sirve para saber qué piden, qué zonas y
 * estilos se repiten, y para no perder una idea si el WhatsApp nunca llega.
 */
export default async function Cotizaciones() {
  await operadorDelPanel();
  const lista = await cotizaciones();
  const hoy = hoyChile();
  const nuevas = lista.filter((c) => !c.vista).length;

  const cuenta = (clave: (c: (typeof lista)[number]) => string | null) => {
    const m = new Map<string, number>();
    for (const c of lista) {
      const k = clave(c);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 3);
  };
  const zonas = cuenta((c) => nombreZona(c.zona));
  // Lo que se pide: el estilo de los tatuajes y el borrado láser como uno más.
  const estilos = cuenta((c) => (c.tipo === "laser" ? "Borrado láser" : nombreEstilo(c.estilo)));
  const cuando = (instante: string) => {
    const dia = instante.slice(0, 10);
    return `${dia === hoy ? "hoy" : dia === sumarDias(hoy, -1) ? "ayer" : fechaCorta(dia)} · ${hora(instante)}`;
  };

  return (
    <>
      <MarcarVistas hay={nuevas > 0} />
      <Encabezado volver={`${PANEL}/mas`} etiqueta={nuevas ? `${nuevas} ${nuevas === 1 ? "nueva" : "nuevas"}` : "Desde la web"} titulo="Cotizaciones" />

      {lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linea px-4 py-8 text-center text-ceniza">
          Todavía nadie ha cotizado. Aparecen acá cuando alguien toca “Pedir hora” en el cotizador de la web.
        </p>
      ) : (
        <>
          <Tarjeta>
            <TituloBloque>Lo que más piden</TituloBloque>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[14px]">
              {[zonas, estilos].map((lista, i) => (
                <ul key={i} className="flex flex-col gap-1">
                  {lista.map(([n, v]) => (
                    <li key={n} className="flex justify-between gap-2">
                      <span className="truncate">{n}</span>
                      <span className="text-ceniza tabular-nums">{v}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </Tarjeta>

          <ul className="mt-4 grid gap-2 lg:grid-cols-2">
            {lista.map((c) => (
              <li key={c.id} className={`rounded-2xl border p-4 ${c.vista ? "border-linea bg-hollin/60" : "border-stencil/60 bg-stencil/10"}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 font-semibold">
                    {!c.vista && <span className="mr-2 inline-block size-2 rounded-full bg-stencil align-middle shadow-[0_0_8px_2px_rgba(47,107,255,0.8)]" />}
                    {c.tipo === "laser" && <span className="mr-2 text-[#a78bfa]">Láser ·</span>}
                    {nombreDonde(c.zona, c.lado)}
                  </p>
                  <p className="shrink-0 text-[12px] text-ceniza first-letter:uppercase">
                    {c.codigo && <span className="mr-2 rounded-full border border-linea px-2 py-0.5 font-semibold text-piel tabular-nums">{c.codigo}</span>}
                    {cuando(c.creada)}
                  </p>
                </div>
                <p className="mt-0.5 text-[14px] text-ceniza">
                  {c.tipo === "laser" ? (
                    <>
                      {nombreTamano(c.tamano)} · {OBJETIVOS_LASER.find((o) => o.id === c.estilo)?.nombre ?? c.estilo} ·{" "}
                      <span className="text-piel tabular-nums">
                        {clp(c.minimo)} a {clp(c.maximo)} por sesión
                      </span>
                      {c.sesiones_min && ` · ${c.sesiones_min} a ${c.sesiones_max} sesiones`}
                    </>
                  ) : (
                    <>
                      {nombreTamano(c.tamano)} · {nombreEstilo(c.estilo)} · <span className="text-piel tabular-nums">{clp(c.minimo)} a {clp(c.maximo)}</span>
                    </>
                  )}
                </p>
                {c.idea && <p className="mt-2 text-[15px] whitespace-pre-line">“{c.idea}”</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
