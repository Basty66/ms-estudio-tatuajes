"use client";

import { useEffect, useState } from "react";
import { FormularioConsentimiento } from "@/componentes/consentimiento/FormularioConsentimiento";
import { Cotizador } from "@/componentes/sitio/Cotizador";
import { Cuidados } from "@/componentes/sitio/Cuidados";
import { ProveedorEstudio } from "@/componentes/sitio/DatosEstudio";
import { Pie } from "@/componentes/sitio/Pie";
import { Preguntas } from "@/componentes/sitio/Preguntas";
import { Tatuador } from "@/componentes/sitio/Tatuador";
import { armarTexto, normalizarTextosConsentimiento, preguntasPara } from "@/lib/consentimiento";
import { normalizarCuidados, normalizarEstudio, normalizarPreguntas, normalizarTatuador, type Contenido, type Foto } from "@/lib/contenido";
import { normalizarPrecios } from "@/lib/precios";

/**
 * Lo que se ve dentro de la vista previa del panel: la sección de verdad de
 * la web, con el borrador que manda el editor. El borrador pasa por la misma
 * revisión que al guardar, así que se ve exactamente lo que va a quedar.
 */
const REVISAR: Partial<Record<keyof Contenido, (v: unknown) => unknown>> = {
  estudio: normalizarEstudio,
  precios: normalizarPrecios,
  tatuador: normalizarTatuador,
  preguntas: normalizarPreguntas,
  cuidados: normalizarCuidados,
  consentimiento: normalizarTextosConsentimiento,
};

export function VistaEnVivo({ base, bloque, hoy }: { base: Contenido; bloque: string; hoy: string }) {
  const [c, setC] = useState(base);

  useEffect(() => {
    const oir = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.tipo !== "vista-previa" || e.data.bloque !== bloque) return;
      const revisar = REVISAR[bloque as keyof Contenido];
      if (revisar) setC((x) => ({ ...x, [bloque]: revisar(e.data.valor) }));
    };
    window.addEventListener("message", oir);
    window.parent.postMessage({ tipo: "vista-lista" }, window.location.origin);
    return () => window.removeEventListener("message", oir);
  }, [bloque]);

  const foto = (clave: string) => c.fotos[clave] as Foto;

  return (
    <ProveedorEstudio estudio={c.estudio}>
      {bloque === "estudio" && <Pie estudio={c.estudio} />}
      {bloque === "precios" && <Cotizador precios={c.precios} fotos={c.fotos} />}
      {bloque === "tatuador" && <Tatuador textos={c.tatuador} grande={foto("tatuador-1")} chica={foto("tatuador-2")} />}
      {bloque === "preguntas" && <Preguntas preguntas={c.preguntas} />}
      {bloque === "cuidados" && <Cuidados cuidados={c.cuidados} />}
      {bloque === "consentimiento" && (
        <main className="mx-auto w-full max-w-[40rem] px-4 pt-6 pb-44 sm:px-6">
          <FormularioConsentimiento
            muestra
            pasoInicial={2}
            token="vista-previa-del-panel-sin-firma-real-0000000"
            enEstudio={false}
            volver={null}
            hoy={hoy}
            cuando="Jueves 20 de noviembre, 15:00"
            detalle="Tatuaje · Antebrazo derecho · Nombre en fineline"
            nombre="Camila Rojas"
            telefono="+56 9 1234 5678"
            texto={armarTexto(c.consentimiento, "tatuaje", c.estudio.responsable)}
            preguntas={preguntasPara("tatuaje")}
            estudio={{ nombre: c.estudio.nombre, whatsapp: c.estudio.whatsapp }}
          />
        </main>
      )}
    </ProveedorEstudio>
  );
}
