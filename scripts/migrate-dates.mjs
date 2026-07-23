import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

// Get all agendamentos
const rows = await sql`SELECT id, fecha FROM agendamentos`
console.log("Total rows:", rows.length)

let migrated = 0
for (const r of rows) {
  const fecha = r.fecha
  // Skip if already ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    console.log(`  #${r.id}: "${fecha}" already ISO, skip`)
    continue
  }

  // Parse Spanish format: "8 de julio de 2026" or "15 de julio 2026"
  const cleaned = fecha.replace(/\s+de\s+/g, " ").trim()
  const parts = cleaned.split(" ")
  if (parts.length < 2) {
    console.log(`  #${r.id}: "${fecha}" could not parse, skip`)
    continue
  }

  const day = parseInt(parts[0])
  const monthName = parts[1].toLowerCase()
  const month = monthNames.indexOf(monthName)
  let year = parseInt(parts[2])
  if (isNaN(year) && parts.length > 3) year = parseInt(parts[3])

  if (isNaN(day) || month === -1 || isNaN(year)) {
    console.log(`  #${r.id}: "${fecha}" parse failed (day=${day}, month=${month}, year=${year})`)
    continue
  }

  const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  await sql`UPDATE agendamentos SET fecha = ${isoDate} WHERE id = ${r.id}`
  console.log(`  #${r.id}: "${fecha}" -> "${isoDate}"`)
  migrated++
}

console.log(`\nMigrated ${migrated} rows`)
process.exit(0)
