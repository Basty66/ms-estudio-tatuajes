// Verificación end-to-end del fix de finanzas (deploy actual en producción)
// Flujo: crear cita → confirmar → completar → simular frontend (POST finanzas al completar)
// Assert: NUNCA se auto-crean registros en $0, ni duplicados; el baucher se guarda.

const BASE = "https://tatuajes-azure.vercel.app"

let passed = 0
let failed = 0
const test = async (name, fn) => {
  try { await fn(); console.log(`  ✅ ${name}`); passed++ }
  catch (e) { console.log(`  ❌ ${name}: ${e.message}`); failed++ }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }

let token
let citaId

// 1) Login
await test("Login admin", async () => {
  const res = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "admin123" }),
  })
  const d = await res.json()
  assert(d.success === true, "login falló")
  token = d.token
})

const H = () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" })
const finanzasCount = async () => {
  const res = await fetch(`${BASE}/api/admin/finanzas`, { headers: H() })
  const d = await res.json()
  assert(d.success, "finanzas falló")
  return d.transactions.length
}

const NOMBRE_TEST = "TEST FIX FINANZAS " + Date.now()

// 2) Crear cita
let base = 0
await test("Crear cita test (confirmada)", async () => {
  base = await finanzasCount()
  const res = await fetch(`${BASE}/api/admin/citas`, {
    method: "POST", headers: H(),
    body: JSON.stringify({ nombre: NOMBRE_TEST, whatsapp: "+56900000000", fecha: "2099-01-01", estado: "confirmada", duracion: 120 }),
  })
  const d = await res.json()
  assert(d.success, JSON.stringify(d))
  citaId = d.cita.id
})

// 3) Confirmar: NO debe crear registros en finanzas (antes creaba uno en $0)
await test("Confirmar NO crea registro en finanzas (fix principal)", async () => {
  const res = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, estado: "confirmada", admin_notas: "💰 $200.000 | 50%: $100.000" }),
  })
  const d = await res.json()
  assert(d.success, JSON.stringify(d))
  const count = await finanzasCount()
  assert(count === base, `esperado ${base}, hay ${count} → se creó un registro indebido`)
})

// 4) Subir baucher (base64 pequeño) y verificar que se guarda
const BAUCHER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
await test("Guardar baucher en la cita (PATCH)", async () => {
  const res = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, baucher: BAUCHER }),
  })
  const d = await res.json()
  assert(d.success, JSON.stringify(d))
  const get = await fetch(`${BASE}/api/admin/citas`, { headers: H() })
  const gd = await get.json()
  const cita = gd.citas.find(c => c.id === citaId)
  assert(cita && cita.baucher === BAUCHER, "baucher no persistió")
})

// 5) Completar vía API: el backend ya NO crea nada (el ingreso lo hace el frontend)
await test("Completar NO crea registro automático en finanzas", async () => {
  const res = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, estado: "completada" }),
  })
  const d = await res.json()
  assert(d.success, JSON.stringify(d))
  const count = await finanzasCount()
  assert(count === base, `esperado ${base}, hay ${count}`)
})

// 6) Simular el frontend: registrar ingreso al completar (POST finanzas con agendamiento_id)
let ingresoId = null
await test("Registrar ingreso al completar (igual que el frontend)", async () => {
  const res = await fetch(`${BASE}/api/admin/finanzas`, {
    method: "POST", headers: H(),
    body: JSON.stringify({ tipo: "ingreso", categoria: "tatuaje", concepto: `Cita completada: ${NOMBRE_TEST} - Test`, monto: 200000, fecha: "2099-01-01", agendamiento_id: citaId }),
  })
  const d = await res.json()
  assert(d.success, JSON.stringify(d))
  ingresoId = d.transaction.id
  const count = await finanzasCount()
  assert(count === base + 1, `esperado ${base + 1}, hay ${count}`)
})

// 7) PATCH repetido a completada: no debe duplicar nada (backend no inserta)
await test("Re-PATCH completada no duplica registros", async () => {
  await fetch(`${BASE}/api/admin/citas`, { method: "PATCH", headers: H(), body: JSON.stringify({ id: citaId, estado: "completada" }) })
  const count = await finanzasCount()
  assert(count === base + 1, `esperado ${base + 1}, hay ${count}`)
})

// 8) Baucher inválido (muy grande) debe rechazarse
await test("Baucher > 300 KB se rechaza", async () => {
  const res = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, baucher: "data:image/png;base64," + "A".repeat(320000) }),
  })
  assert(res.status === 400, `esperado 400, got ${res.status}`)
})

// 9) Cleanup
await test("Limpiar datos de prueba", async () => {
  await fetch(`${BASE}/api/admin/citas?id=${citaId}`, { method: "DELETE", headers: H() })
  if (ingresoId) await fetch(`${BASE}/api/admin/finanzas?id=${ingresoId}`, { method: "DELETE", headers: H() })
  const count = await finanzasCount()
  assert(count === base, `después de limpiar: ${count}, esperado ${base}`)
})

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`Resultados: ${passed} pasaron, ${failed} fallaron`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
process.exit(failed > 0 ? 1 : 0)
