import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Lock,
  Eye,
  EyeSlash,
  ChartBar,
  Image,
  NotePencil,
  Star,
  SignOut,
  Trash,
  UploadSimple,
  Plus,
  ListChecks,
  CalendarCheck,
  CurrencyDollar,
  UsersThree,
  Spinner,
  Warning,
} from "@phosphor-icons/react"

interface Metrics {
  cotizaciones: number
  agendamentos: number
  visitas: number
  galeria: number
  publicaciones: number
  resenas: number
}

interface GalleryItem {
  id: number
  imagen_url: string
  estilo: string
  titulo: string
  descripcion: string
  orden: number
  creado_en: string
}

interface Post {
  id: number
  titulo: string
  contenido: string
  imagen_url: string
  tipo: string
  publicado: boolean
  creado_en: string
}

interface Resena {
  id: number
  autor: string
  texto: string
  rating: number
  fuente: string
  creado_en: string
}

interface Booking {
  id: number
  nombre: string
  whatsapp: string
  fecha: string
  descripcion: string
  creado_en: string
}

interface Quote {
  id: number
  nombre: string
  whatsapp: string
  estilo: string
  zona: string
  tamano: string
  imagen_url: string
  creado_en: string
}

type Tab = "dashboard" | "galeria" | "publicaciones" | "resenas" | "citas" | "cotizaciones"

const estilosGallery = [
  { value: "general", label: "General" },
  { value: "black-grey", label: "Black & Grey" },
  { value: "microrealismo", label: "Microrealismo" },
  { value: "fineline", label: "Fine Line" },
  { value: "lettering", label: "Lettering" },
  { value: "tradicional", label: "Tradicional" },
  { value: "otro", label: "Otro" },
]

