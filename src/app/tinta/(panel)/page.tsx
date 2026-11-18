import Link from "next/link";
import { CerrarRapido } from "@/componentes/panel/AccionesCita";
import { claseBoton } from "@/componentes/panel/Boton";
import { BotonSeguimiento } from "@/componentes/panel/Consentimiento";
import { Cifra, Encabezado, Tarjeta, TituloBloque } from "@/componentes/panel/Encabezado";
import { FilaCita, type Marca } from "@/componentes/panel/FilaCita";
import { Calendario, Campana, Cara, Flecha, Mas } from "@/componentes/panel/Iconos";
import { sql } from "@/db/conexion";
import { ETAPAS, seguimientosDeHoy } from "@/db/consentimientos";
import { leerContenido } from "@/db/contenido";
import { citasEntre, cotizacionesSinVer, porConfirmar, saldosPendientes, sinCerrar, type Cita } from "@/db/panel";
import { credencialDeEsteAparato } from "@/lib/admin/biometria";
import { clp, clpCorto } from "@/lib/admin/etiquetas";
import { ahoraChile, fechaLarga, fechaRelativa, hoyChile, sumarDias } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";
import { rellenar } from "@/lib/contenido";

export const dynamic = "force-dynamic";

/**
 * Lo primero que se ve al abrir la app: lo de hoy, lo que quedó pendiente y
 * lo que viene. Cada cita aparece una sola vez: lo de hoy se cierra en "Hoy",
 * en "Por resolver" queda solo lo de días anteriores y las horas pedidas desde
 * la web esperan en "Por confirmar".
 *
 * En el teléfono va todo en una columna (Hoy → Por resolver → Próximos días);
 * en el escritorio, lo pendiente pasa a la derecha.
 */
