"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { enlaceWhatsapp, ESTUDIO, SECCIONES } from "@/lib/estudio";

type Lenis = { stop: () => void; start: () => void };

/**
 * Navegación en dos piezas:
 * - Una cápsula flotante (escritorio) con las secciones principales. El foco
 *   de luz sigue al cursor y vuelve a la sección donde estás; abajo, el avance
 *   de lectura en neón. Se esconde al bajar y vuelve al subir.
 * - En escritorio, un panel que se despliega bajo la cápsula: todas las
 *   secciones como tarjetas y una vista previa grande con foto real.
 * - En el teléfono, un menú a pantalla completa pensado para el pulgar:
 *   filas grandes con miniatura y la acción principal abajo.
 *
 * El menú completo vive FUERA de los <header>: un header con backdrop-filter
 * hace que un hijo "fixed" se posicione dentro de él y no de la pantalla.
 */
export function Navegacion() {
  const [abierto, setAbierto] = useState(false);
  const [panel, setPanel] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [bajo, setBajo] = useState(false);
  const [activa, setActiva] = useState<string | null>(null);
  const [foco, setFoco] = useState<string | null>(null);

  const { scrollY, scrollYProgress } = useScroll();
  const progreso = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });

  useMotionValueEvent(scrollY, "change", (y) => {
    const antes = scrollY.getPrevious() ?? 0;
    setBajo(y > 40);
    if (y > 500 && y > antes + 4) setOculto(true);
    else if (y < antes - 4 || y < 500) setOculto(false);
  });

  useEffect(() => {
    const o = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setActiva(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of ["inicio", ...SECCIONES.map((s) => s.id)]) {
      const el = document.getElementById(id);
      if (el) o.observe(el);
    }
    return () => o.disconnect();
  }, []);

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    document.documentElement.style.overflow = abierto ? "hidden" : "";
    if (abierto) lenis?.stop();
    else lenis?.start();
    const cerrar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      setPanel(false);
    };
    addEventListener("keydown", cerrar);
    return () => removeEventListener("keydown", cerrar);
  }, [abierto]);

  const marcada = foco ?? activa;

  return (
    <>
      {/* ---------- Cápsula de escritorio ---------- */}
      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: oculto && !panel ? -90 : 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 34 }}
        className="fixed inset-x-0 top-4 z-50 hidden justify-center lg:flex"
      >
        <nav
          aria-label="Principal"
          onPointerLeave={() => setFoco(null)}
          className={`relative flex items-center gap-1 overflow-hidden rounded-full border p-1.5 pl-6 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-500 ${
            bajo ? "border-linea bg-tinta/75 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]" : "border-white/10 bg-tinta/35"
          }`}
        >
          <a href="#inicio" className="texto-acero mr-4 font-gotica text-[30px] leading-none" aria-label="Matness Studio, inicio">
            Matness
          </a>
          <ul className="flex items-center">
            {SECCIONES.filter((s) => s.corto).map((s) => (
              <li key={s.id} className="relative" onPointerEnter={() => setFoco(s.id)}>
                {marcada === s.id && (
                  <motion.span
                    layoutId="nav-luz"
                    className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-white/10 shadow-[inset_0_-10px_20px_-12px_rgba(47,107,255,0.9)]"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <a
                  href={`#${s.id}`}
                  aria-current={activa === s.id ? "true" : undefined}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] transition-colors ${
                    marcada === s.id ? "text-piel" : "text-ceniza hover:text-piel"
                  }`}
                >
                  {activa === s.id && (
                    <span className="h-1.5 w-1.5 rounded-full bg-stencil shadow-[0_0_10px_2px_rgba(47,107,255,0.9)]" />
                  )}
                  {s.texto}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setPanel((v) => !v)}
            aria-expanded={panel}
            aria-controls="panel-escritorio"
            className={`ml-1 flex min-h-11 items-center gap-2.5 rounded-full px-4 text-[15px] transition-colors ${
              panel ? "bg-white/[0.08] text-piel" : "text-ceniza hover:text-piel"
            }`}
          >
            <span aria-hidden className="relative h-3 w-4">
              <span
                className={`absolute left-0 h-px w-4 bg-current transition-transform duration-500 ease-[var(--ease-salida)] ${
                  panel ? "top-1.5 rotate-45" : "top-0.5"
                }`}
              />
              <span
                className={`absolute left-0 h-px w-4 bg-current transition-transform duration-500 ease-[var(--ease-salida)] ${
                  panel ? "top-1.5 -rotate-45" : "top-2.5"
                }`}
              />
            </span>
            Menú
          </button>
          <a
            href="#cotiza"
            className="boton-cromo ml-1 inline-flex min-h-11 items-center rounded-full bg-[image:var(--acero)] px-6 text-[15px] font-semibold text-tinta shadow-[0_0_30px_-6px_rgba(47,107,255,0.8)]"
          >
            Pedir hora
          </a>
          <motion.span
            aria-hidden
            style={{ scaleX: progreso }}
            className="absolute inset-x-6 bottom-0 h-px origin-left bg-stencil shadow-[0_0_8px_1px_rgba(47,107,255,0.9)]"
          />
        </nav>
      </motion.header>

      {/* ---------- Barra del teléfono ---------- */}
      <header
        className={`fixed inset-x-0 top-0 z-[60] transition-[background-color,border-color] duration-500 lg:hidden ${
          bajo && !abierto ? "border-b border-linea/60 bg-tinta/[0.94]" : "border-b border-transparent"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <a href="#inicio" onClick={() => setAbierto(false)} className="texto-acero font-gotica text-[30px] leading-none" aria-label="Matness Studio, inicio">
            Matness
          </a>
          <BotonMenu abierto={abierto} alternar={() => setAbierto((v) => !v)} />
        </div>
      </header>

      {/* Escritorio: panel desplegable bajo la cápsula. Teléfono: menú a pantalla completa. */}
      <AnimatePresence>{panel && <PanelEscritorio activa={activa} cerrar={() => setPanel(false)} />}</AnimatePresence>
      <AnimatePresence>
        {abierto && <MenuCompleto activa={activa} cerrar={() => setAbierto(false)} />}
      </AnimatePresence>
    </>
  );
}

function BotonMenu({ abierto, alternar }: { abierto: boolean; alternar: () => void }) {
  return (
    <button
      type="button"
      onClick={alternar}
      aria-expanded={abierto}
      aria-controls="menu-completo"
      aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
      className="relative grid h-11 w-11 place-items-center rounded-full border border-linea bg-tinta/70"
    >
      <span
        className={`absolute h-[1.5px] w-5 bg-piel transition-transform duration-500 ease-[var(--ease-salida)] ${
          abierto ? "rotate-45" : "-translate-y-[4px]"
        }`}
      />
      <span
        className={`absolute h-[1.5px] w-5 bg-piel transition-transform duration-500 ease-[var(--ease-salida)] ${
          abierto ? "-rotate-45" : "translate-y-[4px]"
        }`}
      />
    </button>
  );
}

function MenuCompleto({ activa, cerrar }: { activa: string | null; cerrar: () => void }) {
  const [vista, setVista] = useState(SECCIONES.find((s) => s.id === activa) ?? SECCIONES[0]);

  return (
    <motion.div
      id="menu-completo"
      role="dialog"
      aria-modal="true"
      aria-label="Menú"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
      className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-tinta lg:hidden"
    >
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/3 h-[70vh] w-[70vw] rounded-full bg-stencil/20 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-stencil shadow-[0_0_20px_2px_rgba(47,107,255,0.9)]" />

      {/* Cerrar en escritorio (en el teléfono lo hace el botón de la barra). */}
      <button
        type="button"
        onClick={cerrar}
        className="absolute top-6 right-8 z-10 hidden min-h-11 items-center gap-3 rounded-full border border-linea px-5 text-[15px] transition-colors hover:border-stencil lg:inline-flex"
      >
        Cerrar
        <span aria-hidden className="relative h-3 w-3">
          <span className="absolute top-1/2 left-0 h-px w-3 rotate-45 bg-current" />
          <span className="absolute top-1/2 left-0 h-px w-3 -rotate-45 bg-current" />
        </span>
      </button>

      <div className="relative mx-auto grid w-full max-w-[1400px] flex-1 gap-10 px-4 pt-20 pb-4 sm:px-8 lg:grid-cols-12 lg:items-center lg:pt-16 lg:pb-8">
        <nav aria-label="Secciones" className="lg:col-span-7">
          <ul className="group/lista divide-y divide-linea/60 lg:divide-y-0">
            {SECCIONES.map((s, i) => {
              const esVista = vista.id === s.id;
              return (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={`#${s.id}`}
                    onClick={cerrar}
                    onPointerEnter={() => setVista(s)}
                    onFocus={() => setVista(s)}
                    className="group flex items-center gap-4 py-2.5 lg:py-1.5"
                  >
                    {/* Miniatura: solo en el teléfono, donde no hay vista previa al lado. */}
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-linea lg:hidden">
                      <Image src={s.img} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block font-gotica text-[clamp(2rem,9vw,2.75rem)] leading-[1] transition-[opacity,transform,color] duration-500 ease-[var(--ease-salida)] lg:text-[clamp(3rem,5.6vw,5.4rem)] ${
                          esVista ? "texto-cromo lg:translate-x-4" : "text-piel lg:group-hover/lista:opacity-35"
                        }`}
                      >
                        {s.texto}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-ceniza lg:hidden">{s.detalle}</span>
                    </span>
                    {activa === s.id && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-stencil shadow-[0_0_12px_3px_rgba(47,107,255,0.9)]" aria-label="Estás aquí" />
                    )}
                  </a>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* Vista previa (escritorio) */}
        <div className="hidden lg:col-span-4 lg:col-start-9 lg:block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-linea shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),0_0_60px_-30px_rgba(47,107,255,0.8)]">
            <AnimatePresence initial={false}>
              <motion.div
                key={vista.img}
                initial={{ opacity: 0, scale: 1.08, filter: "grayscale(1) brightness(1.2)" }}
                animate={{ opacity: 1, scale: 1, filter: "grayscale(0) brightness(1)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <Image src={vista.img} alt="" fill sizes="30vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta via-tinta/60 to-transparent p-6 pt-24">
              <motion.p key={vista.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[15px] text-piel/90">
                {vista.detalle}
              </motion.p>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-8"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col gap-5 border-t border-linea pt-6 lg:flex-row lg:items-center lg:justify-between">
          <a
            href="#cotiza"
            onClick={cerrar}
            className="boton-cromo flex min-h-14 items-center justify-center rounded-full bg-[image:var(--acero)] px-8 text-base font-semibold text-tinta shadow-[0_0_40px_-8px_rgba(47,107,255,0.9)] lg:order-last"
          >
            Cotizar y pedir hora
          </a>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 text-[14px] text-ceniza lg:justify-start">
            <a href={enlaceWhatsapp("Hola, quiero consultar por un tatuaje.")} target="_blank" rel="noopener noreferrer" className="hover:text-piel">
              WhatsApp
            </a>
            <a href={`https://instagram.com/${ESTUDIO.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-piel">
              @{ESTUDIO.instagram}
            </a>
            <span className="w-full text-ceniza/80 lg:w-auto">
              {ESTUDIO.direccion}, {ESTUDIO.comuna}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PanelEscritorio({ activa, cerrar }: { activa: string | null; cerrar: () => void }) {
  const [vista, setVista] = useState(SECCIONES.find((s) => s.id === activa) ?? SECCIONES[0]);

  return (
    <>
      {/* Clic afuera cierra. Transparente: la página se sigue viendo. */}
      <motion.button
        type="button"
        aria-label="Cerrar menú"
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={cerrar}
        className="fixed inset-0 z-40 hidden cursor-default bg-tinta/40 backdrop-blur-[2px] lg:block"
      />
      <motion.div
        id="panel-escritorio"
        role="dialog"
        aria-label="Menú"
        initial={{ opacity: 0, y: -14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        style={{ transformOrigin: "top center" }}
        className="fixed top-[88px] left-1/2 z-50 hidden w-[min(1040px,94vw)] -translate-x-1/2 overflow-hidden rounded-[28px] border border-linea bg-tinta/90 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.95),0_0_60px_-30px_rgba(47,107,255,0.8)] backdrop-blur-2xl lg:block"
      >
        <div aria-hidden className="absolute inset-x-10 top-0 h-px bg-stencil shadow-[0_0_14px_2px_rgba(47,107,255,0.9)]" />
        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-6 p-6">
          <ul className="grid grid-cols-2 gap-2">
            {SECCIONES.map((s, i) => {
              const esVista = vista.id === s.id;
              return (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + i * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={`#${s.id}`}
                    onClick={cerrar}
                    onPointerEnter={() => setVista(s)}
                    onFocus={() => setVista(s)}
                    className={`flex items-center gap-4 rounded-2xl p-3 transition-colors duration-300 ${
                      esVista ? "bg-white/[0.06] ring-1 ring-white/10" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-linea">
                      <Image
                        src={s.img}
                        alt=""
                        fill
                        sizes="56px"
                        className={`object-cover transition-[filter] duration-500 ${esVista ? "" : "grayscale"}`}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className={`font-gotica text-[28px] leading-none ${esVista ? "texto-cromo" : "text-piel"}`}>{s.texto}</span>
                        {activa === s.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-stencil shadow-[0_0_10px_2px_rgba(47,107,255,0.9)]" aria-label="Estás aquí" />
                        )}
                      </span>
                      <span className="mt-1 block truncate text-[13px] text-ceniza">{s.detalle}</span>
                    </span>
                  </a>
                </motion.li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-3">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-linea">
              <AnimatePresence initial={false}>
                <motion.div
                  key={vista.img}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <Image src={vista.img} alt="" fill sizes="300px" className="object-cover" />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta via-tinta/60 to-transparent p-4 pt-16">
                <p className="font-gotica text-3xl leading-none">{vista.texto}</p>
                <p className="mt-1 text-[13px] text-piel/80">{vista.detalle}</p>
              </div>
            </div>
            <a
              href="#cotiza"
              onClick={cerrar}
              className="boton-cromo flex min-h-12 items-center justify-center rounded-full bg-[image:var(--acero)] text-[15px] font-semibold text-tinta shadow-[0_0_30px_-8px_rgba(47,107,255,0.9)]"
            >
              Cotizar y pedir hora
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-linea px-6 py-4 text-[13px] text-ceniza">
          <span>
            {ESTUDIO.direccion}, {ESTUDIO.comuna}
          </span>
          <span className="flex gap-6">
            <a href={enlaceWhatsapp("Hola, quiero consultar por un tatuaje.")} target="_blank" rel="noopener noreferrer" className="hover:text-piel">
              WhatsApp
            </a>
            <a href={`https://instagram.com/${ESTUDIO.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-piel">
              @{ESTUDIO.instagram}
            </a>
          </span>
        </div>
      </motion.div>
    </>
  );
}
