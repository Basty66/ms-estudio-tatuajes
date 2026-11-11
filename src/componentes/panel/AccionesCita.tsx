"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { borrarPago, cambiarEstadoCita, registrarPago } from "@/app/tinta/_acciones/panel";
import { reducirImagen } from "@/lib/admin/imagenes";
import { clp } from "@/lib/admin/etiquetas";
import { PANEL } from "@/lib/admin/ruta";
import { Boton } from "./Boton";
import { Chip, campo, Etiqueta } from "./FormularioCita";
import { Documento, Papelera, Subir } from "./Iconos";

/** Cambiar el estado de la cita: hecha, no vino, cancelar o reactivar. */
export function EstadoCita({ id, estado }: { id: number; estado: string }) {
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

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {estado === "confirmada" ? (
          <>
            <Boton variante="linea" disabled={pendiente} onClick={() => cambiar("completada")} className="min-h-11 px-2 text-[14px]">
              Hecha
            </Boton>
            <Boton variante="linea" disabled={pendiente} onClick={() => cambiar("no_vino", "¿Marcar que no vino?")} className="min-h-11 px-2 text-[14px]">
              No vino
            </Boton>
            <Boton variante="peligro" disabled={pendiente} onClick={() => cambiar("cancelada", "¿Cancelar la cita? La hora queda libre.")} className="min-h-11 px-2 text-[14px]">
              Cancelar
            </Boton>
          </>
        ) : (
          <Boton variante="linea" disabled={pendiente} onClick={() => cambiar("confirmada")} className="col-span-3 min-h-11">
            Volver a confirmada
          </Boton>
        )}
      </div>
      {error && <p className="mt-2 text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
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
    return (
      <Boton variante="cromo" onClick={() => setAbierto(true)} className="w-full">
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
