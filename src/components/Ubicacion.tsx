import { MapPin, ShieldCheck, Building, Star } from "lucide-react"

const pillars = [
  { icon: MapPin, title: "FÁCIL DE ENCONTRAR", desc: "Av. Manso 529, Segundo Piso" },
  { icon: Building, title: "ESTUDIO PROFESIONAL", desc: "Espacio equipado y exclusivo" },
  { icon: Star, title: "EXPERIENCIA Y CALIDAD", desc: "Arte y precisión en cada trazo" },
]

export default function Ubicacion() {
  return (
    <section id="ubicacion" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4">
        <p className="section-subtitle text-center mb-2">ENCUÉNTRANOS</p>
        <h2 className="section-title text-4xl md:text-5xl text-center mb-12 neon-text">
          NUESTRA UBICACIÓN
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="neon-card rounded-xl p-8 flex flex-col justify-center">
            <div className="flex items-start gap-4 mb-6">
              <MapPin className="text-cyan-400 shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-white font-bold text-lg tracking-wider mb-1">
                  MS ESTUDIO DE TATUAJES
                </h3>
                <p className="text-gray-400 text-sm">
                  AV. MANSO 529, SEGUNDO PISO
                  <br />
                  MELIPILLA, CHILE
                </p>
              </div>
            </div>
            <div className="neon-border rounded-lg p-4 bg-dark-200/50">
              <p className="text-cyan-300 text-sm font-semibold tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} />
                Puerta blanca es la entrada
              </p>
            </div>
          </div>

          <div className="neon-card rounded-xl p-8 flex items-center justify-center min-h-[250px]">
            <div className="text-center">
              <MapPin size={48} className="text-cyan-400 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-gray-400 text-sm tracking-wider">
                Melipilla, Región Metropolitana
              </p>
              <a
                href="https://maps.google.com/?q=Av.+Manso+529+Melipilla"
                target="_blank"
                rel="noopener noreferrer"
                className="neon-button inline-flex px-5 py-2 rounded-lg text-sm tracking-wider mt-4"
              >
                VER EN MAPA
              </a>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.title} className="neon-card rounded-xl p-6 text-center">
                <Icon className="text-cyan-400 mx-auto mb-4" size={32} strokeWidth={1.5} />
                <h4 className="text-white font-bold text-sm tracking-wider mb-2">{p.title}</h4>
                <p className="text-gray-500 text-xs">{p.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
