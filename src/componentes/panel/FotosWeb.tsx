"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cambiarFotoWeb, quitarFotoWeb } from "@/app/tinta/_acciones/contenido";
import { reducirImagen } from "@/lib/admin/imagenes";
import type { Foto } from "@/lib/contenido";
import { Boton } from "./Boton";
import { campo, Etiqueta } from "./FormularioCita";
import { Subir } from "./Iconos";

/**
 * Un lugar fijo de la web (un retrato, un paso de la sesión…) con su foto.
 * Se elige la nueva, se ve cómo queda, se describe y se publica. "Volver a la
 * original" deja la de fábrica y borra la subida.
 */
export function FotoWeb({
  clave,
  titulo,
  foto,
  cambiada,
  puedeSubir,
}: {
  clave: string;
  titulo: string;
  foto: Foto | null;
  cambiada: boolean;
  puedeSubir: boolean;
}) {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [alt, setAlt] = useState(foto?.alt ?? "");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function descartar() {
    if (vista) URL.revokeObjectURL(vista);
    setArchivo(null);
    setVista(null);
    setError(null);
  }

  async function publicar() {
    if (!archivo) return;
    setError(null);
    setOcupado(true);
    try {
      const reducida = await reducirImagen(archivo);
      const bitmap = await createImageBitmap(reducida);
      const f = new FormData();
      f.set("clave", clave);
      f.set("foto", new File([reducida], "foto.jpg", { type: "image/jpeg" }));
      f.set("alt", alt);
      f.set("ancho", String(bitmap.width));
      f.set("alto", String(bitmap.height));
      bitmap.close();
      const r = await cambiarFotoWeb(f);
      if (!r.ok) return setError(r.error);
      descartar();
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "No se pudo subir.");
    } finally {
      setOcupado(false);
    }
  }

  async function original() {
    if (!window.confirm("¿Volver a la foto original? La que subiste se borra.")) return;
    setOcupado(true);
    try {
      const r = await quitarFotoWeb(clave);
      if (!r.ok) return setError(r.error);
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <li className={`flex flex-col overflow-hidden rounded-2xl border bg-hollin/70 ${archivo ? "border-stencil/60" : "border-linea"}`}>
      <div className="relative aspect-[4/5] bg-tinta">
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), no pasa por el optimizador
          <img src={vista} alt="" className="absolute inset-0 size-full object-cover" />
        ) : foto ? (
          <Image src={foto.src} alt={foto.alt} fill sizes="(min-width: 1024px) 20vw, 45vw" className="object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center p-4 text-center text-[13px] text-ceniza">Sin foto todavía</span>
        )}
        <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur ${archivo ? "bg-stencil text-piel" : cambiada ? "bg-tinta/80 text-[#6ee7b7]" : "bg-tinta/80 text-ceniza"}`}>
          {archivo ? "Sin publicar" : cambiada ? "Tuya" : "Original"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-[14px] leading-tight font-semibold">{titulo}</p>
        {archivo ? (
          <>
            <label>
              <Etiqueta>Qué se ve</Etiqueta>
              <input value={alt} onChange={(e) => setAlt(e.target.value.slice(0, 160))} placeholder="Ej.: retrato en el estudio" className={`${campo} min-h-11 text-[14px]`} />
            </label>
            {error && <p className="text-[13px] font-semibold text-[#ff8a80]">{error}</p>}
            <div className="mt-auto flex gap-1.5">
              <Boton variante="fantasma" disabled={ocupado} onClick={descartar} className="min-h-10 px-2 text-[13px]">
                Cancelar
              </Boton>
              <Boton disabled={ocupado || alt.trim().length < 3} onClick={publicar} className="min-h-10 flex-1 px-3 text-[13px]">
                {ocupado ? "Subiendo…" : "Publicar"}
              </Boton>
            </div>
          </>
        ) : (
          <>
            {error && <p className="text-[13px] font-semibold text-[#ff8a80]">{error}</p>}
            <div className="mt-auto flex flex-col gap-1">
              <label
                className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-linea px-3 text-[13px] font-semibold hover:border-ceniza/60 ${puedeSubir ? "" : "pointer-events-none opacity-40"}`}
              >
                <Subir className="size-4" /> Cambiar
                <input
                  type="file"
                  accept="image/*"
                  disabled={!puedeSubir}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    if (!f) return;
                    setArchivo(f);
                    setVista(URL.createObjectURL(f));
                  }}
                />
              </label>
              {cambiada && (
                <button type="button" disabled={ocupado} onClick={original} className="min-h-9 text-[12px] text-ceniza hover:text-piel disabled:opacity-40">
                  Volver a la original
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </li>
  );
}
