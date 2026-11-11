"use client";

import { useState } from "react";
import { entrar, revisarClave } from "@/app/tinta/_acciones/entrar";
import { marcarAbierta } from "@/lib/admin/apertura";
import { MENSAJE_PIN_FACIL, pinDemasiadoFacil } from "@/lib/admin/pin";
import { Boton } from "./Boton";
import { FondoEntrada, Inicial } from "./FondoEntrada";
import { Candado, Flecha } from "./Iconos";
import { TecladoPin } from "./TecladoPin";

type Persona = { id: number; nombre: string };

type Paso =
  | { tipo: "quien" }
  | { tipo: "clave"; persona: Persona }
  | { tipo: "pin"; persona: Persona; clave: string }
  | { tipo: "crear"; persona: Persona; clave: string }
  | { tipo: "repetir"; persona: Persona; clave: string; primero: string };

/**
 * Entrada en un aparato que todavía no tiene sesión. Se hace una vez por
 * teléfono: nombre, la clave del panel y el PIN propio (se crea la primera
 * vez). Desde ahí la sesión queda guardada 90 días y solo se pide el PIN —o
 * Face ID / huella— cuando el panel se bloquea.
 *
 * Al terminar se navega con una carga completa: la cookie recién creada tiene
 * que viajar en la primera petición del panel, y en la app instalada de iPhone
 * una navegación del router a veces llegaba con el estado anterior.
 */
