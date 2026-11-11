"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { crearBloqueo, quitarBloqueo } from "@/app/tinta/_acciones/panel";
import { Boton } from "./Boton";
import { campo, Etiqueta } from "./FormularioCita";
import { Bloqueo, Cerrar } from "./Iconos";

/** Bloquear un horario: día libre, trámite, convención. Nadie puede agendar encima. */
export function Bloquear({ fecha }: { fecha: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [desde, setDesde] = useState("10:00");
  const [hasta, setHasta] = useState("20:00");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (!abierto) {
    return (
      <Boton variante="linea" onClick={() => setAbierto(true)} className="min-h-11 px-3 text-[14px]">
        <Bloqueo className="size-4" /> Bloquear
      </Boton>
    );
  }

  return (
    <form
      className="col-span-2 flex w-full flex-col gap-3 rounded-2xl border border-linea bg-tinta/60 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        iniciar(async () => {
          const r = await crearBloqueo(fecha, desde, hasta, motivo);
          if (!r.ok) return setError(r.error);
          setAbierto(false);
          router.refresh();
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label>
          <Etiqueta>Desde</Etiqueta>
          <input type="time" value={desde} onChange={(e) => setDesde(e.target.value)} className={`${campo} [color-scheme:dark]`} />
        </label>
        <label>
          <Etiqueta>Hasta</Etiqueta>
          <input type="time" value={hasta} onChange={(e) => setHasta(e.target.value)} className={`${campo} [color-scheme:dark]`} />
        </label>
      </div>
      <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (opcional): convención, trámite…" className={campo} />
      {error && <p className="text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
      <div className="flex gap-2">
        <Boton variante="fantasma" onClick={() => setAbierto(false)} className="min-h-11">
          Cancelar
        </Boton>
        <Boton type="submit" disabled={pendiente} className="min-h-11 flex-1">
          Bloquear
        </Boton>
      </div>
    </form>
  );
}

export function QuitarBloqueo({ id }: { id: number }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      aria-label="Quitar bloqueo"
      disabled={pendiente}
      onClick={() =>
        iniciar(async () => {
          await quitarBloqueo(id);
          router.refresh();
        })
      }
      className="grid size-10 shrink-0 place-items-center rounded-full text-ceniza hover:text-piel disabled:opacity-40"
    >
      <Cerrar className="size-4" />
    </button>
  );
}
