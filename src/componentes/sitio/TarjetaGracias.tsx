"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/**
 * La tarjeta de "gracias por tu cotización": aparece después de tocar "Pedir
 * hora", con el código que también va en el WhatsApp. Entra inclinada, le
 * pasa un brillo, se da vuelta sola y suelta destellos azules; después flota
 * y, con mouse, se inclina siguiendo el puntero. Un toque la vuelve a girar.
 *
 * Todo se mueve con transform y opacity. Si el sistema pide menos movimiento,
 * muestra directo el reverso y gira sin animación.
 */
export type DatosGracias = {
  codigo: string;
  titulo: string;
  nota: string;
  /** "$50.000 a $90.000" */
  rango: string;
  /** "por sesión · 6 a 10 sesiones", o vacío en un tatuaje. */
  extra: string;
  detalle: string;
};

const SALIDA = [0.16, 1, 0.3, 1] as const;

/** Destellos que salen del centro cuando aparece el agradecimiento (CSS: .chispa). */
const CHISPAS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 2) * 0.2;
  const r = 34 + (i % 3) * 9;
  return { tx: `${(Math.cos(a) * r).toFixed(1)}cqw`, ty: `${(Math.sin(a) * r * 0.75).toFixed(1)}cqw`, tam: 3 + (i % 3) * 2, retraso: 0.45 + (i % 4) * 0.05 };
});

/** La estrella de cuatro puntas del estudio. */
function Estrella({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M32 2 C34 24 40 30 62 32 C40 34 34 40 32 62 C30 40 24 34 2 32 C24 30 30 24 32 2 Z" fill="currentColor" />
    </svg>
  );
}

const CARA = "absolute inset-0 overflow-hidden rounded-[5.5cqw] [backface-visibility:hidden] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)]";

