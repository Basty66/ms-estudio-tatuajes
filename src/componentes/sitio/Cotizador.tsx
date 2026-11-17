"use client";

import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Fotos } from "@/lib/contenido";
import { ESTILOS_PRECIO, estimar, pesos, TAMANOS, type EstiloPrecio, type Precios, type Tamano } from "@/lib/precios";
import { BotonMagnetico } from "./BotonMagnetico";
import { useEstudio } from "./DatosEstudio";
import { clave, MapaCuerpo, nombreZona, textoLado, type Eleccion } from "./MapaCuerpo";
import { Estrella } from "./Marquesina";
import { Ornamento } from "./Ornamento";
import { Titulo } from "./Titulo";

const PASOS = ["Cotizas", "Reservas con abono", "Apruebas el diseño", "Te tatúas"];

function Cifra({ valor }: { valor: number }) {
  const mv = useMotionValue(valor);
  const texto = useTransform(mv, (v) => pesos(Math.round(v / 1000) * 1000));
  useEffect(() => {
    const control = animate(mv, valor, { duration: 0.7, ease: [0.16, 1, 0.3, 1] });
    return () => control.stop();
  }, [mv, valor]);
  return <motion.span className="whitespace-nowrap tabular-nums">{texto}</motion.span>;
}

function Grupo({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-[13px] font-semibold tracking-[0.08em] text-ceniza uppercase">
        {titulo}
        {nota && <span className="text-[12px] font-normal tracking-normal normal-case">{nota}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

/** Lo que dice el mapa: la zona elegida (o la que está bajo el cursor), su lado y si tiene recargo. */
function Lectura({ eleccion, previa: bajoCursor, recargos }: { eleccion: Eleccion; previa: Eleccion | null; recargos: Precios["zonas"] }) {
  // Pasar sobre la zona que ya está elegida no es una vista previa.
  const previa = bajoCursor && clave(bajoCursor) !== clave(eleccion) ? bajoCursor : null;
  const mostrada = previa ?? eleccion;
  const recargo = recargos[mostrada.zona] ?? 0;
  return (
    <div aria-live="polite" className="min-w-0">
      <p className="text-[12px] font-semibold tracking-[0.08em] text-ceniza uppercase">{previa ? "Toca para elegir" : "Zona elegida"}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={clave(mostrada)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <p className={`mt-1 font-gotica text-[clamp(2rem,9vw,2.75rem)] leading-none lg:text-[2.75rem] ${previa ? "text-piel/60" : "text-piel [text-shadow:0_0_24px_rgba(47,107,255,0.7)]"}`}>
            {nombreZona(mostrada.zona)}
          </p>
          <p className="mt-2 inline-flex rounded-full border border-linea px-2.5 py-1 text-[12px] text-piel/85">{textoLado(mostrada.lado)}</p>
          <p className="mt-2 text-[13px] leading-snug text-ceniza">
            {recargo > 0 ? `Piel fina o con movimiento: +${recargo}% al rango.` : "Zona cómoda: sin recargo."}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Cotizador en una sola tarjeta: el cuerpo a un lado y las opciones al otro,
 * con el rango y el botón siempre a la vista. Cada zona se elige con su lado.
 *
 * Los montos y la foto de muestra de cada estilo se cambian desde el panel
 * (Web → Precios y Fotos).
 */
export function Cotizador({ precios, fotos }: { precios: Precios; fotos: Fotos }) {
  const { whatsappCon } = useEstudio();
  const [eleccion, setEleccion] = useState<Eleccion>({ zona: "antebrazo", lado: "izq" });
  const [previa, setPrevia] = useState<Eleccion | null>(null);
  const [tamano, setTamano] = useState<Tamano>("mediano");
  const [estilo, setEstilo] = useState<EstiloPrecio>("fineline");
  const [idea, setIdea] = useState("");
  const resultado = useRef<HTMLDivElement>(null);
  const [resultadoVisible, setResultadoVisible] = useState(false);
  const rango = estimar(precios, tamano, estilo, eleccion.zona);

  const nombre = (lista: readonly { id: string; nombre: string }[], id: string) => lista.find((x) => x.id === id)?.nombre ?? id;
  const zonaTexto = `${nombreZona(eleccion.zona)}${eleccion.lado ? ` (${textoLado(eleccion.lado).toLowerCase()})` : ""}`;

  const mensaje = [
    "Hola, quiero pedir hora para un tatuaje.",
    `Tamaño: ${nombre(TAMANOS, tamano)}`,
    `Zona: ${zonaTexto}`,
    `Estilo: ${nombre(ESTILOS_PRECIO, estilo)}`,
    `Rango de la web: ${pesos(rango.min)} a ${pesos(rango.max)}`,
    idea.trim() && `Idea: ${idea.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Cada combinación distinta se anota una vez: el estudio recibe el aviso
  // aunque la persona nunca llegue a mandar el WhatsApp.
  const anotada = useRef("");
  const anotar = () => {
    const datos = { zona: eleccion.zona, lado: eleccion.lado, tamano, estilo, idea: idea.trim() };
    const clave = JSON.stringify(datos);
    if (clave === anotada.current) return;
    anotada.current = clave;
    try {
      navigator.sendBeacon("/api/cotizacion", new Blob([clave], { type: "application/json" }));
    } catch {
      // Sin beacon no se anota; el WhatsApp se abre igual.
    }
  };

  // En el teléfono la barra de abajo repite el rango y el botón: sobra
  // cuando el bloque del resultado ya está en pantalla.
  useEffect(() => {
    const el = resultado.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => setResultadoVisible(e.isIntersecting), { threshold: 0.4 });
    o.observe(el);
    return () => o.disconnect();
  }, []);

  return (
    <section id="cotiza" aria-labelledby="titulo-cotiza" className="relative mx-auto max-w-[1400px] px-4 py-24 sm:px-8 lg:py-36">
      <Ornamento tipo="ojo" className="top-10 right-[6%] hidden w-36 lg:block" />
      <Titulo id="titulo-cotiza" bajada="Toca la zona, elige tamaño y estilo: el rango aparece al instante. El precio final lo vemos con tu diseño.">
        Cotiza
      </Titulo>

      <div className="relative mt-10 overflow-hidden rounded-[28px] border border-linea bg-hollin/80 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] lg:mt-14 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-stencil/15 blur-3xl" />

        {/* ---------- Cuerpo ---------- */}
        <div className="relative grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center gap-4 border-b border-linea p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_11rem] lg:border-r lg:border-b-0 lg:p-8">
          <MapaCuerpo valor={eleccion} cambiar={setEleccion} previa={setPrevia} className="max-w-[300px] lg:max-w-[250px]" />
          <Lectura eleccion={eleccion} previa={previa} recargos={precios.zonas} />
        </div>

        {/* ---------- Opciones y resultado ---------- */}
        <form className="relative flex flex-col gap-7 p-4 sm:p-6 lg:p-8" onSubmit={(e) => e.preventDefault()}>
          <Grupo titulo="Tamaño">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TAMANOS.map((t, i) => {
                const activo = t.id === tamano;
                return (
                  <label
                    key={t.id}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-[border-color,box-shadow,background-color] duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-stencil-claro ${
                      activo ? "border-stencil bg-stencil/10 shadow-[0_0_24px_-8px_rgba(47,107,255,0.9)]" : "border-linea hover:border-ceniza/60"
                    }`}
                  >
                    <input type="radio" name="tamano" value={t.id} checked={activo} onChange={() => setTamano(t.id)} className="sr-only" />
                    <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center">
                      <Estrella
                        className={`transition-colors duration-300 ${activo ? "text-stencil drop-shadow-[0_0_8px_rgba(47,107,255,0.9)]" : "text-ceniza/45"}`}
                        style={{ width: `${10 + i * 6}px`, height: `${10 + i * 6}px` }}
                      />
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[14px] font-semibold">{t.id === "manga" ? "Manga" : t.nombre}</span>
                      <span className="block truncate text-[12px] text-ceniza">{t.detalle}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Grupo>

          <Grupo titulo="Estilo">
            <div className="flex flex-wrap gap-2">
              {ESTILOS_PRECIO.map((e) => {
                const activo = e.id === estilo;
                const foto = fotos[`estilo-${e.id}`]?.src;
                return (
                  <label
                    key={e.id}
                    className={`relative inline-flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-[14px] transition-[border-color,background-color,color] duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-stencil-claro ${
                      activo ? "border-stencil bg-stencil/10 text-piel" : "border-linea text-ceniza hover:border-ceniza/60 hover:text-piel"
                    }`}
                  >
                    <input type="radio" name="estilo" value={e.id} checked={activo} onChange={() => setEstilo(e.id)} className="sr-only" />
                    <span aria-hidden className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full border ${activo ? "border-stencil" : "border-linea"}`}>
                      {foto ? (
                        <Image src={foto} alt="" fill sizes="32px" className={`object-cover transition-[filter] duration-300 ${activo ? "" : "grayscale"}`} />
                      ) : (
                        <span className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(138,168,255,0.8),rgba(12,31,107,0.9))]" />
                      )}
                    </span>
                    <span className="font-semibold">{e.nombre}</span>
                    {precios.estilos[e.id] > 0 && <span className="text-[12px] text-ceniza">+{pesos(precios.estilos[e.id])}</span>}
                  </label>
                );
              })}
            </div>
          </Grupo>

          <Grupo titulo="Tu idea" nota="Opcional">
            <label htmlFor="idea" className="sr-only">
              Cuéntame qué te imaginas
            </label>
            <textarea
              id="idea"
              rows={2}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ej.: el nombre de mi hija en lettering fino, bajo la muñeca"
              className="w-full resize-none rounded-2xl border border-linea bg-tinta/60 px-4 py-3 text-[15px] text-piel placeholder:text-ceniza/60 focus:border-stencil focus:shadow-[0_0_24px_-6px_rgba(47,107,255,0.8)] focus:outline-none"
            />
          </Grupo>

          <div ref={resultado} className="relative overflow-hidden rounded-3xl border border-stencil/40 bg-tinta/80 p-5 shadow-[0_0_50px_-20px_rgba(47,107,255,0.8)] sm:p-6">
            <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 h-48 w-48 rounded-full bg-stencil/25 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[13px] text-ceniza">Rango estimado</p>
                <p className="mt-1 text-[clamp(1.9rem,6.5vw,2.75rem)] leading-tight font-semibold tracking-[-0.03em]" aria-live="polite">
                  <Cifra valor={rango.min} />
                  <span className="text-ceniza"> a </span>
                  <Cifra valor={rango.max} />
                </p>
                <p className="mt-1 text-[13px] text-ceniza">
                  {nombre(TAMANOS, tamano)} · {zonaTexto.toLowerCase()} · {nombre(ESTILOS_PRECIO, estilo).toLowerCase()}
                </p>
              </div>
              <BotonMagnetico href={whatsappCon(mensaje)} externo alTocar={anotar} className="shrink-0 shadow-[0_0_40px_-8px_rgba(47,107,255,0.9)]">
                Pedir hora con esta idea
              </BotonMagnetico>
            </div>
            <ol className="relative mt-5 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-linea pt-4 text-[12px] text-ceniza">
              {PASOS.map((p, i) => (
                <li key={p} className="flex items-center gap-1.5">
                  <span className="font-gotica text-[15px] leading-none text-stencil-claro">{i + 1}</span>
                  {p}
                </li>
              ))}
            </ol>
          </div>
        </form>
      </div>

      {/* Teléfono: el rango queda a la vista mientras se elige, pegado abajo. */}
      <div
        aria-hidden={resultadoVisible}
        className={`pointer-events-none sticky z-30 mt-6 mr-[72px] transition-[opacity,translate] duration-300 lg:hidden ${resultadoVisible ? "translate-y-4 opacity-0" : ""}`}
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className={`flex ${resultadoVisible ? "" : "pointer-events-auto"} items-center justify-between gap-2 rounded-full border border-linea bg-tinta/[0.94] py-2 pr-2 pl-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85),0_0_30px_-10px_rgba(47,107,255,0.7)]`}>
          <span className="text-[14px] font-semibold whitespace-nowrap tabular-nums">
            <Cifra valor={rango.min} />
            <span className="text-ceniza"> a </span>
            <Cifra valor={rango.max} />
          </span>
          <a
            href={whatsappCon(mensaje)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={anotar}
            className="boton-cromo inline-flex min-h-11 shrink-0 items-center rounded-full bg-[image:var(--acero)] px-4 text-sm font-semibold whitespace-nowrap text-tinta"
          >
            Pedir hora
          </a>
        </div>
      </div>
    </section>
  );
}
