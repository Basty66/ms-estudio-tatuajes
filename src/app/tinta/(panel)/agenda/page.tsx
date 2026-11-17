import Link from "next/link";
import { Bloquear, QuitarBloqueo } from "@/componentes/panel/Bloquear";
import { claseBoton } from "@/componentes/panel/Boton";
import { CambiarMes, Encabezado, Tarjeta } from "@/componentes/panel/Encabezado";
import { FilaCita } from "@/componentes/panel/FilaCita";
import { Atras, Flecha, Mas } from "@/componentes/panel/Iconos";
import { citasEntre, type Cita } from "@/db/panel";
import { esFecha, esMes, fechaLarga, fechaRelativa, hoyChile, nombreMes, sumarDias } from "@/lib/admin/fecha";
import { operadorDelPanel } from "@/lib/admin/panel";
import { PANEL } from "@/lib/admin/ruta";

export const dynamic = "force-dynamic";

const SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * El mes de un vistazo y el día elegido abajo (al lado, en el escritorio). Libre = sin pintar; cada día
 * ocupado lleva su número de citas además del color (el color nunca es la
 * única señal).
 */
export default async function Agenda({ searchParams }: { searchParams: Promise<{ mes?: string; dia?: string }> }) {
  await operadorDelPanel();
  const sp = await searchParams;
  const hoy = hoyChile();
  const dia = esFecha(sp.dia) ? sp.dia : hoy;
  const mes = esMes(sp.mes) ? sp.mes : dia.slice(0, 7);

  const primero = `${mes}-01`;
  const [a, m] = mes.split("-").map(Number);
  const diasDelMes = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const ultimo = `${mes}-${String(diasDelMes).padStart(2, "0")}`;
  // Lunes primero, como en Chile.
  const desfase = (new Date(Date.UTC(a, m - 1, 1)).getUTCDay() + 6) % 7;

  const citas = await citasEntre(primero, ultimo);
  const delDia = dia.slice(0, 7) === mes ? citas.filter((c) => c.inicio.slice(0, 10) === dia) : await citasEntre(dia, dia);

  const porDia = new Map<string, Cita[]>();
  for (const c of citas) {
    const k = c.inicio.slice(0, 10);
    porDia.set(k, [...(porDia.get(k) ?? []), c]);
  }

  const enlace = (d: string) => `${PANEL}/agenda?mes=${d.slice(0, 7)}&dia=${d}`;

  return (
    <>
      <Encabezado
        etiqueta="Agenda"
        titulo={<span className="capitalize">{nombreMes(mes)}</span>}
        accion={<CambiarMes mes={mes} actual={hoy.slice(0, 7)} enlace={(m) => (m === hoy.slice(0, 7) ? `${PANEL}/agenda` : `${PANEL}/agenda?mes=${m}&dia=${m}-01`)} />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] xl:items-start">
        <Tarjeta className="p-3 sm:p-4 lg:sticky lg:top-6">
          <div className="grid grid-cols-7 text-center text-[12px] font-semibold text-ceniza">
            {SEMANA.map((d, i) => (
              <span key={i} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: desfase }, (_, i) => (
              <span key={`v${i}`} />
            ))}
            {Array.from({ length: diasDelMes }, (_, i) => {
              const f = `${mes}-${String(i + 1).padStart(2, "0")}`;
              const lista = porDia.get(f) ?? [];
              const sesiones = lista.filter((c) => c.tipo !== "bloqueo" && c.estado !== "cancelada").length;
              const bloqueado = lista.some((c) => c.tipo === "bloqueo");
              const elegido = f === dia;
              const esHoy = f === hoy;
              const pasado = f < hoy;
              return (
                <Link
                  key={f}
                  href={enlace(f)}
                  aria-current={elegido ? "date" : undefined}
                  aria-label={`${fechaLarga(f)}${sesiones ? `, ${sesiones} ${sesiones === 1 ? "cita" : "citas"}` : ""}${bloqueado ? ", con bloqueo" : ""}`}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-[15px] tabular-nums transition-colors ${
                    elegido
                      ? "bg-[image:var(--acero)] font-semibold text-tinta shadow-[0_0_20px_-4px_rgba(47,107,255,0.9)]"
                      : sesiones
                        ? "bg-stencil/20 font-semibold text-piel ring-1 ring-stencil/40"
                        : bloqueado
                          ? "bg-[repeating-linear-gradient(135deg,rgb(34_42_59/0.9)_0_4px,transparent_4px_8px)] text-ceniza"
                          : pasado
                            ? "text-ceniza/50"
                            : "text-piel hover:bg-white/[0.05]"
                  }`}
                >
                  {i + 1}
                  {sesiones > 0 && (
                    <span className={`absolute bottom-1 text-[10px] leading-none font-semibold ${elegido ? "text-tinta/70" : "text-stencil-claro"}`}>
                      {sesiones}
                    </span>
                  )}
                  {esHoy && !elegido && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-stencil shadow-[0_0_8px_2px_rgba(47,107,255,0.9)]" />}
                </Link>
              );
            })}
          </div>
        </Tarjeta>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] leading-tight font-semibold first-letter:uppercase">{fechaRelativa(dia, hoy)}</h2>
              {fechaRelativa(dia, hoy) !== fechaLarga(dia) && <p className="text-[13px] text-ceniza first-letter:uppercase">{fechaLarga(dia)}</p>}
            </div>
            <Link href={enlace(sumarDias(dia, -1))} aria-label="Día anterior" className="grid size-10 place-items-center rounded-full border border-linea text-ceniza hover:text-piel">
              <Atras className="size-4" />
            </Link>
            <Link href={enlace(sumarDias(dia, 1))} aria-label="Día siguiente" className="grid size-10 place-items-center rounded-full border border-linea text-ceniza hover:text-piel">
              <Flecha className="size-4" />
            </Link>
          </div>
          {delDia.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-linea px-4 py-6 text-center text-ceniza">Día libre.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {delDia.map((c) => (
                <li key={c.id} className="flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <FilaCita c={c} />
                  </div>
                  {c.tipo === "bloqueo" && <QuitarBloqueo id={c.id} />}
                </li>
              ))}
            </ul>
          )}
          {dia >= hoy && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href={`${PANEL}/nueva?fecha=${dia}`} className={claseBoton("cromo", "min-h-11 px-3 text-[14px]")}>
                <Mas className="size-4" /> Agendar
              </Link>
              <Bloquear fecha={dia} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
