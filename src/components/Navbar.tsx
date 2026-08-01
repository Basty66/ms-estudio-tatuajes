import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { List, X } from "@phosphor-icons/react"

const links = [
  { href: "#inicio", label: "Inicio" },
  { href: "#sobre", label: "Sobre mí" },
  { href: "#galeria", label: "Galería" },
  { href: "#cuidados", label: "Cuidados" },
  { href: "#cotizador", label: "Cotizador" },
  { href: "#agenda", label: "Agenda" },
  { href: "#faq", label: "FAQ" },
  { href: "#blog", label: "Blog" },
  { href: "#ubicacion", label: "Ubicación" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const tapCount = useRef(0)
  const tapTimer = useRef<number | undefined>(undefined)

  const handleLogoTripleTap = () => {
    tapCount.current += 1
    clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => { tapCount.current = 0 }, 800)

    if (tapCount.current >= 3) {
      tapCount.current = 0
      sessionStorage.setItem("admin_access", "true")
      navigate("/admin")
    }
  }

  const handleNav = (href: string) => {
    setOpen(false)
    const id = href.replace("#", "")
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
      navigate(href, { replace: true })
    }
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-premium shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <button
          onClick={handleLogoTripleTap}
          className="group relative flex items-center gap-2.5"
          aria-label="MS Estudio de Tatuajes"
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 40 40"
            fill="none"
            className="transition-transform duration-500 group-hover:rotate-[8deg]"
          >
            <rect
              x="1.5"
              y="1.5"
              width="37"
              height="37"
              rx="3"
              stroke="rgba(0,229,255,0.5)"
              strokeWidth="1"
              className="group-hover:stroke-cyan-400 transition-colors duration-300"
            />
            <path
              d="M9 28 L9 12 L14.5 22 L20 12 L20 28"
              stroke="#fff"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d="M31 14 Q23 14 23 18.5 Q23 22 27 22 Q31 22 31 25.5 Q31 30 23 29"
              stroke="#00e5ff"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              style={{ filter: "drop-shadow(0 0 4px rgba(0,229,255,0.6))" }}
            />
          </svg>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-display text-lg tracking-[0.12em] text-white">MATNESS</span>
            <span className="font-tech text-[8px] tracking-[0.35em] text-cyan-400/70 uppercase">
              Tattoo Studio
            </span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link, i) => (
            <motion.button
              key={link.href}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => handleNav(link.href)}
              className="font-tech relative px-5 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-300 tracking-[0.2em] uppercase group"
            >
              {link.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-cyan-400 transition-all duration-300 group-hover:w-1/2" />
            </motion.button>
          ))}
        </nav>

        <motion.a
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          href="https://wa.me/56964470668"
          target="_blank"
          rel="noopener noreferrer"
          className="font-tech hidden md:inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm tracking-[0.2em] hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] transition-all duration-300 group"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          CONTACTO
        </motion.a>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-cyan-400 p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Menú"
        >
          {open ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="md:hidden glass-premium border-t border-white/5 overflow-hidden"
          >
            <nav className="flex flex-col px-4 md:px-6 py-4 md:py-6 gap-2">
              {links.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="font-tech group relative text-left py-3 px-4 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-400/10 hover:shadow-[inset_0_0_24px_rgba(0,229,255,0.08)] active:bg-cyan-400/25 active:text-white active:scale-[0.98] transition-all duration-300 tracking-[0.2em] uppercase text-sm overflow-hidden"
                >
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-0 w-[3px] rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.8)] transition-all duration-300 group-hover:h-3/5" />
                  {link.label}
                </button>
              ))}
              <a
                href="https://wa.me/56964470668"
                target="_blank"
                rel="noopener noreferrer"
                className="font-tech mt-2 text-center py-3 px-4 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 tracking-[0.2em] text-sm hover:bg-cyan-400/20 transition-all"
              >
                CONTACTO
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
