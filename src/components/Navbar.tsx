import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { List, X } from "@phosphor-icons/react"

const links = [
  { href: "#inicio", label: "Inicio" },
  { href: "#galeria", label: "Galería" },
  { href: "#cotizador", label: "Cotizador" },
  { href: "#agenda", label: "Agenda" },
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
          ? "glass-strong shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <button
          onClick={() => handleNav("#inicio")}
          className="group relative"
        >
          <span className="text-3xl font-bold tracking-[0.15em] text-white neon-text">
            MS
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link, i) => (
            <motion.button
              key={link.href}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => handleNav(link.href)}
              className="relative px-5 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-300 tracking-widest uppercase group"
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
          className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm tracking-widest hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] transition-all duration-300 group"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          CONTACTO
        </motion.a>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-cyan-400 p-2"
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
            className="md:hidden glass-strong border-t border-white/5 overflow-hidden"
          >
            <nav className="flex flex-col px-6 py-6 gap-2">
              {links.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="text-left py-3 px-4 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/5 transition-all duration-300 tracking-widest uppercase text-sm"
                >
                  {link.label}
                </button>
              ))}
              <a
                href="https://wa.me/56964470668"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-center py-3 px-4 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 tracking-widest text-sm hover:bg-cyan-400/20 transition-all"
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
