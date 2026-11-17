"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { fechaCorta, fechaLarga } from "@/lib/admin/fecha";
import { diaSemana, textoDuracion, type EstadoDia } from "@/lib/reservas";
import { TarjetaGracias } from "./TarjetaGracias";

/**
 * Elegir día y hora después de cotizar. Los días libres salen de la agenda de
 * verdad (/api/disponibilidad): lo tomado se ve tachado y no se puede elegir.
 * La hora queda apartada como "por confirmar" hasta que el estudio la
 * confirma con el abono por WhatsApp.
 */
export type Pedido = {
  tipo: "tatuaje" | "laser";
  zona: string;
  lado: "izq" | "der" | null;
  tamano: string;
  estilo: string;
  idea: string;
  codigo: string;
  /** "Mediano · antebrazo (lado izquierdo) · fineline" */
  resumen: string;
  /** "$50.000 a $90.000" */
  rango: string;
};

type Dia = { fecha: string; estado: EstadoDia; horas: string[] };

/** Cómo se dice cada estado a quien no ve (y en la leyenda). */
const ESTADO_TEXTO: Record<EstadoDia, string> = {
  libre: "horas libres",
  pocas: "pocas horas",
  completo: "completo",
  bloqueado: "no disponible",
  cerrado: "cerrado",
  pronto: "sin horas",
};

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const SALIDA = [0.16, 1, 0.3, 1] as const;

const campo =
  "min-h-12 w-full rounded-2xl border border-linea bg-tinta/80 px-4 text-[16px] text-piel placeholder:text-ceniza/50 focus:border-stencil focus:shadow-[0_0_0_4px_rgba(47,107,255,0.18)] focus:outline-none";

