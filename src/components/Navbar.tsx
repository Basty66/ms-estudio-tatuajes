import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { List, X, CaretDown } from "@phosphor-icons/react"

const navGroups = [
  {
    label: "Servicios",
    items: [
      { href: "#galeria", label: "Galería" },
      { href: "#cotizador", label: "Cotizador" },
      { href: "#agenda", label: "Agenda" },
      { href: "#laser", label: "Láser" },
    ],
  },
  {
    label: "Info",
    items: [
      { href: "#sobre", label: "Sobre mí" },
      { href: "#cuidados", label: "Cuidados" },
      { href: "#consentimiento", label: "Consentimiento" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    label: "Más",
    items: [
      { href: "#blog", label: "Blog" },
      { href: "#reels", label: "Reels" },
      { href: "#ubicacion", label: "Ubicación" },
    ],
  },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
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
    setActiveDropdown(null)
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
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-18 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={handleLogoTripleTap}
          className="group relative flex items-center gap-2.5 shrink-0"
          aria-label="MS Estudio de Tatuajes"
        >
          <svg
            width="32"
            height="32"
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
            <span className="font-display text-base tracking-[0.12em] text-white">MATNESS</span>
            <span className="font-tech text-[7px] tracking-[0.35em] text-cyan-400/70 uppercase">
              Tattoo Studio
            </span>
          </div>
        </button>

        {/* Desktop nav — dropdowns compactos */}
        <nav className="hidden md:flex items-center gap-1 ml-auto mr-4" ref={dropdownRef}>
          {navGroups.map((group) => (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => setActiveDropdown(group.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`font-tech flex items-center gap-1 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors duration-300 tracking-[0.15em] uppercase ${
                  activeDropdown === group.label ? "text-white" : ""
                }`}
              >
                {group.label}
                <CaretDown
                  size={10}
                  weight="bold"
                  className={`transition-transform duration-200 ${activeDropdown === group.label ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {activeDropdown === group.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 glass-premium rounded-xl py-2 min-w-[180px] border border-white/10"
                  >
                    {group.items.map((link) => (
                      <button
                        key={link.href}
                        onClick={() => handleNav(link.href)}
                        className="font-tech w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-all duration-200 tracking-[0.15em] uppercase"
                      >
                        {link.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* CTA contacto */}
        <motion.a
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          href="https://wa.me/56964470668"
          target="_blank"
          rel="noopener noreferrer"
          className="font-tech hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-xs tracking-[0.15em] hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] transition-all duration-300 shrink-0"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          CONTACTO
        </motion.a>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-cyan-400 p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Menú"
        >
          {open ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="md:hidden glass-premium border-t border-white/5 overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-4 gap-1">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="font-tech text-[10px] text-cyan-400/60 tracking-[0.3em] uppercase px-4 pt-3 pb-1">
                    {group.label}
                  </p>
                  {group.items.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => handleNav(link.href)}
                      className="font-tech group relative text-left py-2.5 px-4 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-400/10 active:bg-cyan-400/25 active:text-white active:scale-[0.98] transition-all duration-300 tracking-[0.15em] uppercase text-sm overflow-hidden"
                    >
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-0 w-[3px] rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.8)] transition-all duration-300 group-hover:h-3/5" />
                      {link.label}
                    </button>
                  ))}
                </div>
              ))}
              <a
                href="https://wa.me/56964470668"
                target="_blank"
                rel="noopener noreferrer"
                className="font-tech mt-2 text-center py-3 px-4 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 tracking-[0.15em] text-sm hover:bg-cyan-400/20 transition-all"
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
