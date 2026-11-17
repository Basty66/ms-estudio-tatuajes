"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { anularConsentimiento, borrarDatosCliente, marcarSeguimiento, pedirConsentimiento } from "@/app/tinta/_acciones/consentimientos";
import { fechaCorta, hora } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";
import { IconoWhatsapp } from "@/componentes/sitio/WhatsappFlotante";
import { Boton, claseBoton } from "./Boton";
import { Check, Documento } from "./Iconos";

type Resumen = {
  id: number;
  estado: "firmado" | "pendiente" | "vencido";
  pedido_en: string;
  vence_en: string | null;
  firmado_en: string | null;
  donde: "link" | "estudio" | null;
  permite_fotos: boolean | null;
  menor: boolean;
};

const cuando = (iso: string) => `${fechaCorta(iso)}, ${hora(iso)}`;

/**
 * El consentimiento de una cita: pedirlo (link por WhatsApp o firmar en este
 * teléfono), ver el PDF firmado o anularlo.
 *
 * Mandar por WhatsApp va en dos toques a propósito: primero se crea el link y
 * después se abre WhatsApp con un enlace de verdad. Abrir una ventana después
 * de esperar al servidor lo bloquea el iPhone.
 */
export function ConsentimientoCita({ citaId, resumen, telefono, activa, hecha }: { citaId: number; resumen: Resumen | null; telefono: string | null; activa: boolean; hecha: boolean }) {
  const router = useRouter();
  const [listo, setListo] = useState<{ link: string; mensaje: string; vence: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const pedir = (donde: "link" | "estudio") =>
    iniciar(async () => {
      setError(null);
      const r = await pedirConsentimiento(citaId, donde);
      if (!r.ok) return setError(r.error);
      if (donde === "estudio") return router.push(new URL(r.link).pathname + new URL(r.link).search);
      setListo({ link: r.link, mensaje: r.mensaje, vence: r.vence });
      router.refresh();
    });

  const anular = () => {
    if (!window.confirm("¿Borrar este consentimiento? Se borran la firma y las respuestas de salud, y hay que pedirlo de nuevo.")) return;
    iniciar(async () => {
      const r = await anularConsentimiento(citaId);
      if (!r.ok) setError(r.error);
      setListo(null);
      router.refresh();
    });
  };

  if (resumen?.estado === "firmado" && resumen.firmado_en) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#34d399]/12 text-[#6ee7b7]">
            <Check className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Firmado</span>
            <span className="block truncate text-[13px] text-ceniza">
              {cuando(resumen.firmado_en)} · {resumen.donde === "estudio" ? "en el estudio" : "desde su link"}
              {resumen.menor ? " · con su representante" : ""}
            </span>
          </span>
          <a href={`${PANEL}/consentimiento/${resumen.id}`} target="_blank" rel="noopener noreferrer" className={claseBoton("linea", "min-h-10 shrink-0 px-4 text-[13px]")}>
            <Documento className="size-4" /> PDF
          </a>
        </div>
        {!resumen.permite_fotos && <p className="mt-3 text-[13px] text-[#fbbf24]">No autoriza publicar fotos del trabajo.</p>}
        <button type="button" disabled={pendiente} onClick={anular} className="mt-3 text-[13px] text-ceniza underline-offset-4 hover:text-[#ff8a80] hover:underline disabled:opacity-40">
          Anular y pedirlo de nuevo
        </button>
        {error && <p className="mt-2 text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
      </div>
    );
  }

  if (!activa) return <p className="text-[14px] text-ceniza">La cita no está activa: no hace falta.</p>;
  if (hecha) return <p className="text-[14px] text-ceniza">Esta sesión se hizo sin consentimiento firmado.</p>;

  return (
    <div>
      {resumen?.estado === "pendiente" && resumen.vence_en && !listo ? (
        <>
          <p className="text-[17px] font-semibold text-[#fbbf24]">Esperando la firma</p>
          <p className="mt-1 text-[14px] text-ceniza">Link pedido el {cuando(resumen.pedido_en)}. Vence el {cuando(resumen.vence_en)}.</p>
        </>
      ) : !listo ? (
        <>
          <p className="text-[17px] font-semibold text-[#fbbf24]">Falta el consentimiento</p>
          <p className="mt-1 text-[14px] text-ceniza">Mándale el link para que lo firme antes, o fírmalo acá el día de la sesión.</p>
        </>
      ) : (
        <>
          <p className="text-[17px] font-semibold">Link listo</p>
          <p className="mt-1 text-[14px] text-ceniza">Sirve una vez y vence el {cuando(listo.vence)}.</p>
        </>
      )}

      {listo ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {telefono ? (
            <a
              href={`https://wa.me/${telefono}?text=${encodeURIComponent(listo.mensaje)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(() => setListo(null), 400)}
              className={claseBoton("cromo", "min-h-11 px-3 text-[14px]")}
            >
              <IconoWhatsapp className="size-5 shrink-0" /> Abrir WhatsApp
            </a>
          ) : (
            <span className="self-center text-[13px] text-ceniza">Sin teléfono: copia el link.</span>
          )}
          <Boton
            variante="linea"
            onClick={async () => {
              await navigator.clipboard?.writeText(listo.link).catch(() => undefined);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1800);
            }}
            className="min-h-11 px-3 text-[14px]"
          >
            {copiado ? "Copiado" : "Copiar link"}
          </Boton>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Boton disabled={pendiente} onClick={() => pedir("link")} className="min-h-11 px-3 text-[14px] whitespace-nowrap">
            <IconoWhatsapp className="size-5 shrink-0" /> {resumen?.estado === "pendiente" ? "Reenviar" : "WhatsApp"}
          </Boton>
          <Boton variante="linea" disabled={pendiente} onClick={() => pedir("estudio")} className="min-h-11 px-3 text-[14px] whitespace-nowrap">
            Firmar aquí
          </Boton>
        </div>
      )}
      {error && <p className="mt-2 text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
    </div>
  );
}

/**
 * Un mensaje de seguimiento: abre WhatsApp con el texto listo y lo anota como
 * mandado. El enlace es de verdad (no se espera al servidor) para que el
 * teléfono no lo bloquee.
 */
export function BotonSeguimiento({ citaId, etapa, href, enviado, toca, children }: { citaId: number; etapa: string; href: string; enviado: boolean; toca: boolean; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => void marcarSeguimiento(citaId, etapa).then(() => router.refresh())}
      className={claseBoton(toca && !enviado ? "cromo" : "linea", "min-h-10 shrink-0 px-4 text-[13px]")}
    >
      <IconoWhatsapp className="size-4 shrink-0" /> {children}
    </a>
  );
}

/** Lo que pide la ley cuando un cliente quiere que borren sus datos. */
export function BorrarDatosCliente({ clienteId, nombre }: { clienteId: number; nombre: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (!abierto) {
    return (
      <Boton variante="fantasma" onClick={() => setAbierto(true)} className="min-h-11 w-full text-[14px] hover:text-[#ff8a80]">
        Borrar sus datos personales
      </Boton>
    );
  }

  return (
    <div className="rounded-3xl border border-sangre/40 bg-sangre/[0.06] p-4 sm:p-5">
      <p className="font-semibold">¿Borrar los datos de {nombre}?</p>
      <ul className="mt-3 flex flex-col gap-1.5 text-[14px] leading-snug text-ceniza">
        <li>Se borran sus consentimientos (salud y firma), las fotos de sus trabajos, su teléfono, Instagram y notas.</li>
        <li>Quedan sus pagos y citas sin datos personales: el SII exige guardar los pagos y así las finanzas siguen cuadrando.</li>
        <li className="font-semibold text-[#ff8a80]">No se puede deshacer.</li>
      </ul>
      {error && <p className="mt-3 text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Boton variante="fantasma" disabled={pendiente} onClick={() => setAbierto(false)} className="min-h-11">
          Cancelar
        </Boton>
        <Boton
          variante="peligro"
          disabled={pendiente}
          onClick={() =>
            iniciar(async () => {
              const r = await borrarDatosCliente(clienteId);
              if (!r.ok) return setError(r.error);
              setAbierto(false);
              router.refresh();
            })
          }
          className="min-h-11 flex-1"
        >
          {pendiente ? "Borrando…" : "Borrar para siempre"}
        </Boton>
      </div>
    </div>
  );
}