export function ReservarHora({
  pedido,
  textos,
  whatsappCon,
  cerrar,
}: {
  pedido: Pedido;
  textos: { titulo: string; nota: string };
  whatsappCon: (mensaje: string) => string;
  cerrar: () => void;
}) {
  const [dias, setDias] = useState<Dia[] | null>(null);
  const [duracion, setDuracion] = useState(0);
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<string | null>(null);

  const cargar = () =>
    fetch(`/api/disponibilidad?tipo=${pedido.tipo}&tamano=${pedido.tamano}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { dias: Dia[]; duracion: number }) => {
        setDias(j.dias);
        setDuracion(j.duracion);
      })
      .catch(() => setError("No se pudo cargar el calendario. Revisa tu conexión."));

  useEffect(() => {
    void cargar();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Los días, agrupados por mes y con huecos al principio para que el 1 caiga en su día de la semana.
  const meses = useMemo(() => {
    const porMes = new Map<string, Dia[]>();
    for (const d of dias ?? []) porMes.set(d.fecha.slice(0, 7), [...(porMes.get(d.fecha.slice(0, 7)) ?? []), d]);
    return [...porMes].map(([mes, lista]) => ({ mes, lista, huecos: diaSemana(lista[0].fecha) }));
  }, [dias]);
  const elegido = dias?.find((d) => d.fecha === fecha);
  const hayLibres = dias?.some((d) => d.horas.length > 0);

  async function pedir() {
    setError(null);
    if (!fecha || !hora) return setError("Elige día y hora.");
    if (nombre.trim().length < 2) return setError("Escribe tu nombre.");
    if (telefono.replace(/\D/g, "").length < 9) return setError("Escribe tu WhatsApp, como 9 1234 5678.");
    if (!acepta) return setError("Para pedir la hora, acepta que guardemos tu nombre y WhatsApp.");
    setEnviando(true);
    try {
      const r = await fetch("/api/reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pedido, fecha, hora, nombre, telefono, acepta }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; cuando?: string };
      if (!r.ok || !j.ok) {
        setError(j.error ?? "No se pudo pedir la hora. Vuelve a intentarlo.");
        // Si alguien la tomó justo antes, el calendario se actualiza.
        if (r.status === 409) {
          setHora(null);
          void cargar();
        }
        return;
      }
      setListo(j.cuando ?? `${fechaLarga(fecha)} a las ${hora}`);
    } catch {
      setError("No hubo conexión. Revisa la señal y vuelve a intentarlo.");
    } finally {
      setEnviando(false);
    }
  }

  const etiquetaBoton = fecha && hora ? `Pedir el ${fechaCorta(fecha)}, ${hora}` : "Pedir esta hora";
  const avisar = listo
    ? whatsappCon(`Hola, soy ${nombre.trim()}. Pedí hora para el ${listo} desde la web (${pedido.codigo}). ¿Me pasas los datos para el abono?`)
    : "";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Elegir día y hora"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-tinta/[0.88] backdrop-blur-xl sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && cerrar()}
    >
      <AnimatePresence mode="wait" initial={false}>
        {listo ? (
          <motion.div key="listo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full max-w-xl flex-col items-center px-4 pb-10 sm:pb-0">
            <TarjetaGracias
              datos={{
                codigo: pedido.codigo,
                titulo: textos.titulo,
                nota: textos.nota,
                rango: `${fechaCorta(fecha!).replace(/^\w/, (l) => l.toUpperCase())} · ${hora}`,
                extra: "",
                detalle: `${pedido.resumen} · ${pedido.rango}`,
              }}
            />
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6, ease: SALIDA }} className="flex flex-col items-center">
              <p className="mt-10 max-w-sm text-center text-[14px] leading-relaxed text-ceniza">Avísame por WhatsApp y te paso los datos para el abono. Con eso tu hora queda confirmada.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <a
                  href={avisar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="boton-cromo inline-flex min-h-12 items-center rounded-full bg-[image:var(--acero)] px-6 text-[15px] font-semibold text-tinta shadow-[0_0_30px_-8px_rgba(47,107,255,0.9)]"
                >
                  Avisar por WhatsApp
                </a>
                <button type="button" onClick={cerrar} className="inline-flex min-h-12 items-center rounded-full border border-linea px-6 text-[15px] font-semibold text-piel/85 hover:border-ceniza/60">
                  Volver a la web
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="calendario"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.5, ease: SALIDA }}
            className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] border border-linea bg-hollin shadow-[0_-30px_80px_-30px_rgba(47,107,255,0.45)] sm:rounded-[28px]"
          >
            <div className="flex items-start gap-3 border-b border-linea/80 px-5 pt-5 pb-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-gotica text-[34px] leading-none">Elige tu hora</h2>
                <p className="mt-2 truncate text-[13px] text-ceniza">
                  {duracion ? `Sesión de aprox. ${textoDuracion(duracion)} · ` : ""}
                  {pedido.resumen}
                </p>
              </div>
              <button type="button" onClick={cerrar} aria-label="Cerrar" className="grid size-11 shrink-0 place-items-center rounded-full border border-linea text-ceniza hover:text-piel">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {!dias ? (
                <div aria-hidden className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 35 }, (_, i) => (
                    <span key={i} className="aspect-square animate-pulse rounded-xl bg-linea/50" />
                  ))}
                </div>
              ) : !hayLibres ? (
                <p className="py-6 text-center text-[15px] text-ceniza">No quedan horas libres en las próximas semanas. Escríbenos por WhatsApp y lo vemos.</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {meses.map(({ mes, lista, huecos }) => (
                    <section key={mes}>
                      <h3 className="mb-2 text-[13px] font-semibold tracking-[0.12em] text-ceniza uppercase">
                        {MESES[Number(mes.slice(5)) - 1]} {mes.slice(0, 4)}
                      </h3>
                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {["L", "M", "M", "J", "V", "S", "D"].map((l, i) => (
                          <span key={i} aria-hidden className="pb-1 text-[11px] font-semibold text-ceniza/70">
                            {l}
                          </span>
                        ))}
                        {Array.from({ length: huecos }, (_, i) => (
                          <span key={`h${i}`} />
                        ))}
                        {lista.map((d) => {
                          const libre = d.horas.length > 0;
                          const activo = d.fecha === fecha;
                          const numero = Number(d.fecha.slice(8));
                          return libre ? (
                            <button
                              key={d.fecha}
                              type="button"
                              aria-pressed={activo}
                              aria-label={`${fechaLarga(d.fecha)}: ${d.horas.length} ${d.horas.length === 1 ? "hora libre" : "horas libres"}`}
                              title={`${d.horas.length} ${d.horas.length === 1 ? "hora libre" : "horas libres"}`}
                              onClick={() => {
                                setFecha(d.fecha);
                                setHora(null);
                                setError(null);
                              }}
                              className={`relative grid aspect-square place-items-center rounded-xl border text-[15px] font-semibold tabular-nums transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-95 ${
                                activo ? "border-stencil bg-stencil text-white shadow-[0_0_20px_-4px_rgba(47,107,255,0.95)]" : "border-linea bg-tinta/60 text-piel hover:border-stencil/60"
                              }`}
                            >
                              {numero}
                              <span aria-hidden className={`absolute bottom-1.5 size-1 rounded-full ${activo ? "bg-white" : d.estado === "pocas" ? "bg-[#fbbf24]" : "bg-stencil"}`} />
                            </button>
                          ) : (
                            <span
                              key={d.fecha}
                              role="img"
                              aria-label={`${fechaLarga(d.fecha)}: ${ESTADO_TEXTO[d.estado]}`}
                              title={ESTADO_TEXTO[d.estado]}
                              className={`grid aspect-square place-items-center rounded-xl text-[15px] tabular-nums ${
                                d.estado === "completo"
                                  ? "border border-sangre/30 bg-sangre/[0.07] text-[#ff8a80]/70 line-through"
                                  : d.estado === "bloqueado"
                                    ? "border border-linea bg-[repeating-linear-gradient(135deg,rgba(155,164,182,0.12)_0_2px,transparent_2px_7px)] text-ceniza/50"
                                    : "text-ceniza/30"
                              }`}
                            >
                              {numero}
                            </span>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  {/* Qué significa cada día: así se sabe al tiro cuándo hay espacio. */}
                  <ul className="-mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-ceniza">
                    <li className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-stencil" /> Libre
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#fbbf24]" /> Pocas horas
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="grid size-4 place-items-center rounded border border-sangre/30 bg-sangre/[0.07] text-[9px] text-[#ff8a80]/70 line-through">8</span> Completo
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="size-4 rounded border border-linea bg-[repeating-linear-gradient(135deg,rgba(155,164,182,0.18)_0_2px,transparent_2px_5px)]" /> No disponible
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-ceniza/40">8</span> Cerrado
                    </li>
                  </ul>

                  {elegido && (
                    <section key={elegido.fecha} className="panel-surge">
                      <h3 className="mb-2 text-[15px] font-semibold first-letter:uppercase">{fechaLarga(elegido.fecha)}</h3>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {elegido.horas.map((h) => (
                          <button
                            key={h}
                            type="button"
                            aria-pressed={h === hora}
                            onClick={() => {
                              setHora(h);
                              setError(null);
                            }}
                            className={`min-h-11 rounded-full border text-[15px] font-semibold tabular-nums transition-colors ${
                              h === hora ? "border-piel bg-piel text-tinta" : "border-linea text-piel/85 hover:border-ceniza/60"
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {hora && (
                    <section className="panel-surge flex flex-col gap-4 border-t border-linea pt-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-[14px] font-semibold">Tu nombre</span>
                          <input value={nombre} onChange={(e) => setNombre(e.target.value.slice(0, 80))} autoComplete="name" className={campo} />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-[14px] font-semibold">Tu WhatsApp</span>
                          <input value={telefono} onChange={(e) => setTelefono(e.target.value.slice(0, 20))} inputMode="tel" autoComplete="tel" placeholder="9 1234 5678" className={`${campo} tabular-nums`} />
                        </label>
                      </div>
                      <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-piel/85">
                        <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#2f6bff]" />
                        <span>
                          Acepto que el estudio guarde mi nombre y WhatsApp para agendar.{" "}
                          <a href="/privacidad" target="_blank" rel="noopener" className="font-semibold text-stencil-claro underline decoration-stencil/40 underline-offset-4">
                            Privacidad
                          </a>
                        </span>
                      </label>
                    </section>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-linea/80 bg-hollin px-5 pt-3" style={{ paddingBottom: "max(0.9rem, env(safe-area-inset-bottom))" }}>
              {error && (
                <p role="alert" className="mb-2.5 text-[14px] leading-snug font-semibold text-[#ff8a80]">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={pedir}
                disabled={enviando || !hora}
                className="boton-cromo inline-flex min-h-13 w-full items-center justify-center rounded-full bg-[image:var(--acero)] px-6 text-[16px] font-semibold text-tinta shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(47,107,255,0.8)] transition-opacity disabled:opacity-40"
              >
                {enviando ? "Pidiendo…" : etiquetaBoton}
              </button>
              <p className="mt-2 text-center text-[12px] text-ceniza">La hora queda apartada y te confirmo por WhatsApp con el abono.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
