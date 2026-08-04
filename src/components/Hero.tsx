import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Star, Share } from "@phosphor-icons/react"

const easeOut = [0.23, 1, 0.32, 1] as const

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const item = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: easeOut } },
}

const specialties = ["Black & Grey", "Microrealismo", "Fine Line", "Lettering"]

export default function Hero() {
  const navigate = useNavigate()
  const [heroImage, setHeroImage] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/galeria")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.images?.length > 0) {
          setHeroImage(data.images[0].imagen_url)
        }
      })
      .catch(() => {})
  }, [])

  const bgImage = heroImage || "/images/hero-bg.png"

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
      navigate(`#${id}`, { replace: true })
    }
  }

  return (
    <section
      id="inicio"
      className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden bg-[#050608]"
    >
      {/* Foto protagonista con tratamiento cinematográfico */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 hero-image-desktop hidden md:block"
          style={{ backgroundImage: `url('${bgImage}')` }}
        />
        <div
          className="absolute inset-0 md:hidden"
          style={{
            backgroundImage: `url('${bgImage}')`,
            backgroundSize: "cover",
            backgroundPosition: "center 25%",
            filter: "grayscale(100%) brightness(45%) contrast(115%)",
          }}
        />
      </div>

      {/* Overlays de profundidad — la foto se ve, el texto se lee */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#050608] via-[#050608]/50 to-[#050608]/70" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#050608] via-[#050608]/40 to-transparent md:to-[#050608]/10" />
      <div className="absolute inset-0 z-[1] hero-grain" />

      {/* Acento neón puntual — un solo glow sutil, abajo */}
      <div className="absolute -bottom-40 left-1/4 z-[1] w-[600px] h-[400px] rounded-full pointer-events-none hero-accent-glow" />

      {/* Contenido — layout asimétrico, alineado a la izquierda */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 pb-20 md:pb-0 pt-28 md:pt-24">
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-2xl">
          {/* Kicker con punto neón */}
          <motion.div variants={item} className="flex items-center gap-3 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_10px_#00e5ff]" />
            </span>
            <span className="font-tech text-[11px] md:text-xs tracking-[0.35em] text-cyan-300/90 uppercase">
              Melipilla · Est. 2014
            </span>
          </motion.div>

          {/* Titular con gancho — neón en una sola palabra */}
          <motion.h1
            variants={item}
            className="font-display leading-[0.86] text-white mb-6"
            style={{ fontSize: "clamp(3.2rem, 11vw, 7.5rem)", letterSpacing: "0.01em" }}
          >
            ARTE QUE
            <br />
            LLEVAS{" "}
            <span className="relative inline-block text-cyan-400 hero-neon-word">
              PARA
            </span>
            <br />
            SIEMPRE
          </motion.h1>

          {/* Subcopy */}
          <motion.p
            variants={item}
            className="text-gray-400 text-sm md:text-base max-w-md mb-8 leading-relaxed"
          >
            Estudio profesional de tatuajes.{" "}
            <span className="text-gray-200">+500 piezas</span> creadas en más de 5 años de
            trayectoria, con un estándar de higiene y detalle que se nota en la piel.
          </motion.p>

          {/* Especialidades — chips minimalistas, esquinas rectas */}
          <motion.div variants={item} className="flex flex-wrap gap-2 mb-9">
            {specialties.map((s) => (
              <span
                key={s}
                className="font-tech text-[10px] md:text-[11px] tracking-[0.15em] text-gray-300 uppercase border border-white/10 px-3 py-1.5 hover:border-cyan-400/40 hover:text-cyan-300 transition-colors duration-300"
              >
                {s}
              </span>
            ))}
          </motion.div>

          {/* CTAs — botón primario neón sólido + link secundario */}
          <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
            <button
              onClick={() => scrollTo("cotizador")}
              className="hero-cta-primary group font-tech text-sm tracking-[0.15em] px-8 py-4 w-full sm:w-auto"
            >
              COTIZAR GRATIS
              <ArrowRight
                size={16}
                weight="bold"
                className="inline ml-2 group-hover:translate-x-1 transition-transform duration-300"
              />
            </button>
            <button
              onClick={() => scrollTo("galeria")}
              className="font-tech text-sm tracking-[0.15em] text-gray-200 hover:text-cyan-300 transition-colors duration-300 pb-1 border-b border-cyan-400/30 hover:border-cyan-400 uppercase"
            >
              Ver galería
            </button>
          </motion.div>

          {/* Trust row — inline, discreto */}
          <motion.div variants={item} className="flex items-center gap-6 text-gray-400">
            <div className="flex items-center gap-2">
              <Star size={15} weight="fill" className="text-cyan-400" />
              <span className="text-white text-sm font-semibold">5.0</span>
              <span className="text-[11px] font-tech tracking-wider">Google</span>
            </div>
            <span className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">500+</span>
              <span className="text-[11px] font-tech tracking-wider">Tatuajes</span>
            </div>
            <span className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <MapPin size={15} weight="duotone" className="text-cyan-400" />
              <span className="text-[11px] font-tech tracking-wider">Melipilla</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Compartir — esquina inferior derecha, desktop */}
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: "MS Estudio de Tatuajes",
              text: "Tatuajes profesionales en Melipilla. Cotiza online.",
              url: window.location.href,
            })
          } else {
            navigator.clipboard.writeText(window.location.href)
          }
        }}
        className="hidden md:inline-flex absolute bottom-8 right-8 z-10 items-center gap-2 text-gray-500 hover:text-cyan-300 transition-colors text-[10px] font-tech tracking-[0.2em] uppercase"
      >
        <Share size={13} />
        Compartir
      </button>

      {/* Indicador de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2"
      >
        <span className="font-tech text-[9px] tracking-[0.3em] text-gray-500 uppercase">Scroll</span>
        <span className="hero-scroll-line" />
      </motion.div>
    </section>
  )
}