export function TarjetaGracias({ datos, estatica = false }: { datos: DatosGracias; /** En la vista previa del panel: quieta, mostrando el reverso. */ estatica?: boolean }) {
  const reducir = useReducedMotion() || estatica;
  const [girada, setGirada] = useState(Boolean(reducir));
  const [estallido, setEstallido] = useState(0);

  const girar = (alReves: boolean) => {
    setGirada(alReves);
    if (alReves && !reducir) setEstallido((n) => n + 1);
  };

  // Se da vuelta sola, después del brillo.
  useEffect(() => {
    if (reducir) return;
    const t = setTimeout(() => {
      setGirada(true);
      setEstallido((n) => n + 1);
    }, 1900);
    return () => clearTimeout(t);
  }, [reducir]);

  // Inclinación y reflejo que siguen al mouse.
  const rx = useSpring(0, { stiffness: 140, damping: 16 });
  const ry = useSpring(0, { stiffness: 140, damping: 16 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const reflejo = useSpring(0, { stiffness: 120, damping: 20 });
  const luz = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22), transparent 55%)`;

  return (
    <div className="relative mx-auto w-full max-w-[420px] [container-type:inline-size]">
      <motion.div
        initial={reducir ? false : { opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: SALIDA }}
        className="relative [perspective:1400px]"
      >
        <motion.button
          type="button"
          disabled={estatica}
          onClick={() => girar(!girada)}
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse" || reducir) return;
            const b = e.currentTarget.getBoundingClientRect();
            const px = (e.clientX - b.left) / b.width;
            const py = (e.clientY - b.top) / b.height;
            rx.set((0.5 - py) * 14);
            ry.set((px - 0.5) * 18);
            gx.set(px * 100);
            gy.set(py * 100);
            reflejo.set(1);
          }}
          onPointerLeave={() => {
            rx.set(0);
            ry.set(0);
            reflejo.set(0);
          }}
          aria-label={girada ? "Ver el frente de la tarjeta" : "Girar la tarjeta"}
          className="relative block aspect-[1.586] w-full cursor-pointer rounded-[5.5cqw] [transform-style:preserve-3d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stencil-claro disabled:cursor-default"
          initial={reducir ? false : { rotateX: 30 }}
          animate={reducir ? { rotateX: 0 } : { rotateX: 0, y: [0, -7, 0] }}
          transition={{ rotateX: { duration: 1.1, ease: SALIDA }, y: { duration: 6, delay: 1.2, repeat: Infinity, ease: "easeInOut" } }}
        >
          <motion.div className="absolute inset-0 [transform-style:preserve-3d]" style={{ rotateX: rx, rotateY: ry }}>
            <motion.div
              className="absolute inset-0 [transform-style:preserve-3d]"
              initial={false}
              animate={{ rotateY: girada ? 180 : 0, scale: reducir ? 1 : [1, 1.05, 1] }}
              transition={reducir ? { duration: 0 } : { duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
            >
              {/* ---------- Frente: la tarjeta del estudio con el código ---------- */}
              <div className={`${CARA} border border-white/10 bg-[radial-gradient(120%_90%_at_85%_0%,rgba(47,107,255,0.35),transparent_55%),radial-gradient(90%_80%_at_0%_100%,rgba(138,168,255,0.12),transparent_60%),linear-gradient(160deg,#151a25,#07080d_60%)]`}>
                {!reducir && (
                  // Un brillo de acero que cruza la tarjeta al aparecer.
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-[-20%] left-0 w-[35%] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    style={{ skewX: -18 }}
                    initial={{ x: "-120%" }}
                    animate={{ x: "420%" }}
                    transition={{ duration: 1.3, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
                  />
                )}
                <motion.div aria-hidden className="absolute inset-0" style={{ background: luz, opacity: reflejo }} />
                <div className="relative flex h-full flex-col justify-between p-[6.5cqw] text-left">
                  <div className="flex items-start justify-between">
                    <span className="text-[max(10px,2.4cqw)] leading-tight font-semibold tracking-[0.22em] text-stencil-claro uppercase">
                      Melipilla
                      <br />
                      <span className="text-piel/50">Chile</span>
                    </span>
                    <Estrella className="w-[9cqw] text-stencil drop-shadow-[0_0_10px_rgba(47,107,255,0.9)]" />
                  </div>
                  <div>
                    <p className="texto-cromo font-gotica text-[17cqw] leading-[0.85]">Matness</p>
                    <p className="mt-[1.5cqw] text-[max(10px,2.5cqw)] font-semibold tracking-[0.42em] text-piel/60 uppercase">Studio</p>
                  </div>
                  <div className="flex items-end justify-between text-[max(10px,2.6cqw)] tracking-[0.16em] text-piel/60 uppercase tabular-nums">
                    <span className="font-semibold text-piel">{datos.codigo}</span>
                    <span>Cotización</span>
                  </div>
                </div>
              </div>

              {/* ---------- Reverso: el agradecimiento ---------- */}
              <div className={`${CARA} border border-stencil/30 bg-[radial-gradient(110%_90%_at_100%_0%,rgba(47,107,255,0.28),transparent_55%),linear-gradient(200deg,#151a25,#0d1018)] [transform:rotateY(180deg)]`}>
                <motion.div aria-hidden className="absolute inset-0" style={{ background: luz, opacity: reflejo }} />
                <div className="relative flex h-full flex-col justify-between p-[6.5cqw] text-left">
                  <div className="flex items-center justify-between gap-[3cqw]">
                    <span className="flex items-center gap-[2cqw]">
                      <Estrella className="w-[5cqw] text-stencil" />
                      <span className="font-gotica text-[max(14px,5cqw)] leading-none text-piel">Matness</span>
                    </span>
                    <span className="text-[max(10px,2.6cqw)] font-semibold tracking-[0.16em] text-piel/60 tabular-nums">{datos.codigo}</span>
                  </div>
                  <div>
                    <p className="text-[max(12px,4cqw)] leading-tight font-semibold text-piel/85">{datos.titulo}</p>
                    <p className="mt-[1cqw] text-[8.6cqw] leading-none font-semibold tracking-[-0.03em] text-piel tabular-nums">{datos.rango}</p>
                    <p className="mt-[1.6cqw] truncate text-[max(10px,2.7cqw)] text-stencil-claro">
                      {datos.extra ? `${datos.extra} · ` : ""}
                      {datos.detalle}
                    </p>
                  </div>
                  <p className="max-w-[80%] text-[max(10px,2.8cqw)] leading-snug text-piel/60">{datos.nota}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.button>

        {estallido > 0 && (
          <div key={estallido} aria-hidden className="pointer-events-none absolute inset-0 z-10">
            {CHISPAS.map((c, i) => (
              <span
                key={i}
                className="chispa absolute top-1/2 left-1/2 rounded-full bg-stencil-claro shadow-[0_0_12px_rgba(47,107,255,0.95)]"
                style={{ width: c.tam, height: c.tam, ["--tx" as string]: c.tx, ["--ty" as string]: c.ty, animationDelay: `${c.retraso}s` }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
