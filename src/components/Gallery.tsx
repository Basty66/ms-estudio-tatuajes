const categories = [
  {
    title: "Black & Grey / Realismo",
    subtitle: "Realismo Mitológico",
    desc: "Tatuaje detallado de Anubis",
    gradient: "from-gray-900 via-gray-800 to-gray-900",
    icon: "⚫",
  },
  {
    title: "Microrealismo a Color",
    subtitle: "Fine Line",
    desc: "Dos peces Betta flotando, uno rojo y uno negro",
    gradient: "from-cyan-900 via-blue-900 to-cyan-900",
    icon: "🐟",
  },
  {
    title: "Lettering",
    subtitle: "Caligrafía Custom",
    desc: "Letras estilo Script que digan \"Godfather\"",
    gradient: "from-purple-900 via-gray-900 to-purple-900",
    icon: "✒️",
  },
]

export default function Gallery() {
  return (
    <section id="galeria" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4">
        <p className="section-subtitle text-center mb-2">NUESTRO TRABAJO</p>
        <h2 className="section-title text-4xl md:text-5xl text-center mb-12 neon-text">
          GALERÍA DE ESTILOS
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className={`relative group rounded-xl overflow-hidden bg-gradient-to-br ${cat.gradient} neon-card min-h-[400px] flex flex-col justify-end p-6`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative z-10">
                <span className="text-4xl mb-3 block">{cat.icon}</span>
                <h3 className="text-cyan-400 font-bold text-lg tracking-wider mb-1">
                  {cat.title}
                </h3>
                <p className="text-cyan-200 text-sm font-semibold mb-2">{cat.subtitle}</p>
                <p className="text-gray-400 text-xs tracking-wide">{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-xs mt-8 tracking-wider">
          Tocá una tarjeta para ver más detalles del estilo
        </p>
      </div>
    </section>
  )
}
