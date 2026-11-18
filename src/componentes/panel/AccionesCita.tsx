"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { borrarPago, cambiarEstadoCita, confirmarReserva, rechazarReserva, registrarPago } from "@/app/tinta/_acciones/panel";
import { duracionTexto, minutosEntre, sumarMinutos } from "@/lib/admin/fecha";
import { reducirImagen } from "@/lib/admin/imagenes";
import { clp, nombreDonde } from "@/lib/admin/etiquetas";
import { rellenar } from "@/lib/contenido";
import { MAX_SESIONES, textoCadaSesion, textoSesiones, valorDeSesion, valoresPropuesta } from "@/lib/sesiones";
import type { TrabajoAbierto } from "@/db/panel";
import { IconoWhatsapp } from "@/componentes/sitio/WhatsappFlotante";
import { PANEL } from "@/lib/admin/ruta";
import { Boton, claseBoton } from "./Boton";
import { Chip, campo, Etiqueta } from "./FormularioCita";
import { Documento, Papelera, Subir } from "./Iconos";

/**
 * Cambiar el estado de la cita. Antes de la hora solo se puede cancelar:
 * "Hecha" o "No vino" recién tienen sentido cuando la sesión empezó.
 */
export function EstadoCita({ id, estado, empezo }: { id: number; estado: string; empezo: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const cambiar = (nuevo: string, pregunta?: string) => {
    if (pregunta && !window.confirm(pregunta)) return;
    setError(null);
    iniciar(async () => {
      const r = await cambiarEstadoCita(id, nuevo);
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  };
  const cancelar = () => cambiar("cancelada", "¿Cancelar la cita? La hora queda libre.");

  return (
    <div>
      {estado !== "confirmada" ? (
        <Boton variante="linea" disabled={pendiente} onClick={() => cambiar("confirmada")} className="min-h-11 w-full">
          Volver a confirmada
        </Boton>
      ) : empezo ? (
        <>
          <p className="mb-2 text-[13px] text-ceniza">¿Cómo terminó?</p>
          <div className="grid grid-cols-2 gap-2">
            <Boton disabled={pendiente} onClick={() => cambiar("completada")} className="min-h-11 px-2 text-[14px]">
              Se hizo
            </Boton>
            <Boton variante="linea" disabled={pendiente} onClick={() => cambiar("no_vino", "¿Marcar que no vino?")} className="min-h-11 px-2 text-[14px]">
              No vino
            </Boton>
          </div>
          <Boton variante="fantasma" disabled={pendiente} onClick={cancelar} className="mt-1 min-h-10 w-full text-[14px] hover:text-[#ff8a80]">
            Cancelar la cita
          </Boton>
        </>
      ) : (
        <Boton variante="fantasma" disabled={pendiente} onClick={cancelar} className="min-h-10 w-full text-[14px] hover:text-[#ff8a80]">
          Cancelar la cita
        </Boton>
      )}
      {error && <p className="mt-2 text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
    </div>
  );
}

/** En una lista: una cita que ya pasó y sigue confirmada se cierra en un toque, sin abrirla. */
export function CerrarRapido({ id }: { id: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const cambiar = (nuevo: string) =>
    iniciar(async () => {
      setError(null);
      const r = await cambiarEstadoCita(id, nuevo);
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  const boton = "min-h-9 rounded-full border px-3.5 text-[13px] font-semibold transition-colors disabled:opacity-40";

  return (
    <div className="flex items-center gap-2 px-1 pt-2">
      <span className="min-w-0 flex-1 text-[13px] text-ceniza">{error ?? "¿Cómo terminó?"}</span>
      <button type="button" disabled={pendiente} onClick={() => cambiar("completada")} className={`${boton} border-stencil/60 bg-stencil/15 text-piel hover:bg-stencil/25`}>
        Se hizo
      </button>
      <button type="button" disabled={pendiente} onClick={() => cambiar("no_vino")} className={`${boton} border-linea text-ceniza hover:text-piel`}>
        No vino
      </button>
    </div>
  );
}

/**
 * Anotar un pago con su comprobante. La foto se reduce en el teléfono antes de
 * subirla (una foto de celular pesa 3–8 MB y el servidor admite 4,5).
 */
export function NuevoPago({ citaId, saldo, tieneAbono }: { citaId: number; saldo: number | null; tieneAbono: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [monto, setMonto] = useState(saldo ? String(saldo) : "");
  const [tipo, setTipo] = useState(tieneAbono ? "saldo" : "abono");
  const [medio, setMedio] = useState("transferencia");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  if (!abierto) {
    // Saldada: anotar otro pago pasa a ser lo raro, no la acción principal.
    return (
      <Boton variante={saldo === 0 ? "linea" : "cromo"} onClick={() => setAbierto(true)} className="w-full">
        Anotar pago
      </Boton>
    );
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const f = new FormData();
      f.set("cita", String(citaId));
      f.set("monto", monto.replace(/\D/g, ""));
      f.set("tipo", tipo);
      f.set("medio", medio);
      if (archivo) {
        const reducida = await reducirImagen(archivo);
        f.set("comprobante", new File([reducida], archivo.name, { type: reducida.type || archivo.type }));
      }
      const r = await registrarPago(f);
      if (!r.ok) return setError(r.error);
      setAbierto(false);
      setArchivo(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4 rounded-2xl border border-stencil/50 bg-tinta/60 p-4">
      <div>
        <Etiqueta>Monto</Etiqueta>
        <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="numeric" autoFocus placeholder="$" className={`${campo} text-lg tabular-nums`} />
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["abono", "Abono"],
          ["saldo", "Saldo"],
          ["otro", "Otro"],
        ].map(([v, t]) => (
          <Chip key={v} activo={tipo === v} onClick={() => setTipo(v)}>
            {t}
          </Chip>
        ))}
        <span className="mx-1 w-px bg-linea" />
        {[
          ["transferencia", "Transferencia"],
          ["efectivo", "Efectivo"],
        ].map(([v, t]) => (
          <Chip key={v} activo={medio === v} onClick={() => setMedio(v)}>
            {t}
          </Chip>
        ))}
      </div>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-linea px-4 text-[14px] text-ceniza hover:border-stencil/60 hover:text-piel">
        <Subir className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{archivo ? archivo.name : "Foto o PDF del comprobante (opcional)"}</span>
        <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
      </label>
      {error && <p className="text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
      <div className="flex gap-2">
        <Boton variante="fantasma" onClick={() => setAbierto(false)} className="min-h-11">
          Cancelar
        </Boton>
        <Boton type="submit" disabled={guardando || !monto} className="min-h-11 flex-1">
          {guardando ? "Guardando…" : "Guardar pago"}
        </Boton>
      </div>
    </form>
  );
}

export function FilaPago({
  p,
}: {
  p: { id: number; monto: number; tipo: string; medio: string; comprobante: string | null; fecha: string; anotado_por: string };
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <li className="flex items-center gap-3 border-b border-linea/60 py-3 last:border-0">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold tabular-nums">{clp(p.monto)}</span>
        <span className="block text-[13px] text-ceniza first-letter:uppercase">
          {p.tipo} · {p.medio} · {p.fecha.split("-").reverse().join("/")} · {p.anotado_por}
        </span>
      </span>
      {p.comprobante && (
        <a
          href={`${PANEL}/comprobante/${p.comprobante}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver comprobante"
          className="grid size-10 place-items-center rounded-full border border-linea text-stencil-claro hover:border-stencil"
        >
          <Documento className="size-5" />
        </a>
      )}
      <button
        type="button"
        aria-label="Borrar pago"
        disabled={pendiente}
        onClick={() => {
          if (!window.confirm(`¿Borrar el pago de ${clp(p.monto)}?`)) return;
          iniciar(async () => {
            const r = await borrarPago(p.id);
            if (!r.ok) window.alert(r.error);
            router.refresh();
          });
        }}
        className="grid size-10 place-items-center rounded-full text-ceniza hover:text-[#ff8a80] disabled:opacity-40"
      >
        <Papelera className="size-5" />
      </button>
    </li>
  );
}

/**
 * Confirmar una hora pedida desde la web: hasta qué hora va, el valor final y
 * en cuántas sesiones, y el abono (con su comprobante, si llegó). Antes de
 * confirmar se le puede mandar la propuesta por WhatsApp con lo mismo que se
 * anota acá. Si la persona tiene un trabajo a medias, se ofrece que sea su
 * siguiente sesión.
 */
export function ConfirmarReserva({
  citaId,
  inicio,
  fin,
  sugerido,
  rechazo,
  nombre,
  telefono,
  propuesta,
  datosAbono,
  abierto,
}: {
  citaId: number;
  inicio: string;
  fin: string;
  sugerido: string | null;
  rechazo: string | null;
  nombre: string;
  telefono: string | null;
  /** La plantilla "Valor final y sesiones". */
  propuesta: string;
  datosAbono: string;
  abierto: TrabajoAbierto | null;
}) {
  const router = useRouter();
  // Parte con lo que apartaba el cupo; el tatuador lo ajusta a lo que de verdad dura.
  const [hasta, setHasta] = useState(fin.slice(11, 16));
  const termina = `${inicio.slice(0, 10)}T${hasta}`;
  const minutos = hasta > inicio.slice(11, 16) ? minutosEntre(inicio, termina) : 0;
  const atajos = [2, 3, 4, 6].map((h) => sumarMinutos(inicio, h * 60)).filter((f) => f.slice(0, 10) === inicio.slice(0, 10));
  // Si tiene un trabajo a medias, lo más probable es que sea la siguiente sesión.
  const [seguir, setSeguir] = useState(Boolean(abierto));
  const [sesiones, setSesiones] = useState(1);
  const [valorFinal, setValorFinal] = useState("");
  const [precio, setPrecio] = useState("");
  const [abono, setAbono] = useState("");
  const [medio, setMedio] = useState("transferencia");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const trabajo = seguir ? abierto : null;
  const numero = trabajo ? trabajo.vivas + 1 : 1;
  const acordadas = trabajo ? Math.max(trabajo.sesiones, numero) : sesiones;
  const total = trabajo ? (trabajo.valor_final ?? 0) : Number(valorFinal.replace(/\D/g, "")) || 0;
  // Lo de esta sesión: su parte del valor final (la última cuadra lo que falta), o lo que se escriba.
  const parte = acordadas > 1 && total ? (trabajo && numero >= acordadas ? Math.max(0, total - trabajo.asignado) : valorDeSesion(total, acordadas, numero)) : null;
  const precioFinal = precio.trim() ? Number(precio.replace(/\D/g, "")) : acordadas > 1 ? parte : total || null;
  const montoAbono = Number(abono.replace(/\D/g, "")) || null;
  const mensaje = rellenar(propuesta, valoresPropuesta({ nombre, valorFinal: total || null, sesiones: acordadas, abono: montoAbono, duracion: minutos > 0 ? duracionTexto(minutos) : "", datosAbono }));

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const f = new FormData();
      f.set("cita", String(citaId));
      f.set("precio", precioFinal != null ? String(precioFinal) : "");
      f.set("valorFinal", acordadas > 1 && total ? String(total) : "");
      f.set("sesiones", String(acordadas));
      if (trabajo) f.set("trabajo", String(trabajo.id));
      f.set("abono", abono.replace(/\D/g, ""));
      f.set("medio", medio);
      f.set("hasta", hasta);
      if (archivo) {
        const reducida = await reducirImagen(archivo);
        f.set("comprobante", new File([reducida], archivo.name, { type: reducida.type || archivo.type }));
      }
      const r = await confirmarReserva(f);
      if (!r.ok) return setError(r.error);
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "No se pudo confirmar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={confirmar} className="flex flex-col gap-4">
      {abierto && (
        <div className="rounded-2xl border border-stencil/50 bg-stencil/10 p-3 pl-4">
          <p className="text-[14px] leading-snug">
            <span className="font-semibold">Tiene un trabajo a medias</span>
            <span className="text-ceniza">
              {" "}
              · {nombreDonde(abierto.zona, abierto.lado) ?? "su tatuaje"}, van {textoSesiones(abierto.vivas)} de {abierto.sesiones}
              {abierto.valor_final != null ? ` · valor final ${clp(abierto.valor_final)}` : ""}.
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip activo={seguir} onClick={() => setSeguir(true)}>
              Es la sesión {abierto.vivas + 1}
            </Chip>
            <Chip activo={!seguir} onClick={() => setSeguir(false)}>
              Es otro tatuaje
            </Chip>
          </div>
        </div>
      )}
      <div>
        <Etiqueta nota={minutos > 0 ? `${inicio.slice(11, 16)} a ${hasta} · ${duracionTexto(minutos)}` : "Antes de empezar, no"}>Termina</Etiqueta>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="time"
            step={900}
            value={hasta}
            aria-label="Hora en que termina la sesión"
            onChange={(e) => e.target.value && setHasta(e.target.value)}
            className="min-h-12 w-28 rounded-2xl border border-linea bg-tinta/70 px-3 text-[16px] text-piel tabular-nums [color-scheme:dark] focus:border-stencil focus:outline-none"
          />
          {atajos.map((f, i) => (
            <Chip key={f} activo={hasta === f.slice(11)} onClick={() => setHasta(f.slice(11))}>
              {[2, 3, 4, 6][i]} h
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-[12px] text-ceniza">El cupo apartaba hasta las {fin.slice(11, 16)}. Si se alarga y pisa otro cupo libre, ese se cierra solo.</p>
      </div>
      {!trabajo && (
        <div>
          <Etiqueta nota="Un tatuaje grande va en varias">Sesiones</Etiqueta>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Chip key={n} activo={sesiones === n} onClick={() => setSesiones(n)} className="min-w-11">
                {n}
              </Chip>
            ))}
            <input
              type="number"
              min={1}
              max={MAX_SESIONES}
              aria-label="Otra cantidad de sesiones"
              placeholder="Más"
              onChange={(e) => {
                const n = Math.round(Number(e.target.value));
                if (n >= 1 && n <= MAX_SESIONES) setSesiones(n);
              }}
              className="min-h-10 w-20 rounded-full border border-linea bg-transparent px-3 text-center text-[14px] tabular-nums placeholder:text-ceniza/60 focus:border-stencil focus:outline-none"
            />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {trabajo ? (
          <label className="min-w-0">
            <Etiqueta>Esta sesión</Etiqueta>
            <input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="numeric" placeholder={parte != null ? clp(parte) : "$"} className={`${campo} tabular-nums`} />
          </label>
        ) : (
          <label className="min-w-0">
            <Etiqueta>Valor final</Etiqueta>
            <input value={valorFinal} onChange={(e) => setValorFinal(e.target.value)} inputMode="numeric" placeholder="$" className={`${campo} tabular-nums`} />
          </label>
        )}
        <label className="min-w-0">
          <Etiqueta>Abono</Etiqueta>
          <input value={abono} onChange={(e) => setAbono(e.target.value)} inputMode="numeric" placeholder="$" className={`${campo} tabular-nums`} />
        </label>
      </div>
      <p className="-mt-2 text-[12px] leading-snug text-ceniza">
        {trabajo
          ? `Sesión ${numero} de ${acordadas}${trabajo.valor_final != null ? ` · valor final ${clp(trabajo.valor_final)}` : ""}${numero >= acordadas && parte != null ? `: en esta va lo que falta` : ""}.`
          : acordadas > 1 && total
            ? `${textoSesiones(acordadas)} de ${textoCadaSesion(total, acordadas)}: en esta sesión se cobra ${clp(parte ?? 0)}.${sugerido ? ` En la web cotizó ${sugerido}.` : ""}`
            : sugerido
              ? `En la web cotizó ${sugerido}.`
              : ""}
      </p>
      {!trabajo && telefono && (
        <div className="rounded-2xl border border-linea bg-tinta/40 p-3">
          <a
            href={`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!total}
            onClick={(e) => !total && e.preventDefault()}
            className={claseBoton("linea", `min-h-11 w-full px-3 text-[14px] ${total ? "" : "pointer-events-none opacity-40"}`)}
          >
            <IconoWhatsapp className="size-5 shrink-0" /> Mandarle el valor y el abono
          </a>
          <p className="mt-2 text-[12px] leading-snug text-ceniza">
            {!total
              ? "Anota el valor final para armar el mensaje."
              : datosAbono
                ? "Va con el valor final, las sesiones, el abono y tus datos para transferir."
                : "Va sin datos para transferir: agrégalos en Web → Mensajes de WhatsApp."}
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {[
          ["transferencia", "Transferencia"],
          ["efectivo", "Efectivo"],
        ].map(([v, t]) => (
          <Chip key={v} activo={medio === v} onClick={() => setMedio(v)}>
            {t}
          </Chip>
        ))}
      </div>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-linea px-4 text-[14px] text-ceniza hover:border-stencil/60 hover:text-piel">
        <Subir className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{archivo ? archivo.name : "Comprobante del abono (opcional)"}</span>
        <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
      </label>
      {error && <p className="text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
      <Boton type="submit" disabled={guardando} className="w-full">
        {guardando ? "Confirmando…" : "Confirmar la hora"}
      </Boton>
      <a
        href={rechazo ?? "#"}
        target={rechazo ? "_blank" : undefined}
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!window.confirm("¿Liberar esta hora? Queda disponible para otra persona.")) return e.preventDefault();
          if (!rechazo) e.preventDefault();
          iniciar(async () => {
            await rechazarReserva(citaId);
            router.refresh();
          });
        }}
        className={`text-center text-[14px] text-ceniza hover:text-[#ff8a80] ${pendiente ? "pointer-events-none opacity-40" : ""}`}
      >
        No puedo esa hora
      </a>
    </form>
  );
}
