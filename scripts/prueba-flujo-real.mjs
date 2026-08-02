// Flujo REAL completo: cliente agenda (endpoint público) → admin confirma → baucher → completar → ingreso
// Los datos de prueba quedan en la BD para que el admin los vea en el panel.

const BASE = "https://tatuajes-azure.vercel.app"
const NOMBRE = "PRUEBA FLUJO"
const WHATSAPP = "+56987654321"
const PRECIO = 180000
const ABONO = Math.round(PRECIO * 0.5)
const BAUCHER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

let passed = 0, failed = 0
const test = async (name, fn) => {
  try { await fn(); console.log(`  ✅ ${name}`); passed++ }
  catch (e) { console.log(`  ❌ ${name}: ${e.message}`); failed++ }
}
const assert = (c, m) => { if (!c) throw new Error(m) }

let token, citaId, fechaElegida

// 0) Login admin
await test("Login admin", async () => {
  const r = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "admin123" }),
  })
  const d = await r.json()
  assert(d.success, "login falló")
  token = d.token
})
const H = () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" })

// 1) Buscar un día con cupo disponible
await test("Buscar día disponible", async () => {
  const now = new Date()
  for (let m = 0; m < 3; m++) {
    const r = await fetch(`${BASE}/api/disponibilidad?year=${now.getFullYear()}&month=${now.getMonth() + m}`)
    const d = await r.json()
    assert(d.success, "disponibilidad falló")
    const day = d.days.find(x => x.available)
    if (day) { fechaElegida = day.date; return }
  }
  throw new Error("No hay días disponibles en los próximos 3 meses")
})
console.log(`  📅 Día elegido: ${fechaElegida}`)

// 2) EL CLIENTE agenda por el endpoint público (como el formulario de la web)
await test("Cliente agenda por /api/agendar (público)", async () => {
  const r = await fetch(`${BASE}/api/agendar`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: NOMBRE, whatsapp: WHATSAPP, fecha: fechaElegida, descripcion: "Tatuaje manga brazo" }),
  })
  const d = await r.json()
  assert(d.success, JSON.stringify(d))
})

// 3) La cita aparece como pendiente en el admin
await test("La cita aparece como PENDIENTE en el admin", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, { headers: H() })
  const d = await r.json()
  const c = d.citas.find(x => x.nombre === NOMBRE && x.fecha === fechaElegida)
  assert(c, "cita no encontrada")
  assert(!c.estado || c.estado === "pendiente", `estado: ${c.estado}`)
  citaId = c.id
})
console.log(`  🔖 Cita #${citaId} — ${NOMBRE} — ${fechaElegida}`)

// 4) Admin CONFIRMA con precio (total + 50%)
await test("Admin confirma con precio (50% en notas)", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, estado: "confirmada", admin_notas: `💰 $${PRECIO.toLocaleString("es-CL")} | 50%: $${ABONO.toLocaleString("es-CL")}` }),
  })
  const d = await r.json()
  assert(d.success, JSON.stringify(d))
  const c = (await (await fetch(`${BASE}/api/admin/citas`, { headers: H() })).json()).citas.find(x => x.id === citaId)
  assert(c.estado === "confirmada", "no quedó confirmada")
  assert(c.admin_notas.includes(`${ABONO.toLocaleString("es-CL")}`), "no se guardó el 50%")
})

// 5) Admin adjunta el BAUCHER del abono 50%
await test("Admin adjunta baucher del 50%", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, baucher: BAUCHER }),
  })
  assert(r.ok, `PATCH ${r.status}`)
  const c = (await (await fetch(`${BASE}/api/admin/citas`, { headers: H() })).json()).citas.find(x => x.id === citaId)
  assert(c.baucher === BAUCHER, "baucher no persistió")
})

// 6) Confirmar NO tocó finanzas
await test("Finanzas intactas tras confirmar (sin ingreso prematuro)", async () => {
  const r = await fetch(`${BASE}/api/admin/finanzas`, { headers: H() })
  const d = await r.json()
  assert(!d.transactions.some(t => t.agendamiento_id === citaId), "¡se creó un ingreso al confirmar!")
})

// 7) Admin COMPLETA la cita
await test("Admin marca la cita como COMPLETADA", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, estado: "completada" }),
  })
  const d = await r.json()
  assert(d.success, JSON.stringify(d))
})

// 8) Se registra el ingreso TOTAL al completar (acción del frontend)
await test("Se registra el ingreso total al completar", async () => {
  const r = await fetch(`${BASE}/api/admin/finanzas`, {
    method: "POST", headers: H(),
    body: JSON.stringify({ tipo: "ingreso", categoria: "tatuaje", concepto: `Cita completada: ${NOMBRE} - Tatuaje manga brazo`, monto: PRECIO, fecha: fechaElegida, agendamiento_id: citaId }),
  })
  const d = await r.json()
  assert(d.success, JSON.stringify(d))
  const rows = (await (await fetch(`${BASE}/api/admin/finanzas`, { headers: H() })).json()).transactions
  const ingresos = rows.filter(t => t.agendamiento_id === citaId)
  assert(ingresos.length === 1, `debe haber 1 ingreso, hay ${ingresos.length}`)
  assert(ingresos[0].monto === PRECIO, `monto ${ingresos[0].monto}`)
})

// 9) Resumen de finanzas actualizado
await test("El resumen de finanzas incluye el ingreso", async () => {
  const r = await fetch(`${BASE}/api/admin/finanzas?resumen=true`, { headers: H() })
  const d = await r.json()
  assert(d.total_ingresos >= PRECIO, `total_ingresos ${d.total_ingresos}`)
})

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`Resultados: ${passed} pasaron, ${failed} fallaron`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`\nLa cita #${citaId} (${NOMBRE}, ${fechaElegida}) quedó COMPLETADA con baucher y su ingreso de $${PRECIO.toLocaleString("es-CL")} en finanzas.`)
console.log(`Mírala en el panel: /admin → Citas (filtro Completadas) y Finanzas.`)
process.exit(failed > 0 ? 1 : 0)
