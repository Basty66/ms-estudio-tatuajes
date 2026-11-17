"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { buscarClientes, crearCita, editarCita, ocupado, type DatosCita } from "@/app/tinta/_acciones/panel";
import { clp } from "@/lib/admin/etiquetas";
import { duracionTexto, fechaCorta, hora, sumarDias, sumarMinutos } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";
import { formatearTelefono } from "@/lib/admin/telefono";
import { ESTILOS_PRECIO, estimar, TAMANOS, ZONAS, type EstiloPrecio, type Precios, type Tamano, type Zona } from "@/lib/precios";
import { Boton } from "./Boton";
import { Buscar, Cerrar } from "./Iconos";

type ClienteElegido = { id: number; nombre: string; telefono: string | null };
type Ocupado = { id: number; inicio: string; fin: string; quien: string };

const HORAS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
const DURACIONES = [60, 120, 180, 240, 300, 360];
const SIN_LADO = ["cuello", "nuca", "abdomen", "espalda-alta", "espalda-baja"];
const DIAS_TIRA = 21;

export const campo =
  "min-h-12 w-full min-w-0 rounded-2xl border border-linea bg-tinta/70 px-4 text-[16px] text-piel placeholder:text-ceniza/60 focus:border-stencil focus:shadow-[0_0_24px_-8px_rgba(47,107,255,0.9)] focus:outline-none";

