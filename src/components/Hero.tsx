import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Users, Share, Star } from "@phosphor-icons/react"

const easeOut = [0.23, 1, 0.32, 1] as const

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeOut } },
}

export default function Hero() {
  const navigate = useNavigate()
  const [heroImage, setHeroImage] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/galeria")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.images?.length > 0) {
          setHeroImage(data.images[0].imagen_url)
        }
      })
      .catch(() => {})
  }, [])

  const bgImage = heroImage || "https://images.unsplash.com/photo-1611501275010-a5f652551b23?w=1920&q=80"

  return (
    <section id="inicio" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Animated ink background */}
      <div className="absolute inset-0 z-0 ink-bg">
        <div className="ink-blob ink-blob-1" />
        <div className="ink-blob ink-blob-2" />
        <div className="ink-blob ink-blob-3" />
      </div>

      {/* Tattoo background image — cinematic */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          backgroundAttachment: "fixed",
          filter: "grayscale(100%) brightness(12%) contrast(150%)",
        }}
      />
      <div
        className="absolute inset-0 z-0 md:hidden"
        style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          filter: "grayscale(100%) brightness(12%) contrast(150%)",
        }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/90 via-black/40 to-black" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.04)_0%,transparent_60%)]" />

      {/* Video — opcional */}
      <div className="absolute inset-0 z-[2] hidden md:block opacity-30" style={{ mixBlendMode: "overlay" as any }}>
        <video autoPlay muted loop playsInline disablePictureInPicture className="absolute inset-0 w-full h-full object-cover">
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 relative z-10">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          
          {/* Brand */}
          <motion.div variants={itemVariants} className="text-center mb-6 md:mb-10">
            <motion.p
              className="font-tech text-[10px] md:text-xs tracking-[0.4em] text-cyan-400/70 mb-4 uppercase"
            >
              Estudio profesional de tatuajes
            </motion.p>

            <h1 className="section-title-fluid text-white leading-[0.82] mb-4">
              <span className="premium-gradient">MATNESS</span>
              <br />
              <span className="text-white text-3xl sm:text-5xl md:text-7xl lg:text-8xl tracking-[0.05em]">TATTOOS</span>
            </h1>

            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-8 md:w-16 bg-cyan-400/20" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="h-px w-8 md:w-16 bg-cyan-400/20" />
            </div>

            <p className="text-gray-500 text-xs md:text-sm font-tech tracking-[0.15em] uppercase max-w-md mx-auto leading-relaxed">
              11 años transformando ideas en arte eterno
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-12">
            <div className="flex items-center gap-3 glass rounded-full px-4 py-2.5 border border-white/5">
              <Users size={16} className="text-cyan-400" weight="duotone" />
              <span className="text-white font-bold text-sm md:text-base">500+</span>
              <span className="text-gray-500 text-[10px] md:text-xs font-tech tracking-wider">Tatuajes</span>
            </div>
            <div className="flex items-center gap-3 glass rounded-full px-4 py-2.5 border border-white/5">
              <Star size={16} className="text-cyan-400" weight="fill" />
              <span className="text-white font-bold text-sm md:text-base">5.0</span>
              <span className="text-gray-500 text-[10px] md:text-xs font-tech tracking-wider">Google</span>
            </div>
            <div className="flex items-center gap-3 glass rounded-full px-4 py-2.5 border border-white/5">
              <MapPin size={16} className="text-cyan-400" weight="duotone" />
              <span className="text-gray-500 text-[10px] md:text-xs font-tech tracking-wider">Melipilla</span>
            </div>
          </motion.div>

          {/* Specialties */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 mb-12">
            {["Black & Grey", "Microrealismo", "Fine Line", "Lettering", "Realismo"].map(s => (
              <span key={s} className="font-tech text-[10px] tracking-[0.15em] text-gray-400 border border-white/5 rounded-full px-3 py-1.5">
                {s}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const el = document.getElementById("cotizador")
                if (el) { el.scrollIntoView({ behavior: "smooth" }); navigate("#cotizador", { replace: true }) }
              }}
              className="font-tech neon-button-primary rounded-full px-8 py-4 text-sm tracking-[0.15em] w-full sm:w-auto"
            >
              COTIZAR TATUAJE
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const el = document.getElementById("galeria")
                if (el) { el.scrollIntoView({ behavior: "smooth" }); navigate("#galeria", { replace: true }) }
              }}
              className="font-tech neon-button rounded-full px-8 py-4 text-sm tracking-[0.15em] w-full sm:w-auto group"
            >
              VER TRABAJOS
              <ArrowRight size={14} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Compartir */}
          <motion.div variants={itemVariants} className="mt-10 text-center">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "MS Estudio de Tatuajes", text: "Tatuajes profesionales en Melipilla. Cotiza online.", url: window.location.href })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                }
              }}
              className="text-gray-600 hover:text-cyan-400 transition-colors text-[10px] font-tech tracking-[0.2em] uppercase inline-flex items-center gap-2"
            >
              <Share size={12} />
              COMPARTIR
            </button>
          </motion.div>

        </motion.div>
      </div>
    </section>
  )
}
