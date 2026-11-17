"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { guardarContenido, restaurarContenido } from "@/app/tinta/_acciones/contenido";
import type { ClaveBloque, Par } from "@/lib/contenido";
import { Boton } from "./Boton";
import { campo, Etiqueta } from "./FormularioCita";
import { Atras, Cerrar, Flecha, Mas, Ojo } from "./Iconos";
import { VistaPrevia } from "./VistaPrevia";

type Mensaje = { texto: string; malo: boolean };

/**
 * Estado de un editor de la sección "Web": el valor que se está editando, si
 * cambió respecto de lo guardado, y guardar o volver a lo de fábrica.
 */
export function useEditor<T>(clave: Exclude<ClaveBloque, "fotos">, inicial: T) {
  const router = useRouter();
  const [valor, setValor] = useState(inicial);
  const [base, setBase] = useState(JSON.stringify(inicial));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  async function correr(accion: () => Promise<{ ok: true } | { ok: false; error: string }>, listo: string) {
    setMensaje(null);
    setGuardando(true);
    try {
      const r = await accion();
      if (!r.ok) return setMensaje({ texto: r.error, malo: true });
      setMensaje({ texto: listo, malo: false });
      router.refresh();
    } catch {
      setMensaje({ texto: "No hubo conexión. Revisa la señal y vuelve a probar.", malo: true });
    } finally {
      setGuardando(false);
    }
  }

  return {
    clave,
    valor,
    cambiar: (v: T) => {
      setValor(v);
      setMensaje(null);
    },
    cambiado: JSON.stringify(valor) !== base,
    guardando,
    mensaje,
    guardar: () =>
      correr(async () => {
        const r = await guardarContenido(clave, valor);
        if (r.ok) setBase(JSON.stringify(valor));
        return r;
      }, "Guardado. Ya se ve en la web."),
    restaurar: () => {
      if (!window.confirm("¿Volver a como venía de fábrica? Se pierde lo que cambiaste acá.")) return;
      // Se recarga entera: el editor tiene que partir de nuevo desde lo de fábrica.
      void correr(async () => {
        const r = await restaurarContenido(clave);
        if (r.ok) window.location.reload();
        return r;
      }, "Listo, quedó como venía de fábrica.");
    },
  };
}

/** Los bloques que tienen una sección de la web para mostrar en la vista previa. */
const CON_VISTA = ["estudio", "precios", "tatuador", "preguntas", "cuidados", "consentimiento"];

/** Guardar siempre a la vista, sobre la barra de abajo del teléfono, y al lado ver cómo queda. */
export function BarraGuardar({
  clave,
  valor,
  cambiado,
  guardando,
  mensaje,
  guardar,
  restaurar,
}: {
  clave?: string;
  valor?: unknown;
  cambiado: boolean;
  guardando: boolean;
  mensaje: Mensaje | null;
  guardar: () => void;
  restaurar?: () => void;
}) {
  const [viendo, setViendo] = useState(false);
  const cerrar = useCallback(() => setViendo(false), []);
  const conVista = clave && CON_VISTA.includes(clave);
  return (
    <div
      className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-4 border-t border-linea/80 bg-tinta/[0.94] px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:bottom-4 lg:mx-0 lg:rounded-3xl lg:border lg:px-5"
    >
      <div className="flex items-center gap-3">
        <p role={mensaje?.malo ? "alert" : "status"} className={`min-w-0 flex-1 text-[13px] leading-snug ${mensaje ? (mensaje.malo ? "font-semibold text-[#ff8a80]" : "font-semibold text-[#6ee7b7]") : "text-ceniza"}`}>
          {mensaje?.texto ?? (cambiado ? "Hay cambios sin guardar." : "Sin cambios.")}
        </p>
        {restaurar && (
          <Boton variante="fantasma" disabled={guardando} onClick={restaurar} className="min-h-11 shrink-0 px-2 text-[13px]">
            De fábrica
          </Boton>
        )}
        {conVista && (
          <Boton variante="linea" onClick={() => setViendo(true)} className="min-h-11 shrink-0 px-4 text-[14px]">
            <Ojo className="size-4" /> <span className="hidden sm:inline">Vista previa</span>
            <span className="sm:hidden">Ver</span>
          </Boton>
        )}
        <Boton disabled={guardando || !cambiado} onClick={guardar} className="min-h-11 shrink-0 px-5">
          {guardando ? "Guardando…" : "Guardar"}
        </Boton>
      </div>
      {viendo && clave && <VistaPrevia bloque={clave} valor={valor} cerrar={cerrar} />}
    </div>
  );
}

