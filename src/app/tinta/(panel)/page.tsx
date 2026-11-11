import Link from "next/link";
import { claseBoton } from "@/componentes/panel/Boton";
import { Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { FilaCita } from "@/componentes/panel/FilaCita";
import { Burbuja, Calendario, Campana, Cara, Flecha, Mas } from "@/componentes/panel/Iconos";
import { sql } from "@/db/conexion";
import { citasEntre, cotizacionesSinVer, saldosPendientes, sinCerrar } from "@/db/panel";
import { credencialDeEsteAparato } from "@/lib/admin/biometria";
import { clp } from "@/lib/admin/etiquetas";
import { fechaLarga, fechaRelativa, hoyChile, sumarDias } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

/**
 * Lo primero que se ve al abrir la app: qué hay hoy, qué viene esta semana y
 * quién debe plata. Todo lo demás está a un toque.
 */
export default async function PaginaHoy() {
  const yo = await operadorDelPanel();
  const hoy = hoyChile();
  const [semana, saldos, abiertas, sinVer, bio, avisos] = await Promise.all([
    citasEntre(hoy, sumarDias(hoy, 7)),
    saldosPendientes(),
    sinCerrar(),
    cotizacionesSinVer(),
    credencialDeEsteAparato(yo.id),
    sql`SELECT COUNT(*)::INT AS n FROM suscripciones_push WHERE usuario_id = ${yo.id}`.then((f) => f as Array<{ n: number }>),
  ]);

  const deHoy = semana.filter((c) => c.inicio.slice(0, 10) === hoy);
  const sesionesHoy = deHoy.filter((c) => c.tipo !== "bloqueo" && c.estado === "confirmada");
  const proximas = semana.filter((c) => c.inicio.slice(0, 10) > hoy);
  const porDia = new Map<string, typeof proximas>();
  for (const c of proximas) porDia.set(c.inicio.slice(0, 10), [...(porDia.get(c.inicio.slice(0, 10)) ?? []), c]);
  const porCobrar = saldos.reduce((t, c) => t + (c.saldo ?? 0), 0);
  // En "Por cobrar" van solo las atrasadas: las de hoy ya están arriba.
  const atrasadas = saldos.filter((c) => c.inicio.slice(0, 10) < hoy);
  const faltaPreparar = !bio || avisos[0].n === 0;

  return (
    <>
      <Encabezado etiqueta={fechaLarga(hoy)} titulo={`Hola, ${yo.nombre}`} />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Dato valor={String(sesionesHoy.length)} texto={sesionesHoy.length === 1 ? "sesión hoy" : "sesiones hoy"} />
        <Dato valor={clp(porCobrar)} texto="por cobrar" href={`${PANEL}/finanzas`} />
        <Dato valor={String(sinVer)} texto={sinVer === 1 ? "cotización nueva" : "cotizaciones nuevas"} href={`${PANEL}/cotizaciones`} brilla={sinVer > 0} />
      </div>

      {faltaPreparar && (
        <Link
          href={`${PANEL}/cuenta`}
          className="mt-4 flex items-center gap-4 rounded-2xl border border-stencil/50 bg-stencil/10 p-4 transition-colors hover:bg-stencil/15"
        >
          <span className="flex -space-x-1.5 text-stencil-claro">
            {!bio && <Cara className="size-6" />}
            {avisos[0].n === 0 && <Campana className="size-6" />}
          </span>
          <span className="flex-1 text-[14px] leading-snug">
            <span className="block font-semibold">Termina de preparar este teléfono</span>
            <span className="text-ceniza">{!bio && avisos[0].n === 0 ? "Activa Face ID o huella y los avisos." : !bio ? "Activa Face ID o huella para entrar más rápido." : "Activa los avisos para enterarte de lo nuevo."}</span>
          </span>
          <Flecha className="size-5 text-ceniza" />
        </Link>
      )}

      {abiertas.length > 0 && (
        <Tarjeta className="mt-6 border-[#f59e0b]/40">
          <TituloBloque>Sin cerrar</TituloBloque>
          <p className="-mt-1 mb-3 text-[13px] text-ceniza">Ya pasaron: marca si se hicieron o si no vino la persona.</p>
          <ul className="flex flex-col gap-2">
            {abiertas.map((c) => (
              <li key={c.id}>
                <FilaCita c={c} conFecha />
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      <Tarjeta className="mt-6">
        <TituloBloque accion={<Link href={`${PANEL}/agenda`} className="text-[13px] text-stencil-claro">Ver agenda</Link>}>Hoy</TituloBloque>
        {deHoy.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Calendario className="size-8 text-ceniza/60" />
            <p className="text-ceniza">No hay nada agendado para hoy.</p>
            <Link href={`${PANEL}/nueva?fecha=${hoy}`} className={claseBoton("linea", "min-h-11")}>
              <Mas className="size-4" /> Agendar hoy
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {deHoy.map((c) => (
              <li key={c.id}>
                <FilaCita c={c} />
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta className="mt-4">
        <TituloBloque>Esta semana</TituloBloque>
        {porDia.size === 0 ? (
          <p className="py-4 text-[14px] text-ceniza">Nada más agendado en los próximos 7 días.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {[...porDia].map(([dia, citas]) => (
              <div key={dia}>
                <p className="mb-2 text-[14px] font-semibold first-letter:uppercase">{fechaRelativa(dia, hoy)}</p>
                <ul className="flex flex-col gap-2">
                  {citas.map((c) => (
                    <li key={c.id}>
                      <FilaCita c={c} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      {atrasadas.length > 0 && (
        <Tarjeta className="mt-4">
          <TituloBloque accion={<span className="text-[13px] font-semibold text-[#fbbf24] tabular-nums">{clp(atrasadas.reduce((t, c) => t + (c.saldo ?? 0), 0))}</span>}>
            Saldos atrasados
          </TituloBloque>
          <ul className="flex flex-col gap-2">
            {atrasadas.slice(0, 6).map((c) => (
              <li key={c.id}>
                <FilaCita c={c} conFecha />
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      {sinVer > 0 && (
        <Link href={`${PANEL}/cotizaciones`} className="mt-4 flex items-center gap-3 rounded-2xl border border-linea bg-hollin/70 p-4 hover:border-stencil/60">
          <Burbuja className="size-5 text-stencil-claro" />
          <span className="flex-1 text-[14px]">
            {sinVer === 1 ? "1 persona cotizó" : `${sinVer} personas cotizaron`} en la web desde la última vez que miraste.
          </span>
          <Flecha className="size-4 text-ceniza" />
        </Link>
      )}
    </>
  );
}

function Dato({ valor, texto, href, brilla = false }: { valor: string; texto: string; href?: string; brilla?: boolean }) {
  const contenido = (
    <>
      <span className={`block truncate text-[clamp(1.25rem,5vw,1.75rem)] leading-tight font-semibold tabular-nums ${brilla ? "text-stencil-claro [text-shadow:0_0_18px_rgba(47,107,255,0.8)]" : ""}`}>{valor}</span>
      <span className="mt-0.5 block text-[12px] leading-tight text-ceniza">{texto}</span>
    </>
  );
  const clase = "rounded-2xl border border-linea bg-hollin/70 p-3 sm:p-4";
  return href ? (
    <Link href={href} className={`${clase} transition-colors hover:border-stencil/60`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}
