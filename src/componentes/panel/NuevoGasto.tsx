"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { borrarGasto, crearGasto } from "@/app/tinta/_acciones/panel";
import { CATEGORIAS } from "@/lib/admin/etiquetas";
import { Boton } from "./Boton";
import { campo, Chip, Etiqueta } from "./FormularioCita";
import { Mas, Papelera } from "./Iconos";

/** Anotar un gasto en tres toques: categoría, monto, guardar. */
export function NuevoGasto({ hoy }: { hoy: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(hoy);
  const [categoria, setCategoria] = useState("insumos");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (!abierto) {
    return (
      <Boton variante="linea" onClick={() => setAbierto(true)} className="min-h-11 w-full">
        <Mas className="size-4" /> Anotar gasto
      </Boton>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-stencil/50 bg-tinta/60 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        iniciar(async () => {
          const r = await crearGasto({ fecha, categoria, monto: Number(monto.replace(/\D/g, "")), descripcion });
          if (!r.ok) return setError(r.error);
          setAbierto(false);
          setMonto("");
          setDescripcion("");
          router.refresh();
        });
      }}
    >
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map(([v, t]) => (
          <Chip key={v} activo={categoria === v} onClick={() => setCategoria(v)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="min-w-0">
          <Etiqueta>Monto</Etiqueta>
          <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="numeric" autoFocus placeholder="$" className={`${campo} tabular-nums`} />
        </label>
        <label className="min-w-0">
          <Etiqueta>Fecha</Etiqueta>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${campo} [color-scheme:dark]`} />
        </label>
      </div>
      <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle (opcional): agujas 3RL, tinta negra…" className={campo} />
      {error && <p className="text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
      <div className="flex gap-2">
        <Boton variante="fantasma" onClick={() => setAbierto(false)} className="min-h-11">
          Cancelar
        </Boton>
        <Boton type="submit" disabled={pendiente || !monto} className="min-h-11 flex-1">
          Guardar gasto
        </Boton>
      </div>
    </form>
  );
}

export function BorrarGasto({ id }: { id: number }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      aria-label="Borrar gasto"
      disabled={pendiente}
      onClick={() => {
        if (!window.confirm("¿Borrar este gasto?")) return;
        iniciar(async () => {
          await borrarGasto(id);
          router.refresh();
        });
      }}
      className="grid size-9 shrink-0 place-items-center rounded-full text-ceniza hover:text-[#ff8a80] disabled:opacity-40"
    >
      <Papelera className="size-4" />
    </button>
  );
}
