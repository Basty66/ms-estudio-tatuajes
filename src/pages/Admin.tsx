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
  CalendarCheck,
  CurrencyDollar,
  UsersThree,
  Spinner,
  Warning,
  Clock,
  Check,
  XCircle,
  PencilSimple,
  CalendarBlank,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react"

interface Metrics {
  cotizaciones: number
  agendamentos: number
  visitas: number
  galeria: number
  publicaciones: number
  resenas: number
  citasPendientes?: number
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
  hora: string
  duracion: number
  descripcion: string
  estado: string
  admin_notas: string
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
  created_at: string
  estado: string
}

interface DisponibilidadItem {
  dia_semana: number
  activo: boolean
  hora_inicio: string
  hora_fin: string
  slots_max: number
}

interface ExcepcionFecha {
  id: number
  fecha: string
  slots_max: number | null
  activo: boolean
  motivo: string
}

type Tab = "dashboard" | "galeria" | "publicaciones" | "resenas" | "disponibilidad" | "citas" | "cotizaciones"

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

  useEffect(() => {
    const hasToken = !!token
    const hasAccess = sessionStorage.getItem("admin_access") === "true"
    if (!hasToken && !hasAccess) {
      window.location.replace("/")
      return
    }
    sessionStorage.removeItem("admin_access")
  }, [])
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
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadItem[]>([])
  const [excepciones, setExcepciones] = useState<ExcepcionFecha[]>([])
  const [allCitas, setAllCitas] = useState<Booking[]>([])
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

  const fetchCotizaciones = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/cotizaciones", { headers })
      const data = await res.json()
      if (data.success) setCotizaciones(data.cotizaciones)
    } catch {}
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

  const fetchDisponibilidad = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/disponibilidad", { headers })
      const data = await res.json()
      if (data.success) {
        setDisponibilidad(data.template || [])
        setExcepciones(data.overrides || [])
        setAllCitas(data.citas || [])
      }
    } catch {}
    setLoading(false)
  }, [token])

  const fetchAllCitas = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/citas", { headers })
      const data = await res.json()
      if (data.success) setAllCitas(data.citas || [])
    } catch {}
    setLoading(false)
  }, [token])

  useEffect(() => {
    if (!token) return
    if (tab === "dashboard") fetchDashboard()
    if (tab === "galeria") fetchGaleria()
    if (tab === "publicaciones") fetchPosts()
    if (tab === "resenas") fetchResenas()
    if (tab === "disponibilidad") fetchDisponibilidad()
    if (tab === "citas") fetchAllCitas()
    if (tab === "cotizaciones") fetchCotizaciones()
  }, [tab, token, fetchDashboard, fetchGaleria, fetchPosts, fetchResenas, fetchDisponibilidad, fetchAllCitas, fetchCotizaciones])

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
    { id: "disponibilidad", label: "Disponibilidad", icon: Clock },
    { id: "citas", label: "Citas", icon: CalendarCheck },
    { id: "galeria", label: "Galería", icon: Image },
    { id: "publicaciones", label: "Publicaciones", icon: NotePencil },
    { id: "resenas", label: "Reseñas", icon: Star },
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
              <DashboardTab metrics={metrics} citasPendientes={allCitas.filter(c => (!c.estado || c.estado === 'pendiente')).length} cotizaciones={cotizaciones} agendamentos={agendamentos} />
            ) : tab === "disponibilidad" ? (
              <DisponibilidadTab disponibilidad={disponibilidad} excepciones={excepciones} onRefresh={fetchDisponibilidad} headers={headers} />
            ) : tab === "citas" ? (
              <CitasManagerTab citas={allCitas} onRefresh={fetchAllCitas} headers={headers} />
            ) : tab === "galeria" ? (
              <GaleriaTab items={galeria} onDelete={deleteGaleria} onRefresh={fetchGaleria} headers={headers} />
            ) : tab === "publicaciones" ? (
              <PublicacionesTab items={posts} onDelete={deletePost} onRefresh={fetchPosts} headers={headers} />
            ) : tab === "resenas" ? (
              <ResenasTab items={resenas} />
            ) : tab === "cotizaciones" ? (
              <CotizacionesTab items={cotizaciones} onRefresh={fetchCotizaciones} headers={headers} />
            ) : null}
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

