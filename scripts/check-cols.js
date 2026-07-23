import { neon } from "@neondatabase/serverless"
const sql = neon("postgresql://neondb_owner:npg_VHq26eWlanfO@ep-lingering-resonance-at6lyxf2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require")

const cols1 = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'cotizaciones' ORDER BY ordinal_position`
console.log("cotizaciones:", cols1.map(c => c.column_name))

const cols2 = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'agendamentos' ORDER BY ordinal_position`
console.log("agendamentos:", cols2.map(c => c.column_name))

const cols3 = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'disponibilidad' ORDER BY ordinal_position`
console.log("disponibilidad:", cols3.map(c => c.column_name))

const all = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
console.log("all tables:", all.map(t => t.table_name))

process.exit(0)
