import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

const tables = ["agendamentos", "cotizaciones", "disponibilidad", "excepciones_fecha", "galeria", "publicaciones", "resenas", "visitas"]

for (const t of tables) {
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ${t} ORDER BY ordinal_position`
  console.log(`\n=== ${t} ===`)
  cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`))
}
process.exit(0)
