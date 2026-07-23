import { neon } from "@neondatabase/serverless"

const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

await sql`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente'`
console.log("✓ columna estado agregada a cotizaciones")

// Also fix the fecha filter issue in disponibilidad - migrate old dates to ISO
// But first let's check what's there
const rows = await sql`SELECT id, fecha FROM agendamentos`
console.log("Fechas actuales:", rows.map(r => `${r.id}: ${r.fecha}`).join(", "))

process.exit(0)