export default function Admin() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"))
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [logging, setLogging] = useState(false)

  const [tab, setTab] = useState<Tab>("dashboard")
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [cotizaciones, setCotizaciones] = useState<Quote[]>([])
  const [agendamentos, setAgendamentos] = useState<Booking[]>([])
  const [galeria, setGaleria] = useState<GalleryItem[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {}

  const handleLogin = async () => {
    if (!password.trim()) return
    setLogging(true)
    setLoginError("")
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem("admin_token", data.token)
        setToken(data.token)
      } else {
        setLoginError(data.error || "Contraseña incorrecta")
      }
    } catch {
      setLoginError("Error de conexión")
    }
    setLogging(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    setToken(null)
    setPassword("")
  }

  const fetchDashboard = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/auth", { headers })
      const data = await res.json()
      if (data.success) {
        setMetrics(data.metrics)
        setCotizaciones(data.recentCotizaciones || [])
        setAgendamentos(data.recentAgendamentos || [])
      } else {
        handleLogout()
      }
    } catch {
      handleLogout()
    }
    setLoading(false)
  }, [token])

  const fetchGaleria = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/galeria", { headers })
      const data = await res.json()
      if (data.success) setGaleria(data.images)
    } catch {}
    setLoading(false)
  }, [token])

  const fetchPosts = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/publicaciones", { headers })
      const data = await res.json()
      if (data.success) setPosts(data.posts)
    } catch {}
    setLoading(false)
  }, [token])

  const fetchResenas = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/resenas")
      const data = await res.json()
      if (data.success) setResenas(data.resenas)
    } catch {}
    setLoading(false)
  }, [token])

  useEffect(() => {
    if (!token) return
    if (tab === "dashboard") fetchDashboard()
    if (tab === "galeria") fetchGaleria()
    if (tab === "publicaciones") fetchPosts()
    if (tab === "resenas") fetchResenas()
  }, [tab, token, fetchDashboard, fetchGaleria, fetchPosts, fetchResenas])

  const deleteGaleria = async (id: number) => {
    if (!confirm("¿Eliminar esta imagen?")) return
    await fetch(`/api/admin/galeria?id=${id}`, { method: "DELETE", headers })
    fetchGaleria()
  }

  const deletePost = async (id: number) => {
    if (!confirm("¿Eliminar esta publicación?")) return
    await fetch(`/api/admin/publicaciones?id=${id}`, { method: "DELETE", headers })
    fetchPosts()
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 md:p-12 w-full max-w-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-8">
            <Lock size={28} className="text-cyan-400" weight="duotone" />
          </div>
          <h1 className="section-title text-3xl text-center premium-gradient mb-2">ADMIN</h1>
          <p className="font-tech text-center text-gray-600 text-xs tracking-[0.2em] mb-8">ACCESO RESTRINGIDO</p>

          <div className="relative mb-4">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError("") }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="neon-input rounded-xl px-5 py-3.5 w-full text-sm pr-12"
            />
            <button
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400/50 hover:text-cyan-400 transition-colors"
            >
              {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {loginError && (
            <div className="flex items-center gap-2 text-red-400 text-xs mb-4 font-tech tracking-wider">
              <Warning size={14} /> {loginError}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={logging || !password.trim()}
            className="font-tech neon-button-primary w-full rounded-xl px-6 py-3.5 text-sm tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-30"
          >
            {logging ? <Spinner size={18} className="animate-spin" /> : <Lock size={18} weight="bold" />}
            {logging ? "VERIFICANDO..." : "INGRESAR"}
          </button>
        </motion.div>
      </div>
    )
  }

  const navItems: { id: Tab; label: string; icon: typeof ChartBar }[] = [
    { id: "dashboard", label: "Dashboard", icon: ChartBar },
    { id: "galeria", label: "Galería", icon: Image },
    { id: "publicaciones", label: "Publicaciones", icon: NotePencil },
    { id: "resenas", label: "Reseñas", icon: Star },
    { id: "citas", label: "Citas", icon: CalendarCheck },
    { id: "cotizaciones", label: "Cotizaciones", icon: CurrencyDollar },
  ]

  return (
    <div className="min-h-screen bg-dark">
      <header className="sticky top-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="section-title text-xl premium-gradient">MS</span>
            <span className="font-tech text-xs tracking-[0.2em] text-gray-600 hidden sm:inline">ADMIN PANEL</span>
          </div>
          <button
            onClick={handleLogout}
            className="font-tech flex items-center gap-2 text-xs tracking-wider text-gray-500 hover:text-red-400 transition-colors"
          >
            <SignOut size={16} /> SALIR
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-56px)]">
        <nav className="md:w-56 md:border-r border-white/5 p-3 md:p-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`font-tech flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs tracking-wider transition-all whitespace-nowrap ${
                tab === id
                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <Icon size={16} weight="duotone" /> {label.toUpperCase()}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <Spinner size={32} className="text-cyan-400 animate-spin" />
              </motion.div>
            ) : tab === "dashboard" ? (
              <DashboardTab metrics={metrics} cotizaciones={cotizaciones} agendamentos={agendamentos} />
            ) : tab === "galeria" ? (
              <GaleriaTab items={galeria} onDelete={deleteGaleria} onRefresh={fetchGaleria} headers={headers} />
            ) : tab === "publicaciones" ? (
              <PublicacionesTab items={posts} onDelete={deletePost} onRefresh={fetchPosts} headers={headers} />
            ) : tab === "resenas" ? (
              <ResenasTab items={resenas} />
            ) : tab === "citas" ? (
              <CitasTab items={agendamentos} />
            ) : (
              <CotizacionesTab items={cotizaciones} />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof ChartBar; label: string; value: number | string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center">
          <Icon size={18} className="text-cyan-400" weight="duotone" />
        </div>
        <span className="font-tech text-xs tracking-[0.15em] text-gray-500 uppercase">{label}</span>
      </div>
      <p className="text-3xl font-bold section-title text-white">{value}</p>
    </motion.div>
  )
}