function DashboardTab({ metrics, citasPendientes, cotizaciones, agendamentos }: {
  metrics: Metrics | null
  citasPendientes: number
  cotizaciones: Quote[]
  agendamentos: Booking[]
}) {
  if (!metrics) return null
  return (
    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6">DASHBOARD</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CalendarCheck} label="Citas Pendientes" value={citasPendientes} />
        <StatCard icon={UsersThree} label="Citas Activas" value={metrics.agendamentos} />
        <StatCard icon={CurrencyDollar} label="Cotizaciones" value={metrics.cotizaciones} />
        <StatCard icon={ChartBar} label="Visitas" value={metrics.visitas} />
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
                <span className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString("es-CL")}</span>
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

function DisponibilidadTab({ disponibilidad, excepciones, onRefresh, headers }: {
  disponibilidad: DisponibilidadItem[]
  excepciones: ExcepcionFecha[]
  onRefresh: () => void
  headers: Record<string, string>
}) {
  const [template, setTemplate] = useState<DisponibilidadItem[]>([])
  const [editExcepcion, setEditExcepcion] = useState({ fecha: "", slots_max: "", motivo: "", activo: true })
  const [saving, setSaving] = useState(false)
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  const daysShort = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

  // Calendar state for visual disponibilidad
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calDays, setCalDays] = useState<any[]>([])
  const [loadingCal, setLoadingCal] = useState(true)

  useEffect(() => {
    setLoadingCal(true)
    fetch(`/api/disponibilidad?year=${calYear}&month=${calMonth}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setCalDays(data.days || [])
      })
      .catch(() => {})
      .finally(() => setLoadingCal(false))
  }, [calYear, calMonth])

  const calMonthData = (() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const calDaysMap = new Map(calDays.map((d: any) => [d.date, d]))

    const getStatus = (day: number) => {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const info = calDaysMap.get(dateStr)
      if (!info) return "nodata"
      if (!info.available) return "full"
      if (info.booked > 0) return "partial"
      return "free"
    }

    const calColor = (status: string) => {
      switch (status) {
        case "free": return "text-gray-300 bg-cyan-400/5"
        case "partial": return "text-amber-300 bg-amber-400/10 border border-amber-400/20"
        case "full": return "text-red-400 bg-red-400/10 border border-red-400/20"
        default: return "text-gray-700"
      }
    }

    return { daysInMonth, firstDay, calDaysMap, getStatus, calColor }
  })()

  useEffect(() => {
    setTemplate(disponibilidad.length > 0
      ? disponibilidad
      : Array.from({ length: 7 }, (_, i) => ({
          dia_semana: i, activo: i !== 0, hora_inicio: "10:00", hora_fin: "19:00", slots_max: 3
        }))
    )
  }, [disponibilidad])

  const saveTemplate = async () => {
    setSaving(true)
    try {
      await fetch("/api/admin/disponibilidad", {
        method: "POST", headers,
        body: JSON.stringify({ template }),
      })
      onRefresh()
    } catch {}
    setSaving(false)
  }

  const saveExcepcion = async () => {
    if (!editExcepcion.fecha) return
    setSaving(true)
    try {
      await fetch("/api/admin/disponibilidad", {
        method: "POST", headers,
        body: JSON.stringify({
          override: {
            fecha: editExcepcion.fecha,
            slots_max: editExcepcion.slots_max ? parseInt(editExcepcion.slots_max) : null,
            activo: editExcepcion.activo,
            motivo: editExcepcion.motivo,
          }
        }),
      })
      setEditExcepcion({ fecha: "", slots_max: "", motivo: "", activo: true })
      onRefresh()
    } catch {}
    setSaving(false)
  }

  const deleteExcepcion = async (fecha: string) => {
    if (!confirm(`¿Eliminar excepción para ${fecha}?`)) return
    try {
      await fetch("/api/admin/disponibilidad", {
        method: "POST", headers,
        body: JSON.stringify({ deleteOverride: fecha }),
      })
      onRefresh()
    } catch {}
  }

  return (
    <motion.div key="disp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <Clock size={20} className="text-cyan-400" /> DISPONIBILIDAD SEMANAL
      </h2>

      <div className="glass rounded-2xl p-5 md:p-8 mb-8">
        <div className="space-y-3">
          {template.map((d) => (
            <div key={d.dia_semana} className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setTemplate(template.map(t => t.dia_semana === d.dia_semana ? { ...t, activo: !t.activo } : t))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  d.activo ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30" : "bg-white/5 text-gray-600 border border-white/10"
                }`}
              >
                {d.activo ? <Check size={14} weight="bold" /> : <XCircle size={14} />}
              </button>
              <span className={`font-tech text-sm w-24 tracking-wider ${d.activo ? "text-white" : "text-gray-600"}`}>{days[d.dia_semana]}</span>
              {d.activo && (
                <>
                  <input type="time" value={d.hora_inicio} onChange={(e) => setTemplate(template.map(t => t.dia_semana === d.dia_semana ? { ...t, hora_inicio: e.target.value } : t))}
                    className="neon-input rounded-lg px-3 py-2 w-28 text-xs" />
                  <span className="text-gray-600 text-xs">a</span>
                  <input type="time" value={d.hora_fin} onChange={(e) => setTemplate(template.map(t => t.dia_semana === d.dia_semana ? { ...t, hora_fin: e.target.value } : t))}
                    className="neon-input rounded-lg px-3 py-2 w-28 text-xs" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-xs">Slots:</span>
                    <input type="number" min={1} max={10} value={d.slots_max} onChange={(e) => setTemplate(template.map(t => t.dia_semana === d.dia_semana ? { ...t, slots_max: parseInt(e.target.value) || 1 } : t))}
                      className="neon-input rounded-lg px-3 py-2 w-16 text-xs text-center" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <button onClick={saveTemplate} disabled={saving}
          className="font-tech neon-button-primary rounded-xl px-6 py-3 text-sm tracking-[0.2em] mt-6 disabled:opacity-30">
          {saving ? "GUARDANDO..." : "GUARDAR DISPONIBILIDAD"}
        </button>
      </div>

      {/* Calendario visual */}
      <div className="glass rounded-2xl p-5 md:p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 flex items-center gap-2">
            <CalendarBlank size={16} className="text-cyan-400" /> CALENDARIO DE DISPONIBILIDAD
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => { if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11) } else setCalMonth(calMonth - 1) }}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 transition-all">
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="font-tech text-white text-sm tracking-wider w-32 text-center">
              {monthNames[calMonth]} {calYear}
            </span>
            <button onClick={() => { if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0) } else setCalMonth(calMonth + 1) }}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 transition-all">
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-4 text-[10px] font-tech tracking-wider flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-400" /> Libre</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> Parcial</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400" /> Lleno</span>
        </div>

        {loadingCal ? (
          <div className="flex items-center justify-center py-10">
            <Spinner size={20} className="text-cyan-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysShort.map((d) => (
                <div key={d} className="font-tech text-center text-[11px] tracking-wider text-cyan-400/40 font-semibold py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calMonthData.firstDay }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: calMonthData.daysInMonth }).map((_, i) => {
                const day = i + 1
                const status = calMonthData.getStatus(day)
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const info = calMonthData.calDaysMap.get(dateStr)
                return (
                  <div key={day}
                    title={info ? `${info.booked}/${info.max} cupos · ${info.pendientes || 0} pendientes, ${info.confirmadas || 0} confirmadas` : ""}
                    className={`text-xs min-h-[32px] py-1.5 rounded-lg text-center font-tech transition-all ${calMonthData.calColor(status)}`}>
                    {day}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 mb-4 flex items-center gap-2">
        <CalendarBlank size={16} className="text-cyan-400" /> EXCEPCIONES POR FECHA
      </h3>

      <div className="glass rounded-2xl p-5 md:p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="font-tech text-xs tracking-wider text-gray-500 mb-1 block">FECHA</label>
            <input type="date" value={editExcepcion.fecha} onChange={(e) => setEditExcepcion({ ...editExcepcion, fecha: e.target.value })}
              className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
          </div>
          <div>
            <label className="font-tech text-xs tracking-wider text-gray-500 mb-1 block">SLOTS (vacío = usar template)</label>
            <input type="number" min={0} max={10} value={editExcepcion.slots_max} onChange={(e) => setEditExcepcion({ ...editExcepcion, slots_max: e.target.value })}
              placeholder="Ej: 2" className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
          </div>
          <div>
            <label className="font-tech text-xs tracking-wider text-gray-500 mb-1 block">MOTIVO</label>
            <input value={editExcepcion.motivo} onChange={(e) => setEditExcepcion({ ...editExcepcion, motivo: e.target.value })}
              placeholder="Ej: Feriado" className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => setEditExcepcion({ ...editExcepcion, activo: !editExcepcion.activo })}
              className={`font-tech rounded-xl px-4 py-3 text-xs tracking-wider transition-all ${editExcepcion.activo ? "bg-green-400/10 text-green-400 border border-green-400/30" : "bg-red-400/10 text-red-400 border border-red-400/30"}`}>
              {editExcepcion.activo ? "DISPONIBLE" : "BLOQUEADO"}
            </button>
            <button onClick={saveExcepcion} disabled={saving || !editExcepcion.fecha}
              className="font-tech neon-button-primary rounded-xl px-4 py-3 text-xs tracking-wider disabled:opacity-30">
              AGREGAR
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {excepciones.map((ex) => (
          <div key={ex.id} className="glass rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`w-2 h-2 rounded-full ${ex.activo ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-white text-sm">{ex.fecha}</span>
              <span className="text-gray-500 text-xs">{ex.slots_max !== null ? `${ex.slots_max} slots` : "Template"}</span>
              {ex.motivo && <span className="text-cyan-400/60 text-xs">{ex.motivo}</span>}
            </div>
            <button onClick={() => deleteExcepcion(ex.fecha)} className="text-gray-600 hover:text-red-400 transition-colors p-2">
              <Trash size={16} />
            </button>
          </div>
        ))}
        {excepciones.length === 0 && <p className="text-center text-gray-600 text-sm py-8">Sin excepciones</p>}
      </div>
    </motion.div>
  )
}

