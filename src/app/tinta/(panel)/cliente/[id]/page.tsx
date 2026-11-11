import Link from "next/link";
import { notFound } from "next/navigation";
import { claseBoton } from "@/componentes/panel/Boton";
import { EditarCliente } from "@/componentes/panel/EditarCliente";
import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { FilaCita } from "@/componentes/panel/FilaCita";
import { Mas, Telefono } from "@/componentes/panel/Iconos";
import { IconoWhatsapp } from "@/componentes/sitio/WhatsappFlotante";
import { citasDeCliente, cliente as leerCliente } from "@/db/panel";
import { clp } from "@/lib/admin/etiquetas";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { formatearTelefono } from "@/lib/admin/telefono";

export const dynamic = "force-dynamic";

/** La ficha: contacto, notas, lo que ha pagado y todas sus citas. Lo que el cuaderno nunca pudo dar. */
export default async function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  await operadorDelPanel();
  const c = await leerCliente(Number((await params).id) || 0);
  if (!c) notFound();
  const citas = await citasDeCliente(c.id);
  const hechas = citas.filter((x) => x.estado === "completada");
  const pagado = citas.reduce((t, x) => t + x.pagado, 0);
  const debe = citas.filter((x) => x.estado !== "cancelada").reduce((t, x) => t + (x.saldo ?? 0), 0);

  return (
    <>
      <Encabezado volver={`${PANEL}/clientes`} etiqueta="Cliente" titulo={c.nombre} accion={<EditarCliente c={c} />} />

      <div className="grid grid-cols-3 gap-2">
        <Cifra t="Sesiones" v={String(hechas.length)} />
        <Cifra t="Pagado" v={clp(pagado)} />
        <Cifra t="Debe" v={clp(debe)} color={debe ? "text-[#fbbf24]" : ""} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href={`${PANEL}/nueva?cliente=${c.id}`} className={claseBoton("cromo", "min-h-11 px-2 text-[14px]")}>
          <Mas className="size-4" /> Agendar
        </Link>
        {c.telefono ? (
          <>
            <a href={`https://wa.me/${c.telefono}`} target="_blank" rel="noopener noreferrer" className={claseBoton("linea", "min-h-11 px-2 text-[14px]")}>
              <IconoWhatsapp className="size-4" /> WhatsApp
            </a>
            <a href={`tel:+${c.telefono}`} className={claseBoton("linea", "min-h-11 px-2 text-[14px]")}>
              <Telefono className="size-4" /> Llamar
            </a>
          </>
        ) : (
          <p className="col-span-2 self-center text-[13px] text-ceniza">Sin teléfono: agrégalo con Editar.</p>
        )}
      </div>

      <Tarjeta className="mt-4">
        <TituloBloque>Datos</TituloBloque>
        <dl className="grid grid-cols-2 gap-3 text-[15px]">
          <div>
            <dt className="text-[12px] text-ceniza">WhatsApp</dt>
            <dd>{c.telefono ? formatearTelefono(c.telefono) : "—"}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-ceniza">Instagram</dt>
            <dd>
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
            <dd className="whitespace-pre-line">{c.notas ?? "—"}</dd>
          </div>
        </dl>
      </Tarjeta>

      <Tarjeta className="mt-4">
        <TituloBloque>Historial</TituloBloque>
        {citas.length === 0 ? (
          <p className="text-[14px] text-ceniza">Sin citas todavía.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {citas.map((x) => (
              <li key={x.id}>
                <FilaCita c={x} conFecha />
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </>
  );
}

function Cifra({ t, v, color = "" }: { t: string; v: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-linea bg-hollin/70 p-3">
      <p className="text-[12px] text-ceniza">{t}</p>
      <p className={`truncate text-[18px] font-semibold tabular-nums ${color}`}>{v}</p>
    </div>
  );
}
