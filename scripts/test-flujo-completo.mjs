// Test completo del flujo de citas + finanzas + baucher (contra producción)
// Flujo real: cliente agenda (pendiente) → admin confirma con precio (50% abono) →
// admin adjunta baucher → cita completada → se registra el ingreso total UNA sola vez.

const BASE = "https://tatuajes-azure.vercel.app"

let passed = 0
let failed = 0
const test = async (name, fn) => {
  try { await fn(); console.log(`  ✅ ${name}`); passed++ }
  catch (e) { console.log(`  ❌ ${name}: ${e.message}`); failed++ }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }

let token
let citaId = null
let ingresoId = null
let base = 0
const NOMBRE = "TEST FLUJO " + Date.now()
const PRECIO = 250000
const ABONO = Math.round(PRECIO * 0.5)

const H = () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" })
const getFinanzas = async () => {
  const r = await fetch(`${BASE}/api/admin/finanzas`, { headers: H() })
  const d = await r.json()
  assert(d.success, "GET finanzas falló")
  return d.transactions
}
const getResumen = async () => {
  const r = await fetch(`${BASE}/api/admin/finanzas?resumen=true`, { headers: H() })
  const d = await r.json()
  assert(d.success, "GET resumen falló")
  return d
}
const getCita = async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, { headers: H() })
  const d = await r.json()
  assert(d.success, "GET citas falló")
  return d.citas.find(c => c.id === citaId)
}

// 1) Login
await test("Login admin", async () => {
  const r = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "admin123" }),
  })
  const d = await r.json()
  assert(d.success, "login falló")
  token = d.token
})

// 2) Crear cita PENDIENTE (como la agenda el cliente)
await test("Cliente agenda cita (pendiente)", async () => {
  base = (await getFinanzas()).length
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "POST", headers: H(),
    body: JSON.stringify({ nombre: NOMBRE, whatsapp: "+56987654321", fecha: "2099-01-01", hora: "12:00", duracion: 120, descripcion: "Tatuaje realismo brazo", estado: "pendiente" }),
  })
  const d = await r.json()
  assert(d.success, JSON.stringify(d))
  citaId = d.cita.id
})

// 3) Confirmar con precio → NO entra dinero, notas con total + 50%
await test("Confirmar: guarda precio + 50% en notas, NO crea ingreso", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, estado: "confirmada", admin_notas: `💰 $${PRECIO.toLocaleString("es-CL")} | 50%: $${ABONO.toLocaleString("es-CL")}` }),
  })
  const d = await r.json()
  assert(d.success, JSON.stringify(d))
  const count = (await getFinanzas()).length
  assert(count === base, `finanzas cambió sin completar: ${base} → ${count}`)
  const cita = await getCita()
  assert(cita.estado === "confirmada", "estado no quedó confirmada")
  assert(cita.admin_notas.includes(`50%: $${ABONO.toLocaleString("es-CL")}`), "notas no incluyen el 50%")
})

// 4) Adjuntar baucher del abono 50% → persiste en la cita
const BAUCHER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
await test("Adjuntar baucher 50%: persiste y se lee", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, baucher: BAUCHER }),
  })
  assert(r.ok, `PATCH falló (${r.status})`)
  const cita = await getCita()
  assert(cita.baucher === BAUCHER, "baucher no persistió")
  assert(cita.baucher.startsWith("data:image/"), "baucher no parece imagen")
})

// 5) Baucher inválido se rechaza (muy grande y no-imagen)
await test("Baucher enorme (>300 KB) se rechaza con 400", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, baucher: "data:image/png;base64," + "A".repeat(320000) }),
  })
  assert(r.status === 400, `esperado 400, got ${r.status}`)
})
await test("Baucher que no es imagen se rechaza con 400", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, baucher: "texto-plano-sin-formato-de-imagen" }),
  })
  assert(r.status === 400, `esperado 400, got ${r.status}`)
})
await test("El baucher bueno siguió intacto tras los rechazos", async () => {
  const cita = await getCita()
  assert(cita.baucher === BAUCHER, "el baucher válido fue pisado por uno inválido")
})

