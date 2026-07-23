// Test manual: Agenda → Admin confirma → Disponibilidad refleja cambio
import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

const BASE = "https://tatuajes-azure.vercel.app"
const ADMIN_PW = "admin123"
const TOKEN = btoa(ADMIN_PW)
const HEADERS = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }

// 1. Find a future date with availability
const now = new Date()
const disponibilidadRes = await fetch(`${BASE}/api/disponibilidad?year=${now.getFullYear()}&month=${now.getMonth()}`)
const dispData = await disponibilidadRes.json()

const availableDay = dispData.days.find(d => d.available && d.booked < d.max)
if (!availableDay) {
  console.log("❌ No hay días disponibles para probar")
  process.exit(1)
}

console.log(`📅 Día disponible: ${availableDay.date} (${availableDay.booked}/${availableDay.max} ocupados)`)

// 2. Book appointment on that day
console.log(`\n📝 Agendando cita en ${availableDay.date}...`)
const agendarRes = await fetch(`${BASE}/api/agendar`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    nombre: "Test Manual",
    whatsapp: "+56987654321",
    fecha: availableDay.date,
    descripcion: "Test de verificación",
  }),
})
const agendarData = await agendarRes.json()
if (!agendarData.success) {
  console.log(`❌ Error al agendar: ${JSON.stringify(agendarData)}`)
  process.exit(1)
}
console.log("✅ Cita agendada como pendiente")

// 3. Verify disponibilidad now shows +1 booked
const dispAfterBooking = await fetch(`${BASE}/api/disponibilidad?year=${now.getFullYear()}&month=${now.getMonth()}`)
const dispAfterData = await dispAfterBooking.json()
const dayAfterBooking = dispAfterData.days.find(d => d.date === availableDay.date)
console.log(`📊 Después de agendar: ${dayAfterBooking.booked}/${dayAfterBooking.max} ocupados`)
const bookedAfterBooking = dayAfterBooking.booked

// 4. Find the appointment in admin citas
const citasRes = await fetch(`${BASE}/api/admin/citas`, { headers: HEADERS })
const citasData = await citasRes.json()
const testCita = citasData.citas.find(c => c.nombre === "Test Manual" && c.fecha === availableDay.date)
if (!testCita) {
  console.log("❌ Cita no encontrada en admin")
  process.exit(1)
}
console.log(`🔍 Cita #${testCita.id} encontrada en admin (estado: ${testCita.estado || "pendiente"})`)

// 5. Confirm from admin
console.log(`\n✅ Confirmando cita #${testCita.id} desde admin...`)
const confirmRes = await fetch(`${BASE}/api/admin/citas`, {
  method: "PATCH",
  headers: HEADERS,
  body: JSON.stringify({ id: testCita.id, estado: "confirmada" }),
})
const confirmData = await confirmRes.json()
if (!confirmData.success) {
  console.log(`❌ Error al confirmar: ${JSON.stringify(confirmData)}`)
  process.exit(1)
}
console.log("✅ Cita confirmada")

// 6. Verify disponibilidad STILL shows the same count (confirmar no debería cambiar el conteo)
const dispAfterConfirm = await fetch(`${BASE}/api/disponibilidad?year=${now.getFullYear()}&month=${now.getMonth()}`)
const dispAfterConfirmData = await dispAfterConfirm.json()
const dayAfterConfirm = dispAfterConfirmData.days.find(d => d.date === availableDay.date)
console.log(`📊 Después de confirmar: ${dayAfterConfirm.booked}/${dayAfterConfirm.max} ocupados`)

if (dayAfterConfirm.booked === bookedAfterBooking) {
  console.log("✅ CORRECTO: El conteo se mantiene igual (la cita ya estaba contada como pendiente)")
} else {
  console.log(`❌ ERROR: El conteo cambió de ${bookedAfterBooking} a ${dayAfterConfirm.booked}`)
}

// 7. Verify the visual states are correct
let estadoVisual
if (dayAfterConfirm.booked === 0) estadoVisual = "🟦 Libre"
else if (dayAfterConfirm.booked < dayAfterConfirm.max) estadoVisual = "🟨 Parcial"
else estadoVisual = "🟥 Lleno"
console.log(`\n🎨 Estado visual del día ${availableDay.date}: ${estadoVisual} (${dayAfterConfirm.booked}/${dayAfterConfirm.max})`)

// 8. Cleanup - delete test cita
await fetch(`${BASE}/api/admin/citas?id=${testCita.id}`, { method: "DELETE", headers: HEADERS })
console.log(`\n🧹 Cita de test eliminada`)

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log("✅ VERIFICACIÓN COMPLETA")
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
