import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { MarcarVistas } from "@/componentes/panel/MarcarVistas";
import { cotizaciones } from "@/db/panel";
import { clp, nombreEstilo, nombreTamano, nombreZona, textoLado } from "@/lib/admin/etiquetas";
import { fechaRelativa, hora, hoyChile } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
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
  const estilos = cuenta((c) => nombreEstilo(c.estilo));

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
            <div className="grid grid-cols-2 gap-3 text-[14px]">
              <ul className="flex flex-col gap-1">
                {zonas.map(([n, v]) => (
                  <li key={n} className="flex justify-between gap-2">
                    <span>{n}</span>
                    <span className="text-ceniza tabular-nums">{v}</span>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-1">
                {estilos.map(([n, v]) => (
                  <li key={n} className="flex justify-between gap-2">
                    <span>{n}</span>
                    <span className="text-ceniza tabular-nums">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Tarjeta>

          <ul className="mt-4 flex flex-col gap-2">
            {lista.map((c) => (
              <li key={c.id} className={`rounded-2xl border p-4 ${c.vista ? "border-linea bg-hollin/60" : "border-stencil/60 bg-stencil/10"}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold">
                    {nombreZona(c.zona)}
                    {c.lado ? ` ${textoLado(c.lado)}` : ""}
                  </p>
                  <p className="shrink-0 text-[12px] text-ceniza first-letter:uppercase">
                    {fechaRelativa(c.creada, hoy)} · {hora(c.creada)}
                  </p>
                </div>
                <p className="text-[14px] text-ceniza">
                  {nombreTamano(c.tamano)} · {nombreEstilo(c.estilo)} · {clp(c.minimo)} a {clp(c.maximo)}
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
