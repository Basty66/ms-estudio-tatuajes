"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fechaCorta, fechaLarga } from "@/lib/admin/fecha";
import { diaSemana, type Cupo, type EstadoDia } from "@/lib/reservas";
import { Ornamento } from "./Ornamento";
import { TarjetaGracias } from "./TarjetaGracias";

/**
 * Elegir día y cupo después de cotizar. Los cupos los define el tatuador
 * (Web → Horario y reservas) y lo libre sale de la agenda de verdad
 * (/api/disponibilidad): lo tomado se ve, pero no se puede elegir. El cupo
 * queda apartado como "por confirmar" hasta que el estudio lo confirma por
 * WhatsApp con el abono; cuánto dura y el valor final los pone el tatuador.
 *
 * Un mes a la vez y el primer día libre ya elegido: los cupos se ven al tiro,
 * debajo del mes en el teléfono y al lado en el escritorio. Cada día lleva sus
 * cupos como puntos: llenos los libres, vacíos los tomados.
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

type Dia = { fecha: string; estado: EstadoDia; cupos: Cupo[]; horas: string[] };

/** Cómo se dice cada estado a quien no ve. */
const ESTADO_TEXTO: Record<EstadoDia, string> = {
  libre: "cupos libres",
  ultimo: "queda un cupo",
  completo: "completo",
  bloqueado: "no disponible",
  cerrado: "cerrado",
  pronto: "sin cupos",
};

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const SALIDA = [0.16, 1, 0.3, 1] as const;

const campo =
  "min-h-12 w-full rounded-2xl border border-linea bg-tinta/80 px-4 text-[16px] text-piel placeholder:text-ceniza/50 focus:border-stencil focus:shadow-[0_0_0_4px_rgba(47,107,255,0.18)] focus:outline-none";

/** Mañana, mediodía, tarde o noche: así se lee más rápido un cupo. */
const franja = (hora: string) => (hora < "12:00" ? "Mañana" : hora < "14:00" ? "Mediodía" : hora < "19:00" ? "Tarde" : "Noche");

