import Link from "next/link";
import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { FilaCita } from "@/componentes/panel/FilaCita";
import { Atras, Flecha } from "@/componentes/panel/Iconos";
import { BorrarGasto, NuevoGasto } from "@/componentes/panel/NuevoGasto";
import { pagosDelMes, resumenMes, saldosPendientes, saldosPorVenir } from "@/db/panel";
import { CATEGORIAS, clp } from "@/lib/admin/etiquetas";
import { esMes, fechaCorta, hoyChile, nombreMes } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

function mesVecino(mes: string, paso: number): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + paso, 1)).toISOString().slice(0, 7);
}

/**
 * La plata del mes. Los ingresos son los pagos anotados (lo que de verdad
 * entró, con su fecha), no el valor de las citas: una sesión de $200.000 con
 * $50.000 de abono es $50.000 este mes.
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
  const atrasado = deudas.reduce((t, c) => t + (c.saldo ?? 0), 0);

  return (
    <>
      <Encabezado
        volver={`${PANEL}/mas`}
        etiqueta="Finanzas"
        titulo={<span className="capitalize">{nombreMes(mes)}</span>}
        accion={
          <div className="flex gap-1">
            <Link href={`${PANEL}/finanzas?mes=${mesVecino(mes, -1)}`} aria-label="Mes anterior" className="grid size-11 place-items-center rounded-full border border-linea text-ceniza hover:text-piel">
              <Atras className="size-5" />
            </Link>
            <Link href={`${PANEL}/finanzas?mes=${mesVecino(mes, 1)}`} aria-label="Mes siguiente" className="grid size-11 place-items-center rounded-full border border-linea text-ceniza hover:text-piel">
              <Flecha className="size-5" />
            </Link>
          </div>
        }
      />

      <Tarjeta>
        <p className="text-[13px] text-ceniza">Resultado del mes</p>
        <p className={`mt-1 text-[clamp(2rem,9vw,2.8rem)] leading-none font-semibold tabular-nums ${resultado < 0 ? "text-[#ff8a80]" : ""}`}>{clp(resultado)}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-linea bg-tinta/50 p-3">
            <p className="text-[12px] text-ceniza">Entró</p>
            <p className="text-[18px] font-semibold text-[#6ee7b7] tabular-nums">{clp(r.ingresos.total)}</p>
            <p className="mt-1 text-[12px] text-ceniza">
              Transf. {clp(r.ingresos.transferencia)} · Efect. {clp(r.ingresos.efectivo)}
            </p>
          </div>
          <div className="rounded-2xl border border-linea bg-tinta/50 p-3">
            <p className="text-[12px] text-ceniza">Salió</p>
            <p className="text-[18px] font-semibold text-[#ff8a80] tabular-nums">{clp(totalGastos)}</p>
            <p className="mt-1 text-[12px] text-ceniza">
              {r.gastos.length} {r.gastos.length === 1 ? "gasto" : "gastos"}
            </p>
          </div>
        </div>
      </Tarjeta>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/[0.06] p-3">
          <p className="text-[12px] text-ceniza">Por cobrar (hoy y atrasado)</p>
          <p className="text-[18px] font-semibold text-[#fbbf24] tabular-nums">{clp(atrasado)}</p>
        </div>
        <div className="rounded-2xl border border-linea bg-hollin/70 p-3">
          <p className="text-[12px] text-ceniza">Saldos de citas agendadas</p>
          <p className="text-[18px] font-semibold tabular-nums">{clp(porVenir)}</p>
        </div>
      </div>

      {deudas.length > 0 && (
        <Tarjeta className="mt-4">
          <TituloBloque>Quién debe</TituloBloque>
          <ul className="flex flex-col gap-2">
            {deudas.map((c) => (
              <li key={c.id}>
                <FilaCita c={c} conFecha />
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      <Tarjeta className="mt-4">
        <TituloBloque>Gastos</TituloBloque>
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
                <span className="w-14 shrink-0 text-[13px] text-ceniza capitalize">{fechaCorta(g.fecha).split(" ").slice(1).join(" ")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] capitalize">{g.descripcion ?? g.categoria}</span>
                  <span className="block text-[12px] text-ceniza capitalize">
                    {g.categoria} · {g.anotado_por}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{clp(g.monto)}</span>
                <BorrarGasto id={g.id} />
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta className="mt-4">
        <TituloBloque>Ingresos</TituloBloque>
        {pagos.length === 0 ? (
          <p className="text-[14px] text-ceniza">No hay pagos anotados este mes.</p>
        ) : (
          <ul>
            {pagos.map((p) => (
              <li key={p.id}>
                <Link href={`${PANEL}/cita/${p.cita_id}`} className="flex items-center gap-3 border-b border-linea/60 py-2.5 last:border-0 hover:text-stencil-claro">
                  <span className="w-14 shrink-0 text-[13px] text-ceniza capitalize">{fechaCorta(p.fecha).split(" ").slice(1).join(" ")}</span>
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
    </>
  );
}
