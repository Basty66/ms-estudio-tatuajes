import { Camera, Globe, Heart } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-cyan-400/10 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <span className="text-2xl font-bold neon-text tracking-widest">MS</span>
            <p className="text-gray-600 text-xs mt-2 tracking-wider leading-relaxed">
              Estudio de Tatuajes Profesional
              <br />
              Melipilla, Chile
            </p>
          </div>

          <div>
            <h4 className="text-cyan-400 font-bold text-sm tracking-wider mb-4">ENLACES</h4>
            <nav className="flex flex-col gap-2">
              {["Inicio", "Concurso", "Galería", "Cotizador", "Agenda"].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                  className="text-gray-500 hover:text-cyan-400 text-xs tracking-wider transition-colors"
                >
                  {l}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="text-cyan-400 font-bold text-sm tracking-wider mb-4">REDES</h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://instagram.com/matness_tattoos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-500 hover:text-cyan-400 transition-colors text-sm"
              >
                <Camera size={18} />
                @MATNESS_TATTOOS
              </a>
              <a
                href="https://facebook.com/matnesstattoos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-500 hover:text-cyan-400 transition-colors text-sm"
              >
                <Globe size={18} />
                MATNESS TATTOOS
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-400/10 pt-6 text-center">
          <p className="text-gray-700 text-xs tracking-wider flex items-center justify-center gap-1">
            © {new Date().getFullYear()} MS Estudio de Tatuajes. Hecho con <Heart size={12} className="text-cyan-400" /> en Melipilla
          </p>
        </div>
      </div>
    </footer>
  )
}
