"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

/**
 * Una frase que se va "entintando" palabra por palabra a medida que se baja.
 * Cada palabra es su propia capa y solo cambia de opacidad.
 * Sin scroll (o con reducir movimiento) se lee completa: la opacidad mínima
 * nunca baja de un gris legible.
 */
export function TextoRevelado({ texto, className = "" }: { texto: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const palabras = texto.split(" ");

  return (
    <p ref={ref} className={className}>
      {palabras.map((p, i) => (
        <Palabra key={i} progreso={scrollYProgress} desde={i / palabras.length} hasta={(i + 1) / palabras.length}>
          {p}
        </Palabra>
      ))}
    </p>
  );
}

function Palabra({
  children,
  progreso,
  desde,
  hasta,
}: {
  children: string;
  progreso: MotionValue<number>;
  desde: number;
  hasta: number;
}) {
  // Solo opacidad: la resuelve la GPU sin repintar el texto en cada cuadro.
  const opacidad = useTransform(progreso, [desde, hasta], [0.18, 1]);
  return (
    <motion.span style={{ opacity: opacidad }} className="inline-block pr-[0.25em] text-piel">
      {children}
    </motion.span>
  );
}
