"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { guardarCliente } from "@/app/tinta/_acciones/panel";
import { formatearTelefono } from "@/lib/admin/telefono";
import { Boton } from "./Boton";
import { campo, Etiqueta } from "./FormularioCita";

/** Los datos del cliente y sus notas ("piel sensible", "llegó tarde dos veces"). */
export function EditarCliente({ c }: { c: { id: number; nombre: string; telefono: string | null; instagram: string | null; notas: string | null } }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(c.nombre);
  const [telefono, setTelefono] = useState(c.telefono ? formatearTelefono(c.telefono) : "");
  const [instagram, setInstagram] = useState(c.instagram ?? "");
  const [notas, setNotas] = useState(c.notas ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (!abierto) {
    return (
      <Boton variante="linea" onClick={() => setAbierto(true)} className="min-h-10 px-4 text-[14px]">
        Editar
      </Boton>
    );
  }

  return (
    <form
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-tinta/80 backdrop-blur-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        iniciar(async () => {
          const r = await guardarCliente({ id: c.id, nombre, telefono, instagram, notas });
          if (!r.ok) return setError(r.error);
          setAbierto(false);
          router.refresh();
        });
      }}
    >
      <div
        className="panel-surge mx-auto flex w-full max-w-lg flex-col gap-4 rounded-t-3xl border border-linea bg-hollin p-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <p className="text-[17px] font-semibold">Editar cliente</p>
        <label>
          <Etiqueta>Nombre</Etiqueta>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="min-w-0">
            <Etiqueta>WhatsApp</Etiqueta>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" className={campo} />
          </label>
          <label className="min-w-0">
            <Etiqueta>Instagram</Etiqueta>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@" className={campo} />
          </label>
        </div>
        <label>
          <Etiqueta>Notas</Etiqueta>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} className={`${campo} resize-none py-3`} />
        </label>
        {error && <p className="text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
        <div className="flex gap-2">
          <Boton variante="fantasma" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={pendiente} className="flex-1">
            Guardar
          </Boton>
        </div>
      </div>
    </form>
  );
}
