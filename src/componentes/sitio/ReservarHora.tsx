"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fechaCorta, fechaLarga, sumarMinutos } from "@/lib/admin/fecha";
import { diaSemana, textoDuracion, type EstadoDia } from "@/lib/reservas";
import { TarjetaGracias } from "./TarjetaGracias";

/**
 * Elegir día y hora después de cotizar. Los días libres salen de la agenda de
 * verdad (/api/disponibilidad): lo tomado se ve tachado y no se puede elegir.
 * La hora queda apartada como "por confirmar" hasta que el estudio la
 * confirma con el abono por WhatsApp.
 *
 * Un mes a la vez y el primer día libre ya elegido: las horas se ven al tiro,
 * debajo del mes en el teléfono y al lado en el escritorio.
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
  const [mes, setMes] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [haciaAtras, setHaciaAtras] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<string | null>(null);
  const reducir = Boolean(useReducedMotion());
  const horasRef = useRef<HTMLElement>(null);
  const datosRef = useRef<HTMLElement>(null);
  // Después de tocar un día o una hora, lo que sigue se trae a la vista.
  const seguir = useRef<"horas" | "datos" | null>(null);

  const cargar = () =>
    fetch(`/api/disponibilidad?tipo=${pedido.tipo}&tamano=${pedido.tamano}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { dias: Dia[]; duracion: number }) => {
        setDias(j.dias);
        setDuracion(j.duracion);
        // La primera vez queda elegido el primer día con horas, y su mes a la vista.
        const primero = j.dias.find((d) => d.horas.length > 0);
        if (primero) {
          setFecha((f) => f ?? primero.fecha);
          setMes((m) => m ?? primero.fecha.slice(0, 7));
        }
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

  // Los días, agrupados por mes. El mes de hoy parte en esta semana (las pasadas no sirven y empujan
  // las horas hacia abajo); lo anterior a hoy en la semana va apagado. Los demás parten el 1.
  const meses = useMemo(() => {
    const porMes = new Map<string, Map<number, Dia>>();
    for (const d of dias ?? []) {
      const k = d.fecha.slice(0, 7);
      porMes.set(k, (porMes.get(k) ?? new Map()).set(Number(d.fecha.slice(8)), d));
    }
    const fechaDe = (mes: string, n: number) => `${mes}-${String(n).padStart(2, "0")}`;
    return [...porMes].map(([mes, lista]) => {
      const primero = Math.min(...lista.keys());
      const desde = Math.max(1, primero - diaSemana(fechaDe(mes, primero)));
      return { mes, lista, desde, huecos: diaSemana(fechaDe(mes, desde)), hasta: Math.max(...lista.keys()) };
    });
  }, [dias]);
  const indice = Math.max(0, meses.findIndex((m) => m.mes === mes));
  const visible = meses[indice];
  const elegido = dias?.find((d) => d.fecha === fecha);
  const hayLibres = dias?.some((d) => d.horas.length > 0);

  useEffect(() => {
    const destino = seguir.current === "horas" ? horasRef.current : seguir.current === "datos" ? datosRef.current : null;
    seguir.current = null;
    destino?.scrollIntoView({ block: "nearest", behavior: reducir ? "auto" : "smooth" });
  }, [fecha, hora, reducir]);

  // El mes que sale y el que entra se mueven hacia el mismo lado; `custom` le avisa al que sale.
  const deslizar = {
    entra: (atras: boolean) => ({ opacity: 0, x: reducir ? 0 : atras ? -28 : 28 }),
    quieto: { opacity: 1, x: 0 },
    sale: (atras: boolean) => ({ opacity: 0, x: reducir ? 0 : atras ? 28 : -28 }),
  };

  const irAMes = (paso: number) => {
    const m = meses[indice + paso];
    if (!m) return;
    setHaciaAtras(paso < 0);
    setMes(m.mes);
  };

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
            <motion.div initial={{ opacity: 0, y: reducir ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6, ease: SALIDA }} className="flex flex-col items-center">
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
            initial={{ y: reducir ? 0 : 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reducir ? 0 : 30, opacity: 0 }}
            transition={{ duration: 0.5, ease: SALIDA }}
            className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] border border-linea bg-hollin shadow-[0_-30px_80px_-30px_rgba(47,107,255,0.45)] sm:rounded-[28px] lg:max-w-[880px]"
          >
            <div className="flex items-start gap-3 border-b border-linea/80 px-5 pt-5 pb-4 lg:px-7">
              <div className="min-w-0 flex-1">
                <h2 className="font-gotica text-[34px] leading-none">Elige tu hora</h2>
                <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-ceniza">
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

            <div className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-5 lg:px-7 lg:py-6">
              {!dias ? (
                <div aria-hidden className="grid grid-cols-7 gap-1.5 lg:w-1/2">
                  {Array.from({ length: 35 }, (_, i) => (
                    <span key={i} className="aspect-square animate-pulse rounded-xl bg-linea/50" />
                  ))}
                </div>
              ) : !hayLibres || !visible ? (
                <p className="py-6 text-center text-[15px] text-ceniza">No quedan horas libres en las próximas semanas. Escríbenos por WhatsApp y lo vemos.</p>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-0">
                  <section aria-label="Calendario" className="lg:pr-7">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 aria-live="polite" className="text-[15px] font-semibold">
                        {MESES[Number(visible.mes.slice(5)) - 1]} <span className="text-ceniza">{visible.mes.slice(0, 4)}</span>
                      </h3>
                      <div className="flex gap-2">
                        {[
                          [-1, "Mes anterior", "M15 6l-6 6 6 6"],
                          [1, "Mes siguiente", "M9 6l6 6-6 6"],
                        ].map(([paso, texto, trazo]) => (
                          <button
                            key={texto}
                            type="button"
                            aria-label={texto as string}
                            disabled={!meses[indice + (paso as number)]}
                            onClick={() => irAMes(paso as number)}
                            className="grid size-10 place-items-center rounded-full border border-linea text-piel/85 transition-colors hover:border-stencil/60 disabled:pointer-events-none disabled:opacity-25"
                          >
                            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d={trazo as string} />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {["L", "M", "M", "J", "V", "S", "D"].map((l, i) => (
                        <span key={i} aria-hidden className="pb-1 text-[11px] font-semibold text-ceniza/70">
                          {l}
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <AnimatePresence mode="popLayout" initial={false} custom={haciaAtras}>
                        <motion.div
                          key={visible.mes}
                          custom={haciaAtras}
                          variants={deslizar}
                          initial="entra"
                          animate="quieto"
                          exit="sale"
                          transition={{ duration: 0.28, ease: SALIDA }}
                          className="grid grid-cols-7 gap-1.5 text-center"
                        >
                          {Array.from({ length: visible.huecos }, (_, i) => (
                            <span key={`h${i}`} />
                          ))}
                          {Array.from({ length: visible.hasta - visible.desde + 1 }, (_, i) => {
                            const numero = visible.desde + i;
                            const d = visible.lista.get(numero);
                            // Antes de hoy: no se ofrece.
                            if (!d)
                              return (
                                <span key={numero} aria-hidden className="grid aspect-square place-items-center text-[15px] text-ceniza/20 tabular-nums">
                                  {numero}
                                </span>
                              );
                            const activo = d.fecha === fecha;
                            return d.horas.length > 0 ? (
                              <button
                                key={d.fecha}
                                type="button"
                                aria-pressed={activo}
                                aria-label={`${fechaLarga(d.fecha)}: ${d.horas.length} ${d.horas.length === 1 ? "hora libre" : "horas libres"}`}
                                title={`${d.horas.length} ${d.horas.length === 1 ? "hora libre" : "horas libres"}`}
                                onClick={() => {
                                  seguir.current = "horas";
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
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Qué significa cada día: así se sabe al tiro cuándo hay espacio. */}
                    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-ceniza">
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
                  </section>

                  <div className="flex flex-col gap-6 lg:border-l lg:border-linea/80 lg:pl-7">
                    <section ref={horasRef} aria-live="polite" className="scroll-mt-4 scroll-mb-4">
                      {elegido && elegido.horas.length > 0 ? (
                        <div key={elegido.fecha} className="panel-surge">
                          <h3 className="text-[15px] font-semibold first-letter:uppercase">{fechaLarga(elegido.fecha)}</h3>
                          <p className="mt-0.5 mb-3 text-[13px] text-ceniza">
                            {elegido.horas.length} {elegido.horas.length === 1 ? "hora libre" : "horas libres"} · elige a qué hora empezar
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {elegido.horas.map((h) => (
                              <button
                                key={h}
                                type="button"
                                aria-pressed={h === hora}
                                onClick={() => {
                                  seguir.current = "datos";
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
                          {hora && duracion > 0 && (
                            <p className="mt-3 text-[13px] text-ceniza">
                              Sesión de {hora} a {sumarMinutos(`${elegido.fecha}T${hora}`, duracion).slice(11)} aprox.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="py-4 text-[14px] text-ceniza">
                          {elegido ? "Ese día se acaba de llenar. Elige otro con punto azul." : "Toca un día con punto azul para ver sus horas."}
                        </p>
                      )}
                    </section>

                    {hora && (
                      <section ref={datosRef} className="panel-surge flex scroll-mb-4 flex-col gap-4 border-t border-linea pt-5">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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
                </div>
              )}
            </div>

            <div className="border-t border-linea/80 bg-hollin px-5 pt-3 lg:px-7" style={{ paddingBottom: "max(0.9rem, env(safe-area-inset-bottom))" }}>
              {error && (
                <p role="alert" className="mb-2.5 text-[14px] leading-snug font-semibold text-[#ff8a80]">
                  {error}
                </p>
              )}
              <div className="lg:flex lg:items-center lg:justify-between lg:gap-6">
                <p className="hidden text-[13px] text-ceniza lg:block">La hora queda apartada y te confirmo por WhatsApp con el abono.</p>
                <button
                  type="button"
                  onClick={pedir}
                  disabled={enviando || !hora}
                  className="boton-cromo inline-flex min-h-13 w-full items-center justify-center rounded-full bg-[image:var(--acero)] px-6 text-[16px] font-semibold text-tinta shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(47,107,255,0.8)] transition-opacity disabled:opacity-40 lg:w-auto lg:min-w-80 lg:shrink-0"
                >
                  {enviando ? "Pidiendo…" : etiquetaBoton}
                </button>
              </div>
              <p className="mt-2 text-center text-[12px] text-ceniza lg:hidden">La hora queda apartada y te confirmo por WhatsApp con el abono.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
