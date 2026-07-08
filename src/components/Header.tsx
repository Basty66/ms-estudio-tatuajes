import { useState } from "react"
import { Menu, X } from "lucide-react"

const links = [
  { href: "#inicio", label: "Inicio" },
  { href: "#concurso", label: "Concurso" },
  { href: "#galeria", label: "Galería" },
  { href: "#cotizador", label: "Cotizador" },
  { href: "#agenda", label: "Agendar" },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark/90 backdrop-blur-md border-b border-cyan-400/20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#" className="text-2xl font-bold neon-text tracking-widest select-none">
          MS
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-400 hover:text-cyan-400 transition-colors tracking-wider uppercase"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="https://wa.me/56964470668"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex neon-button-primary px-5 py-2 rounded text-sm tracking-wider"
        >
          CONTÁCTANOS
        </a>

        <button
          className="md:hidden text-cyan-400"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-dark-200/95 backdrop-blur-md border-t border-cyan-400/20">
          <nav className="flex flex-col items-center gap-4 py-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-cyan-400 transition-colors tracking-wider uppercase text-sm"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://wa.me/56964470668"
              target="_blank"
              rel="noopener noreferrer"
              className="neon-button-primary px-5 py-2 rounded text-sm tracking-wider"
            >
              CONTÁCTANOS
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