// 6) Completar vía API → el backend NO crea nada (el ingreso lo hace el frontend)
await test("Completar: backend no crea registros ni en $0 ni duplicados", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "PATCH", headers: H(),
    body: JSON.stringify({ id: citaId, estado: "completada" }),
  })
  const d = await r.json()
  assert(d.success, JSON.stringify(d))
  const count = (await getFinanzas()).length
  assert(count === base, `finanzas cambió al completar: ${base} → ${count}`)
})

// 7) Simular el frontend al completar: registrar el ingreso TOTAL (una vez)
await test("Registrar ingreso total al completar (acción del frontend)", async () => {
  const r = await fetch(`${BASE}/api/admin/finanzas`, {
    method: "POST", headers: H(),
    body: JSON.stringify({ tipo: "ingreso", categoria: "tatuaje", concepto: `Cita completada: ${NOMBRE} - Tatuaje realismo brazo`, monto: PRECIO, fecha: "2099-01-01", agendamiento_id: citaId }),
  })
  const d = await r.json()
  assert(d.success, JSON.stringify(d))
  ingresoId = d.transaction.id
  const rows = await getFinanzas()
  assert(rows.length === base + 1, `esperado ${base + 1}, hay ${rows.length}`)
  const ing = rows.find(t => t.id === ingresoId)
  assert(ing.monto === PRECIO, `monto esperado ${PRECIO}, got ${ing.monto}`)
  assert(ing.agendamiento_id === citaId, "no está ligado a la cita")
  assert(ing.tipo === "ingreso", "tipo incorrecto")
})

// 8) El resumen de finanzas refleja el ingreso
await test("Resumen de finanzas incluye el ingreso", async () => {
  const s = await getResumen()
  assert(s.total_ingresos >= PRECIO, `total_ingresos ${s.total_ingresos} no incluye ${PRECIO}`)
  const cat = s.porCategoria.find(c => c.categoria === "tatuaje" && c.tipo === "ingreso")
  assert(cat && cat.total >= PRECIO, "categoría tatuaje no refleja el monto")
})

// 9) Clic doble/re-PATCH no duplica nada
await test("Re-PATCH completada: sin duplicados", async () => {
  await fetch(`${BASE}/api/admin/citas`, { method: "PATCH", headers: H(), body: JSON.stringify({ id: citaId, estado: "completada" }) })
  await fetch(`${BASE}/api/admin/citas`, { method: "PATCH", headers: H(), body: JSON.stringify({ id: citaId, estado: "completada" }) })
  const count = (await getFinanzas()).length
  assert(count === base + 1, `esperado ${base + 1}, hay ${count}`)
})

// 10) Cita cancelada NO registra dinero
let cita2 = null
await test("Cancelar otra cita: no se registra dinero", async () => {
  const r = await fetch(`${BASE}/api/admin/citas`, {
    method: "POST", headers: H(),
    body: JSON.stringify({ nombre: NOMBRE + " B", whatsapp: "+56911111111", fecha: "2099-01-02", estado: "confirmada" }),
  })
  const d = await r.json()
  cita2 = d.cita.id
  await fetch(`${BASE}/api/admin/citas`, { method: "PATCH", headers: H(), body: JSON.stringify({ id: cita2, estado: "cancelada" }) })
  const count = (await getFinanzas()).length
  assert(count === base + 1, `esperado ${base + 1}, hay ${count}`)
})

// 11) Limpieza total: borrar cita, ingreso y cita cancelada → estado original
await test("Limpieza: la BD vuelve a su estado inicial", async () => {
  await fetch(`${BASE}/api/admin/citas?id=${citaId}`, { method: "DELETE", headers: H() })
  await fetch(`${BASE}/api/admin/finanzas?id=${ingresoId}`, { method: "DELETE", headers: H() })
  await fetch(`${BASE}/api/admin/citas?id=${cita2}`, { method: "DELETE", headers: H() })
  const count = (await getFinanzas()).length
  assert(count === base, `después de limpiar: ${count}, esperado ${base}`)
  const citas = await (await fetch(`${BASE}/api/admin/citas`, { headers: H() })).json()
  assert(!citas.citas.some(c => c.nombre === NOMBRE || c.nombre === NOMBRE + " B"), "quedaron citas de test")
})

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`Resultados: ${passed} pasaron, ${failed} fallaron`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
process.exit(failed > 0 ? 1 : 0)
