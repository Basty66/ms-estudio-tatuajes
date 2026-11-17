"use client";

import { animate, AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { codigoCotizacion, type Fotos } from "@/lib/contenido";
import { ESTILOS_PRECIO, estimar, estimarLaser, OBJETIVOS_LASER, pesos, TAMANOS, type EstiloPrecio, type ObjetivoLaser, type Precios, type Tamano } from "@/lib/precios";
import { BotonMagnetico } from "./BotonMagnetico";
import { useEstudio } from "./DatosEstudio";
import { clave, MapaCuerpo, nombreZona, textoLado, type Eleccion } from "./MapaCuerpo";
import { Ornamento } from "./Ornamento";
import { TarjetaGracias, type DatosGracias } from "./TarjetaGracias";
import { Titulo } from "./Titulo";

type Modo = "tatuaje" | "laser";

const PASOS: Record<Modo, string[]> = {
  tatuaje: ["Cotizas", "Reservas con abono", "Apruebas el diseño", "Firmas desde tu teléfono", "Te tatúas"],
  laser: ["Cotizas", "Mandas una foto", "Evalúo la piel", "Firmas desde tu teléfono", "Primera sesión"],
};

/** "#cotiza-laser" abre el cotizador directo en borrado láser (lo usa la sección del láser). */
export const ANCLA_LASER = "cotiza-laser";

/** Tatuaje o borrado láser: un marcador que se desliza, como un interruptor. */
function Selector({ modo, cambiar }: { modo: Modo; cambiar: (m: Modo) => void }) {
  const opciones: Array<[Modo, string]> = [
    ["tatuaje", "Tatuaje"],
    ["laser", "Borrado láser"],
  ];
  return (
    <div role="radiogroup" aria-label="Qué quieres cotizar" className="relative grid grid-cols-2 rounded-full border border-linea bg-tinta/60 p-1">
      <span
        aria-hidden
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[image:var(--acero)] shadow-[0_0_24px_-6px_rgba(47,107,255,0.9)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          modo === "laser" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      {opciones.map(([m, texto]) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={modo === m}
          onClick={() => cambiar(m)}
          className={`relative z-10 min-h-11 rounded-full px-4 text-[15px] font-semibold transition-colors duration-300 ${modo === m ? "text-tinta" : "text-ceniza hover:text-piel"}`}
        >
          {texto}
        </button>
      ))}
    </div>
  );
}

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
function Lectura({ eleccion, previa: bajoCursor, recargos, laser }: { eleccion: Eleccion; previa: Eleccion | null; recargos: Precios["zonas"]; laser: boolean }) {
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
            {laser ? "En el láser la zona no cambia el precio." : recargo > 0 ? `Piel fina o con movimiento: +${recargo}% al rango.` : "Zona cómoda: sin recargo."}
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
/**
 * Después de tocar "Pedir hora": WhatsApp se abre aparte y acá queda la
 * tarjeta de gracias, para cuando la persona vuelve a la web.
 */
function Gracias({ datos, whatsapp, cerrar }: { datos: DatosGracias; whatsapp: string; cerrar: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [cerrar]);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={datos.titulo}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto bg-tinta/[0.88] px-4 py-10 backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && cerrar()}
    >
      <TarjetaGracias datos={datos} />
      <p className="mt-8 max-w-sm text-center text-[14px] leading-relaxed text-ceniza">Toca la tarjeta para darla vuelta. Si WhatsApp no se abrió, ábrelo desde acá.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="boton-cromo inline-flex min-h-12 items-center rounded-full bg-[image:var(--acero)] px-6 text-[15px] font-semibold text-tinta shadow-[0_0_30px_-8px_rgba(47,107,255,0.9)]"
        >
          Abrir WhatsApp
        </a>
        <button type="button" onClick={cerrar} className="inline-flex min-h-12 items-center rounded-full border border-linea px-6 text-[15px] font-semibold text-piel/85 hover:border-ceniza/60">
          Volver a la web
        </button>
      </div>
    </motion.div>
  );
}