/** Un campo de texto con su rótulo y, si se acerca al tope, cuánto queda. */
export function Campo({
  etiqueta,
  valor,
  cambiar,
  max,
  lineas = 1,
  placeholder,
  inputMode,
}: {
  etiqueta: string;
  valor: string;
  cambiar: (v: string) => void;
  max: number;
  lineas?: number;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const quedan = max - valor.length;
  return (
    <label className="block min-w-0">
      <Etiqueta nota={valor.length > max * 0.85 ? `${Math.max(0, quedan)} letras más` : undefined}>{etiqueta}</Etiqueta>
      {lineas > 1 ? (
        <textarea value={valor} onChange={(e) => cambiar(e.target.value.slice(0, max))} rows={lineas} placeholder={placeholder} className={`${campo} resize-y py-3 leading-snug`} />
      ) : (
        <input value={valor} onChange={(e) => cambiar(e.target.value.slice(0, max))} placeholder={placeholder} inputMode={inputMode} className={campo} />
      )}
    </label>
  );
}

/**
 * Una lista de pares título + texto (preguntas, hitos, datos), con subir,
 * bajar, quitar y agregar. Con `fijos` no se agrega ni se quita: la web está
 * dibujada para ese número exacto.
 */
export function ListaPares({
  valor,
  cambiar,
  rotulos,
  largos,
  tope = 12,
  fijos = false,
}: {
  valor: Par[];
  cambiar: (v: Par[]) => void;
  rotulos: [string, string];
  largos: [number, number];
  tope?: number;
  fijos?: boolean;
}) {
  const poner = (i: number, p: Partial<Par>) => cambiar(valor.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const mover = (i: number, paso: number) => {
    const otra = [...valor];
    [otra[i], otra[i + paso]] = [otra[i + paso], otra[i]];
    cambiar(otra);
  };
  const redondo = "grid size-9 place-items-center rounded-full text-ceniza hover:text-piel disabled:opacity-25";

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {valor.map((p, i) => (
          <li key={i} className="rounded-2xl border border-linea bg-tinta/50 p-3 sm:p-4">
            <div className="mb-2 flex items-center gap-1">
              <span className="flex-1 text-[12px] font-semibold text-stencil-claro tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              {!fijos && (
                <>
                  <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)} className={`${redondo} rotate-90`}>
                    <Atras className="size-4" />
                  </button>
                  <button type="button" aria-label="Bajar" disabled={i === valor.length - 1} onClick={() => mover(i, 1)} className={`${redondo} rotate-90`}>
                    <Flecha className="size-4" />
                  </button>
                  <button type="button" aria-label="Quitar" disabled={valor.length <= 1} onClick={() => cambiar(valor.filter((_, j) => j !== i))} className={`${redondo} hover:text-[#ff8a80]`}>
                    <Cerrar className="size-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Campo etiqueta={rotulos[0]} valor={p.titulo} cambiar={(v) => poner(i, { titulo: v })} max={largos[0]} />
              <Campo etiqueta={rotulos[1]} valor={p.texto} cambiar={(v) => poner(i, { texto: v })} max={largos[1]} lineas={largos[1] > 160 ? 4 : 2} />
            </div>
          </li>
        ))}
      </ol>
      {!fijos && valor.length < tope && (
        <Boton variante="linea" onClick={() => cambiar([...valor, { titulo: "", texto: "" }])} className="min-h-11">
          <Mas className="size-4" /> Agregar
        </Boton>
      )}
    </div>
  );
}

/** Una lista simple, una cosa por línea: es lo más cómodo de escribir en el teléfono. */
export function Lineas({ etiqueta, valor, cambiar, max = 160, nota }: { etiqueta: string; valor: string[]; cambiar: (v: string[]) => void; max?: number; nota?: string }) {
  // Se edita el texto tal cual (con líneas vacías incluidas) y se limpia al guardar.
  const [texto, setTexto] = useState(valor.join("\n"));
  return (
    <label className="block">
      <Etiqueta nota={nota ?? "Una por línea"}>{etiqueta}</Etiqueta>
      <textarea
        value={texto}
        rows={Math.max(3, valor.length + 1)}
        onChange={(e) => {
          setTexto(e.target.value);
          cambiar(e.target.value.split("\n").map((l) => l.slice(0, max)));
        }}
        className={`${campo} resize-y py-3 leading-relaxed`}
      />
    </label>
  );
}
