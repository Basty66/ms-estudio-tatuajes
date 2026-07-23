const { neon } = require("@neondatabase/serverless")
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

async function run() {
  // 1. Create cotizaciones table
  try {
    await sql`CREATE TABLE IF NOT EXISTS cotizaciones (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      estilo TEXT NOT NULL,
      zona TEXT NOT NULL,
      tamano TEXT NOT NULL,
      imagen_url TEXT DEFAULT '',
      creado_en TIMESTAMP DEFAULT NOW()
    )`
    console.log("OK: cotizaciones table")
  } catch (e) { console.log("ERR: cotizaciones -", e.message) }

  // 2. Unique constraint for disponibilidad
  try {
    await sql`ALTER TABLE disponibilidad ADD CONSTRAINT disponibilidad_dia_semana_key UNIQUE (dia_semana)`
    console.log("OK: disponibilidad constraint")
  } catch (e) { console.log("NOTE: disponibilidad constraint -", e.message) }

  // 3. Add columns to agendamentos
  const cols = [
    { name: "estado", type: "TEXT DEFAULT 'pendiente'" },
    { name: "admin_notas", type: "TEXT DEFAULT ''" },
    { name: "duracion", type: "INTEGER DEFAULT 120" },
    { name: "hora", type: "TEXT DEFAULT ''" },
  ]
  for (const col of cols) {
    try {
      await sql.query(`ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`)
      console.log("OK: agendamentos." + col.name)
    } catch (e) { console.log("NOTE: agendamentos." + col.name + " -", e.message) }
  }

  // 4. Seed disponibilidad
  try {
    const days = [
      [1, "10:00", "19:00", 3],
      [2, "10:00", "19:00", 3],
      [3, "10:00", "19:00", 3],
      [4, "10:00", "19:00", 3],
      [5, "10:00", "19:00", 3],
      [6, "10:00", "14:00", 2],
    ]
    for (const [d, start, end, slots] of days) {
      await sql`INSERT INTO disponibilidad (dia_semana, activo, hora_inicio, hora_fin, slots_max)
        VALUES (${d}, true, ${start}, ${end}, ${slots})
        ON CONFLICT (dia_semana) DO NOTHING`
    }
    console.log("OK: seeded disponibilidad")
  } catch (e) { console.log("ERR: seed disponibilidad -", e.message) }

  console.log("ALL DONE")
}

run().catch(console.error)