export function Cotizador({ precios, fotos, gracias }: { precios: Precios; fotos: Fotos; gracias: { titulo: string; nota: string } }) {
  const { whatsappCon } = useEstudio();
  const [eleccion, setEleccion] = useState<Eleccion>({ zona: "antebrazo", lado: "izq" });
  const [previa, setPrevia] = useState<Eleccion | null>(null);
  const [tamano, setTamano] = useState<Tamano>("mediano");
  const [estilo, setEstilo] = useState<EstiloPrecio>("fineline");
  const [modo, setModo] = useState<Modo>("tatuaje");
  const [objetivo, setObjetivo] = useState<ObjetivoLaser>("borrar");
  const [idea, setIdea] = useState("");
  const [tarjeta, setTarjeta] = useState<DatosGracias | null>(null);
  // La sal del código se elige ya en el navegador: si la eligiera el servidor,
  // el código del WhatsApp y el de la tarjeta podrían no coincidir.
  const [sal, setSal] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- se elige una sola vez al montar
    setSal(Math.random().toString(36).slice(2));
  }, []);
  const resultado = useRef<HTMLDivElement>(null);
  const [resultadoVisible, setResultadoVisible] = useState(false);
  const laser = modo === "laser";
  const rangoLaser = estimarLaser(precios, tamano, objetivo);
  const rango = laser ? rangoLaser : estimar(precios, tamano, estilo, eleccion.zona);

  // Desde la sección del láser se llega con #cotiza-laser: el cotizador se abre ya en láser.
  useEffect(() => {
    const revisar = () => {
      if (window.location.hash !== `#${ANCLA_LASER}`) return;
      setModo("laser");
      document.getElementById("cotiza")?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", "#cotiza");
    };
    revisar();
    window.addEventListener("hashchange", revisar);
    return () => window.removeEventListener("hashchange", revisar);
  }, []);

  const nombre = (lista: readonly { id: string; nombre: string }[], id: string) => lista.find((x) => x.id === id)?.nombre ?? id;
  const zonaTexto = `${nombreZona(eleccion.zona)}${eleccion.lado ? ` (${textoLado(eleccion.lado).toLowerCase()})` : ""}`;

  const cotizado = JSON.stringify({ modo, zona: eleccion.zona, lado: eleccion.lado, tamano, estilo: laser ? objetivo : estilo });
  const codigo = sal ? codigoCotizacion(sal, cotizado) : "";

  const mensaje = (
    laser
      ? [
          "Hola, quiero evaluar un tatuaje para borrado láser. Te mando una foto.",
          `Tamaño: ${nombre(TAMANOS, tamano)}`,
          `Zona: ${zonaTexto}`,
          `Busco: ${nombre(OBJETIVOS_LASER, objetivo).toLowerCase()}`,
          `Rango de la web: ${pesos(rango.min)} a ${pesos(rango.max)} por sesión, ${rangoLaser.sesiones.min} a ${rangoLaser.sesiones.max} sesiones`,
          idea.trim() && `Sobre el tatuaje: ${idea.trim()}`,
          codigo && `Código: ${codigo}`,
        ]
      : [
          "Hola, quiero pedir hora para un tatuaje.",
          `Tamaño: ${nombre(TAMANOS, tamano)}`,
          `Zona: ${zonaTexto}`,
          `Estilo: ${nombre(ESTILOS_PRECIO, estilo)}`,
          `Rango de la web: ${pesos(rango.min)} a ${pesos(rango.max)}`,
          idea.trim() && `Idea: ${idea.trim()}`,
          codigo && `Código: ${codigo}`,
        ]
  )
    .filter(Boolean)
    .join("\n");

  const cerrarTarjeta = useCallback(() => setTarjeta(null), []);

  // Cada combinación distinta se anota una vez: el estudio recibe el aviso
  // aunque la persona nunca llegue a mandar el WhatsApp.
  const anotada = useRef("");
  const anotar = () => {
    setTarjeta({
      codigo: codigo || "MS-····",
      titulo: gracias.titulo,
      nota: gracias.nota,
      rango: `${pesos(rango.min)} a ${pesos(rango.max)}`,
      extra: laser ? `por sesión · ${rangoLaser.sesiones.min} a ${rangoLaser.sesiones.max} sesiones` : "",
      detalle: laser
        ? `${nombre(TAMANOS, tamano)} · ${zonaTexto.toLowerCase()}`
        : `${nombre(TAMANOS, tamano)} · ${zonaTexto.toLowerCase()} · ${nombre(ESTILOS_PRECIO, estilo).toLowerCase()}`,
    });
    const datos = { tipo: modo, zona: eleccion.zona, lado: eleccion.lado, tamano, estilo: laser ? objetivo : estilo, idea: idea.trim(), codigo };
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
      <Titulo id="titulo-cotiza" bajada="Un tatuaje nuevo o borrar uno: toca la zona, elige el tamaño y el rango aparece al instante. El precio final lo vemos juntos.">
        Cotiza
      </Titulo>

      {/* Lo primero que se elige: cambia todo lo de abajo. */}
      <div className="mt-10 max-w-md lg:mt-14">
        <Selector modo={modo} cambiar={setModo} />
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[28px] border border-linea bg-hollin/80 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-stencil/15 blur-3xl" />

        {/* ---------- Cuerpo ---------- */}
        <div className="relative grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center gap-4 border-b border-linea p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_11rem] lg:border-r lg:border-b-0 lg:p-8">
          <MapaCuerpo valor={eleccion} cambiar={setEleccion} previa={setPrevia} className="max-w-[300px] lg:max-w-[250px]" />
          <Lectura eleccion={eleccion} previa={previa} recargos={precios.zonas} laser={laser} />
        </div>

        {/* ---------- Opciones y resultado ---------- */}
        <form className="relative flex flex-col gap-7 p-4 sm:p-6 lg:p-8" onSubmit={(e) => e.preventDefault()}>
          <Grupo titulo={laser ? "Tamaño del tatuaje" : "Tamaño"}>
            {/* Un solo control: cuatro celdas unidas, con una escala que crece de izquierda a derecha. */}
            <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-linea bg-tinta/40 sm:grid-cols-4">
              {TAMANOS.map((t, i) => {
                const activo = t.id === tamano;
                return (
                  <label
                    key={t.id}
                    className={`relative flex cursor-pointer flex-col gap-1.5 border-linea px-3.5 py-3 transition-colors duration-300 has-[:focus-visible]:bg-stencil/10 ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""} ${
                      activo ? "bg-stencil/15" : "hover:bg-hollin/80"
                    }`}
                  >
                    <input type="radio" name="tamano" value={t.id} checked={activo} onChange={() => setTamano(t.id)} className="sr-only" />
                    <span aria-hidden className="flex h-3.5 items-end gap-[3px]">
                      {[0, 1, 2, 3].map((b) => (
                        <span
                          key={b}
                          className={`w-[3px] rounded-full transition-colors duration-300 ${b <= i ? (activo ? "bg-stencil shadow-[0_0_6px_rgba(47,107,255,0.9)]" : "bg-ceniza/60") : "bg-linea"}`}
                          style={{ height: `${5 + b * 3}px` }}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[14px] font-semibold">{t.id === "manga" ? "Manga" : t.nombre}</span>
                      <span className="block truncate text-[12px] text-ceniza">{t.detalle}</span>
                    </span>
                    <span aria-hidden className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-stencil shadow-[0_0_10px_rgba(47,107,255,0.9)] transition-opacity duration-300 ${activo ? "opacity-100" : "opacity-0"}`} />
                  </label>
                );
              })}
            </div>
          </Grupo>

          {laser ? (
            <Grupo titulo="Qué buscas">
              <div key="laser" className="panel-surge grid gap-2 sm:grid-cols-2">
                {OBJETIVOS_LASER.map((o) => {
                  const activo = o.id === objetivo;
                  const s = precios.laser.sesiones[o.id];
                  return (
                    <label
                      key={o.id}
                      className={`relative flex cursor-pointer flex-col rounded-2xl border px-4 py-3 transition-[border-color,box-shadow,background-color] duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-stencil-claro ${
                        activo ? "border-stencil bg-stencil/10 shadow-[0_0_24px_-8px_rgba(47,107,255,0.9)]" : "border-linea hover:border-ceniza/60"
                      }`}
                    >
                      <input type="radio" name="objetivo" value={o.id} checked={activo} onChange={() => setObjetivo(o.id)} className="sr-only" />
                      <span className="text-[15px] font-semibold">{o.nombre}</span>
                      <span className="text-[13px] text-ceniza">
                        {o.detalle} · {s.min} a {s.max} sesiones
                      </span>
                    </label>
                  );
                })}
              </div>
            </Grupo>
          ) : (
          <Grupo titulo="Estilo">
            {/* Se elige viendo un tatuaje de ese estilo (las fotos se cambian en Web → Fotos). En el teléfono se desliza de lado. */}
            <div key="tatuaje" className="panel-surge -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {ESTILOS_PRECIO.map((e) => {
                const activo = e.id === estilo;
                const foto = fotos[`estilo-${e.id}`]?.src;
                return (
                  <label
                    key={e.id}
                    className={`group relative aspect-[4/5] w-[7.25rem] shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-stencil-claro sm:w-auto ${
                      activo ? "border-stencil shadow-[0_0_28px_-8px_rgba(47,107,255,0.95)]" : "border-linea hover:border-ceniza/60"
                    }`}
                  >
                    <input type="radio" name="estilo" value={e.id} checked={activo} onChange={() => setEstilo(e.id)} className="sr-only" />
                    {foto ? (
                      <Image
                        src={foto}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 140px, 120px"
                        className={`object-cover transition-[transform,opacity,filter] duration-500 ${activo ? "scale-105" : "opacity-55 grayscale-[35%] group-hover:opacity-85"}`}
                      />
                    ) : (
                      <span aria-hidden className={`absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_25%,rgba(47,107,255,0.35),transparent_60%),linear-gradient(160deg,#151a25,#07080d)] transition-opacity duration-500 ${activo ? "" : "opacity-70"}`}>
                        <span className="font-gotica text-5xl text-piel/25">{e.nombre.charAt(0)}</span>
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta via-tinta/75 to-transparent px-2.5 pt-8 pb-2.5">
                      <span className="block text-[14px] leading-tight font-semibold">{e.nombre}</span>
                      <span className="block text-[11px] text-ceniza">{precios.estilos[e.id] > 0 ? `+${pesos(precios.estilos[e.id])}` : "Sin recargo"}</span>
                    </span>
                    <span
                      aria-hidden
                      className={`absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-stencil text-white shadow-[0_0_12px_rgba(47,107,255,0.9)] transition-[opacity,transform] duration-300 ${activo ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                    >
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                  </label>
                );
              })}
            </div>
          </Grupo>
          )}

          <Grupo titulo={laser ? "Sobre el tatuaje" : "Tu idea"} nota="Opcional">
            <label htmlFor="idea" className="sr-only">
              {laser ? "Cuéntame del tatuaje que quieres borrar" : "Cuéntame qué te imaginas"}
            </label>
            <textarea
              id="idea"
              rows={2}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={laser ? "Ej.: un nombre en la muñeca, de hace 10 años, en negro" : "Ej.: el nombre de mi hija en lettering fino, bajo la muñeca"}
              className="w-full resize-none rounded-2xl border border-linea bg-tinta/60 px-4 py-3 text-[15px] text-piel placeholder:text-ceniza/60 focus:border-stencil focus:shadow-[0_0_24px_-6px_rgba(47,107,255,0.8)] focus:outline-none"
            />
          </Grupo>

          <div ref={resultado} className="relative overflow-hidden rounded-3xl border border-stencil/40 bg-tinta/80 p-5 shadow-[0_0_50px_-20px_rgba(47,107,255,0.8)] sm:p-6">
            <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 h-48 w-48 rounded-full bg-stencil/25 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[13px] text-ceniza">{laser ? "Por sesión" : "Rango estimado"}</p>
                <p className="mt-1 text-[clamp(1.9rem,6.5vw,2.75rem)] leading-tight font-semibold tracking-[-0.03em]" aria-live="polite">
                  <Cifra valor={rango.min} />
                  <span className="text-ceniza"> a </span>
                  <Cifra valor={rango.max} />
                </p>
                <p className="mt-1 text-[13px] text-ceniza">
                  {laser
                    ? `Aprox. ${rangoLaser.sesiones.min} a ${rangoLaser.sesiones.max} sesiones, cada 4 a 8 semanas · ${zonaTexto.toLowerCase()}`
                    : `${nombre(TAMANOS, tamano)} · ${zonaTexto.toLowerCase()} · ${nombre(ESTILOS_PRECIO, estilo).toLowerCase()}`}
                </p>
              </div>
              <BotonMagnetico href={whatsappCon(mensaje)} externo alTocar={anotar} className="shrink-0 shadow-[0_0_40px_-8px_rgba(47,107,255,0.9)]">
                {laser ? "Evaluar mi tatuaje" : "Pedir hora con esta idea"}
              </BotonMagnetico>
            </div>
            <ol className="relative mt-5 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-linea pt-4 text-[12px] text-ceniza">
              {PASOS[modo].map((p, i) => (
                <li key={p} className="flex items-center gap-1.5">
                  <span className="font-gotica text-[15px] leading-none text-stencil-claro">{i + 1}</span>
                  {p}
                </li>
              ))}
            </ol>
          </div>
        </form>
      </div>

      <AnimatePresence>{tarjeta && <Gracias datos={tarjeta} whatsapp={whatsappCon(mensaje)} cerrar={cerrarTarjeta} />}</AnimatePresence>

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
            {laser && <span className="text-[12px] font-normal text-ceniza"> c/u</span>}
          </span>
          <a
            href={whatsappCon(mensaje)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={anotar}
            className="boton-cromo inline-flex min-h-11 shrink-0 items-center rounded-full bg-[image:var(--acero)] px-4 text-sm font-semibold whitespace-nowrap text-tinta"
          >
            {laser ? "Evaluar" : "Pedir hora"}
          </a>
        </div>
      </div>
    </section>
  );
}