export function Chip({ activo, children, className = "", ...resto }: React.ButtonHTMLAttributes<HTMLButtonElement> & { activo: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      {...resto}
      className={`min-h-10 shrink-0 rounded-full border px-3.5 text-[14px] font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        activo ? "border-stencil bg-stencil/20 text-piel shadow-[0_0_18px_-6px_rgba(47,107,255,0.9)]" : "border-linea text-ceniza hover:text-piel"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Etiqueta({ children, nota }: { children: React.ReactNode; nota?: React.ReactNode }) {
  return (
    <span className="mb-2 flex items-baseline justify-between gap-3 text-[12px] font-semibold tracking-[0.14em] text-ceniza uppercase">
      {children}
      {nota && <span className="text-[12px] font-normal tracking-normal normal-case">{nota}</span>}
    </span>
  );
}

/** Un paso del formulario: número, título y contenido, en su propia tarjeta. */
function Paso({ n, titulo, opcional = false, children }: { n: number; titulo: string; opcional?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 rounded-3xl border border-linea bg-hollin/70 p-4 sm:p-5">
      <legend className="sr-only">{titulo}</legend>
      <p aria-hidden className="mb-4 flex items-center gap-3 text-[15px] font-semibold">
        <span className="grid size-7 place-items-center rounded-full border border-stencil font-gotica text-[16px] leading-none shadow-[0_0_12px_-2px_rgba(47,107,255,0.9)]">{n}</span>
        {titulo}
        {opcional && <span className="ml-auto text-[12px] font-normal text-ceniza">Opcional</span>}
      </p>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </fieldset>
  );
}

/** Fila de chips que se desliza de lado sin ensanchar la página. */
function Deslizable({ children }: { children: React.ReactNode }) {
  return <div className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden">{children}</div>;
}

const choca = (a: { inicio: string; fin: string }, b: { inicio: string; fin: string }) => a.inicio < b.fin && b.inicio < a.fin;

/**
 * Agendar o editar una cita, en cuatro pasos: quién, cuándo, qué y cuánto.
 * Pensado para el teléfono en una mano mientras se habla por WhatsApp: lo
 * común es un toque (días, horas y duraciones típicas) y lo raro se escribe.
 *
 * Las horas que chocan con otra cita del día se ven tachadas antes de
 * elegirlas. Es una ayuda: lo que de verdad impide la doble reserva es el
 * constraint de la base.
 */
export function FormularioCita({
  hoy,
  fechaInicial,
  cliente: clienteInicial,
  edicion,
  precios,
  desde,
}: {
  precios: Precios;
  hoy: string;
  fechaInicial: string;
  cliente?: ClienteElegido | null;
  edicion?: { id: number; datos: DatosCita & { cliente: string } };
  /** Agendar desde una cotización de la web: llega con lo cotizado y queda unida a la cita. */
  desde?: { id: number; codigo: string | null; rango: string; datos: Partial<DatosCita> };
}) {
  const router = useRouter();
  const d: Partial<DatosCita> | undefined = edicion?.datos ?? desde?.datos;
  const [cliente, setCliente] = useState<ClienteElegido | null>(clienteInicial ?? null);
  const [busqueda, setBusqueda] = useState("");
  const [sugeridos, setSugeridos] = useState<ClienteElegido[]>([]);
  const [telefono, setTelefono] = useState("");
  const [tipo, setTipo] = useState(d?.tipo ?? "tatuaje");
  const [fecha, setFecha] = useState(d?.fecha ?? fechaInicial);
  const [horaElegida, setHora] = useState(d?.hora ?? "");
  const [otraHora, setOtraHora] = useState(Boolean(d?.hora && !HORAS.includes(d.hora)));
  const [duracion, setDuracion] = useState(d?.duracion ?? 180);
  const [zona, setZona] = useState<string>(d?.zona ?? "");
  const [lado, setLado] = useState<string>(d?.lado ?? "");
  const [tamano, setTamano] = useState<string>(d?.tamano ?? "");
  const [estilo, setEstilo] = useState<string>(d?.estilo ?? "");
  const [descripcion, setDescripcion] = useState(d?.descripcion ?? "");
  const [precio, setPrecio] = useState(d?.precio != null ? String(d.precio) : "");
  const [abono, setAbono] = useState("");
  const [medioAbono, setMedioAbono] = useState("transferencia");
  const [notas, setNotas] = useState(d?.notas ?? "");
  const [ocupados, setOcupados] = useState<Ocupado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const pedido = useRef(0);

  // Autocompletar: si ya vino antes, no se vuelve a escribir su teléfono.
  useEffect(() => {
    if (cliente || busqueda.trim().length < 2) return;
    const n = ++pedido.current;
    const t = setTimeout(async () => {
      const r = await buscarClientes(busqueda);
      if (n === pedido.current) setSugeridos(r);
    }, 220);
    return () => clearTimeout(t);
  }, [busqueda, cliente]);

  // Lo ocupado de las próximas semanas, para marcar días y horas.
  const finTira = sumarDias(hoy, DIAS_TIRA - 1);
  useEffect(() => {
    const desde = fecha < hoy ? fecha : hoy;
    const hasta = fecha > finTira ? fecha : finTira;
    void ocupado(desde, hasta).then((r) => setOcupados(edicion ? r.filter((o) => o.id !== edicion.id) : r));
  }, [fecha, hoy, finTira, edicion]);

  const delDia = ocupados.filter((o) => o.inicio.slice(0, 10) === fecha);
  const libre = (h: string) => {
    const inicio = `${fecha}T${h}`;
    return !delDia.some((o) => choca(o, { inicio, fin: sumarMinutos(inicio, duracion) }));
  };
  const tira = Array.from({ length: DIAS_TIRA }, (_, i) => sumarDias(hoy, i));
  const fechaEnTira = tira.includes(fecha);

  const conLado = Boolean(zona) && !SIN_LADO.includes(zona);
  const rango = useMemo(
    () => (zona && tamano && estilo ? estimar(precios, tamano as Tamano, estilo as EstiloPrecio, zona as Zona) : null),
    [precios, zona, tamano, estilo],
  );
  const inicio = horaElegida ? `${fecha}T${horaElegida}` : null;
  const resumen = inicio ? `${fechaCorta(fecha)} · ${horaElegida} a ${hora(sumarMinutos(inicio, duracion))}` : `${fechaCorta(fecha)} · elige la hora`;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!edicion && !cliente && busqueda.trim().length < 2) return setError("Escribe el nombre del cliente.");
    if (!horaElegida) return setError("Elige la hora.");
    setGuardando(true);
    const datos: DatosCita = {
      clienteId: cliente?.id ?? null,
      nombre: cliente ? undefined : busqueda,
      telefono: cliente ? undefined : telefono,
      tipo,
      fecha,
      hora: horaElegida,
      duracion,
      zona: zona || null,
      lado: conLado ? lado || null : null,
      tamano: tamano || null,
      estilo: estilo || null,
      descripcion,
      precio: precio.trim() === "" ? null : Number(precio.replace(/\D/g, "")),
      notas,
      abono: abono.trim() === "" ? null : Number(abono.replace(/\D/g, "")),
      medioAbono,
      cotizacion: desde?.id ?? null,
    };
    try {
      let id: number;
      if (edicion) {
        const r = await editarCita(edicion.id, datos);
        if (!r.ok) return setError(r.error);
        id = edicion.id;
      } else {
        const r = await crearCita(datos);
        if (!r.ok) return setError(r.error);
        id = r.id;
      }
      router.push(`${PANEL}/cita/${id}`);
      router.refresh();
    } catch {
      setError("No hubo conexión. Revisa la señal y vuelve a probar.");
    } finally {
      setGuardando(false);
    }
  }

  let n = 0;
  return (
    <form onSubmit={guardar} className="flex min-w-0 flex-col gap-4 lg:max-w-2xl">
      {desde && (
        <p className="rounded-2xl border border-stencil/50 bg-stencil/10 px-4 py-3 text-[14px] leading-snug">
          <span className="font-semibold">Desde la cotización {desde.codigo ?? "de la web"}</span>
          <span className="text-ceniza"> · {desde.rango}. Ya viene lo que cotizó: falta quién, cuándo y el valor.</span>
        </p>
      )}
      {/* ---------- 1. Cliente ---------- */}
      {!edicion && (
        <Paso n={++n} titulo="Cliente">
          {cliente ? (
            <div className="flex items-center gap-3 rounded-2xl border border-stencil/60 bg-stencil/10 p-3 pl-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2f6bff,#0c1f6b)] font-gotica text-lg">
                {cliente.nombre.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{cliente.nombre}</span>
                <span className="block text-[13px] text-ceniza">{cliente.telefono ? formatearTelefono(cliente.telefono) : "Sin teléfono"}</span>
              </span>
              <button type="button" aria-label="Elegir otro cliente" onClick={() => setCliente(null)} className="grid size-10 place-items-center rounded-full text-ceniza hover:text-piel">
                <Cerrar className="size-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="relative">
                <span className="sr-only">Nombre del cliente</span>
                <Buscar className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ceniza" />
                <input
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    if (e.target.value.trim().length < 2) setSugeridos([]);
                  }}
                  placeholder="Nombre (busca si ya vino antes)"
                  autoComplete="off"
                  className={`${campo} pl-12`}
                />
              </label>
              {sugeridos.length > 0 && (
                <ul className="overflow-hidden rounded-2xl border border-linea bg-tinta">
                  {sugeridos.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCliente(s);
                          setSugeridos([]);
                        }}
                        className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-linea/60 px-4 text-left last:border-0 hover:bg-white/[0.04]"
                      >
                        <span className="truncate font-semibold">{s.nombre}</span>
                        <span className="shrink-0 text-[13px] text-ceniza">{s.telefono ? formatearTelefono(s.telefono) : ""}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {busqueda.trim().length >= 2 && (
                <label>
                  <span className="sr-only">WhatsApp</span>
                  <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" autoComplete="off" placeholder="WhatsApp: 9 1234 5678 (opcional)" className={campo} />
                </label>
              )}
            </div>
          )}
        </Paso>
      )}

      {/* ---------- 2. Cuándo ---------- */}
      <Paso n={++n} titulo="Cuándo">
        <div className="min-w-0">
          <Etiqueta
            nota={
              // El selector nativo, transparente encima del texto: tocarlo abre
              // el calendario del teléfono, en iPhone y en Android.
              <label className="relative inline-flex min-h-8 items-center px-1 text-stencil-claro">
                Otra fecha
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => e.target.value && setFecha(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0 [color-scheme:dark]"
                  aria-label="Elegir otra fecha"
                />
              </label>
            }
          >
            Día
          </Etiqueta>
          <Deslizable>
            {!fechaEnTira && (
              <DiaChip fecha={fecha} hoy={hoy} activo citas={delDia.length} onClick={() => undefined} />
            )}
            {tira.map((f) => (
              <DiaChip
                key={f}
                fecha={f}
                hoy={hoy}
                activo={f === fecha}
                citas={ocupados.filter((o) => o.inicio.slice(0, 10) === f).length}
                onClick={() => setFecha(f)}
              />
            ))}
          </Deslizable>
        </div>

        <div className="min-w-0">
          <Etiqueta nota={duracionTexto(duracion)}>Duración</Etiqueta>
          <Deslizable>
            {DURACIONES.map((m) => (
              <Chip key={m} activo={duracion === m} onClick={() => setDuracion(m)}>
                {duracionTexto(m)}
              </Chip>
            ))}
            <Chip activo={!DURACIONES.includes(duracion)} onClick={() => setDuracion(90)}>
              Otra
            </Chip>
          </Deslizable>
          {!DURACIONES.includes(duracion) && (
            <label className="mt-2 flex items-center gap-3">
              <input type="number" min={15} max={720} step={15} value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} className={`${campo} w-28`} />
              <span className="text-[14px] text-ceniza">minutos</span>
            </label>
          )}
        </div>

        <div className="min-w-0">
          <Etiqueta nota={delDia.length ? `${delDia.length} ${delDia.length === 1 ? "cosa" : "cosas"} ese día` : "Día libre"}>Hora</Etiqueta>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {HORAS.map((h) => {
              const puede = libre(h);
              return (
                <Chip key={h} activo={!otraHora && horaElegida === h} disabled={!puede} onClick={() => {
                    setHora(h);
                    setOtraHora(false);
                  }} className={puede ? "" : "line-through"}>
                  {h}
                </Chip>
              );
            })}
            <Chip activo={otraHora} onClick={() => setOtraHora(true)}>
              Otra
            </Chip>
          </div>
          {otraHora && (
            <input type="time" value={horaElegida} onChange={(e) => setHora(e.target.value)} step={900} className={`${campo} mt-2 [color-scheme:dark]`} aria-label="Hora" />
          )}
          {delDia.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-[13px] text-ceniza">
              {delDia.map((o) => (
                <li key={o.id} className="flex gap-2">
                  <span className="tabular-nums">
                    {hora(o.inicio)}–{hora(o.fin)}
                  </span>
                  <span className="truncate">{o.quien}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Paso>

      {/* ---------- 3. El tatuaje ---------- */}
      <Paso n={++n} titulo="El tatuaje" opcional>
        <div className="flex flex-wrap gap-2">
          {[
            ["tatuaje", "Tatuaje"],
            ["laser", "Láser"],
            ["retoque", "Retoque"],
          ].map(([v, t]) => (
            <Chip key={v} activo={tipo === v} onClick={() => setTipo(v)}>
              {t}
            </Chip>
          ))}
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <label className="min-w-0">
            <Etiqueta>Zona</Etiqueta>
            <select value={zona} onChange={(e) => setZona(e.target.value)} className={`${campo} [color-scheme:dark]`}>
              <option value="">Sin definir</option>
              {[...ZONAS]
                .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
                .map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
            </select>
          </label>
          <div role="group" aria-label="Lado" className="flex h-12 items-center gap-1 rounded-2xl border border-linea p-1">
            {[
              ["izq", "Izq."],
              ["der", "Der."],
            ].map(([v, t]) => (
              <button
                key={v}
                type="button"
                aria-pressed={lado === v}
                disabled={!conLado}
                onClick={() => setLado(lado === v ? "" : v)}
                className={`h-full rounded-xl px-3 text-[14px] font-semibold transition-colors disabled:opacity-30 ${lado === v && conLado ? "bg-stencil/25 text-piel" : "text-ceniza"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3">
          <label className="min-w-0">
            <Etiqueta>Estilo</Etiqueta>
            <select value={estilo} onChange={(e) => setEstilo(e.target.value)} className={`${campo} [color-scheme:dark]`}>
              <option value="">Sin definir</option>
              {ESTILOS_PRECIO.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <Etiqueta>Tamaño</Etiqueta>
            <select value={tamano} onChange={(e) => setTamano(e.target.value)} className={`${campo} [color-scheme:dark]`}>
              <option value="">Sin definir</option>
              {TAMANOS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <Etiqueta>Diseño</Etiqueta>
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej.: lettering “Everything” en cursiva" className={campo} />
        </label>
      </Paso>

      {/* ---------- 4. Pago ---------- */}
      <Paso n={++n} titulo="Pago" opcional>
        <label>
          <Etiqueta nota={rango ? `En la web: ${clp(rango.min)} a ${clp(rango.max)}` : undefined}>Valor acordado</Etiqueta>
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="numeric" placeholder="$" className={`${campo} tabular-nums`} />
        </label>
        {!edicion && (
          <div>
            <Etiqueta>Abono recibido</Etiqueta>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input value={abono} onChange={(e) => setAbono(e.target.value)} inputMode="numeric" placeholder="$" aria-label="Monto del abono" className={`${campo} tabular-nums`} />
              <div role="group" aria-label="Cómo pagó" className="flex h-12 items-center gap-1 rounded-2xl border border-linea p-1">
                {[
                  ["transferencia", "Transf."],
                  ["efectivo", "Efectivo"],
                ].map(([v, t]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={medioAbono === v}
                    onClick={() => setMedioAbono(v)}
                    className={`h-full rounded-xl px-3 text-[14px] font-semibold transition-colors ${medioAbono === v ? "bg-stencil/25 text-piel" : "text-ceniza"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <label>
          <Etiqueta>Notas</Etiqueta>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Alergias, referencias que mandó, lo que haya que recordar…" className={`${campo} resize-none py-3`} />
        </label>
      </Paso>

      {/* ---------- Resumen y guardar, siempre a la vista ---------- */}
      <div
        className="sticky z-10 -mx-4 mt-2 border-t border-linea/80 bg-tinta/[0.94] px-4 pt-3 pb-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-3xl lg:border lg:px-5"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        {error && (
          <p role="alert" className="mb-2 text-[14px] font-semibold text-[#ff8a80]">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-[13px] leading-tight">
            <span className="block truncate font-semibold text-piel first-letter:uppercase">{resumen}</span>
            <span className="block truncate text-ceniza">
              {cliente?.nombre ?? (busqueda.trim() || "Sin cliente")} · {duracionTexto(duracion)}
            </span>
          </p>
          <Boton type="submit" disabled={guardando} className="min-h-12 shrink-0 px-5">
            {guardando ? "Guardando…" : edicion ? "Guardar" : "Agendar"}
          </Boton>
        </div>
      </div>
    </form>
  );
}

function DiaChip({ fecha, hoy, activo, citas, onClick }: { fecha: string; hoy: string; activo: boolean; citas: number; onClick: () => void }) {
  const [dia, num, mes] = fechaCorta(fecha).split(" ");
  const etiqueta = fecha === hoy ? "Hoy" : fecha === sumarDias(hoy, 1) ? "Mañ." : dia;
  return (
    <button
      type="button"
      aria-pressed={activo}
      aria-label={`${fecha}${citas ? `, ${citas} ocupado` : ""}`}
      onClick={onClick}
      className={`relative flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2 transition-colors ${
        activo ? "border-stencil bg-stencil/20 shadow-[0_0_18px_-6px_rgba(47,107,255,0.9)]" : "border-linea hover:border-ceniza/60"
      }`}
    >
      <span className={`text-[11px] font-semibold capitalize ${activo ? "text-stencil-claro" : "text-ceniza"}`}>{etiqueta}</span>
      <span className="text-[20px] leading-tight font-semibold tabular-nums">{num}</span>
      <span className="text-[11px] text-ceniza">{mes}</span>
      {citas > 0 && (
        <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-stencil px-1 text-[10px] leading-5 font-semibold text-piel">{citas}</span>
      )}
    </button>
  );
}
