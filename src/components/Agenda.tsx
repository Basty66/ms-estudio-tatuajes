import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CalendarCheck,
  WhatsappLogo,
  User,
  Note,
  Spinner,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react"

const daysOfWeek = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface DayInfo {
  date: string
  day: number
  dayOfWeek: number
  available: boolean
  booked: number
  max: number
  pendientes: number
  confirmadas: number
  completadas: number
}

export default function Agenda() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<Date | null>(null)
  const [nombre, setNombre] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daysData, setDaysData] = useState<Map<string, DayInfo>>(new Map())
  const [loadingDisp, setLoadingDisp] = useState(true)
  const [confirmed, setConfirmed] = useState<{ fecha: string; nombre: string; whatsapp: string; descripcion: string } | null>(null)

  useEffect(() => {
    setLoadingDisp(true)
    setSelected(null)
    fetch(`/api/disponibilidad?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const map = new Map<string, DayInfo>()
          data.days.forEach((d: DayInfo) => map.set(d.date, d))
          setDaysData(map)
        }
      })
      .catch(() => setError("No se pudo cargar la disponibilidad. Recarga la página."))
      .finally(() => setLoadingDisp(false))
  }, [year, month])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0) }
    else setMonth(month + 1)
  }

  const handleSelectDay = (day: number) => {
    const info = daysData.get(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)
    if (info && info.available) {
      setSelected(new Date(year, month, day))
    }
  }

  const isPastDay = (day: number) => {
    const date = new Date(year, month, day)
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < todayDate
  }

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })

  const handleSubmit = async () => {
    if (!nombre.trim() || !whatsapp.trim() || !selected) return

    const digits = whatsapp.trim().replace(/\D/g, "")
    if (digits.length !== 9 || !digits.startsWith("9")) {
      setError("WhatsApp inválido. Debe ser 9XXXXXXXX (9 dígitos)")
      return
    }

    setSubmitting(true)
    const fechaStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`

    let apiError = false
    try {
      const res = await fetch("/api/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          whatsapp: `+56${digits}`,
          fecha: fechaStr,
          descripcion: descripcion.trim(),
        }),
      })
      const data = await res.json()
      if (!data.success) {
        apiError = true
        setError(data.error || "Error al agendar")
        if (data.error?.includes("completo") || data.error?.includes("disponible")) {
          // Refresh disponibilidad
          fetch(`/api/disponibilidad?year=${year}&month=${month}`)
            .then(r => r.json())
            .then(d => {
              if (d.success) {
                const map = new Map<string, DayInfo>()
                d.days.forEach((di: DayInfo) => map.set(di.date, di))
                setDaysData(map)
              }
            })
        }
      }
    } catch {
      apiError = true
      setError("Error de conexión")
    }

    if (apiError) {
      setSubmitting(false)
      return
    }

    setConfirmed({
      fecha: formatDate(selected),
      nombre: nombre.trim(),
      whatsapp: `+56${digits}`,
      descripcion: descripcion.trim(),
    })
    setSubmitting(false)
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const getDayStatus = (day: number): "available" | "partial" | "full" | "past" | "nodata" | "selected" | "today" => {
    if (selected?.getDate() === day && selected?.getMonth() === month && selected?.getFullYear() === year) return "selected"
    if (isPastDay(day)) return "past"
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const info = daysData.get(dateStr)
    if (!info) return "nodata"
    if (!info.available) return "full"
    if (info.booked > 0) return isToday(day) ? "today" : "partial"
    return isToday(day) ? "today" : "available"
  }

  const dayColor = (status: string) => {
    switch (status) {
      case "selected": return "bg-cyan-400 text-black font-bold"
      case "today": return "text-cyan-400 font-bold border border-cyan-400/30 bg-cyan-400/5"
      case "available": return "text-gray-300 hover:bg-cyan-400/15 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(0,229,255,0.1)] bg-cyan-400/5"
      case "partial": return "text-amber-300 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 transition-all"
      case "full": return "text-red-400 bg-red-400/10 border border-red-400/20 cursor-not-allowed"
      case "past": return "text-gray-700 cursor-not-allowed"
      default: return "text-gray-700 cursor-not-allowed"
    }
  }

  return (
    <section id="agenda" className="relative py-20 md:py-32 overflow-hidden">
      <div className="ambient-glow top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-400/5" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
            Reserva tu cita
          </span>
          <h2 className="section-title text-4xl md:text-7xl text-white mb-4">
            AGENDA
            <br />
            <span className="premium-gradient">TU CITA</span>
          </h2>
          <div className="w-12 h-[1px] bg-cyan-400/30 mx-auto mt-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-lg mx-auto"
        >
          <div className="glass rounded-2xl md:rounded-3xl p-4 md:p-10">
            <div className="space-y-4 mb-8">
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/50" weight="duotone" />
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/40 focus:bg-white/10 transition-all tracking-wider"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/50 text-sm font-mono">+56</span>
                <input
                  type="tel"
                  placeholder="9 1234 5678"
                  value={whatsapp}
                  onChange={(e) => { setWhatsapp(e.target.value); setError(null) }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-16 pr-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/40 focus:bg-white/10 transition-all tracking-wider"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevMonth}
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/20 transition-all"
              >
                <CaretLeft size={16} weight="bold" />
              </motion.button>

              <div className="flex items-center gap-3">
                <CalendarBlank size={20} className="text-cyan-400" weight="duotone" />
                <span className="font-tech text-white font-semibold tracking-wider text-lg">
                  {monthNames[month]} {year}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextMonth}
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/20 transition-all"
              >
                <CaretRight size={16} weight="bold" />
              </motion.button>
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center gap-3 mb-4 text-[11px] font-tech tracking-wider flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-400" /> Libre</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> Parcial</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400" /> Lleno</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-700" /> Pasado</span>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-3">
              {daysOfWeek.map((d) => (
                <div key={d} className="font-tech text-center text-[11px] tracking-wider text-cyan-400/40 font-semibold py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {loadingDisp && (
                <div className="col-span-7 flex items-center justify-center py-4">
                  <Spinner size={20} className="text-cyan-400 animate-spin" />
                </div>
              )}
              {!loadingDisp && Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {!loadingDisp && Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const status = getDayStatus(day)
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const info = daysData.get(dateStr)

                return (
                    <motion.button
                    key={day}
                    whileTap={status === "available" || status === "partial" ? { scale: 0.9 } : {}}
                    disabled={status === "past" || status === "nodata" || status === "full"}
                    onClick={() => handleSelectDay(day)}
                    title={info ? `${info.booked}/${info.max} cupos · ${info.pendientes} pendientes, ${info.confirmadas} confirmadas` : ""}
                    className={`text-sm min-h-[44px] py-2.5 rounded-xl transition-all ${dayColor(status)}`}
                  >
                    {day}
                  </motion.button>
                )
              })}
            </div>

            <AnimatePresence>
              {selected && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center text-cyan-300 text-sm mt-6 tracking-wider flex items-center justify-center gap-2"
                >
                  <CalendarCheck size={16} className="text-cyan-400" weight="duotone" />
                  {formatDate(selected)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="relative mt-4">
            <Note size={16} className="absolute left-4 top-4 text-cyan-400/50" weight="duotone" />
            <textarea
              placeholder="Describe brevemente tu idea (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-400/40 focus:bg-white/10 transition-all tracking-wider resize-none"
            />
          </div>

          {error && (
            <p className="font-tech text-xs text-red-400 tracking-wider text-center">{error}</p>
          )}

          <AnimatePresence>
            {confirmed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="glass rounded-2xl p-6 mt-6 text-center border border-cyan-400/20"
              >
                <CheckCircle size={40} className="text-cyan-400 mx-auto mb-3" weight="duotone" />
                <h3 className="font-tech text-lg text-white tracking-[0.15em] mb-1">CITA AGENDADA</h3>
                <p className="text-sm text-cyan-300/80 font-tech tracking-wider mb-3">
                  {confirmed.fecha}
                </p>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-4">
                  <Clock size={14} weight="duotone" />
                  <span className="font-tech tracking-wider">Pendiente de confirmación (hasta 30 min)</span>
                </div>
                <p className="text-gray-500 text-xs mb-5 font-tech tracking-wider">
                  El admin revisará tu solicitud y te confirmará la hora. Si necesitas hablar antes, contáctanos por WhatsApp.
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href={`https://wa.me/56964470668?text=${encodeURIComponent(`Hola MS Estudio, soy ${confirmed.nombre}. Agendé una cita para el ${confirmed.fecha}.${confirmed.descripcion ? `\n\nDetalles: ${confirmed.descripcion}` : ""}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-tech neon-button-primary w-full rounded-xl px-6 py-3 flex items-center justify-center gap-2 text-sm tracking-[0.2em] font-bold"
                  >
                    <WhatsappLogo size={18} weight="fill" />
                    CONTACTAR POR WHATSAPP
                  </a>
                  <button
                    onClick={() => setConfirmed(null)}
                    className="font-tech text-gray-500 hover:text-white text-xs tracking-[0.2em] py-2 transition-colors"
                  >
                    AGENDAR OTRA CITA
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!confirmed && (
            <>
              <motion.button
                whileHover={!submitting ? { scale: 1.02 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                onClick={handleSubmit}
                disabled={submitting || !nombre.trim() || !whatsapp.trim() || !selected}
                className="font-tech neon-button-primary w-full rounded-2xl px-6 py-4 mt-6 flex items-center justify-center gap-3 text-base tracking-[0.2em] font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Spinner size={22} className="animate-spin" />
                ) : (
                  <WhatsappLogo size={22} weight="fill" />
                )}
                {submitting ? "PROCESANDO..." : "AGENDA TU CITA"}
              </motion.button>

              <p className="font-tech text-center text-gray-700 text-xs mt-4 tracking-[0.2em] uppercase">
                Recibirás confirmación del admin en minutos
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}
