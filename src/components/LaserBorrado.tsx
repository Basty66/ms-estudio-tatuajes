import { motion } from "framer-motion"
import { Crosshair, ShieldCheck, Clock, Sparkle, ArrowRight } from "@phosphor-icons/react"

const beneficios = [
  {
    icon: Crosshair,
    title: "¿Cómo funciona?",
    text: "El láser descompone la tinta en partículas diminutas que tu cuerpo elimina de forma natural. En cada sesión el tatuaje se aclara de forma progresiva.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro y sin cirugía",
    text: "Procedimiento ambulatorio, sin cortes ni anestesia general. Siguiendo los cuidados, no deja cicatrices.",
  },
  {
    icon: Clock,
    title: "Varias sesiones",
    text: "La cantidad depende del tamaño, los colores y la antigüedad. Se espacian entre 4 y 8 semanas para que la piel se recupere.",
  },
  {
    icon: Sparkle,
    title: "Ideal para",
    text: "Tatuajes que ya no querés, trabajos oscuros o piezas que querés aclarar para cubrirlas con un diseño nuevo.",
  },
]

export default function LaserBorrado() {
  return (
    <section id="laser" className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-dark-100 to-black" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400 uppercase">
            <Crosshair size={14} className="inline mr-2 text-cyan-400" weight="fill" />
            Nuevo servicio
          </span>
          <h2 className="section-title text-4xl md:text-6xl text-white mt-2 mb-4">
            BORRADO DE TATUAJES <span className="premium-gradient">CON LÁSER</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            ¿Tenés un tatuaje que ya no te representa? En MS Estudio lo borramos o aclaramos con láser especializado, con valoración gratuita.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-3xl mx-auto mb-14"
        >
          <div className="absolute -inset-1 bg-cyan-400/10 rounded-3xl blur-2xl" />
          <div className="relative glass-premium rounded-2xl overflow-hidden border border-cyan-400/20">
            <img
              src="/images/laser-borrado.jpg"
              alt="Aparato de borrado de tatuajes con láser"
              className="w-full h-64 md:h-80 object-cover grayscale contrast-150 brightness-[0.65]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-tech text-[10px] tracking-[0.25em] text-cyan-400/80 uppercase whitespace-nowrap">
              Tecnología láser para borrado de tatuajes
            </p>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {beneficios.map((b, i) => {
            const Icon = b.icon
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-premium rounded-2xl p-6 border border-white/5 hover:border-cyan-400/20 transition-colors duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center">
                    <Icon size={18} className="text-cyan-400" weight="duotone" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{b.title}</h3>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{b.text}</p>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-500 text-xs mb-6">
            Cada caso es distinto: escribime y te comento cuántas sesiones estimo para el tuyo.
          </p>
          <a
            href="https://wa.me/56964470668?text=Hola!%20Quiero%20informaci%C3%B3n%20sobre%20el%20borrado%20de%20tatuajes%20con%20l%C3%A1ser"
            target="_blank"
            rel="noopener noreferrer"
            className="font-tech inline-flex items-center gap-2 px-8 py-4 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm tracking-[0.2em] hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] transition-all duration-300 group"
          >
            CONSULTAR POR MI BORRADO
            <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
