"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * En el teléfono, pasado el hero, queda abajo el botón de cotizar, al lado del
 * WhatsApp flotante. Se esconde al llegar a la sección de cotizar, que ya
 * tiene su propio botón, para no repetirlo encima.
 */
export function BarraMovil() {
  const [pasadoHero, setPasadoHero] = useState(false);
  const [enCotiza, setEnCotiza] = useState(false);

  // Dos observadores en vez de medir la página en cada evento de scroll:
  // medir obliga al navegador a recalcular el diseño y se nota en el teléfono.
  useEffect(() => {
    const hero = document.getElementById("inicio");
    const cotiza = document.getElementById("cotiza");
    const o = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.target === hero) setPasadoHero(!e.isIntersecting && e.boundingClientRect.top < 0);
        if (e.target === cotiza) setEnCotiza(e.isIntersecting);
      }
    }, { rootMargin: "0px 0px -20% 0px" });
    if (hero) o.observe(hero);
    if (cotiza) o.observe(cotiza);
    return () => o.disconnect();
  }, []);

  const visible = pasadoHero && !enCotiza;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120 }}
          animate={{ y: 0 }}
          exit={{ y: 120 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="fixed right-[84px] left-3 z-40 flex gap-2 rounded-full border border-linea bg-tinta/[0.94] p-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] lg:hidden"
          style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <a
            href="#cotiza"
            className="boton-cromo flex min-h-12 flex-1 items-center justify-center rounded-full bg-[image:var(--acero)] text-[15px] font-semibold text-tinta"
          >
            Cotizar y pedir hora
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
