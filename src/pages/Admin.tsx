import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { upload } from "@vercel/blob/client"
import { descargarPdfConsentimiento } from "../lib/pdfConsentimiento"

import {
  Lock,
  Eye,
  EyeSlash,
  ChartBar,
  Image,
  NotePencil,
  ClipboardText,
  Star,
  SignOut,
  Trash,
  X,
  UploadSimple,
  VideoCamera,
  Upload,
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
  TrendUp,
  WhatsappLogo,
  House,
  DownloadSimple,
  InstagramLogo,
  ShieldCheck,
  Camera,
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
  baucher?: string
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

interface Reel {
  id: number
  url: string
  titulo: string
  plataforma: string
  video_url?: string
  orden: number
  creado_en: string
}

interface FinanzaItem {  id: number
  tipo: string
  categoria: string
  concepto: string
  monto: number
  fecha: string
  agendamiento_id: number | null
  created_at: string
  cliente_nombre?: string
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

type Tab = "dashboard" | "galeria" | "publicaciones" | "reels" | "resenas" | "testimonios" | "disponibilidad" | "citas" | "cotizaciones" | "finanzas" | "consentimientos"

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
  const [token, setToken] = useState<string | null>(sessionStorage.getItem("admin_token"))

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
  const [consentimientos, setConsentimientos] = useState<any[]>([])
  const [testimonios, setTestimonios] = useState<any[]>([])
  const [agendamentos, setAgendamentos] = useState<Booking[]>([])
  const [galeria, setGaleria] = useState<GalleryItem[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [resenas, setResenas] = useState<Resena[]>([])
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadItem[]>([])
  const [excepciones, setExcepciones] = useState<ExcepcionFecha[]>([])
  const [allCitas, setAllCitas] = useState<Booking[]>([])
  const [finanzas, setFinanzas] = useState<FinanzaItem[]>([])
  const [finanzasSummary, setFinanzasSummary] = useState<any>(null)
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

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
        sessionStorage.setItem("admin_token", data.token)
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
    sessionStorage.removeItem("admin_token")
    setToken(null)
    setPassword("")
    window.location.replace("/")
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
    } catch { setErrorMsg("Error al cargar cotizaciones") }
    setLoading(false)
  }, [token])

  const fetchConsentimientos = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/consentimientos", { headers })
      const data = await res.json()
      if (data.success) setConsentimientos(data.consentimientos)
    } catch { setErrorMsg("Error al cargar consentimientos") }
    setLoading(false)
  }, [token])

  const fetchTestimonios = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/testimonios", { headers })
      const data = await res.json()
      if (data.success) setTestimonios(data.testimonios)
    } catch { setErrorMsg("Error al cargar testimonios") }
    setLoading(false)
  }, [token])

  const fetchFinanzas = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [transRes, sumRes] = await Promise.all([
        fetch("/api/admin/finanzas", { headers }),
        fetch("/api/admin/finanzas?resumen=true", { headers }),
      ])
      const transData = await transRes.json()
      const sumData = await sumRes.json()
      if (transData.success) setFinanzas(transData.transactions)
      if (sumData.success) setFinanzasSummary(sumData)
    } catch { setErrorMsg("Error al cargar finanzas") }
    setLoading(false)
  }, [token])

  const fetchGaleria = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/galeria", { headers })
      const data = await res.json()
      if (data.success) setGaleria(data.images)
    } catch { setErrorMsg("Error al cargar galería") }
    setLoading(false)
  }, [token])

  const fetchPosts = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/publicaciones", { headers })
      const data = await res.json()
      if (data.success) setPosts(data.posts)
    } catch { setErrorMsg("Error al cargar publicaciones") }
    setLoading(false)
  }, [token])

  const fetchReels = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/reels", { headers })
      const data = await res.json()
      if (data.success) setReels(data.reels)
    } catch { setErrorMsg("Error al cargar reels") }
    setLoading(false)
  }, [token])

  const fetchResenas = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/resenas")
      const data = await res.json()
      if (data.success) setResenas(data.resenas)
    } catch { setErrorMsg("Error al cargar reseñas") }
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
    } catch { setErrorMsg("Error al cargar disponibilidad") }
    setLoading(false)
  }, [token])

  const fetchAllCitas = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/citas", { headers })
      const data = await res.json()
      if (data.success) setAllCitas(data.citas || [])
    } catch { setErrorMsg("Error al cargar citas") }
    setLoading(false)
  }, [token])

  useEffect(() => {
    if (!token) return
    if (tab === "dashboard") { fetchDashboard(); fetchAllCitas() }
    if (tab === "galeria") fetchGaleria()
    if (tab === "publicaciones") fetchPosts()
    if (tab === "reels") fetchReels()
    if (tab === "resenas") fetchResenas()
    if (tab === "testimonios") fetchTestimonios()
    if (tab === "disponibilidad") fetchDisponibilidad()
    if (tab === "citas") fetchAllCitas()
    if (tab === "cotizaciones") fetchCotizaciones()
    if (tab === "consentimientos") fetchConsentimientos()
    if (tab === "finanzas") fetchFinanzas()
  }, [tab, token, fetchDashboard, fetchGaleria, fetchPosts, fetchReels, fetchResenas, fetchTestimonios, fetchDisponibilidad, fetchAllCitas, fetchCotizaciones, fetchConsentimientos, fetchFinanzas])

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
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="1.5" y="1.5" width="37" height="37" rx="3" stroke="rgba(0,229,255,0.5)" strokeWidth="1"/>
              <path d="M9 28 L9 12 L14.5 22 L20 12 L20 28" stroke="#fff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
              <path d="M31 14 Q23 14 23 18.5 Q23 22 27 22 Q31 22 31 25.5 Q31 30 23 29" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" fill="none" style={{ filter: "drop-shadow(0 0 6px rgba(0,229,255,0.7))" }}/>
            </svg>
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
    { id: "reels", label: "Reels", icon: InstagramLogo },
    { id: "resenas", label: "Reseñas", icon: Star },
    { id: "testimonios", label: "Testimonios", icon: Star },
    { id: "cotizaciones", label: "Cotizaciones", icon: CurrencyDollar },
    { id: "consentimientos", label: "Consentimientos", icon: ClipboardText },
    { id: "finanzas", label: "Finanzas", icon: TrendUp },
  ]

  return (
    <div className="min-h-screen bg-dark">
      <header className="sticky top-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect x="1.5" y="1.5" width="37" height="37" rx="3" stroke="rgba(0,229,255,0.5)" strokeWidth="1"/>
              <path d="M9 28 L9 12 L14.5 22 L20 12 L20 28" stroke="#fff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
              <path d="M31 14 Q23 14 23 18.5 Q23 22 27 22 Q31 22 31 25.5 Q31 30 23 29" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" fill="none" style={{ filter: "drop-shadow(0 0 4px rgba(0,229,255,0.6))" }}/>
            </svg>
            <span className="font-tech text-xs tracking-[0.2em] text-gray-600 hidden sm:inline">ADMIN PANEL</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.replace("/")}
              className="font-tech flex items-center gap-2 text-xs tracking-wider text-gray-500 hover:text-cyan-400 transition-colors"
            >
              <House size={16} /> INICIO
            </button>
            <button
              onClick={handleLogout}
              className="font-tech flex items-center gap-2 text-xs tracking-wider text-gray-500 hover:text-red-400 transition-colors"
            >
              <SignOut size={16} /> SALIR
            </button>
          </div>
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

        {errorMsg && (
          <div className="fixed top-4 right-4 z-50 max-w-sm animate-slideDown">
            <div className="glass rounded-xl px-4 py-3 border border-red-400/30 flex items-start gap-3">
              <Warning size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-red-400 text-xs font-tech tracking-wider">{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg("")} className="text-gray-600 hover:text-white transition-colors">
                <XCircle size={14} />
              </button>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="animate-pulse">
                  <div className="h-8 w-48 bg-white/5 rounded mb-6" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="glass rounded-2xl p-5">
                        <div className="h-3 w-20 bg-white/5 rounded mb-3" />
                        <div className="h-8 w-16 bg-white/5 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="glass rounded-2xl p-5">
                    <div className="h-4 w-full bg-white/5 rounded mb-3" />
                    <div className="h-4 w-3/4 bg-white/5 rounded mb-3" />
                    <div className="h-4 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
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
            ) : tab === "reels" ? (
              <ReelsTab items={reels} onRefresh={fetchReels} headers={headers} />
            ) : tab === "resenas" ? (
              <ResenasTab items={resenas} />
            ) : tab === "testimonios" ? (
              <TestimoniosTab items={testimonios} onRefresh={fetchTestimonios} headers={headers} />
            ) : tab === "cotizaciones" ? (
              <CotizacionesTab items={cotizaciones} onRefresh={fetchCotizaciones} headers={headers} />
            ) : tab === "consentimientos" ? (
              <ConsentimientosTab items={consentimientos} onRefresh={fetchConsentimientos} headers={headers} />
            ) : tab === "finanzas" ? (
              <FinanzasTab items={finanzas} summary={finanzasSummary} onRefresh={fetchFinanzas} headers={headers} />
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
    } catch (e) { console.error("Error al subir imagen", e) }
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
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar 5 MB")
      return
    }

    setUploadingImage(true)
    try {
      setImagePreview(URL.createObjectURL(file))

      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const blob = await upload(`blog/${Date.now()}-${safe}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload-blog",
        headers,
      })
      setForm({ ...form, imagen_url: blob.url })
    } catch (err) {
      console.error("Error al subir imagen", err)
      alert("Error al subir la imagen. Probá con otra.")
    }
    setUploadingImage(false)
  }

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
        setImagePreview(null)
        onRefresh()
      }
    } catch (e) { console.error("Error al crear publicación", e) }
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

          {/* Upload de imagen */}
          <div>
            {imagePreview || form.imagen_url ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview || form.imagen_url}
                  alt="Preview"
                  className="max-h-40 rounded-xl border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setForm({ ...form, imagen_url: "" }) }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <Spinner size={24} className="animate-spin text-cyan-400" />
                  </div>
                )}
              </div>
            ) : (
              <label className="flex items-center gap-3 rounded-xl px-4 py-4 border border-dashed border-white/20 bg-white/[0.02] text-gray-400 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all cursor-pointer">
                <Camera size={24} weight="duotone" className="text-cyan-400" />
                <div>
                  <p className="text-sm">Subir imagen desde tu dispositivo</p>
                  <p className="text-[10px] text-gray-500">JPG o PNG, máximo 5 MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
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

function TestimoniosTab({ items, onRefresh, headers }: { items: any[]; onRefresh: () => void; headers: Record<string, string> }) {
  const aprobar = async (id: number, aprobado: boolean) => {
    await fetch("/api/admin/testimonios", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, aprobado }),
    })
    onRefresh()
  }

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este testimonio?")) return
    await fetch(`/api/admin/testimonios?id=${id}`, { method: "DELETE", headers })
    onRefresh()
  }

  return (
    <motion.div key="testimonios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <Star size={20} className="text-cyan-400" /> TESTIMONIOS DE CLIENTES
      </h2>
      <p className="font-tech text-xs text-gray-600 tracking-wider mb-6">
        Testimonios enviados por visitantes del sitio. Aprueba los que quieras mostrar en la landing.
      </p>

      <div className="space-y-3">
        {items.map((t) => (
          <div key={t.id} className={`glass rounded-xl p-4 border ${t.aprobado ? "border-cyan-400/20" : "border-white/5"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        weight={i < t.rating ? "fill" : "regular"}
                        className={i < t.rating ? "text-yellow-400" : "text-gray-700"}
                      />
                    ))}
                  </div>
                  <span className="text-white text-sm font-medium">{t.nombre}</span>
                  <span className={`text-[10px] font-tech tracking-wider px-2 py-0.5 rounded-full ${t.aprobado ? "bg-cyan-400/10 text-cyan-400" : "bg-gray-700/30 text-gray-500"}`}>
                    {t.aprobado ? "Aprobado" : "Pendiente"}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{t.texto}</p>
                <p className="text-gray-700 text-xs mt-2">
                  {new Date(t.creado_en).toLocaleDateString("es-CL")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => aprobar(t.id, !t.aprobado)}
                  className={`neon-button rounded-lg px-3 py-2 text-xs font-tech tracking-wider ${t.aprobado ? "text-gray-500" : "text-cyan-400"}`}
                >
                  {t.aprobado ? "OCULTAR" : "APROBAR"}
                </button>
                <button
                  onClick={() => eliminar(t.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors px-2"
                  aria-label="Eliminar"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16">
          <Star size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="font-tech text-gray-600 tracking-wider">NO HAY TESTIMONIOS AÚN</p>
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
      .catch(() => console.error("Error al cargar calendario de disponibilidad"))
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
    const allDays = Array.from({ length: 7 }, (_, i) => ({
      dia_semana: i, activo: i !== 0, hora_inicio: "10:00", hora_fin: "19:00", slots_max: 3
    }))
    if (disponibilidad.length > 0) {
      const map = new Map(disponibilidad.map((d) => [d.dia_semana, d]))
      setTemplate(allDays.map((d) => map.get(d.dia_semana) || d))
    } else {
      setTemplate(allDays)
    }
  }, [disponibilidad])

  const saveTemplate = async () => {
    setSaving(true)
    try {
      await fetch("/api/admin/disponibilidad", {
        method: "POST", headers,
        body: JSON.stringify({ template }),
      })
      onRefresh()
    } catch (e) { console.error("Error al guardar plantilla", e) }
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
    } catch (e) { console.error("Error al guardar excepción", e) }
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
    } catch (e) { console.error("Error al eliminar excepción", e) }
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
      <div className="glass rounded-2xl p-5 md:p-6 mb-8 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 flex items-center gap-2">
            <CalendarBlank size={16} className="text-cyan-400" /> DISPONIBILIDAD
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={() => { if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11) } else setCalMonth(calMonth - 1) }}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 transition-all">
              <CaretLeft size={12} weight="bold" />
            </button>
            <span className="font-tech text-white text-xs tracking-wider w-24 text-center">
              {monthNames[calMonth].slice(0, 3)} {calYear}
            </span>
            <button onClick={() => { if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0) } else setCalMonth(calMonth + 1) }}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 transition-all">
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3 text-[9px] font-tech tracking-wider">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyan-400" /> Libre</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" /> Parcial</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400" /> Lleno</span>
        </div>

        {loadingCal ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size={16} className="text-cyan-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
              {daysShort.map((d) => (
                <div key={d} className="font-tech text-center text-[9px] tracking-wider text-cyan-400/30 font-semibold py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-[2px]">
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
                    title={info
                      ? `${dateStr}\n${info.booked}/${info.max} cupos usados\n${info.pendientes || 0} pendientes\n${info.confirmadas || 0} confirmadas`
                      : dateStr}
                    className={`aspect-square flex items-center justify-center text-[11px] rounded-lg font-tech transition-all cursor-default ${calMonthData.calColor(status)}`}>
                    <span className={status === "full" ? "line-through decoration-red-400/80 decoration-2" : undefined}>{day}</span>
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
  const [editForm, setEditForm] = useState({ nombre: "", whatsapp: "", fecha: "", hora: "", duracion: 120, descripcion: "", estado: "pendiente", admin_notas: "", baucher: "" })
  const [creando, setCreando] = useState(false)
  const [nueva, setNueva] = useState({ nombre: "", whatsapp: "+56", fecha: "", hora: "", duracion: 120, descripcion: "" })
  const [precioModal, setPrecioModal] = useState<{ id: number; estado: string } | null>(null)
  const [precioInput, setPrecioInput] = useState("")
  const [confirmando, setConfirmando] = useState(false)

  const updateEstado = (id: number, estado: string) => {
    if (estado === "confirmada" || estado === "completada") {
      setPrecioModal({ id, estado })
    } else {
      confirmarEstado(id, estado, 0)
    }
  }

  const confirmarEstado = async (id: number, estado: string, precio: number) => {
    const cita = citas.find(c => c.id === id)
    const notaPrecio = estado === "confirmada"
      ? `💰 $${precio.toLocaleString("es-CL")} | 50%: $${Math.round(precio * 0.5).toLocaleString("es-CL")}`
      : `💰 $${precio.toLocaleString("es-CL")}`
    await fetch("/api/admin/citas", {
      method: "PATCH", headers,
      body: JSON.stringify({
        id,
        estado,
        ...(precio > 0 ? { admin_notas: notaPrecio } : {}),
      }),
    })
    if (estado === "completada" && precio > 0) {
      await fetch("/api/admin/finanzas", {
        method: "POST", headers,
        body: JSON.stringify({
          tipo: "ingreso",
          categoria: "tatuaje",
          concepto: `Cita completada: ${cita?.nombre || "Cliente"} - ${cita?.descripcion || "Tatuaje"}`,
          monto: precio,
          fecha: cita?.fecha || new Date().toISOString().split("T")[0],
          agendamiento_id: id,
        }),
      })
    }
    onRefresh()
    if (cita?.whatsapp) {
      const abono = Math.round(precio * 0.5)
      const msgs: Record<string, string> = {
        confirmada: [
          `✅ CITA CONFIRMADA ✅`,
          ``,
          `*Cliente:* ${cita.nombre}`,
          `*Fecha:* ${new Date(cita.fecha + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}`,
          `*Hora:* ${cita.hora || "A coordinar"}`,
          `*Direccion:* Manso 529, Melipilla`,
          cita.descripcion ? `*Diseno:* ${cita.descripcion}` : "",
          ``,
          precio > 0 ? `*Valor total:* $${precio.toLocaleString("es-CL")}` : "",
          precio > 0 ? `*Abona el 50% para reservar:* $${abono.toLocaleString("es-CL")}` : `*Para reservar:* abona el 50% del valor`,
          `Enviame el comprobante y queda agendado`,
          ``,
          `Llega 10 min antes. Si no podes, avisame con anticipacion.`,
          ``,
          `Nos vemos!`,
        ].filter(Boolean).join("\n"),
        cancelada: [
          `CITA CANCELADA`,
          ``,
          `*Cliente:* ${cita.nombre}`,
          `*Fecha:* ${new Date(cita.fecha + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}`,
          ``,
          `Lamento que no podamos vernos en esta ocasion.`,
          `Si queres reagendar, escribime y coordinamos otra fecha.`,
          ``,
          `Gracias por avisar!`,
        ].join("\n"),
        completada: [
          `*SESION COMPLETADA*`,
          ``,
          `*Cliente:* ${cita.nombre}`,
          ``,
          `Gracias por confiar en mi trabajo!`,
          `Espero que te haya gustado el resultado.`,
          ``,
          `Segui los cuidados indicados para una cicatrizacion perfecta.`,
          `Si podes, mandame una foto cuando este curado.`,
          ``,
          `Recorda: protege tu tatuaje del sol las proximas 3 semanas.`,
          ``,
          `*Si te gusto la experiencia, segui mis redes:*`,
          `Instagram: @matness_tattoos`,
          `Facebook: Matness Tattoos`,
          ``,
          `Espero verte de nuevo pronto!`,
        ].join("\n"),
      }
      const msg = msgs[estado]
      if (msg) {
        window.open(`https://wa.me/${cita.whatsapp.replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`, "_blank")
      }
    }
  }

  const chatearCliente = (cita: Booking) => {
    if (!cita.whatsapp) return
    const msg = [
      `Hola ${cita.nombre}!`,
      ``,
      `Soy de MS Estudio de Tatuajes.`,
      `Estamos coordinando tu cita.`,
      ``,
      `*Fecha solicitada:* ${new Date(cita.fecha + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}`,
      cita.descripcion ? `*Diseno:* ${cita.descripcion}` : "",
      ``,
      `Hablemos de los detalles y el precio para confirmar.`,
    ].filter(Boolean).join("\n")
    window.open(`https://wa.me/${cita.whatsapp.replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const saveEdit = async () => {
    if (!editId) return
    const citaOriginal = citas.find(c => c.id === editId)
    await fetch("/api/admin/citas", {
      method: "PATCH", headers,
      body: JSON.stringify({ id: editId, ...editForm }),
    })
    if (citaOriginal && editForm.estado && editForm.estado !== (citaOriginal.estado || "pendiente") && citaOriginal.whatsapp) {
      const msgs: Record<string, string> = {
        confirmada: `Hola ${editForm.nombre || citaOriginal.nombre}, tu cita del ${new Date(editForm.fecha + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long" })} esta *CONFIRMADA*\n*Hora:* ${editForm.hora || "A coordinar"}\n*Direccion:* Manso 529, Melipilla\nTe espero!`,
        cancelada: `Hola ${editForm.nombre || citaOriginal.nombre}, tu cita del ${new Date(editForm.fecha + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long" })} fue *CANCELADA*\nSi queres reagendar, avisame.`,
        completada: `Hola ${editForm.nombre || citaOriginal.nombre}, tu sesion fue *COMPLETADA*. Gracias por confiar en mi trabajo! Si te gusto la experiencia, segui mis redes: Instagram @matness_tattoos | Facebook Matness Tattoos. Espero verte de nuevo pronto!`,
      }
      const msg = msgs[editForm.estado]
      if (msg) {
        window.open(`https://wa.me/${(editForm.whatsapp || citaOriginal.whatsapp).replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`, "_blank")
      }
    }
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
    <>
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
                <div>
                  <span className="text-gray-600 text-xs block mb-1">Baucher del abono 50% (comprobante de transferencia):</span>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 font-tech text-xs tracking-wider neon-button rounded-xl px-4 py-2">
                      <Upload size={14} />
                      {editForm.baucher ? "REEMPLAZAR IMAGEN" : "SUBIR BAUCHER"}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 250_000) { alert("Imagen demasiado grande (máx ~190 KB). Comprime el comprobante antes de subirlo."); return }
                          const reader = new FileReader()
                          reader.onload = () => setEditForm({ ...editForm, baucher: String(reader.result) })
                          reader.readAsDataURL(file)
                        }} />
                    </label>
                    {editForm.baucher && (
                      <>
                        <a href={editForm.baucher} target="_blank" rel="noreferrer" title="Ver baucher">
                          <img src={editForm.baucher} className="h-12 w-12 object-cover rounded-lg border border-cyan-400/30" />
                        </a>
                        <button onClick={() => setEditForm({ ...editForm, baucher: "" })}
                          className="text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg" title="Quitar baucher">
                          <Trash size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
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
                  {c.baucher && (
                    <a href={c.baucher} target="_blank" rel="noreferrer" title="Ver baucher del abono 50%"
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-400/70 mt-1.5 hover:text-cyan-300">
                      <img src={c.baucher} className="h-8 w-8 object-cover rounded border border-cyan-400/20" />
                      Baucher 50%
                    </a>
                  )}
                  <p className="text-gray-700 text-xs mt-1">Creado: {new Date(c.creado_en).toLocaleDateString("es-CL")}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(c.estado || "pendiente") === "pendiente" && (
                    <>
                      <button onClick={() => chatearCliente(c)}
                        className="text-green-500 hover:bg-green-500/10 p-1.5 rounded-lg transition-all" title="Chatear con el cliente (precio, detalles)">
                        <WhatsappLogo size={16} weight="fill" />
                      </button>
                      <button onClick={() => updateEstado(c.id, "confirmada")}
                        className="text-green-400 hover:bg-green-400/10 p-1.5 rounded-lg transition-all" title="Confirmar cita">
                        <Check size={16} weight="bold" />
                      </button>
                    </>
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
                    setEditForm({ nombre: c.nombre, whatsapp: c.whatsapp, fecha: c.fecha, hora: c.hora || "", duracion: c.duracion || 120, descripcion: c.descripcion || "", estado: c.estado || "pendiente", admin_notas: c.admin_notas || "", baucher: c.baucher || "" })
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

    {precioModal && (
      <PrecioModal
        cita={citas.find(c => c.id === precioModal.id)!}
        precioInput={precioInput}
        setPrecioInput={setPrecioInput}
        confirmando={confirmando}
        modo={precioModal.estado === "completada" ? "completar" : "confirmar"}
        onClose={() => { setPrecioModal(null); setPrecioInput("") }}
        onConfirm={(valor) => {
          setConfirmando(true)
          confirmarEstado(precioModal!.id, precioModal!.estado, valor).then(() => {
            setPrecioModal(null)
            setPrecioInput("")
            setConfirmando(false)
          })
        }}
      />
    )}
    </>
  )
}

function PrecioModal({ cita, precioInput, setPrecioInput, confirmando, onClose, onConfirm, modo = "confirmar" }: {
  cita: Booking
  precioInput: string
  setPrecioInput: (v: string) => void
  confirmando: boolean
  onClose: () => void
  onConfirm: (valor: number) => void
  modo?: "confirmar" | "completar"
}) {
  const raw = precioInput.replace(/\D/g, "")
  const valor = parseInt(raw) || 0
  const abono = Math.round(valor * 0.5)
  const fmt = (n: number) => n.toLocaleString("es-CL")
  const esCompletar = modo === "completar"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-premium rounded-2xl p-6 w-full max-w-sm border border-white/10" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-1">{esCompletar ? "💰 Sesión completada" : "💰 Confirmar cita"}</h3>
        <p className="text-gray-400 text-sm mb-1">{cita?.nombre}</p>
        <p className="text-gray-600 text-xs font-tech mb-5">{cita?.descripcion}</p>

        <label className="text-gray-400 text-xs font-tech tracking-wider uppercase mb-2 block">
          {esCompletar ? "Precio final cobrado" : "Precio del tatuaje"}
        </label>
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={precioInput ? `$ ${fmt(valor)}` : ""}
            onChange={(e) => setPrecioInput(e.target.value.replace(/\D/g, ""))}
            placeholder="$ 0"
            className="neon-input rounded-xl pl-10 pr-4 py-4 w-full text-xl font-bold text-white"
            autoFocus
          />
        </div>

        {valor > 0 && (
          esCompletar ? (
            <div className="glass rounded-xl p-4 mb-5 border border-blue-400/10">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Ingreso a registrar en finanzas</span>
                <span className="text-white font-bold text-lg">$ {fmt(valor)}</span>
              </div>
              <p className="text-gray-600 text-[11px] mt-2">El abono del 50% queda respaldado por el baucher adjunto en la cita.</p>
            </div>
          ) : (
            <div className="glass rounded-xl p-4 mb-5 border border-cyan-400/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-xs">Valor total</span>
                <span className="text-white font-bold">$ {fmt(valor)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-xs">50% para reservar</span>
                <span className="text-cyan-400 font-bold text-lg">$ {fmt(abono)}</span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">Restante el día de la cita</span>
                <span className="text-gray-300 text-sm">$ {fmt(valor - abono)}</span>
              </div>
            </div>
          )
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 font-tech neon-button rounded-xl py-3 text-xs tracking-wider">CANCELAR</button>
          <button onClick={() => onConfirm(valor)}
            disabled={(!esCompletar && valor === 0) || confirmando}
            className="flex-1 font-tech neon-button-primary rounded-xl py-3 text-xs tracking-wider disabled:opacity-30">
            {confirmando ? "GUARDANDO..." : esCompletar ? (valor > 0 ? `REGISTRAR $ ${fmt(valor)}` : "COMPLETAR SIN INGRESO") : `CONFIRMAR $ ${fmt(valor)}`}
          </button>
        </div>
      </div>
    </div>
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
    } catch (e) { console.error("Error al actualizar cotización", e) }
    onRefresh()
  }

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta cotización?")) return
    try {
      await fetch(`/api/admin/cotizaciones?id=${id}`, { method: "DELETE", headers })
    } catch (e) { console.error("Error al eliminar cotización", e) }
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

function FinanzasTab({ items, summary, onRefresh, headers }: {
  items: FinanzaItem[]
  summary: any
  onRefresh: () => void
  headers: Record<string, string>
}) {
  const [tipo, setTipo] = useState<"ingreso" | "gasto">("ingreso")
  const [categoria, setCategoria] = useState("tatuaje")
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])

  const guardar = async () => {
    if (!concepto || monto === "") return
    try {
      const res = await fetch("/api/admin/finanzas", {
        method: "POST", headers,
        body: JSON.stringify({ tipo, categoria, concepto, monto: parseInt(monto), fecha }),
      })
      const data = await res.json()
      if (!data.success) { alert("Error: " + (data.error || "Error al guardar")); return }
    } catch { alert("Error de conexión al guardar"); return }
    setConcepto("")
    setMonto("")
    onRefresh()
  }

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este registro?")) return
    try {
      const res = await fetch(`/api/admin/finanzas?id=${id}`, { method: "DELETE", headers })
      const data = await res.json()
      if (!data.success) { alert("Error: " + (data.error || "Error al eliminar")); return }
    } catch { alert("Error de conexión al eliminar"); return }
    onRefresh()
  }

  const formatPeso = (n: number) => "$" + n.toLocaleString("es-CL")

  const catIngresos = ["tatuaje", "otro"]
  const catGastos = ["insumos", "porcentaje", "arriendo", "transporte", "marketing", "otro"]
  const catLabels: Record<string, string> = {
    tatuaje: "Tatuaje", insumos: "Insumos", porcentaje: "Porcentaje",
    arriendo: "Arriendo", transporte: "Transporte", marketing: "Marketing", otro: "Otro"
  }

  return (
    <motion.div key="finanzas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6 flex items-center gap-2">
        <TrendUp size={20} className="text-cyan-400" /> FINANZAS
      </h2>

      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-2xl p-5">
            <p className="font-tech text-xs tracking-[0.15em] text-gray-500 uppercase mb-1">Ingresos</p>
            <p className="text-2xl font-bold text-green-400">{formatPeso(summary.total_ingresos)}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="font-tech text-xs tracking-[0.15em] text-gray-500 uppercase mb-1">Gastos</p>
            <p className="text-2xl font-bold text-red-400">{formatPeso(summary.total_gastos)}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="font-tech text-xs tracking-[0.15em] text-gray-500 uppercase mb-1">Neto</p>
            <p className={`text-2xl font-bold ${summary.neto >= 0 ? "text-cyan-400" : "text-red-400"}`}>
              {formatPeso(summary.neto)}
            </p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="font-tech text-xs tracking-[0.15em] text-gray-500 uppercase mb-1">Gastos</p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Insumos: <span className="text-white">{formatPeso(summary.gasto_insumos)}</span></p>
              <p>% Pagado: <span className="text-white">{formatPeso(summary.gasto_porcentaje)}</span></p>
              <p>Arriendo: <span className="text-white">{formatPeso(summary.gasto_arriendo)}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="glass rounded-2xl p-5 md:p-8 mb-8">
        <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-cyan-400" /> NUEVO REGISTRO
        </h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setTipo("ingreso"); setCategoria("tatuaje") }}
            className={`font-tech text-xs tracking-wider px-4 py-2 rounded-xl transition-all ${tipo === "ingreso" ? "bg-green-400/10 text-green-400 border border-green-400/30" : "text-gray-500 border border-transparent"}`}>
            INGRESO
          </button>
          <button onClick={() => { setTipo("gasto"); setCategoria("insumos") }}
            className={`font-tech text-xs tracking-wider px-4 py-2 rounded-xl transition-all ${tipo === "gasto" ? "bg-red-400/10 text-red-400 border border-red-400/30" : "text-gray-500 border border-transparent"}`}>
            GASTO
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
            className="neon-input rounded-xl px-4 py-3 w-full text-sm">
            {(tipo === "ingreso" ? catIngresos : catGastos).map(c => (
              <option key={c} value={c}>{catLabels[c] || c}</option>
            ))}
          </select>
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)}
            placeholder="Concepto" className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
          <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
            placeholder="Monto $" className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            className="neon-input rounded-xl px-4 py-3 w-full text-sm" />
        </div>
        <button onClick={guardar} disabled={!concepto || monto === ""}
          className="font-tech neon-button-primary rounded-xl px-6 py-3 text-sm tracking-[0.2em] disabled:opacity-30">
          GUARDAR
        </button>
      </div>

      {/* Tabla de registros */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="font-tech text-[10px] tracking-wider text-gray-500 text-left px-4 py-3">FECHA</th>
                <th className="font-tech text-[10px] tracking-wider text-gray-500 text-left px-4 py-3">TIPO</th>
                <th className="font-tech text-[10px] tracking-wider text-gray-500 text-left px-4 py-3">CATEGORÍA</th>
                <th className="font-tech text-[10px] tracking-wider text-gray-500 text-left px-4 py-3">CONCEPTO</th>
                <th className="font-tech text-[10px] tracking-wider text-gray-500 text-left px-4 py-3">CLIENTE</th>
                <th className="font-tech text-[10px] tracking-wider text-gray-500 text-right px-4 py-3">MONTO</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.fecha}</td>
                  <td className="px-4 py-3">
                    <span className={`font-tech text-[10px] tracking-wider px-2 py-0.5 rounded-full border ${r.tipo === "ingreso" ? "bg-green-400/10 text-green-400 border-green-400/30" : "bg-red-400/10 text-red-400 border-red-400/30"}`}>
                      {r.tipo.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{catLabels[r.categoria] || r.categoria}</td>
                  <td className="px-4 py-3 text-white text-xs max-w-[200px] truncate">{r.concepto}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.cliente_nombre || "—"}</td>
                  <td className={`px-4 py-3 text-xs font-bold text-right ${r.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                    {r.tipo === "ingreso" ? "+" : "-"}{formatPeso(r.monto)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => eliminar(r.id)}
                      className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors">
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <div className="text-center py-16">
            <TrendUp size={48} className="text-gray-700 mx-auto mb-4" />
            <p className="font-tech text-gray-600 tracking-wider">SIN REGISTROS FINANCIEROS</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ConsentimientosTab({ items, onRefresh, headers }: {
  items: any[]
  onRefresh: () => void
  headers: Record<string, string>
}) {
  const [detalle, setDetalle] = useState<any | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const verDetalle = async (id: number) => {
    setCargandoDetalle(true)
    try {
      const res = await fetch(`/api/admin/consentimientos?id=${id}`, { headers })
      const data = await res.json()
      if (data.success) setDetalle(data.consentimiento)
    } catch { /* noop */ }
    setCargandoDetalle(false)
  }

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este consentimiento? Esta acción no se puede deshacer.")) return
    try {
      await fetch(`/api/admin/consentimientos?id=${id}`, { method: "DELETE", headers })
      onRefresh()
    } catch { /* noop */ }
  }

  const descargarFicha = (c: any) => {
    descargarPdfConsentimiento({
      nombre: c.nombre,
      rut: c.rut,
      fechaNacimiento: String(c.fecha_nacimiento || "").slice(0, 10),
      telefono: c.telefono,
      email: c.email,
      zonaTatuaje: c.zona_tatuaje,
      descripcionTatuaje: c.descripcion_tatuaje,
      saludMarcadas: [
        ...alertasDe(c),
        ...(c.bajo_efectos ? ["Bajo efectos de alcohol/drogas hoy"] : []),
      ],
      alergiasDetalle: c.alergias_detalle,
      medicamentos: c.medicamentos,
      firmaUrl: c.firma_url,
      firmadoEn: new Date(c.firmado_en || c.creado_en).toLocaleString("es-CL"),
      origen: "admin",
      menorEdad: c.menor_edad,
      nombrePadre: c.nombre_padre,
      rutPadre: c.rut_padre,
      carnetPadreUrl: c.carnet_padre_url,
    })
  }

  const tieneAlertas = (c: any) =>
    c.alergias || c.problemas_coagulacion || c.diabetes || c.enfermedad_cardiaca ||
    c.epilepsia || c.vih_hepatitis || c.embarazo_lactancia

  const alertasDe = (c: any): string[] => {
    const a: string[] = []
    if (c.alergias) a.push("Alergias")
    if (c.problemas_coagulacion) a.push("Coagulación")
    if (c.diabetes) a.push("Diabetes")
    if (c.enfermedad_cardiaca) a.push("Cardíaca")
    if (c.epilepsia) a.push("Epilepsia")
    if (c.vih_hepatitis) a.push("VIH/Hepatitis")
    if (c.embarazo_lactancia) a.push("Embarazo")
    return a
  }

  const fmtFecha = (f: string) => {
    try { return new Date(f).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) }
    catch { return f }
  }

  return (
    <motion.div key="consentimientos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title text-2xl text-white">Consentimientos</h2>
          <p className="font-tech text-xs text-gray-600 tracking-wider mt-1">
            {items.length} firmados
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="neon-button rounded-lg px-4 py-2 text-xs font-tech tracking-wider"
        >
          ACTUALIZAR
        </button>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ClipboardText size={40} className="text-gray-700 mx-auto mb-3" weight="duotone" />
          <p className="text-gray-500 text-sm">Aún no hay consentimientos firmados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div
              key={c.id}
              className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold">{c.nombre}</span>
                  <span className="text-gray-600 text-xs">{c.rut}</span>
                  {c.menor_edad && (
                    <span className="text-[10px] font-tech tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-0.5">
                      MENOR · Padre: {c.nombre_padre}
                    </span>
                  )}
                  {tieneAlertas(c) && (
                    <span className="text-[10px] font-tech tracking-wider text-red-400 bg-red-400/10 border border-red-400/20 rounded px-2 py-0.5">
                      ⚠ {alertasDe(c).join(" · ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{c.telefono}</span>
                  {c.zona_tatuaje && <span>· {c.zona_tatuaje}</span>}
                  <span>· {fmtFecha(c.firmado_en || c.creado_en)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://wa.me/${String(c.telefono).replace(/\+/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neon-button rounded-lg px-3 py-2 text-xs font-tech tracking-wider"
                >
                  WHATSAPP
                </a>
                <button
                  onClick={() => verDetalle(c.id)}
                  className="neon-button-primary rounded-lg px-3 py-2 text-xs font-tech tracking-wider"
                >
                  VER FICHA
                </button>
                <button
                  onClick={() => eliminar(c.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors px-2"
                  aria-label="Eliminar"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(detalle || cargandoDetalle) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setDetalle(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-premium rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {cargandoDetalle ? (
                <p className="text-gray-500 text-sm text-center py-8">Cargando ficha...</p>
              ) : detalle ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="section-title text-xl text-white">{detalle.nombre}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => descargarFicha(detalle)}
                        className="text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-xs font-tech tracking-wider"
                      >
                        <DownloadSimple size={16} /> DESCARGAR
                      </button>
                      <button onClick={() => setDetalle(null)} className="text-gray-500 hover:text-white">
                        <X size={22} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info label="RUT" value={detalle.rut} />
                    <Info label="Teléfono" value={detalle.telefono} />
                    <Info label="Nacimiento" value={fmtFecha(detalle.fecha_nacimiento)} />
                    <Info label="Email" value={detalle.email || "—"} />
                    <Info label="Zona" value={detalle.zona_tatuaje || "—"} />
                    <Info label="Firmado" value={fmtFecha(detalle.firmado_en)} />
                  </div>

                  {detalle.menor_edad && (
                    <div className="glass rounded-xl p-4 border border-amber-400/20">
                      <p className="font-tech text-xs text-amber-400 tracking-wider uppercase mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} weight="fill" />
                        Autorización Parental
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Info label="Padre/Madre" value={detalle.nombre_padre || "—"} />
                        <Info label="RUT Padre" value={detalle.rut_padre || "—"} />
                      </div>
                      {detalle.carnet_padre_url && (
                        <div className="mt-3">
                          <p className="font-tech text-[10px] text-gray-500 tracking-wider uppercase mb-2">
                            Carnet del padre
                          </p>
                          <a
                            href={detalle.carnet_padre_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={detalle.carnet_padre_url}
                              alt="Carnet del padre"
                              className="max-h-32 rounded-lg border border-white/10 hover:border-cyan-400/50 transition-colors cursor-pointer"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {detalle.descripcion_tatuaje && (
                    <Info label="Descripción del tatuaje" value={detalle.descripcion_tatuaje} />
                  )}

                  <div>
                    <p className="font-tech text-xs text-cyan-400 tracking-wider uppercase mb-2">Salud</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ["Alergias", detalle.alergias],
                        ["Coagulación", detalle.problemas_coagulacion],
                        ["Diabetes", detalle.diabetes],
                        ["Cardíaca", detalle.enfermedad_cardiaca],
                        ["Epilepsia", detalle.epilepsia],
                        ["VIH/Hepatitis", detalle.vih_hepatitis],
                        ["Embarazo/Lactancia", detalle.embarazo_lactancia],
                        ["Bajo efectos", detalle.bajo_efectos],
                      ].map(([label, val]) => (
                        <span
                          key={label as string}
                          className={`text-[11px] font-tech tracking-wider rounded px-2 py-1 border ${
                            val
                              ? "text-red-400 bg-red-400/10 border-red-400/20"
                              : "text-gray-600 bg-white/[0.02] border-white/5"
                          }`}
                        >
                          {val ? "⚠ " : "○ "}{label as string}
                        </span>
                      ))}
                    </div>
                    {detalle.alergias && detalle.alergias_detalle && (
                      <p className="text-gray-400 text-xs mt-2">Detalle alergias: {detalle.alergias_detalle}</p>
                    )}
                    {detalle.medicamentos && (
                      <p className="text-gray-400 text-xs mt-1">Medicamentos: {detalle.medicamentos}</p>
                    )}
                  </div>

                  {detalle.firma_url && (
                    <div>
                      <p className="font-tech text-xs text-cyan-400 tracking-wider uppercase mb-2">Firma</p>
                      <div className="bg-white rounded-lg p-3 inline-block">
                        <img src={detalle.firma_url} alt="Firma" className="max-h-32" />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-tech text-[10px] text-gray-600 tracking-wider uppercase">{label}</p>
      <p className="text-gray-200 text-sm">{value}</p>
    </div>
  )
}

function detectPlatform(url: string): string {
  if (/instagram\.com\/(reel|p)\//i.test(url)) return "instagram"
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube"
  if (/tiktok\.com/i.test(url)) return "tiktok"
  return "instagram"
}

function ReelsTab({ items, onRefresh, headers }: {
  items: Reel[]
  onRefresh: () => void
  headers: Record<string, string>
}) {
  const [url, setUrl] = useState("")
  const [titulo, setTitulo] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const MAX_VIDEO_MB = 200

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    if (!f.type.startsWith("video/")) { setMsg({ ok: false, text: "Solo se permiten archivos de video" }); return }
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) { setMsg({ ok: false, text: `El video supera los ${MAX_VIDEO_MB} MB` }); return }
    setVideoFile(f)
    setMsg(null)
  }

  const subirVideo = async (): Promise<string | null> => {
    if (!videoFile) return null
    setSubiendo(true)
    setMsg(null)
    try {
      const safe = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const blob = await upload(`reels/${Date.now()}-${safe}`, videoFile, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
        headers,
        multipart: videoFile.size > 10 * 1024 * 1024,
      })
      setSubiendo(false)
      return blob.url
    } catch (err) {
      console.error("Error al subir video", err)
      setSubiendo(false)
      setMsg({ ok: false, text: "Error al subir el video. Probá con otro archivo." })
      return null
    }
  }

  const addReel = async () => {
    if (!url.trim() && !videoFile && !videoUrl.trim()) return
    setSaving(true)
    setMsg(null)
    try {
      const plataforma = detectPlatform(url || videoUrl || "")
      const videoSubido = videoFile ? await subirVideo() : videoUrl.trim() || null
      if (videoFile && !videoSubido) { setSaving(false); return }
      const reelUrl = url.trim() || videoSubido || ""
      const res = await fetch("/api/admin/reels", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: reelUrl, titulo: titulo.trim(), plataforma, video_url: videoSubido || "" }),
      })
      const data = await res.json()
      if (data.success) {
        setUrl("")
        setTitulo("")
        setVideoUrl("")
        setVideoFile(null)
        setMsg({ ok: true, text: videoSubido ? "Reel subido con video local" : "Reel agregado correctamente" })
        onRefresh()
      } else {
        setMsg({ ok: false, text: data.error || "Error al agregar" })
      }
    } catch {
      setMsg({ ok: false, text: "Error de conexión" })
    }
    setSaving(false)
  }

  const deleteReel = async (id: number) => {
    try {
      await fetch(`/api/admin/reels?id=${id}`, { method: "DELETE", headers })
      onRefresh()
    } catch {
      setMsg({ ok: false, text: "Error al eliminar" })
    }
  }

  return (
    <motion.div key="reels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-tech text-lg tracking-[0.2em] text-white mb-6">REELS</h2>

      <div className="glass rounded-2xl p-5 mb-6">
        <h3 className="font-tech text-sm tracking-[0.15em] text-gray-400 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-cyan-400" /> AGREGAR REEL
        </h3>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL del reel (Instagram, YouTube Shorts o TikTok)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400/40"
          />
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título (opcional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <input
            type="file"
            accept="video/*"
            className="hidden"
            id="reel-video-input"
            onChange={handleVideoFile}
          />
          <label
            htmlFor="reel-video-input"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-tech tracking-wider hover:bg-pink-500/20 transition-all cursor-pointer disabled:opacity-40"
          >
            {subiendo ? <Spinner size={14} className="animate-spin" /> : videoFile ? <VideoCamera size={14} /> : <UploadSimple size={14} weight="bold" />}
            {subiendo ? "SUBINDO VIDEO…" : videoFile ? `VIDEO: ${videoFile.name.slice(0, 28)}` : "SUBIR VIDEO (PC O MÓVIL)"}
          </label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="o URL del archivo de video (opcional)"
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400/40"
          />
          <span className="text-gray-600 text-[11px]">MP4 · hasta ~200 MB</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addReel}
            disabled={saving || subiendo || (!url.trim() && !videoFile && !videoUrl.trim())}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-tech tracking-wider hover:bg-cyan-400/20 transition-all disabled:opacity-40"
          >
            {saving ? <Spinner size={14} className="animate-spin" /> : <Plus size={14} />}
            AGREGAR
          </button>
          {msg && (
            <span className={`text-xs font-tech ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</span>
          )}
        </div>
        <p className="text-gray-600 text-[11px] mt-3">
          Sube un video desde tu PC o celular, o pega la URL de un reel. Si el video lleva a un reel de Instagram, su botón "Ver en IG" lleva al Instagram del estudio.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <InstagramLogo size={28} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No hay reels todavía. Agrega el primero con la URL de un reel de Instagram.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((r) => (
            <div key={r.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                  r.plataforma === "instagram"
                    ? "bg-pink-500/10 border-pink-500/20 text-pink-400"
                    : r.plataforma === "youtube"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-gray-500/10 border-gray-500/20 text-gray-300"
                }`}
              >
                <InstagramLogo size={15} weight="fill" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{r.titulo || r.url}</p>
                <p className="text-gray-600 text-[11px] font-tech tracking-wider truncate">{r.plataforma.toUpperCase()} · {r.url}</p>
              </div>
              <button
                onClick={() => deleteReel(r.id)}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-red-400 hover:border-red-400/30 transition-all shrink-0"
                aria-label="Eliminar"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
