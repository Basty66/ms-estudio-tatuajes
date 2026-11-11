"use client";

import { useState, useTransition } from "react";
import { cambiarPin } from "@/app/tinta/_acciones/entrar";
import { MENSAJE_PIN_FACIL, pinDemasiadoFacil, pinValido } from "@/lib/admin/pin";
import { Caja } from "./ActivarAvisos";
import { Boton } from "./Boton";
import { campo } from "./FormularioCita";
import { Candado } from "./Iconos";

export function CambiarPin() {
  const [abierto, setAbierto] = useState(false);
  const [actual, setActual] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [mensaje, setMensaje] = useState<{ texto: string; malo: boolean } | null>(null);
  const [pendiente, iniciar] = useTransition();
  const soloNumeros = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  return (
    <Caja encendido={false} Icono={Candado} titulo="PIN del panel">
      {!abierto ? (
        <Boton variante="linea" onClick={() => setAbierto(true)} className="min-h-11 self-start">
          Cambiar PIN
        </Boton>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setMensaje(null);
            if (!pinValido(nuevo)) return setMensaje({ texto: "El PIN nuevo son 4 números.", malo: true });
            if (pinDemasiadoFacil(nuevo)) return setMensaje({ texto: MENSAJE_PIN_FACIL, malo: true });
            iniciar(async () => {
              const r = await cambiarPin(actual, nuevo);
              if (!r.ok) return setMensaje({ texto: r.error, malo: true });
              setMensaje({ texto: "Listo, desde ahora entras con el PIN nuevo.", malo: false });
              setAbierto(false);
              setActual("");
              setNuevo("");
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <input value={actual} onChange={(e) => setActual(soloNumeros(e.target.value))} inputMode="numeric" type="password" autoComplete="off" placeholder="PIN actual" aria-label="PIN actual" className={`${campo} tracking-[0.4em]`} />
            <input value={nuevo} onChange={(e) => setNuevo(soloNumeros(e.target.value))} inputMode="numeric" type="password" autoComplete="off" placeholder="PIN nuevo" aria-label="PIN nuevo" className={`${campo} tracking-[0.4em]`} />
          </div>
          <div className="flex gap-2">
            <Boton variante="fantasma" onClick={() => setAbierto(false)} className="min-h-11">
              Cancelar
            </Boton>
            <Boton type="submit" disabled={pendiente || actual.length < 4 || nuevo.length < 4} className="min-h-11 flex-1">
              Guardar PIN
            </Boton>
          </div>
        </form>
      )}
      {mensaje && <p className={`text-[14px] font-semibold ${mensaje.malo ? "text-[#ff8a80]" : "text-[#6ee7b7]"}`}>{mensaje.texto}</p>}
    </Caja>
  );
}