export default async function PaginaHoy() {
  const yo = await operadorDelPanel();
  const hoy = hoyChile();
  const ahora = ahoraChile();
  const [semana, saldos, abiertas, sinVer, bio, avisos, escribir, { mensajes }, pedidas] = await Promise.all([
    citasEntre(hoy, sumarDias(hoy, 7)),
    saldosPendientes(),
    sinCerrar(),
    cotizacionesSinVer(),
    credencialDeEsteAparato(yo.id),
    sql`SELECT COUNT(*)::INT AS n FROM suscripciones_push WHERE usuario_id = ${yo.id}`.then((f) => (f as Array<{ n: number }>)[0].n),
    seguimientosDeHoy(hoy),
    leerContenido(),
    porConfirmar(),
  ]);

  // Las horas pedidas desde la web van solo en "Por confirmar".
  const agendadas = semana.filter((c) => c.estado !== "solicitada");
  const deHoy = agendadas.filter((c) => c.inicio.slice(0, 10) === hoy);
  const vivas = deHoy.filter((c) => c.tipo !== "bloqueo" && c.estado === "confirmada");
  const enCurso = vivas.find((c) => c.inicio <= ahora && ahora < c.fin);
  const siguiente = vivas.find((c) => c.inicio > ahora);
  const marcaDe = (c: Cita): Marca | undefined =>
    c === enCurso ? "en-curso" : c === siguiente ? "siguiente" : c.estado === "confirmada" && c.tipo !== "bloqueo" && c.fin <= ahora ? "sin-cerrar" : undefined;

  const porDia = new Map<string, Cita[]>();
  for (const c of agendadas.filter((c) => c.inicio.slice(0, 10) > hoy)) {
    const k = c.inicio.slice(0, 10);
    porDia.set(k, [...(porDia.get(k) ?? []), c]);
  }

  // Lo de días anteriores: sin cerrar o con plata pendiente, una vez cada una.
  const pendientes = new Map<number, Cita>();
  for (const c of [...abiertas, ...saldos]) if (c.inicio.slice(0, 10) < hoy) pendientes.set(c.id, c);
  const porResolver = [...pendientes.values()].sort((a, b) => b.inicio.localeCompare(a.inicio));
  const atrasado = porResolver.reduce((t, c) => t + (c.saldo ?? 0), 0);
  const porCobrar = saldos.reduce((t, c) => t + (c.saldo ?? 0), 0);

  return (
    <>
      <Encabezado etiqueta={fechaLarga(hoy)} titulo={`Hola, ${yo.nombre}`} />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Cifra texto={vivas.length === 1 ? "sesión hoy" : "sesiones hoy"} valor={vivas.length} />
        <Cifra texto="por cobrar" valor={clpCorto(porCobrar)} tono={porCobrar ? "ambar" : "neutro"} href={`${PANEL}/finanzas`} />
        <Cifra texto={sinVer === 1 ? "cotización nueva" : "cotizaciones nuevas"} valor={sinVer} tono={sinVer ? "azul" : "neutro"} href={`${PANEL}/cotizaciones`} />
      </div>

      <div className="mt-4 flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] xl:items-start xl:gap-5">
        {/* En el teléfono y la tablet las dos columnas se deshacen y manda el `order`. */}
        <div className="contents xl:flex xl:flex-col xl:gap-5">
          <Tarjeta className="order-2 xl:order-none">
            <TituloBloque accion={<Link href={`${PANEL}/agenda`} className="text-[13px] text-stencil-claro">Agenda</Link>}>Hoy</TituloBloque>
            {deHoy.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Calendario className="size-8 text-ceniza/60" />
                <p className="text-ceniza">Día libre.</p>
                <Link href={`${PANEL}/nueva?fecha=${hoy}`} className={claseBoton("linea", "min-h-11")}>
                  <Mas className="size-4" /> Agendar hoy
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {deHoy.map((c) => (
                  <li key={c.id}>
                    <FilaCita c={c} marca={marcaDe(c)} />
                    {marcaDe(c) === "sin-cerrar" && <CerrarRapido id={c.id} />}
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>

          <Tarjeta className="order-4 xl:order-none">
            <TituloBloque>Próximos días</TituloBloque>
            {porDia.size === 0 ? (
              <p className="py-2 text-[14px] text-ceniza">Nada agendado en los próximos 7 días.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {[...porDia].map(([dia, citas]) => (
                  <div key={dia}>
                    <Link href={`${PANEL}/agenda?dia=${dia}`} className="mb-2 inline-block text-[14px] font-semibold first-letter:uppercase hover:text-stencil-claro">
                      {fechaRelativa(dia, hoy)}
                    </Link>
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
        </div>

        <div className="contents xl:flex xl:flex-col xl:gap-5">
          {(!bio || avisos === 0) && (
            <Link
              href={`${PANEL}/cuenta`}
              className="order-1 flex items-center gap-3 rounded-2xl border border-stencil/50 bg-stencil/10 px-4 py-3 transition-colors hover:bg-stencil/15 xl:order-none"
            >
              <span className="flex shrink-0 -space-x-1.5 text-stencil-claro">
                {!bio && <Cara className="size-5" />}
                {avisos === 0 && <Campana className="size-5" />}
              </span>
              <span className="min-w-0 flex-1 text-[14px] leading-snug">
                <span className="font-semibold">Prepara este teléfono: </span>
                <span className="text-ceniza">{!bio && avisos === 0 ? "Face ID o huella y avisos." : !bio ? "Face ID o huella." : "avisos."}</span>
              </span>
              <Flecha className="size-4 shrink-0 text-ceniza" />
            </Link>
          )}

          {pedidas.length > 0 && (
            <Tarjeta className="order-1 border-dashed border-[#f59e0b]/50 xl:order-none">
              <TituloBloque accion={<span className="text-[13px] font-semibold text-[#fbbf24] tabular-nums">{pedidas.length}</span>}>Por confirmar</TituloBloque>
              <p className="-mt-1 mb-3 text-[13px] text-ceniza">Horas pedidas desde la web. Confírmalas con el precio y el abono.</p>
              <ul className="flex flex-col gap-2">
                {pedidas.map((c) => (
                  <li key={c.id}>
                    <FilaCita c={c} conFecha />
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}

          {porResolver.length > 0 && (
            <Tarjeta className="order-3 border-[#f59e0b]/30 xl:order-none">
              <TituloBloque accion={atrasado > 0 && <span className="text-[13px] font-semibold text-[#fbbf24] tabular-nums">{clp(atrasado)}</span>}>
                Por resolver
              </TituloBloque>
              <ul className="flex flex-col gap-3">
                {porResolver.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <FilaCita c={c} conFecha marca={c.estado === "confirmada" ? "sin-cerrar" : undefined} />
                    {c.estado === "confirmada" && <CerrarRapido id={c.id} />}
                  </li>
                ))}
              </ul>
              {porResolver.length > 8 && (
                <Link href={`${PANEL}/finanzas`} className="mt-3 block text-center text-[13px] text-stencil-claro">
                  Ver las {porResolver.length} en Finanzas
                </Link>
              )}
            </Tarjeta>
          )}

          {escribir.length > 0 && (
            <Tarjeta className="order-3 xl:order-none">
              <TituloBloque>Mensajes de hoy</TituloBloque>
              <ul className="flex flex-col">
                {escribir.map((e) => (
                  <li key={`${e.cita_id}-${e.etapa}`} className="flex min-h-14 items-center gap-3 border-b border-linea/60 py-2 last:border-0">
                    <Link href={`${PANEL}/cita/${e.cita_id}`} className="min-w-0 flex-1 hover:text-stencil-claro">
                      <span className="block truncate font-semibold">{e.nombre}</span>
                      <span className="block truncate text-[13px] text-ceniza">
                        {ETAPAS.find((x) => x.id === e.etapa)?.laser ? "Láser · " : ""}
                        {ETAPAS.find((x) => x.id === e.etapa)?.texto} · {fechaRelativa(e.inicio.slice(0, 10), hoy)}
                      </span>
                    </Link>
                    <BotonSeguimiento
                      citaId={e.cita_id}
                      etapa={e.etapa}
                      href={`https://wa.me/${e.telefono}?text=${encodeURIComponent(rellenar(mensajes[e.etapa], { nombre: e.nombre.split(" ")[0], cuidados: "https://tatuajes-azure.vercel.app/#cuidados" }))}`}
                      enviado={false}
                      toca
                    >
                      Mandar
                    </BotonSeguimiento>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}
        </div>
      </div>
    </>
  );
}
