// End-to-end test: Cotización → Admin → Aceptar
import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

const BASE = "https://tatuajes-azure.vercel.app"
const ADMIN_PW = "admin123"
const TOKEN = btoa(ADMIN_PW)
const HEADERS = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`)
    failed++
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg)
}

// ===== Test 1: Login =====
await test("POST /api/admin/auth - login correcto", async () => {
  const res = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PW }),
  })
  const data = await res.json()
  assert(data.success === true, "login failed")
  assert(data.token === TOKEN, `token mismatch: got ${data.token}`)
})

await test("POST /api/admin/auth - login incorrecto", async () => {
  const res = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "wrong" }),
  })
  assert(res.status === 401, `expected 401, got ${res.status}`)
})

// ===== Test 2: Dashboard =====
await test("GET /api/admin/auth - dashboard con token valido", async () => {
  const res = await fetch(`${BASE}/api/admin/auth`, { headers: HEADERS })
  const data = await res.json()
  assert(data.success === true, "dashboard failed")
  assert(typeof data.metrics.cotizaciones === "number", "no metrics")
  assert(typeof data.metrics.agendamentos === "number", "no agendamentos")
})

// ===== Test 3: Cotización flow =====
let cotizacionId
await test("POST /api/cotizar - crear cotizacion", async () => {
  const res = await fetch(`${BASE}/api/cotizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: "Test E2E",
      whatsapp: "+56912345678",
      estilo: "realismo",
      zona: "brazo",
      tamano: "mediano",
    }),
  })
  const data = await res.json()
  assert(data.success === true, `cotizar failed: ${JSON.stringify(data)}`)
})

await test("GET /api/admin/cotizaciones - ver cotizaciones en admin", async () => {
  const res = await fetch(`${BASE}/api/admin/cotizaciones`, { headers: HEADERS })
  const data = await res.json()
  assert(data.success === true, "fetch failed")
  assert(Array.isArray(data.cotizaciones), "not an array")
  const last = data.cotizaciones.find(c => c.nombre === "Test E2E")
  assert(last, "cotizacion not found in admin")
  assert(last.estado === "pendiente", `expected pendiente, got ${last.estado}`)
  cotizacionId = last.id
})

await test("PATCH /api/admin/cotizaciones - aceptar cotizacion", async () => {
  assert(cotizacionId, "no cotizacion id")
  const res = await fetch(`${BASE}/api/admin/cotizaciones`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ id: cotizacionId, estado: "aceptada" }),
  })
  const data = await res.json()
  assert(data.success === true, `patch failed: ${JSON.stringify(data)}`)
  assert(data.cotizacion.estado === "aceptada", `expected aceptada, got ${data.cotizacion.estado}`)
})

// ===== Test 4: Agenda flow =====
await test("GET /api/disponibilidad - consultar disponibilidad", async () => {
  const now = new Date()
  const res = await fetch(`${BASE}/api/disponibilidad?year=${now.getFullYear()}&month=${now.getMonth()}`)
  const data = await res.json()
  assert(data.success === true, "disponibilidad failed")
  assert(Array.isArray(data.days), "no days array")
})

// ===== Test 5: Citas Admin =====
await test("GET /api/admin/citas - ver citas", async () => {
  const res = await fetch(`${BASE}/api/admin/citas`, { headers: HEADERS })
  const data = await res.json()
  assert(data.success === true, "citas failed")
  assert(Array.isArray(data.citas), "not an array")
})

// ===== Test 6: Galeria Admin =====
await test("GET /api/admin/galeria - ver galeria", async () => {
  const res = await fetch(`${BASE}/api/admin/galeria`, { headers: HEADERS })
  const data = await res.json()
  assert(data.success === true, "galeria failed")
})

// ===== Test 7: Publicaciones Admin =====
await test("GET /api/admin/publicaciones - ver publicaciones", async () => {
  const res = await fetch(`${BASE}/api/admin/publicaciones`, { headers: HEADERS })
  const data = await res.json()
  assert(data.success === true, "publicaciones failed")
})

// ===== Test 8: Disponibilidad Admin =====
await test("GET /api/admin/disponibilidad - ver disponibilidad admin", async () => {
  const now = new Date()
  const res = await fetch(`${BASE}/api/admin/disponibilidad?year=${now.getFullYear()}&month=${now.getMonth()}`, { headers: HEADERS })
  const data = await res.json()
  assert(data.success === true, "disponibilidad admin failed")
})

// ===== Cleanup: Delete test cotizacion =====
await test("DELETE /api/admin/cotizaciones - limpiar cotizacion test", async () => {
  assert(cotizacionId, "no cotizacion id")
  const res = await fetch(`${BASE}/api/admin/cotizaciones?id=${cotizacionId}`, { method: "DELETE", headers: HEADERS })
  const data = await res.json()
  assert(data.success === true, `delete failed: ${JSON.stringify(data)}`)
})

// ===== Summary =====
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`Resultados: ${passed} pasaron, ${failed} fallaron`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
process.exit(failed > 0 ? 1 : 0)