export function PantallaEntrar({ equipo, destino }: { equipo: Persona[]; destino: string }) {
  const [paso, setPaso] = useState<Paso>(equipo.length === 1 ? { tipo: "clave", persona: equipo[0] } : { tipo: "quien" });
  const [error, setError] = useState<string | null>(null);
  const [clave, setClave] = useState("");
  const [ocupado, setOcupado] = useState(false);

  function volverAlInicio() {
    setPaso({ tipo: "quien" });
    setClave("");
    setError(null);
  }

  async function enviarClave(e: React.FormEvent) {
    e.preventDefault();
    if (paso.tipo !== "clave" || !clave) return;
    setError(null);
    setOcupado(true);
    try {
      const r = await revisarClave(paso.persona.id, clave);
      if (!r.ok) return setError(r.error);
      setPaso(r.tienePin ? { tipo: "pin", persona: paso.persona, clave } : { tipo: "crear", persona: paso.persona, clave });
    } catch {
      setError("No hubo conexión. Revisa la señal y vuelve a probar.");
    } finally {
      setOcupado(false);
    }
  }

  async function terminar(persona: Persona, claveDelPanel: string, pin: string): Promise<boolean> {
    setError(null);
    const r = await entrar(persona.id, claveDelPanel, pin);
    if (!r.ok) {
      setError(r.error);
      return false;
    }
    marcarAbierta();
    window.location.replace(destino);
    return true;
  }

  if (paso.tipo === "quien") {
    return (
      <FondoEntrada>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-gotica text-[2.6rem] leading-none">¿Quién eres?</h1>
          <p className="max-w-[30ch] text-ceniza">Lo que hagas en el panel queda firmado con tu nombre.</p>
        </div>

        <ul className="flex w-full flex-col gap-3">
          {equipo.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setPaso({ tipo: "clave", persona: p });
                }}
                className="group flex min-h-16 w-full items-center gap-4 rounded-2xl border border-linea bg-hollin/70 px-4 text-left backdrop-blur transition-all duration-200 hover:border-stencil hover:shadow-[0_0_30px_-10px_rgba(47,107,255,0.9)] active:scale-[.98]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2f6bff,#0c1f6b)] font-gotica text-xl text-piel">
                  {p.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 text-lg font-semibold">{p.nombre}</span>
                <Flecha className="size-5 text-ceniza transition-transform duration-200 group-hover:translate-x-1 group-hover:text-stencil-claro" />
              </button>
            </li>
          ))}
        </ul>

        {equipo.length === 0 && <p className="text-center text-sm text-ceniza">No hay nadie activo en el panel. Hay que agregar a alguien en la base.</p>}
      </FondoEntrada>
    );
  }

  const persona = paso.persona;

  const encabezado = (titulo: string, bajada: string) => (
    <div className="flex flex-col items-center gap-[clamp(0.375rem,1.4dvh,0.75rem)] text-center">
      <Inicial nombre={persona.nombre} />
      <h1 className="text-[clamp(1.375rem,4dvh,1.75rem)] leading-tight font-semibold">{titulo}</h1>
      <p className="max-w-[32ch] text-[15px] text-ceniza [@media(max-height:600px)]:hidden">{bajada}</p>
    </div>
  );

  // Arriba del teclado: en un teléfono chico, lo que queda bajo el teclado no
  // se ve sin desplazar, y un PIN rechazado sin explicación parece que no hizo nada.
  const aviso = (
    <p role="alert" className="-my-2 min-h-10 max-w-[40ch] text-center text-sm font-semibold text-balance text-[#ff8a80]">
      {error}
    </p>
  );

  const noSoyYo =
    equipo.length > 1 ? (
      <button type="button" onClick={volverAlInicio} className="text-sm font-semibold text-ceniza underline-offset-4 hover:text-piel hover:underline">
        No soy {persona.nombre}
      </button>
    ) : null;

  if (paso.tipo === "clave") {
    return (
      <FondoEntrada>
        {encabezado(`Hola, ${persona.nombre}`, "Escribe la clave del panel. Se pide solo la primera vez en este teléfono.")}
        <form onSubmit={enviarClave} className="flex w-full flex-col gap-4">
          {/* El nombre oculto hace que el gestor de claves guarde la clave junto a la persona. */}
          <input type="text" name="usuario" autoComplete="username" value={persona.nombre} readOnly hidden />
          <label className="flex flex-col gap-2 text-[13px] font-semibold text-ceniza">
            Clave del panel
            <span className="relative">
              <Candado className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ceniza" />
              <input
                type="password"
                name="clave"
                autoComplete="current-password"
                autoFocus
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="min-h-14 w-full rounded-2xl border border-linea bg-hollin pr-4 pl-12 text-lg text-piel focus:border-stencil focus:shadow-[0_0_24px_-6px_rgba(47,107,255,0.8)] focus:outline-none"
              />
            </span>
          </label>
          <Boton type="submit" disabled={ocupado || !clave} className="w-full">
            {ocupado ? "Revisando…" : "Seguir"}
          </Boton>
        </form>
        {aviso}
        {noSoyYo}
      </FondoEntrada>
    );
  }

  if (paso.tipo === "pin") {
    return (
      <FondoEntrada compacta>
        {encabezado(`Tu PIN, ${persona.nombre}`, "Los 4 números que creaste para el panel.")}
        {aviso}
        <TecladoPin alCompletar={(pin) => terminar(persona, paso.clave, pin)} />
        {noSoyYo}
      </FondoEntrada>
    );
  }

  if (paso.tipo === "crear") {
    return (
      <FondoEntrada compacta>
        {encabezado("Crea tu PIN", "4 números para abrir el panel. Evita 1234 o tu fecha de nacimiento.")}
        {aviso}
        <TecladoPin
          key="crear"
          alCompletar={async (pin) => {
            if (pinDemasiadoFacil(pin)) {
              setError(MENSAJE_PIN_FACIL);
              return false;
            }
            setError(null);
            setPaso({ tipo: "repetir", persona, clave: paso.clave, primero: pin });
            return true;
          }}
        />
        {noSoyYo}
      </FondoEntrada>
    );
  }

  return (
    <FondoEntrada compacta>
      {encabezado("Repite tu PIN", "Para estar seguros de que quedó bien.")}
      {aviso}
      <TecladoPin
        key="repetir"
        alCompletar={async (pin) => {
          if (pin !== paso.primero) {
            setError("No coinciden. Créalo de nuevo.");
            setPaso({ tipo: "crear", persona, clave: paso.clave });
            return false;
          }
          // Si el servidor no lo acepta, se vuelve a crear: repetir un PIN rechazado no lleva a nada.
          const sirvio = await terminar(persona, paso.clave, pin);
          if (!sirvio) setPaso({ tipo: "crear", persona, clave: paso.clave });
          return sirvio;
        }}
      />
      {noSoyYo}
    </FondoEntrada>
  );
}