function CitasManagerTab({ citas, onRefresh, headers }: {
  citas: Booking[]
  onRefresh: () => void
  headers: Record<string, string>
}) {
  const [filtro, setFiltro] = useState<string>("todas")
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ nombre: "", whatsapp: "", fecha: "", hora: "", duracion: 120, descripcion: "", estado: "pendiente", admin_notas: "" })
  const [creando, setCreando] = useState(false)
  const [nueva, setNueva] = useState({ nombre: "", whatsapp: "+56", fecha: "", hora: "", duracion: 120, descripcion: "" })

  const updateEstado = async (id: number, estado: string) => {
    await fetch("/api/admin/citas", {
      method: "PATCH", headers,
      body: JSON.stringify({ id, estado }),
    })
    onRefresh()
  }

  const saveEdit = async () => {
    if (!editId) return
    await fetch("/api/admin/citas", {
      method: "PATCH", headers,
      body: JSON.stringify({ id: editId, ...editForm }),
    })
    setEditId(null)
    onRefresh()
  }

  const deleteCita = async (id: number) => {
    if (!confirm("¿Eliminar esta cita?")) return
    await fetch(`/api/admin/citas?id=${id}`, { method: "DELETE", headers })
    onRefresh()
  }

  const crearCita = async () => {
    if (!nueva.nombre || !nueva.whatsapp || !nueva.fecha) return
    setCreando(true)
    await fetch("/api/admin/citas", {
      method: "POST", headers,
      body: JSON.stringify(nueva),
    })
    setNueva({ nombre: "", whatsapp: "+56", fecha: "", hora: "", duracion: 120, descripcion: "" })
    setCreando(false)
    onRefresh()
  }

  const estadoBadge = (estado: string | null) => {
    const e = estado || "pendiente"
    const colors: Record<string, string> = {
      pendiente: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
      confirmada: "bg-green-400/10 text-green-400 border-green-400/30",
      cancelada: "bg-red-400/10 text-red-400 border-red-400/30",
      completada: "bg-blue-400/10 text-blue-400 border-blue-400/30",
    }
    return colors[e] || colors.pendiente
  }

  const filtros: { key: string; label: string; color: string }[] = [
    { key: "todas", label: "Todas", color: "text-gray-300" },
    { key: "pendiente", label: `Pendientes (${citas.filter(c => !c.estado || c.estado === "pendiente").length})`, color: "text-yellow-400" },
    { key: "confirmada", label: `Confirmadas (${citas.filter(c => c.estado === "confirmada").length})`, color: "text-green-400" },
    { key: "completada", label: `Completadas (${citas.filter(c => c.estado === "completada").length})`, color: "text-blue-400" },
    { key: "cancelada", label: `Canceladas (${citas.filter(c => c.estado === "cancelada").length})`, color: "text-red-400" },
  ]

  const filtradas = filtro === "todas" ? citas : citas.filter(c => (c.estado || "pendiente") === filtro)

  return (
    <motion.div key="citas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <CalendarCheck size={20} className="text-cyan-400" /> GESTIÓN DE CITAS
      </h2>

      <div className="glass rounded-2xl p-5 md:p-8 mb-8">
        <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-cyan-400" /> AGREGAR CITA MANUAL
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })}
            placeholder="Nombre" className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
          <input value={nueva.whatsapp} onChange={(e) => setNueva({ ...nueva, whatsapp: e.target.value })}
            placeholder="+56 9 XXXX XXXX" className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
          <input type="date" value={nueva.fecha} onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })}
            className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
          <input type="time" value={nueva.hora} onChange={(e) => setNueva({ ...nueva, hora: e.target.value })}
            className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
        </div>
        <button onClick={crearCita} disabled={creando || !nueva.nombre || !nueva.fecha}
          className="font-tech neon-button-primary rounded-xl px-6 py-3 text-sm tracking-[0.2em] disabled:opacity-30">
          {creando ? "CREANDO..." : "CREAR CITA"}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filtros.map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`font-tech text-xs tracking-wider px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              filtro === f.key
                ? "bg-white/10 text-white border border-white/20"
                : "text-gray-500 hover:text-gray-300 border border-transparent"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtradas.map((c) => (
          <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4">
            {editId === c.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    className="neon-input rounded-xl px-4 py-2 w-full text-sm" />
                  <input value={editForm.whatsapp} onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                    className="neon-input rounded-xl px-4 py-2 w-full text-sm" />
                  <input type="date" value={editForm.fecha} onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                    className="neon-input rounded-xl px-4 py-2 w-full text-sm" />
                  <input type="time" value={editForm.hora} onChange={(e) => setEditForm({ ...editForm, hora: e.target.value })}
                    className="neon-input rounded-xl px-4 py-2 w-full text-sm" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <select value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                    className="neon-input rounded-xl px-4 py-2 text-sm">
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                  <div>
                    <span className="text-gray-600 text-xs block mb-1">Duración (min):</span>
                    <input type="number" min={30} step={30} value={editForm.duracion}
                      onChange={(e) => setEditForm({ ...editForm, duracion: parseInt(e.target.value) || 120 })}
                      className="neon-input rounded-xl px-4 py-2 w-full text-sm" />
                  </div>
                  <input value={editForm.descripcion} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                    placeholder="Descripción" className="neon-input rounded-xl px-4 py-2 w-full text-sm col-span-2" />
                </div>
                <input value={editForm.admin_notas} onChange={(e) => setEditForm({ ...editForm, admin_notas: e.target.value })}
                  placeholder="Notas internas del admin" className="neon-input rounded-xl px-4 py-2 w-full text-sm" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="font-tech neon-button-primary rounded-xl px-4 py-2 text-xs tracking-wider">GUARDAR</button>
                  <button onClick={() => setEditId(null)} className="font-tech neon-button rounded-xl px-4 py-2 text-xs tracking-wider">CANCELAR</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-tech text-[10px] tracking-wider px-2 py-0.5 rounded-full border ${estadoBadge(c.estado)}`}>
                      {(c.estado || "pendiente").toUpperCase()}
                    </span>
                    <span className="text-white text-sm font-medium">{c.nombre}</span>
                    <span className="text-cyan-400/60 text-xs font-tech">{c.whatsapp}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><CalendarBlank size={12} /> {c.fecha}</span>
                    {c.hora && <span className="flex items-center gap-1"><Clock size={12} /> {c.hora}</span>}
                    <span>{c.duracion} min</span>
                  </div>
                  {c.descripcion && <p className="text-gray-500 text-xs mt-1 italic">"{c.descripcion}"</p>}
                  {c.admin_notas && <p className="text-cyan-400/40 text-xs mt-1">📝 {c.admin_notas}</p>}
                  <p className="text-gray-700 text-xs mt-1">Creado: {new Date(c.creado_en).toLocaleDateString("es-CL")}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(c.estado || "pendiente") === "pendiente" && (
                    <button onClick={() => updateEstado(c.id, "confirmada")}
                      className="text-green-400 hover:bg-green-400/10 p-1.5 rounded-lg transition-all" title="Confirmar">
                      <Check size={16} weight="bold" />
                    </button>
                  )}
                  {(c.estado || "pendiente") === "confirmada" && (
                    <button onClick={() => updateEstado(c.id, "completada")}
                      className="text-blue-400 hover:bg-blue-400/10 p-1.5 rounded-lg transition-all" title="Completada">
                      <Check size={16} weight="bold" />
                    </button>
                  )}
                  {(c.estado || "pendiente") !== "cancelada" && (c.estado || "pendiente") !== "completada" && (
                    <button onClick={() => updateEstado(c.id, "cancelada")}
                      className="text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-all" title="Cancelar">
                      <XCircle size={16} />
                    </button>
                  )}
                  <button onClick={() => {
                    setEditId(c.id)
                    setEditForm({ nombre: c.nombre, whatsapp: c.whatsapp, fecha: c.fecha, hora: c.hora || "", duracion: c.duracion || 120, descripcion: c.descripcion || "", estado: c.estado || "pendiente", admin_notas: c.admin_notas || "" })
                  }}
                    className="text-cyan-400 hover:bg-cyan-400/10 p-1.5 rounded-lg transition-all" title="Editar">
                    <PencilSimple size={16} />
                  </button>
                  <button onClick={() => deleteCita(c.id)}
                    className="text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-all" title="Eliminar">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filtradas.length === 0 && (
        <div className="text-center py-16">
          <CalendarCheck size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-tech text-gray-600 tracking-wider">
            {filtro === "todas" ? "NO HAY CITAS AÚN" : `NO HAY CITAS ${filtro.toUpperCase()}S`}
          </p>
        </div>
      )}
    </motion.div>
  )
}

