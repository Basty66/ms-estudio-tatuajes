import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CalendarCheck,
  WhatsappLogo,
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

export default function Agenda() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<Date | null>(null)

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
    const date = new Date(year, month, day)
    if (date >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      setSelected(date)
    }
  }

  const isPastDay = (day: number) => {
    const date = new Date(year, month, day)
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < todayDate
  }

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })

  const handleWhatsApp = () => {
    const fechaStr = selected ? formatDate(selected) : "próximamente"
    const mensaje = `Hola MS Estudio, vi su página web y me interesa agendar una cita para el día ${fechaStr}. Quedo atento.`
    window.open(`https://wa.me/56964470668?text=${encodeURIComponent(mensaje)}`, "_blank")
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <section id="agenda" className="relative py-20 md:py-32 overflow-hidden">
      <div className="ambient-glow top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-400/5" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-xs tracking-[0.3em] text-cyan-400/50 uppercase mb-4 block">
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
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <div className="glass rounded-2xl md:rounded-3xl p-4 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevMonth}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/20 transition-all"
              >
                <CaretLeft size={16} weight="bold" />
              </motion.button>

              <div className="flex items-center gap-3">
                <CalendarBlank size={20} className="text-cyan-400" weight="duotone" />
                <span className="text-white font-semibold tracking-wider text-lg">
                  {monthNames[month]} {year}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextMonth}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/20 transition-all"
              >
                <CaretRight size={16} weight="bold" />
              </motion.button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-3">
              {daysOfWeek.map((d) => (
                <div key={d} className="text-center text-[11px] tracking-wider text-cyan-400/40 font-semibold py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const past = isPastDay(day)
                const isSelected =
                  selected?.getDate() === day &&
                  selected?.getMonth() === month &&
                  selected?.getFullYear() === year

                return (
                  <motion.button
                    key={day}
                    whileTap={{ scale: 0.9 }}
                    disabled={past}
                    onClick={() => handleSelectDay(day)}
                    className={`text-sm min-h-[40px] py-2.5 rounded-xl transition-all ${
                      isSelected
                        ? "bg-cyan-400 text-black font-bold"
                        : past
                          ? "text-gray-700 cursor-not-allowed"
                          : isToday(day)
                            ? "text-cyan-400 font-bold border border-cyan-400/30"
                            : "text-gray-400 hover:bg-cyan-400/10 hover:text-cyan-400"
                    }`}
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWhatsApp}
            className="neon-button-primary w-full rounded-2xl px-6 py-4 mt-6 flex items-center justify-center gap-3 text-base tracking-widest font-bold"
          >
            <WhatsappLogo size={22} weight="fill" />
            AGENDA TU CITA POR WHATSAPP
          </motion.button>

          <p className="text-center text-gray-700 text-xs mt-4 tracking-wider">
            Se abrirá WhatsApp con un mensaje predefinido
          </p>
        </motion.div>
      </div>
    </section>
  )
}