function DashboardTab({ metrics, cotizaciones, agendamentos }: { metrics: Metrics | null; cotizaciones: Quote[]; agendamentos: Booking[] }) {
  if (!metrics) return null
  return (
    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6">DASHBOARD</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={CurrencyDollar} label="Cotizaciones" value={metrics.cotizaciones} />
        <StatCard icon={CalendarCheck} label="Agendados" value={metrics.agendamentos} />
        <StatCard icon={UsersThree} label="Visitas" value={metrics.visitas} />
        <StatCard icon={Image} label="Imágenes" value={metrics.galeria} />
        <StatCard icon={NotePencil} label="Publicaciones" value={metrics.publicaciones} />
        <StatCard icon={Star} label="Reseñas" value={metrics.resenas} />
      </div>

      {cotizaciones.length > 0 && (
        <div className="mb-8">
          <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 mb-4 flex items-center gap-2">
            <CurrencyDollar size={16} className="text-cyan-400" /> ÚLTIMAS COTIZACIONES
          </h3>
          <div className="space-y-2">
            {cotizaciones.map((c) => (
              <div key={c.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{c.nombre}</p>
                  <p className="text-gray-500 text-xs">{c.whatsapp} · {c.estilo} · {c.zona} · {c.tamano}</p>
                </div>
                <span className="text-gray-600 text-xs">{new Date(c.creado_en).toLocaleDateString("es-CL")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {agendamentos.length > 0 && (
        <div>
          <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 mb-4 flex items-center gap-2">
            <CalendarCheck size={16} className="text-cyan-400" /> ÚLTIMAS CITAS
          </h3>
          <div className="space-y-2">
            {agendamentos.map((a) => (
              <div key={a.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{a.nombre}</p>
                  <p className="text-gray-500 text-xs">{a.whatsapp} · {a.fecha}</p>
                  {a.descripcion && <p className="text-gray-600 text-xs mt-1">{a.descripcion}</p>}
                </div>
                <span className="text-gray-600 text-xs">{new Date(a.creado_en).toLocaleDateString("es-CL")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function GaleriaTab({ items, onDelete, onRefresh, headers }: { items: GalleryItem[]; onDelete: (id: number) => void; onRefresh: () => void; headers: Record<string, string> }) {
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ estilo: "general", titulo: "", descripcion: "" })
  const [, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  const handleUpload = async () => {
    if (!preview) return
    setUploading(true)
    try {
      const res = await fetch("/api/admin/galeria", {
        method: "POST",
        headers,
        body: JSON.stringify({
          imagen_url: preview,
          estilo: form.estilo,
          titulo: form.titulo,
          descripcion: form.descripcion,
          orden: 0,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setForm({ estilo: "general", titulo: "", descripcion: "" })
        setFile(null)
        setPreview(null)
        onRefresh()
      }
    } catch {}
    setUploading(false)
  }

  return (
    <motion.div key="galeria" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <Image size={20} className="text-cyan-400" /> GALERÍA
      </h2>

      <div className="glass rounded-2xl p-5 md:p-8 mb-8">
        <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 mb-4 flex items-center gap-2">
          <UploadSimple size={16} className="text-cyan-400" /> SUBIR IMAGEN
        </h3>

        <label className="block mb-4">
          <div className="glass rounded-xl p-4 flex items-center justify-center border-2 border-dashed border-white/10 hover:border-cyan-400/30 transition-all cursor-pointer min-h-[120px]">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
            ) : (
              <div className="text-center">
                <UploadSimple size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="font-tech text-xs text-gray-600 tracking-wider">TOCA PARA SELECCIONAR</p>
                <p className="text-gray-700 text-xs mt-1">o arrastra una imagen aquí</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="font-tech text-xs tracking-wider text-gray-500 mb-1 block">ESTILO</label>
            <select
              value={form.estilo}
              onChange={(e) => setForm({ ...form, estilo: e.target.value })}
              className="neon-input rounded-xl px-4 py-3 w-full text-sm"
            >
              {estilosGallery.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-tech text-xs tracking-wider text-gray-500 mb-1 block">TÍTULO</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Nombre del tatuaje"
              className="neon-input rounded-xl px-4 py-3 w-full text-sm"
            />
          </div>
          <div>
            <label className="font-tech text-xs tracking-wider text-gray-500 mb-1 block">DESCRIPCIÓN</label>
            <input
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Breve descripción"
              className="neon-input rounded-xl px-4 py-3 w-full text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !preview}
          className="font-tech neon-button-primary rounded-xl px-6 py-3 text-sm tracking-[0.2em] flex items-center gap-2 disabled:opacity-30"
        >
          {uploading ? <Spinner size={16} className="animate-spin" /> : <Plus size={16} weight="bold" />}
          {uploading ? "SUBIENDO..." : "SUBIR IMAGEN"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass rounded-xl overflow-hidden group"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={item.imagen_url}
                alt={item.titulo || "Tatuaje"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{item.titulo || "Sin título"}</p>
                  <p className="text-cyan-400/60 text-xs font-tech tracking-wider">{item.estilo}</p>
                </div>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-2"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16">
          <Image size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-tech text-gray-600 tracking-wider">NO HAY IMÁGENES AÚN</p>
        </div>
      )}
    </motion.div>
  )
}

function PublicacionesTab({ items, onDelete, onRefresh, headers }: { items: Post[]; onDelete: (id: number) => void; onRefresh: () => void; headers: Record<string, string> }) {
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ titulo: "", contenido: "", imagen_url: "", tipo: "post" })

  const handleCreate = async () => {
    if (!form.titulo.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/publicaciones", {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setForm({ titulo: "", contenido: "", imagen_url: "", tipo: "post" })
        onRefresh()
      }
    } catch {}
    setCreating(false)
  }

  return (
    <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <NotePencil size={20} className="text-cyan-400" /> PUBLICACIONES
      </h2>

      <div className="glass rounded-2xl p-5 md:p-8 mb-8">
        <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-cyan-400" /> NUEVA PUBLICACIÓN
        </h3>
        <div className="space-y-3">
          <input
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título de la publicación"
            className="neon-input rounded-xl px-4 py-3 w-full text-sm"
          />
          <textarea
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            placeholder="Escribe el contenido aquí..."
            rows={4}
            className="neon-input rounded-xl px-4 py-3 w-full text-sm resize-none"
          />
          <input
            value={form.imagen_url}
            onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
            placeholder="URL de imagen (opcional)"
            className="neon-input rounded-xl px-4 py-3 w-full text-sm"
          />
          <div className="flex items-center gap-3">
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="neon-input rounded-xl px-4 py-3 text-sm"
            >
              <option value="post">Post</option>
              <option value="promocion">Promoción</option>
              <option value="evento">Evento</option>
              <option value="aviso">Aviso</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={creating || !form.titulo.trim()}
              className="font-tech neon-button-primary rounded-xl px-6 py-3 text-sm tracking-[0.2em] flex items-center gap-2 disabled:opacity-30"
            >
              {creating ? <Spinner size={16} className="animate-spin" /> : <Plus size={16} weight="bold" />}
              PUBLICAR
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((post) => (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-tech text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 uppercase">
                    {post.tipo}
                  </span>
                  <span className={`text-[10px] ${post.publicado ? "text-green-400" : "text-gray-600"}`}>
                    {post.publicado ? "Publicado" : "Borrador"}
                  </span>
                </div>
                <p className="text-white text-sm font-medium truncate">{post.titulo}</p>
                {post.contenido && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{post.contenido}</p>}
                <p className="text-gray-700 text-xs mt-2">{new Date(post.creado_en).toLocaleDateString("es-CL")}</p>
              </div>
              <button onClick={() => onDelete(post.id)} className="text-gray-600 hover:text-red-400 transition-colors p-2 shrink-0">
                <Trash size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16">
          <NotePencil size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-tech text-gray-600 tracking-wider">NO HAY PUBLICACIONES AÚN</p>
        </div>
      )}
    </motion.div>
  )
}

function ResenasTab({ items }: { items: Resena[] }) {
  return (
    <motion.div key="resenas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <Star size={20} className="text-cyan-400" /> RESEÑAS DE GOOGLE
      </h2>
      <p className="font-tech text-xs text-gray-600 tracking-wider mb-6">
        Las reseñas se agregan manualmente desde esta sección. En el futuro se puede integrar la API de Google Reviews.
      </p>

      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    weight={i < r.rating ? "fill" : "regular"}
                    className={i < r.rating ? "text-yellow-400" : "text-gray-700"}
                  />
                ))}
              </div>
              <span className="text-white text-sm font-medium">{r.autor}</span>
              <span className="text-gray-700 text-xs">{r.fuente}</span>
            </div>
            <p className="text-gray-400 text-sm">{r.texto}</p>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16">
          <Star size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-tech text-gray-600 tracking-wider">NO HAY RESEÑAS AÚN</p>
        </div>
      )}
    </motion.div>
  )
}

function CitasTab({ items }: { items: Booking[] }) {
  return (
    <motion.div key="citas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <CalendarCheck size={20} className="text-cyan-400" /> CITAS AGENDADAS
      </h2>
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white text-sm font-medium">{a.nombre}</p>
                <p className="text-cyan-400/60 text-xs font-tech">{a.whatsapp}</p>
                <p className="text-gray-400 text-xs mt-1">{a.fecha}</p>
                {a.descripcion && <p className="text-gray-500 text-xs mt-2 italic">"{a.descripcion}"</p>}
              </div>
              <span className="text-gray-700 text-xs">{new Date(a.creado_en).toLocaleDateString("es-CL")}</span>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center py-16">
          <ListChecks size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-tech text-gray-600 tracking-wider">NO HAY CITAS AÚN</p>
        </div>
      )}
    </motion.div>
  )
}

function CotizacionesTab({ items }: { items: Quote[] }) {
  return (
    <motion.div key="cotizaciones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <CurrencyDollar size={20} className="text-cyan-400" /> COTIZACIONES
      </h2>
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white text-sm font-medium">{c.nombre}</p>
                <p className="text-cyan-400/60 text-xs font-tech">{c.whatsapp}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400">{c.estilo}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{c.zona}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{c.tamano}</span>
                </div>
              </div>
              <span className="text-gray-700 text-xs">{new Date(c.creado_en).toLocaleDateString("es-CL")}</span>
            </div>
            {c.imagen_url && (
              <div className="mt-3">
                <img src={c.imagen_url} alt="Referencia" className="w-20 h-20 rounded-lg object-cover" />
              </div>
            )}
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center py-16">
          <CurrencyDollar size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-tech text-gray-600 tracking-wider">NO HAY COTIZACIONES AÚN</p>
        </div>
      )}
    </motion.div>
  )
}
