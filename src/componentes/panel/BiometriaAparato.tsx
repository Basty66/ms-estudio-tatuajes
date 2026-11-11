"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import { guardarBiometria, opcionesRegistro, quitarBiometria } from "@/app/tinta/_acciones/entrar";
import { Caja } from "./ActivarAvisos";
import { Boton } from "./Boton";
import { Cara, Huella } from "./Iconos";

type Mensaje = { texto: string; malo: boolean };

/**
 * Face ID / huella en ESTE aparato. Opcional: quien no la quiera sigue con
 * su PIN y no pierde nada.
 *
 * La huella o la cara nunca salen del teléfono. Lo que se guarda en el panel
 * es una llave pública; el teléfono firma con la privada solo después de que
 * Face ID o la huella lo autoricen.
 */
export function BiometriaAparato({
  activa: activaInicial,
  aparato,
}: {
  activa: boolean;
  aparato: string;
}) {
  const [activa, setActiva] = useState(activaInicial);
  const [soportada, setSoportada] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  const etiqueta = aparato === "iPhone" || aparato === "Mac" ? "Face ID" : aparato === "Android" ? "la huella" : "la biometría";

  useEffect(() => {
    // Lo que importa no es que el navegador entienda WebAuthn sino que el
    // aparato tenga con qué verificar a la persona: un computador sin lector
    // de huella lo entiende y no sirve de nada.
    const pkc = window.PublicKeyCredential;
    const consulta = pkc?.isUserVerifyingPlatformAuthenticatorAvailable
      ? pkc.isUserVerifyingPlatformAuthenticatorAvailable()
      : Promise.resolve(false);
    consulta.then(setSoportada).catch(() => setSoportada(false));
  }, []);

  async function activar() {
    setMensaje(null);
    setOcupado(true);
    try {
      const opciones = await opcionesRegistro();
      if (!opciones.ok) return setMensaje({ texto: opciones.error, malo: true });

      const respuesta = await startRegistration({ optionsJSON: opciones.opciones });
      const r = await guardarBiometria(respuesta);
      if (!r.ok) return setMensaje({ texto: r.error, malo: true });

      setActiva(true);
      setMensaje({
        texto: `Listo. La próxima vez que el panel se bloquee, entras con ${etiqueta}.`,
        malo: false,
      });
    } catch (e) {
      const nombre = (e as Error).name;
      setMensaje({
        texto:
          nombre === "NotAllowedError" || nombre === "AbortError"
            ? "Se canceló. Puedes activarla cuando quieras."
            : `El teléfono no pudo activarla: ${(e as Error).message}`,
        malo: true,
      });
    } finally {
      setOcupado(false);
    }
  }

  async function quitar() {
    setMensaje(null);
    setOcupado(true);
    try {
      const r = await quitarBiometria();
      if (!r.ok) return setMensaje({ texto: r.error, malo: true });
      setActiva(false);
      setMensaje({ texto: "Quitada. Desde ahora entras con tu PIN.", malo: false });
    } finally {
      setOcupado(false);
    }
  }

  if (soportada === null) return null;
  const Titulo = etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);

  return (
    <Caja encendido={activa} Icono={etiqueta === "Face ID" ? Cara : Huella} titulo={activa ? `${Titulo} activado en este aparato` : `Entrar con ${etiqueta}`}>
      {!soportada && !activa ? (
        <p className="text-[14px] text-ceniza">Este aparato no tiene Face ID ni huella disponibles para el navegador. Sigues entrando con tu PIN.</p>
      ) : activa ? (
        <Boton variante="fantasma" disabled={ocupado} onClick={quitar} className="min-h-11 self-start px-0">
          {ocupado ? "Quitando…" : "Quitar de este aparato"}
        </Boton>
      ) : (
        <>
          <p className="text-[14px] text-ceniza">
            Cuando el panel se bloquee, lo abres mirando el teléfono o con el dedo en vez de escribir el PIN. Tu cara o tu huella no salen del teléfono.
          </p>
          <Boton disabled={ocupado} onClick={activar} className="min-h-11">
            {ocupado ? "Activando…" : `Activar ${etiqueta}`}
          </Boton>
        </>
      )}
      {mensaje && (
        <p role={mensaje.malo ? "alert" : undefined} className={`text-[14px] font-semibold ${mensaje.malo ? "text-[#ff8a80]" : "text-[#6ee7b7]"}`}>
          {mensaje.texto}
        </p>
      )}
    </Caja>
  );
}
