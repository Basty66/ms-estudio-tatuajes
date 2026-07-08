import { useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"

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
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const handleWhatsApp = () => {
    const fechaStr = selected ? formatDate(selected) : "próximamente"
    const mensaje = `Hola MS Estudio, vi su página web y me interesa agendar una cita para el día ${fechaStr}. Quedo atento.`
    const url = `https://wa.me/56964470668?text=${encodeURIComponent(mensaje)}`
    window.open(url, "_blank")
  }

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  return (
    <section id="agenda" className="py-24 relative">
      <div className="max-w-lg mx-auto px-4">
        <p className="section-subtitle text-center mb-2">RESERVA TU CITA</p>
        <h2 className="section-title text-4xl md:text-5xl text-center mb-12 neon-text">
          AGENDA
        </h2>

        <div className="neon-card rounded-xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="text-cyan-400 hover:text-cyan-300 transition-colors p-1"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-cyan-400" />
              <span className="text-white font-semibold tracking-wider">
                {monthNames[month]} {year}
              </span>
            </div>
            <button
              onClick={nextMonth}
              className="text-cyan-400 hover:text-cyan-300 transition-colors p-1"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((d) => (
              <div key={d} className="text-center text-xs text-cyan-400/60 font-semibold py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const past = isPastDay(day)
              const isSelected =
                selected?.getDate() === day &&
                selected?.getMonth() === month &&
                selected?.getFullYear() === year

              return (
                <button
                  key={day}
                  disabled={past}
                  onClick={() => handleSelectDay(day)}
                  className={`text-sm py-2 rounded-lg transition-all ${
                    isSelected
                      ? "bg-cyan-400 text-black font-bold"
                      : past
                        ? "text-gray-700 cursor-not-allowed"
                        : isToday(day)
                          ? "text-cyan-400 font-bold border border-cyan-400/40"
                          : "text-gray-300 hover:bg-cyan-400/10 hover:text-cyan-400"
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {selected && (
            <p className="text-center text-cyan-300 text-sm mt-4 tracking-wider">
              Fecha seleccionada: {formatDate(selected)}
            </p>
          )}
        </div>

        <button
          onClick={handleWhatsApp}
          className="neon-button-primary w-full rounded-xl px-6 py-4 mt-6 flex items-center justify-center gap-3 text-base tracking-wider font-bold"
        >
          <Calendar size={20} />
          AGENDA TU CITA POR WHATSAPP
        </button>

        <p className="text-center text-gray-600 text-xs mt-4 tracking-wider">
          Al hacer clic se abrirá WhatsApp con un mensaje predefinido
        </p>
      </div>
    </section>
  )
}