/** El visto que se dibuja al marcar (cupo elegido, casilla aceptada). */
function Visto({ marcado, className }: { marcado: boolean; className: string }) {
  return (
    <span aria-hidden data-marcada={marcado ? "si" : "no"} className={`grid shrink-0 place-items-center border transition-[background-color,border-color,box-shadow] duration-200 ${className}`}>
      <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path className="visto-trazo" d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

/** Los cupos de un día como puntos: llenos los libres, vacíos los tomados. Hasta cuatro. */
function Puntos({ cupos, activo, completo }: { cupos: Cupo[]; activo: boolean; completo: boolean }) {
  return (
    <span aria-hidden className="absolute bottom-[17%] left-1/2 flex -translate-x-1/2 gap-[3px]">
      {cupos.slice(0, 4).map((c, i) => (
        <span
          key={i}
          className={`size-[5px] rounded-full ${
            c.libre
              ? activo
                ? "bg-white"
                : "bg-stencil-claro shadow-[0_0_6px_rgba(47,107,255,0.95)]"
              : activo
                ? "border border-white/55"
                : completo
                  ? "border border-[#ff8a80]/55"
                  : "border border-ceniza/45"
          }`}
        />
      ))}
    </span>
  );
}

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
  // Después de tocar un día o un cupo, lo que sigue se trae a la vista.
  const seguir = useRef<"horas" | "datos" | null>(null);

  const cargar = () =>
    fetch("/api/disponibilidad", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { dias: Dia[] }) => {
        setDias(j.dias);
        // La primera vez queda elegido el primer día con cupos, y su mes a la vista.
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
  // los cupos hacia abajo); lo anterior a hoy en la semana va apagado. Los demás parten el 1.
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
  const hoy = dias?.[0]?.fecha;
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

  const etiquetaBoton = fecha && hora ? `Pedir el ${fechaCorta(fecha)}, ${hora}` : "Elige un cupo";
  const avisar = listo
    ? whatsappCon(`Hola, soy ${nombre.trim()}. Pedí hora para el ${listo} desde la web (${pedido.codigo}). ¿Me pasas los datos para el abono?`)
    : "";
  const libres = elegido?.horas.length ?? 0;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Elegir día y hora"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-tinta/[0.9] backdrop-blur-xl sm:items-center sm:p-6"
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
                detalle: `${pedido.resumen} · estimado ${pedido.rango}`,
              }}
            />
            <motion.div initial={{ opacity: 0, y: reducir ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6, ease: SALIDA }} className="flex flex-col items-center">
              <p className="mt-10 max-w-sm text-center text-[14px] leading-relaxed text-ceniza">
                Avísame por WhatsApp y te paso los datos para el abono. Ahí vemos tu diseño, cuánto dura la sesión y el valor final.
              </p>
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
            className="relative flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[32px] border border-linea/90 bg-hollin shadow-[0_-30px_90px_-30px_rgba(47,107,255,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[32px] lg:max-w-[980px]"
          >
            {/* Luz de lámpara y filo cromado arriba, como en la portada. */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(70%_100%_at_30%_0%,rgba(47,107,255,0.2),transparent_70%)]" />
            <div aria-hidden className="pointer-events-none absolute inset-x-12 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(207,220,255,0.8),transparent)]" />
            <Ornamento tipo="estrella" className="top-7 right-[4.75rem] w-8 opacity-40 sm:right-24 sm:w-10" flotar={6} ritmo={7} />

            <header className="relative px-5 pt-3 pb-4 sm:pt-7 sm:pb-5 lg:px-8">
              <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-linea sm:hidden" />
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-ceniza uppercase">
                    <span className="size-1.5 rounded-full bg-stencil shadow-[0_0_8px_rgba(47,107,255,0.95)]" />
                    Reserva{pedido.codigo.includes("·") ? "" : ` · ${pedido.codigo}`}
                  </p>
                  <h2 className="mt-2.5 font-gotica text-[40px] leading-[0.95] sm:text-[48px]">Elige tu hora</h2>
                  <span aria-hidden data-prendido="si" className="neon mt-3 block w-24" />
                </div>
                <button type="button" onClick={cerrar} aria-label="Cerrar" className="grid size-11 shrink-0 place-items-center rounded-full border border-linea bg-tinta/40 text-ceniza transition-colors hover:border-ceniza/60 hover:text-piel">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
              {/* En el teléfono, una sola línea: lo de arriba no debe empujar los cupos fuera de la pantalla. */}
              <div className="mt-4 flex gap-1.5 text-[12px] sm:flex-wrap">
                <span className="min-w-0 truncate rounded-full border border-linea bg-tinta/60 px-3 py-1.5 text-piel/85">{pedido.resumen}</span>
                <span className="shrink-0 rounded-full border border-stencil/40 bg-stencil/10 px-3 py-1.5 text-piel/90 tabular-nums">
                  <span className="max-sm:hidden">Estimado </span>
                  {pedido.rango}
                </span>
              </div>
            </header>

            <div className="relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain border-t border-linea/70 px-5 pt-4 pb-5 sm:pt-5 lg:px-8 lg:py-7">
              {!dias ? (
                <div aria-hidden className="grid grid-cols-7 gap-1.5 lg:w-1/2 lg:pr-8">
                  {Array.from({ length: 28 }, (_, i) => (
                    <span key={i} className="aspect-square animate-pulse rounded-2xl bg-linea/40 motion-reduce:animate-none" />
                  ))}
                </div>
              ) : !hayLibres || !visible ? (
                <p className="py-6 text-center text-[15px] text-ceniza">No quedan cupos libres en las próximas semanas. Escríbenos por WhatsApp y lo vemos.</p>
              ) : (
                <div className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-0">
                  <section aria-label="Calendario" className="lg:sticky lg:top-0 lg:self-start lg:pr-8">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 aria-live="polite" className="flex items-baseline gap-2.5">
                        <span className="font-gotica text-[32px] leading-none">{MESES[Number(visible.mes.slice(5)) - 1]}</span>
                        <span className="text-[13px] text-ceniza tabular-nums">{visible.mes.slice(0, 4)}</span>
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
                            className="grid size-10 place-items-center rounded-full border border-linea bg-tinta/40 text-piel/85 transition-[border-color,box-shadow] hover:border-stencil/60 hover:shadow-[0_0_18px_-6px_rgba(47,107,255,0.9)] disabled:pointer-events-none disabled:opacity-25"
                          >
                            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d={trazo as string} />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {SEMANA.map((l) => (
                        <span key={l} aria-hidden className="pb-2 text-[10px] font-semibold tracking-[0.14em] text-ceniza/70 uppercase">
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
                            const esHoy = d.fecha === hoy;
                            return d.horas.length > 0 ? (
                              <button
                                key={d.fecha}
                                type="button"
                                aria-pressed={activo}
                                aria-current={esHoy ? "date" : undefined}
                                aria-label={`${fechaLarga(d.fecha)}: ${d.horas.length} ${d.horas.length === 1 ? "cupo libre" : "cupos libres"}`}
                                title={`${d.horas.length} ${d.horas.length === 1 ? "cupo libre" : "cupos libres"}`}
                                onClick={() => {
                                  seguir.current = "horas";
                                  setFecha(d.fecha);
                                  setHora(null);
                                  setError(null);
                                }}
                                className={`relative grid aspect-square place-items-center rounded-2xl border text-[16px] font-semibold tabular-nums transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-95 ${
                                  activo
                                    ? "scale-[1.04] border-stencil bg-stencil text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_12px_32px_-8px_rgba(47,107,255,0.95)]"
                                    : "border-linea bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0))] text-piel hover:border-stencil/60 hover:shadow-[0_0_22px_-8px_rgba(47,107,255,0.9)]"
                                }`}
                              >
                                <span className="-mt-1.5">{numero}</span>
                                <Puntos cupos={d.cupos} activo={activo} completo={false} />
                              </button>
                            ) : (
                              <span
                                key={d.fecha}
                                role="img"
                                aria-current={esHoy ? "date" : undefined}
                                aria-label={`${fechaLarga(d.fecha)}: ${ESTADO_TEXTO[d.estado]}`}
                                title={ESTADO_TEXTO[d.estado]}
                                className={`relative grid aspect-square place-items-center rounded-2xl text-[15px] tabular-nums ${
                                  d.estado === "completo"
                                    ? "border border-sangre/25 bg-sangre/[0.06] text-[#ff8a80]/70"
                                    : d.estado === "bloqueado"
                                      ? "border border-linea bg-[repeating-linear-gradient(135deg,rgba(155,164,182,0.12)_0_2px,transparent_2px_7px)] text-ceniza/50"
                                      : "text-ceniza/30"
                                }`}
                              >
                                <span className={d.estado === "completo" || esHoy ? "-mt-1.5" : ""}>{numero}</span>
                                {d.estado === "completo" && <Puntos cupos={d.cupos} activo={false} completo />}
                                {esHoy && d.estado !== "completo" && <span className="absolute bottom-[12%] text-[9px] font-semibold tracking-[0.12em] text-stencil-claro/80 uppercase">hoy</span>}
                              </span>
                            );
                          })}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Qué significa cada día: así se sabe al tiro dónde hay espacio. */}
                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-ceniza">
                      <li className="flex items-center gap-2">
                        <span className="size-[6px] rounded-full bg-stencil-claro shadow-[0_0_6px_rgba(47,107,255,0.95)]" /> Cupo libre
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="size-[6px] rounded-full border border-ceniza/60" /> Tomado
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="size-3.5 rounded-[5px] border border-linea bg-[repeating-linear-gradient(135deg,rgba(155,164,182,0.2)_0_2px,transparent_2px_5px)]" /> No disponible
                      </li>
                    </ul>
                  </section>

                  <div className="flex flex-col gap-6 lg:border-l lg:border-linea/70 lg:pl-8">
                    <section ref={horasRef} aria-live="polite" className="scroll-mt-4 scroll-mb-4">
                      {elegido && libres > 0 ? (
                        <div key={elegido.fecha}>
                          <div className="panel-surge flex items-end gap-3.5">
                            <span aria-hidden className="texto-cromo font-gotica text-[58px] leading-[0.78] sm:text-[72px]">
                              {Number(elegido.fecha.slice(8))}
                            </span>
                            <span className="min-w-0 pb-1">
                              <span className="block text-[18px] font-semibold first-letter:uppercase">{fechaLarga(elegido.fecha).split(" ")[0]}</span>
                              <span className="block text-[13px] text-ceniza">
                                <span className="sr-only">{fechaLarga(elegido.fecha)} · </span>
                                de {MESES[Number(elegido.fecha.slice(5, 7)) - 1].toLowerCase()} · {libres} de {elegido.cupos.length} {elegido.cupos.length === 1 ? "cupo libre" : "cupos libres"}
                              </span>
                            </span>
                          </div>
                          <div className="mt-5 grid gap-2">
                            {elegido.cupos.map((c, i) => {
                              const activo = c.hora === hora;
                              return (
                                <button
                                  key={c.hora}
                                  type="button"
                                  disabled={!c.libre}
                                  aria-pressed={c.libre ? activo : undefined}
                                  aria-label={`${c.hora}, ${franja(c.hora).toLowerCase()}: ${c.libre ? "libre" : "tomado"}`}
                                  onClick={() => {
                                    seguir.current = "datos";
                                    setHora(c.hora);
                                    setError(null);
                                  }}
                                  style={{ animationDelay: `${80 + i * 60}ms` }}
                                  className={`panel-surge group relative flex min-h-16 items-center gap-4 overflow-hidden rounded-2xl border px-4 text-left transition-[border-color,background-color,box-shadow] duration-200 ${
                                    !c.libre
                                      ? "cursor-not-allowed border-linea/60 bg-[repeating-linear-gradient(135deg,rgba(155,164,182,0.06)_0_2px,transparent_2px_8px)]"
                                      : activo
                                        ? "border-stencil bg-stencil/[0.13] shadow-[0_0_0_1px_rgba(47,107,255,0.55),0_14px_40px_-14px_rgba(47,107,255,0.95)]"
                                        : "border-linea bg-tinta/50 hover:border-stencil/55 hover:bg-tinta/80"
                                  }`}
                                >
                                  <span className={`text-[26px] font-semibold tracking-[-0.03em] tabular-nums ${c.libre ? "" : "text-ceniza/45 line-through decoration-1"}`}>{c.hora}</span>
                                  <span className="min-w-0 flex-1">
                                    <span className={`block text-[13px] font-semibold ${c.libre ? "text-piel/85" : "text-ceniza/55"}`}>{franja(c.hora)}</span>
                                    <span className={`block text-[12px] ${activo ? "text-stencil-claro" : "text-ceniza"}`}>{!c.libre ? "Tomado" : activo ? "Elegido" : "Libre"}</span>
                                  </span>
                                  {c.libre && (
                                    <Visto
                                      marcado={activo}
                                      className={`size-7 rounded-full ${activo ? "border-stencil bg-stencil shadow-[0_0_16px_-2px_rgba(47,107,255,0.95)]" : "border-ceniza/50 group-hover:border-stencil/70"}`}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-4 flex gap-2.5 text-[13px] leading-snug text-ceniza">
                            <svg viewBox="0 0 24 24" className="mt-px size-4 shrink-0 text-stencil-claro" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden>
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 11v5M12 8h.01" />
                            </svg>
                            Cuánto dura la sesión y el valor final te los confirmo al ver tu diseño.
                          </p>
                        </div>
                      ) : (
                        <p className="py-4 text-[14px] text-ceniza">
                          {elegido ? "Ese día se acaba de llenar. Elige otro con cupos libres." : "Toca un día con cupos libres para verlos."}
                        </p>
                      )}
                    </section>

                    {hora && (
                      <section ref={datosRef} className="panel-surge flex scroll-mb-4 flex-col gap-4 rounded-3xl border border-linea bg-tinta/40 p-4 sm:p-5">
                        <p className="text-[11px] font-semibold tracking-[0.22em] text-ceniza uppercase">Tus datos</p>
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
                          <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="peer sr-only" />
                          <Visto
                            marcado={acepta}
                            className={`mt-px size-6 rounded-lg peer-focus-visible:shadow-[0_0_0_4px_rgba(47,107,255,0.3)] ${acepta ? "border-stencil bg-stencil shadow-[0_0_16px_-4px_rgba(47,107,255,0.9)]" : "border-ceniza/60"}`}
                          />
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

            <div className="relative border-t border-linea/80 bg-hollin px-5 pt-3 lg:px-8 lg:pt-4" style={{ paddingBottom: "max(0.9rem, env(safe-area-inset-bottom))" }}>
              {error && (
                <p role="alert" className="mb-2.5 text-[14px] leading-snug font-semibold text-[#ff8a80]">
                  {error}
                </p>
              )}
              <div className="lg:flex lg:items-center lg:justify-between lg:gap-6">
                <p className="hidden text-[13px] leading-snug text-ceniza lg:block">
                  {fecha && hora && <span className="block font-semibold text-piel first-letter:uppercase">{`${fechaLarga(fecha)}, ${hora}`}</span>}
                  El cupo queda apartado y te confirmo por WhatsApp con el abono.
                </p>
                <button
                  type="button"
                  onClick={pedir}
                  disabled={enviando || !hora}
                  className="boton-cromo inline-flex min-h-13 w-full items-center justify-center gap-2.5 rounded-full bg-[image:var(--acero)] px-6 text-[16px] font-semibold text-tinta shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(47,107,255,0.8)] transition-opacity disabled:opacity-40 lg:w-auto lg:min-w-80 lg:shrink-0"
                >
                  {enviando ? "Pidiendo…" : etiquetaBoton}
                  {hora && !enviando && (
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-2 text-center text-[12px] text-ceniza lg:hidden">Queda apartado y te confirmo por WhatsApp con el abono.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
