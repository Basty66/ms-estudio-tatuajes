"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { borrarFoto, cambiarFoto, editarFoto, subirFoto } from "@/app/tinta/_acciones/panel";
import { reducirImagen } from "@/lib/admin/imagenes";
import { ESTILOS, type Trabajo } from "@/lib/estudio";
import { ZONAS } from "@/lib/precios";
import { Boton } from "./Boton";
import { campo, Chip, Etiqueta } from "./FormularioCita";
import { Atras, Flecha, Lapiz, Ojo, Papelera, Subir } from "./Iconos";

/** Subir un trabajo: se reduce en el teléfono, se describe y queda primero en la web. */
export function SubirFoto() {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [estilo, setEstilo] = useState<string>("Lettering");
  const [zona, setZona] = useState("Antebrazo");
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      const reducida = await reducirImagen(archivo);
      const bitmap = await createImageBitmap(reducida);
      const f = new FormData();
      f.set("foto", new File([reducida], "trabajo.jpg", { type: "image/jpeg" }));
      f.set("alt", alt);
      f.set("estilo", estilo);
      f.set("zona", zona);
      f.set("ancho", String(bitmap.width));
      f.set("alto", String(bitmap.height));
      bitmap.close();
      const r = await subirFoto(f);
      if (!r.ok) return setError(r.error);
      setArchivo(null);
      setVista(null);
      setAlt("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "No se pudo subir.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 rounded-3xl border border-linea bg-hollin/70 p-4 sm:p-5">
      <label className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-linea text-ceniza hover:border-stencil/60 hover:text-piel">
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), no pasa por el optimizador
          <img src={vista} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            <Subir className="size-7" />
            <span className="text-[14px]">Elegir foto del trabajo</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setArchivo(f);
            setVista(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>
      {archivo && (
        <>
          <label>
            <Etiqueta>Descripción</Etiqueta>
            <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Ej.: rosa fineline con nombre en el antebrazo" className={campo} />
          </label>
          <div>
            <Etiqueta>Estilo</Etiqueta>
            <div className="flex flex-wrap gap-2">
              {ESTILOS.map((x) => (
                <Chip key={x} activo={estilo === x} onClick={() => setEstilo(x)}>
                  {x}
                </Chip>
              ))}
            </div>
          </div>
          <label>
            <Etiqueta>Zona</Etiqueta>
            <select value={zona} onChange={(e) => setZona(e.target.value)} className={`${campo} [color-scheme:dark]`}>
              {[...new Set(ZONAS.map((z) => z.nombre))].sort((a, b) => a.localeCompare(b, "es")).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          {error && <p className="text-[14px] font-semibold text-[#ff8a80]">{error}</p>}
          <Boton type="submit" disabled={subiendo || alt.trim().length < 3}>
            {subiendo ? "Subiendo…" : "Publicar en la web"}
          </Boton>
        </>
      )}
    </form>
  );
}

export function FotoGaleria({ f, primera, ultima }: { f: Trabajo & { id: number; visible: boolean }; primera: boolean; ultima: boolean }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [editando, setEditando] = useState(false);
  const [alt, setAlt] = useState(f.alt);
  const [estilo, setEstilo] = useState(f.estilo);
  const [zona, setZona] = useState(f.zona);
  const hacer = (accion: () => Promise<{ ok: boolean; error?: string }>) =>
    iniciar(async () => {
      const r = await accion();
      if (!r.ok && r.error) window.alert(r.error);
      router.refresh();
    });

  return (
    <li className={`overflow-hidden rounded-2xl border border-linea bg-hollin/70 ${f.visible ? "" : "opacity-50"} ${pendiente ? "animate-pulse" : ""}`}>
      <div className="relative aspect-[4/5]">
        <Image src={f.src} alt={f.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        {!f.visible && <span className="absolute top-2 left-2 rounded-full bg-tinta/80 px-2 py-0.5 text-[11px]">Oculta</span>}
      </div>
      <div className="p-2.5">
        {editando ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              hacer(async () => {
                const r = await editarFoto(f.id, { alt, estilo, zona });
                if (r.ok) setEditando(false);
                return r;
              });
            }}
          >
            <textarea value={alt} onChange={(e) => setAlt(e.target.value.slice(0, 160))} rows={3} aria-label="Descripción" className={`${campo} resize-none px-3 py-2 text-[13px]`} />
            <select value={estilo} onChange={(e) => setEstilo(e.target.value)} aria-label="Estilo" className={`${campo} min-h-10 px-3 text-[13px] [color-scheme:dark]`}>
              {[...new Set([...ESTILOS, f.estilo])].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select value={zona} onChange={(e) => setZona(e.target.value)} aria-label="Zona" className={`${campo} min-h-10 px-3 text-[13px] [color-scheme:dark]`}>
              {[...new Set([...ZONAS.map((z) => z.nombre), f.zona])].sort((a, b) => a.localeCompare(b, "es")).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <Boton variante="fantasma" onClick={() => setEditando(false)} className="min-h-9 px-2 text-[13px]">
                Cancelar
              </Boton>
              <Boton type="submit" disabled={pendiente || alt.trim().length < 3} className="min-h-9 flex-1 px-2 text-[13px]">
                Guardar
              </Boton>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setEditando(true)} className="group block w-full text-left">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              <span className="truncate">{f.estilo}</span>
              <Lapiz className="size-3.5 shrink-0 text-ceniza group-hover:text-piel" />
            </span>
            <span className="block truncate text-[12px] text-ceniza">{f.zona}</span>
          </button>
        )}
        <div className={`mt-2 flex justify-between ${editando ? "hidden" : ""}`}>
          <button type="button" aria-label="Mover antes" disabled={primera || pendiente} onClick={() => hacer(() => cambiarFoto(f.id, { mover: -1 }))} className="grid size-9 place-items-center rounded-full text-ceniza hover:text-piel disabled:opacity-25">
            <Atras className="size-4" />
          </button>
          <button type="button" aria-label={f.visible ? "Ocultar de la web" : "Mostrar en la web"} disabled={pendiente} onClick={() => hacer(() => cambiarFoto(f.id, { visible: !f.visible }))} className="grid size-9 place-items-center rounded-full text-ceniza hover:text-piel">
            <Ojo className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Borrar"
            disabled={pendiente}
            onClick={() => window.confirm("¿Borrar esta foto de la web?") && hacer(() => borrarFoto(f.id))}
            className="grid size-9 place-items-center rounded-full text-ceniza hover:text-[#ff8a80]"
          >
            <Papelera className="size-4" />
          </button>
          <button type="button" aria-label="Mover después" disabled={ultima || pendiente} onClick={() => hacer(() => cambiarFoto(f.id, { mover: 1 }))} className="grid size-9 place-items-center rounded-full text-ceniza hover:text-piel disabled:opacity-25">
            <Flecha className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
