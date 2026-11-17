import Link from "next/link";
import { notFound } from "next/navigation";
import { claseBoton } from "@/componentes/panel/Boton";
import { BorrarDatosCliente } from "@/componentes/panel/Consentimiento";
import { EditarCliente } from "@/componentes/panel/EditarCliente";
import { Cifra, Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { FilaCita } from "@/componentes/panel/FilaCita";
import { Documento, Mas, Telefono } from "@/componentes/panel/Iconos";
import { IconoWhatsapp } from "@/componentes/sitio/WhatsappFlotante";
import { consentimientosDeCliente } from "@/db/consentimientos";
import { citasDeCliente, cliente as leerCliente } from "@/db/panel";
import { clp, TIPO } from "@/lib/admin/etiquetas";
import { fechaCorta } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { formatearTelefono } from "@/lib/admin/telefono";

export const dynamic = "force-dynamic";

/** La ficha: contacto, notas, lo que ha pagado y todas sus citas. Lo que el cuaderno nunca pudo dar. */
export default async function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  await operadorDelPanel();
  const c = await leerCliente(Number((await params).id) || 0);
  if (!c) notFound();
  const [citas, consentimientos] = await Promise.all([citasDeCliente(c.id), consentimientosDeCliente(c.id)]);
  const borrado = c.nombre === "Datos borrados" && !c.telefono;
  const hechas = citas.filter((x) => x.estado === "completada");
  const pagado = citas.reduce((t, x) => t + x.pagado, 0);
  const debe = citas.filter((x) => x.estado !== "cancelada").reduce((t, x) => t + (x.saldo ?? 0), 0);

  return (
    <>
      <Encabezado volver={`${PANEL}/clientes`} titulo={c.nombre} accion={<EditarCliente c={c} />} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            <Cifra texto={hechas.length === 1 ? "sesión" : "sesiones"} valor={hechas.length} />
            <Cifra texto="pagado" valor={clp(pagado)} />
            <Cifra texto="debe" valor={clp(debe)} tono={debe ? "ambar" : "neutro"} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Link href={`${PANEL}/nueva?cliente=${c.id}`} className={claseBoton("cromo", "min-h-11 px-2 text-[14px]")}>
              <Mas className="size-4" /> Agendar
            </Link>
            {c.telefono ? (
              <>
                <a href={`https://wa.me/${c.telefono}`} target="_blank" rel="noopener noreferrer" className={claseBoton("linea", "min-h-11 px-2 text-[14px]")}>
                  <IconoWhatsapp className="size-4 shrink-0" /> WhatsApp
                </a>
                <a href={`tel:+${c.telefono}`} className={claseBoton("linea", "min-h-11 px-2 text-[14px]")}>
                  <Telefono className="size-4 shrink-0" /> Llamar
                </a>
              </>
            ) : (
              <p className="col-span-2 self-center text-[13px] text-ceniza">Sin teléfono: agrégalo con Editar.</p>
            )}
          </div>

          <Tarjeta>
            <TituloBloque>Datos</TituloBloque>
            <dl className="grid grid-cols-2 gap-3 text-[15px]">
              <div>
                <dt className="text-[12px] text-ceniza">WhatsApp</dt>
                <dd>{c.telefono ? formatearTelefono(c.telefono) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-ceniza">Instagram</dt>
                <dd className="truncate">
                  {c.instagram ? (
                    <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer" className="text-stencil-claro">
                      @{c.instagram}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[12px] text-ceniza">Notas</dt>
                <dd className={`whitespace-pre-line ${c.notas ? "" : "text-ceniza"}`}>{c.notas ?? "Sin notas. Anota con Editar lo que haya que recordar."}</dd>
              </div>
            </dl>
          </Tarjeta>

          {consentimientos.length > 0 && (
            <Tarjeta>
              <TituloBloque>Consentimientos</TituloBloque>
              <ul className="flex flex-col">
                {consentimientos.map((k) => (
                  <li key={k.id} className="flex min-h-14 items-center gap-3 border-b border-linea/60 py-2 last:border-0">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold first-letter:uppercase">
                        {TIPO[k.tipo]} · {fechaCorta(k.inicio)}
                      </span>
                      <span className={`block truncate text-[13px] ${k.alertas.length ? "text-[#ff8a80]" : "text-ceniza"}`}>
                        {k.alertas.length ? k.alertas.join(" · ") : "Sin alertas de salud"}
                      </span>
                    </span>
                    <a href={`${PANEL}/consentimiento/${k.id}`} target="_blank" rel="noopener noreferrer" aria-label="Ver PDF" className="grid size-10 shrink-0 place-items-center rounded-full border border-linea text-stencil-claro hover:border-stencil">
                      <Documento className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}

        </div>

        <Tarjeta>
          <TituloBloque>Historial</TituloBloque>
          {citas.length === 0 ? (
            <p className="text-[14px] text-ceniza">Sin citas todavía.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {citas.map((x) => (
                <li key={x.id}>
                  <FilaCita c={x} conFecha sinNombre />
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <div className="mt-8 lg:max-w-md">
        {borrado ? (
          <p className="text-[13px] text-ceniza">Sus datos personales ya se borraron. Quedan solo sus citas y pagos.</p>
        ) : (
          <BorrarDatosCliente clienteId={c.id} nombre={c.nombre.split(" ")[0]} />
        )}
      </div>
    </>
  );
}