function CotizacionesTab({ items, onRefresh, headers }: { items: Quote[]; onRefresh: () => void; headers: Record<string, string> }) {
  const actualizarEstado = async (id: number, estado: string) => {
    try {
      await fetch("/api/admin/cotizaciones", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id, estado }),
      })
    } catch {}
    onRefresh()
  }

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta cotización?")) return
    try {
      await fetch(`/api/admin/cotizaciones?id=${id}`, { method: "DELETE", headers })
    } catch {}
    onRefresh()
  }

  const badgeColor = (estado: string) => {
    switch (estado) {
      case "aceptada": return "bg-green-400/10 text-green-400 border-green-400/20"
      case "rechazada": return "bg-red-400/10 text-red-400 border-red-400/20"
      default: return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
    }
  }

  return (
    <motion.div key="cotizaciones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <CurrencyDollar size={20} className="text-cyan-400" /> COTIZACIONES
      </h2>
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`font-tech text-[10px] tracking-wider px-2 py-0.5 rounded-full border ${badgeColor(c.estado)}`}>
                    {(c.estado || "pendiente").toUpperCase()}
                  </span>
                  <p className="text-white text-sm font-medium">{c.nombre}</p>
                  <p className="text-cyan-400/60 text-xs font-tech">{c.whatsapp}</p>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400">{c.estilo}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{c.zona}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{c.tamano}</span>
                </div>
                <p className="text-gray-700 text-xs mt-1">{new Date(c.created_at).toLocaleDateString("es-CL")}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {c.estado === "pendiente" && (
                  <button onClick={() => actualizarEstado(c.id, "aceptada")}
                    className="text-green-400 hover:bg-green-400/10 p-1.5 rounded-lg transition-all" title="Aceptar">
                    <Check size={16} weight="bold" />
                  </button>
                )}
                {c.estado === "pendiente" && (
                  <button onClick={() => actualizarEstado(c.id, "rechazada")}
                    className="text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-all" title="Rechazar">
                    <XCircle size={16} />
                  </button>
                )}
                <button onClick={() => eliminar(c.id)}
                  className="text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-all" title="Eliminar">
                  <Trash size={16} />
                </button>
              </div>
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
