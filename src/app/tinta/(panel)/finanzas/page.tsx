import Link from "next/link";
import { CambiarMes, Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { FilaCita } from "@/componentes/panel/FilaCita";
import { BorrarGasto, NuevoGasto } from "@/componentes/panel/NuevoGasto";
import { pagosDelMes, resumenMes, saldosPendientes, saldosPorVenir } from "@/db/panel";
import { CATEGORIAS, clp } from "@/lib/admin/etiquetas";
import { esMes, fechaCorta, hoyChile, nombreMes } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

/** "14 nov" */
const diaMes = (fecha: string) => fechaCorta(fecha).split(" ").slice(1).join(" ");

/**
 * La plata del mes. Los ingresos son los pagos anotados (lo que de verdad
 * entró, con su fecha), no el valor de las citas: una sesión de $200.000 con
 * $50.000 de abono es $50.000 este mes.
 *
 * "Por cobrar" no depende del mes: es lo que se debe hoy.
 */
export default async function Finanzas({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await operadorDelPanel();
  const hoy = hoyChile();
  const sp = await searchParams;
  const mes = esMes(sp.mes) ? sp.mes : hoy.slice(0, 7);
  const [r, pagos, deudas, porVenir] = await Promise.all([resumenMes(mes), pagosDelMes(mes), saldosPendientes(), saldosPorVenir()]);
  const totalGastos = r.gastos.reduce((t, g) => t + g.monto, 0);
  const resultado = r.ingresos.total - totalGastos;
  const porCategoria = CATEGORIAS.map(([id, nombre]) => ({ nombre, total: r.gastos.filter((g) => g.categoria === id).reduce((t, g) => t + g.monto, 0) })).filter((c) => c.total > 0);
  const porCobrar = deudas.reduce((t, c) => t + (c.saldo ?? 0), 0);
  const mayor = Math.max(r.ingresos.total, totalGastos, 1);

  return (
    <>
      <Encabezado
        volver={`${PANEL}/mas`}
        etiqueta="Finanzas"
        titulo={<span className="capitalize">{nombreMes(mes)}</span>}
        accion={<CambiarMes mes={mes} actual={hoy.slice(0, 7)} enlace={(m) => `${PANEL}/finanzas${m === hoy.slice(0, 7) ? "" : `?mes=${m}`}`} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta>
            <p className="text-[13px] text-ceniza">Resultado del mes</p>
            <p className={`mt-1 text-[clamp(2rem,9vw,2.8rem)] leading-none font-semibold tabular-nums ${resultado < 0 ? "text-[#ff8a80]" : ""}`}>{clp(resultado)}</p>
            <div className="mt-5 flex flex-col gap-3">
              <Barra texto="Entró" monto={r.ingresos.total} mayor={mayor} color="bg-[#34d399]" detalle={`Transferencia ${clp(r.ingresos.transferencia)} · Efectivo ${clp(r.ingresos.efectivo)}`} />
              <Barra texto="Salió" monto={totalGastos} mayor={mayor} color="bg-[#ff8a80]" detalle={`${r.gastos.length} ${r.gastos.length === 1 ? "gasto" : "gastos"}`} />
            </div>
          </Tarjeta>

          <Tarjeta className={porCobrar ? "border-[#f59e0b]/30" : ""}>
            <TituloBloque accion={<span className={`text-[15px] font-semibold tabular-nums ${porCobrar ? "text-[#fbbf24]" : ""}`}>{clp(porCobrar)}</span>}>Por cobrar</TituloBloque>
            {deudas.length === 0 ? (
              <p className="text-[14px] text-ceniza">Nadie debe nada de hoy ni de antes.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {deudas.map((c) => (
                  <li key={c.id}>
                    <FilaCita c={c} conFecha />
                  </li>
                ))}
              </ul>
            )}
            {porVenir > 0 && <p className="mt-3 text-[13px] text-ceniza">Más {clp(porVenir)} en saldos de citas que vienen, a cobrar el día de cada sesión.</p>}
          </Tarjeta>
        </div>

        <div className="flex flex-col gap-4 lg:gap-5">
          <Tarjeta>
            <TituloBloque accion={<span className="text-[13px] text-ceniza tabular-nums">{clp(r.ingresos.total)}</span>}>Ingresos</TituloBloque>
            {pagos.length === 0 ? (
              <p className="text-[14px] text-ceniza">No hay pagos anotados este mes. Se anotan desde cada cita.</p>
            ) : (
              <ul>
                {pagos.map((p) => (
                  <li key={p.id}>
                    <Link href={`${PANEL}/cita/${p.cita_id}`} className="flex items-center gap-3 border-b border-linea/60 py-2.5 last:border-0 hover:text-stencil-claro">
                      <span className="w-12 shrink-0 text-[13px] text-ceniza capitalize tabular-nums">{diaMes(p.fecha)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">{p.cliente}</span>
                        <span className="block text-[12px] text-ceniza capitalize">
                          {p.tipo} · {p.medio}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-[#6ee7b7] tabular-nums">{clp(p.monto)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>

          <Tarjeta>
            <TituloBloque accion={<span className="text-[13px] text-ceniza tabular-nums">{clp(totalGastos)}</span>}>Gastos</TituloBloque>
            <NuevoGasto hoy={hoy} />
            {porCategoria.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {porCategoria.map((c) => (
                  <li key={c.nombre} className="rounded-full border border-linea px-3 py-1 text-[13px]">
                    {c.nombre} <span className="font-semibold tabular-nums">{clp(c.total)}</span>
                  </li>
                ))}
              </ul>
            )}
            {r.gastos.length > 0 && (
              <ul className="mt-3">
                {r.gastos.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 border-b border-linea/60 py-2.5 last:border-0">
                    <span className="w-12 shrink-0 text-[13px] text-ceniza capitalize tabular-nums">{diaMes(g.fecha)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] first-letter:uppercase">{g.descripcion ?? g.categoria}</span>
                      <span className="block text-[12px] text-ceniza capitalize">{g.categoria}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{clp(g.monto)}</span>
                    <BorrarGasto id={g.id} />
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      </div>
    </>
  );
}

/** Entró o salió, con una barra proporcional al mayor de los dos. */
function Barra({ texto, monto, mayor, color, detalle }: { texto: string; monto: number; mayor: number; color: string; detalle: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px]">{texto}</span>
        <span className="text-[17px] font-semibold tabular-nums">{clp(monto)}</span>
      </div>
      <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-linea">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(monto / mayor) * 100}%` }} />
      </div>
      <p className="mt-1 text-[12px] text-ceniza">{detalle}</p>
    </div>
  );
}
