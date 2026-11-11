"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { desbloquearConBiometria, desbloquearConPin, opcionesDesbloqueo, salir } from "@/app/tinta/_acciones/entrar";
import { marcarAbierta } from "@/lib/admin/apertura";
import { FondoEntrada, Inicial } from "./FondoEntrada";
import { Cara, Huella } from "./Iconos";
import { TecladoPin } from "./TecladoPin";

/** Cómo llama cada teléfono a su biometría. */
function nombreBiometria(aparato: string): string {
  if (aparato === "iPhone" || aparato === "Mac") return "Face ID";
  if (aparato === "Android") return "tu huella";
  return "biometría";
}

/**
 * El panel bloqueado (se cerró la app, estuvo un rato en segundo plano o pasó
 * media hora sin uso) en un aparato que ya tiene sesión.
 *
 * No pide nombre ni clave: la sesión ya dice de quién es el teléfono. Solo PIN
 * o, si se activó, Face ID / huella, que se ofrece sola al abrir, como en la
 * app del banco. Si se cancela, queda el teclado.
 */
export function PantallaDesbloqueo({
  nombre,
  biometria,
  aparato,
  destino,
}: {
  nombre: string;
  biometria: boolean;
  aparato: string;
  destino: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const yaSeOfrecio = useRef(false);
  const etiqueta = nombreBiometria(aparato);
  const IconoBio = etiqueta === "Face ID" ? Cara : Huella;

  const abrir = useCallback(() => {
    marcarAbierta();
    window.location.replace(destino);
  }, [destino]);

  const conBiometria = useCallback(
    async (automatico: boolean) => {
      setError(null);
      setOcupado(true);
      try {
        const opciones = await opcionesDesbloqueo();
        if (!opciones.ok) return setError(opciones.error);
        const respuesta = await startAuthentication({ optionsJSON: opciones.opciones });
        const r = await desbloquearConBiometria(respuesta);
        if (!r.ok) return setError(r.error);
        abrir();
      } catch (e) {
        // Cancelar el Face ID no es un error que mostrar: la persona eligió el
        // PIN. Y si el teléfono no dejó lanzarlo solo al abrir (algunos exigen
        // un toque antes), el botón sigue ahí.
        const n = (e as Error).name;
        if (!automatico && n !== "NotAllowedError" && n !== "AbortError") setError(`No se pudo usar ${etiqueta}. Usa tu PIN.`);
      } finally {
        setOcupado(false);
      }
    },
    [abrir, etiqueta],
  );

  useEffect(() => {
    if (!biometria || yaSeOfrecio.current) return;
    yaSeOfrecio.current = true;
    void conBiometria(true);
  }, [biometria, conBiometria]);

  async function conPin(pin: string): Promise<boolean> {
    setError(null);
    const r = await desbloquearConPin(pin);
    if (!r.ok) {
      setError(r.error);
      return false;
    }
    abrir();
    return true;
  }

  return (
    <FondoEntrada compacta>
      <div className="flex flex-col items-center gap-[clamp(0.375rem,1.4dvh,0.75rem)] text-center">
        <Inicial nombre={nombre} />
        <h1 className="text-[clamp(1.375rem,4dvh,1.75rem)] leading-tight font-semibold">Hola, {nombre}</h1>
        <p className="max-w-[30ch] text-[15px] text-ceniza [@media(max-height:600px)]:hidden">
          {biometria ? `Usa ${etiqueta} o tu PIN para abrir el panel.` : "Tu PIN para abrir el panel."}
        </p>
      </div>

      <p role="alert" className="-my-2 min-h-10 max-w-[40ch] text-center text-sm font-semibold text-balance text-[#ff8a80]">
        {error}
      </p>

      <TecladoPin
        alCompletar={conPin}
        ocupado={ocupado}
        esquina={
          biometria ? (
            <button
              type="button"
              aria-label={`Entrar con ${etiqueta}`}
              disabled={ocupado}
              onClick={() => void conBiometria(false)}
              className="grid size-full place-items-center rounded-full text-stencil-claro transition-all duration-150 active:scale-90 disabled:opacity-40"
            >
              <IconoBio className="size-[55%]" />
            </button>
          ) : null
        }
      />

      <form action={salir}>
        <button type="submit" className="text-sm font-semibold text-ceniza underline-offset-4 hover:text-piel hover:underline">
          No soy {nombre}
        </button>
      </form>
    </FondoEntrada>
  );
}
