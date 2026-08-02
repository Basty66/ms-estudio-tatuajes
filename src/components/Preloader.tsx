import { useEffect, useState } from "react"
import { motion } from "framer-motion"

const EASE = [0.23, 1, 0.32, 1] as const

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in")

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 950)
    const t2 = setTimeout(() => setPhase("out"), 1750)
    const t3 = setTimeout(onDone, 2700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[100] bg-dark overflow-hidden">
      {/* Panel izquierdo */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: phase === "out" ? "-100%" : "0%" }}
        transition={{ duration: 0.85, ease: EASE }}
        className="absolute inset-y-0 left-0 w-1/2 overflow-hidden"
      >
        <img
          src="/images/tatuaje1.jpg"
          alt=""
          className="h-full w-full object-cover grayscale brightness-[0.4] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/40" />
      </motion.div>

      {/* Panel derecho */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: phase === "out" ? "100%" : "0%" }}
        transition={{ duration: 0.85, ease: EASE }}
        className="absolute inset-y-0 right-0 w-1/2 overflow-hidden"
      >
        <img
          src="/images/tatuaje2.jpg"
          alt=""
          className="h-full w-full object-cover grayscale brightness-[0.4] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-transparent to-black/40" />
      </motion.div>

      {/* Costura central que se enciende al cerrar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "hold" ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px z-10 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
        style={{ boxShadow: "0 0 24px rgba(0,229,255,0.7)" }}
      />

      {/* Logo central */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: phase === "out" ? 0 : 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.55, ease: EASE }}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 pointer-events-none"
      >
        <motion.div
          animate={{ scale: phase === "hold" ? [1, 1.06, 1] : 1 }}
          transition={{ duration: 0.8, repeat: phase === "hold" ? Infinity : 0, repeatDelay: 0.2 }}
        >
          <svg width="76" height="76" viewBox="0 0 40 40" fill="none">
            <rect
              x="1.5" y="1.5" width="37" height="37" rx="3"
              stroke="rgba(0,229,255,0.5)" strokeWidth="1"
            />
            <path
              d="M9 28 L9 12 L14.5 22 L20 12 L20 28"
              stroke="#fff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
            />
            <path
              d="M31 14 Q23 14 23 18.5 Q23 22 27 22 Q31 22 31 25.5 Q31 30 23 29"
              stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" fill="none"
              style={{ filter: "drop-shadow(0 0 6px rgba(0,229,255,0.7))" }}
            />
          </svg>
        </motion.div>
        <div className="text-center">
          <div className="font-display text-3xl md:text-4xl tracking-[0.18em] text-white">MATNESS</div>
          <div className="font-tech text-[10px] tracking-[0.5em] text-cyan-400/80 uppercase mt-1">Tattoo Studio</div>
        </div>
        <div className="w-44 h-[3px] rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.5, ease: "linear" }}
            className="h-full w-full origin-left bg-gradient-to-r from-cyan-400 to-cyan-300"
          />
        </div>
      </motion.div>
    </div>
  )
}
