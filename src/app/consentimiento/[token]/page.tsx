import { createHash } from "node:crypto";
import type { Metadata } from "next";
import { FormularioConsentimiento } from "@/componentes/consentimiento/FormularioConsentimiento";
import { leerContenido } from "@/db/contenido";
import { pedidoPorToken } from "@/db/consentimientos";
import { nombreDonde, TIPO } from "@/lib/admin/etiquetas";
import { fechaLarga, hora, hoyChile } from "@/lib/admin/fecha";
import { PANEL } from "@/lib/admin/ruta";
import { formatearTelefono } from "@/lib/admin/telefono";
import { armarTexto, preguntasPara } from "@/lib/consentimiento";
import { enlaceWhatsapp } from "@/lib/contenido";

/**
 * El consentimiento que llena el cliente, desde el link de WhatsApp o en el
 * teléfono del estudio ("Firmar aquí").
 *
 * Pública pero escondida: sin el token no hay nada que ver, no se indexa y no
 * manda el link a terceros como referencia (ver next.config.ts). Muestra solo
 * lo que el estudio ya sabe (nombre, teléfono, la cita); nada de lo firmado.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Consentimiento · Matness",
  robots: { index: false, follow: false },
};

export default async function Consentimiento({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ estudio?: string }> }) {
  const { token } = await params;
  const enEstudio = (await searchParams).estudio === "1";
  const valido = /^[\w-]{40,64}$/.test(token);
  const [pedido, { consentimiento, estudio }] = await Promise.all([
    valido ? pedidoPorToken(createHash("sha256").update(token).digest("hex")) : null,
    leerContenido(),
  ]);

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute -top-56 left-1/2 -z-10 h-[55vh] w-[120vw] -translate-x-1/2 rounded-full bg-stencil/15 blur-[120px]" />
      <main className="mx-auto w-full max-w-[40rem] px-4 pb-44 sm:px-6" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}>
        {pedido ? (
          <FormularioConsentimiento
            token={token}
            enEstudio={enEstudio}
            volver={enEstudio ? `${PANEL}/cita/${pedido.cita_id}` : null}
            hoy={hoyChile()}
            cuando={`${fechaLarga(pedido.inicio).replace(/^\w/, (l) => l.toUpperCase())}, ${hora(pedido.inicio)}`}
            detalle={[TIPO[pedido.tipo], nombreDonde(pedido.zona, pedido.lado), pedido.descripcion].filter(Boolean).join(" · ")}
            nombre={pedido.nombre}
            telefono={pedido.telefono ? formatearTelefono(pedido.telefono) : ""}
            texto={armarTexto(consentimiento, pedido.tipo, estudio.responsable)}
            preguntas={preguntasPara(pedido.tipo)}
            estudio={{ nombre: estudio.nombre, whatsapp: estudio.whatsapp }}
          />
        ) : (
          <div className="panel-surge flex min-h-[80dvh] flex-col justify-center">
            <span className="texto-acero font-gotica text-[26px] leading-none">Matness</span>
            <h1 className="mt-12 font-gotica text-[clamp(2.75rem,12vw,4.25rem)] leading-[0.92]">Este link ya no sirve</h1>
            <p className="mt-5 max-w-[30rem] text-[17px] leading-relaxed text-ceniza">
              Puede que ya esté firmado o que haya vencido: cada link dura una semana y sirve una sola vez. Pide uno nuevo y te llega al tiro.
            </p>
            <a
              href={enlaceWhatsapp(estudio.whatsapp, "Hola, necesito un link nuevo para firmar el consentimiento.")}
              className="boton-cromo mt-10 inline-flex min-h-13 items-center justify-center gap-2 self-start rounded-full bg-[image:var(--acero)] px-7 text-[16px] font-semibold text-tinta shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(47,107,255,0.8)]"
            >
              Pedir uno nuevo por WhatsApp
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
